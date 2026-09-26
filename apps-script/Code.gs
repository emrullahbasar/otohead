const SPREADSHEET_ID = '1vFE9pWV26YolJaNOlpeGJevL5BXjsRIZ60Dhid0Fmqo';
const SHEET_NAME = 'Araç Öneri';
const EVAL_SHEET_NAME = 'Değerlendirme';
const CLIENTS_SHEET_NAME = 'Clients';
const MAX_CELL_LENGTH = 2000; // tek hücreye yazılacak metin üst sınırı
const CLIENT_CACHE_TTL = 3600; // saniye — doğrulanmış secret hash'i önbellekte bu kadar tutulur

function testAccess() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet: ' + ss.getName());
  } catch (e) {
    Logger.log('Hata: ' + e.message);
  }
}
function testSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  sheets.forEach(s => Logger.log(s.getName()));
}

// Her çalıştırmada tek bir kez açılır (global değişken her istekte sıfırlanır).
let ss_ = null;
function getSS_() {
  if (!ss_) ss_ = SpreadsheetApp.getActiveSpreadsheet();
  return ss_;
}

// ───────────────────────────────────────────────────────────
// Kimlik doğrulama — her clientId'nin KENDİNE ÖZEL bir secret'ı var.
// Secret'ın kendisi saklanmaz, yalnızca SHA-256 hash'i (Clients sayfası).
// Doğrulama sonucu CacheService'te tutulur: sonraki isteklerde Clients
// sayfası okunmaz (istek başına ~1-2 sn tasarruf).
// ───────────────────────────────────────────────────────────

function getClientsSheet_() {
  const ss = getSS_();
  let sheet = ss.getSheetByName(CLIENTS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CLIENTS_SHEET_NAME);
    sheet.appendRow(['clientId', 'secretHash', 'createdAt', 'pushToken']);
  }
  return sheet;
}

function hash_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(b => ((b < 0 ? b + 256 : b).toString(16)).padStart(2, '0')).join('');
}

function isValidId_(clientId) {
  return typeof clientId === 'string' && clientId.length > 0 && clientId.length <= 100;
}

function clientCacheKey_(clientId) {
  return 'c_' + clientId;
}

// Yalnızca ilk iki sütunu (clientId, secretHash) okur.
function findClientRow_(sheet, clientId) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === clientId) return { rowIndex: i + 2, secretHash: String(values[i][1]) };
  }
  return null;
}

// Basit global hız sınırlama — register herkese açık olmak zorunda
// (henüz kimlik yok), spam kayıt oluşturmayı zorlaştırmak için.
function checkRegisterRateLimit_() {
  const cache = CacheService.getScriptCache();
  const key = 'register_count_' + Math.floor(Date.now() / 60000); // dakikalık pencere
  const current = Number(cache.get(key) || '0');
  if (current >= 30) return false; // dakikada en fazla 30 yeni kayıt
  cache.put(key, String(current + 1), 90);
  return true;
}

// Kimlik doğrulanmış uçlar (check/checkEval/submit/evalSubmit) için de basit
// bir hız sınırı — yalnızca register korunuyordu, kimliği geçerli ama bozuk/
// döngüye girmiş bir istemci sayfayı gereksiz yere zorlayabilirdi.
function checkActionRateLimit_(clientId, action, maxPerMinute) {
  const cache = CacheService.getScriptCache();
  const key = 'act_' + action + '_' + clientId + '_' + Math.floor(Date.now() / 60000);
  const current = Number(cache.get(key) || '0');
  if (current >= maxPerMinute) return false;
  cache.put(key, String(current + 1), 90);
  return true;
}

function registerClient_(clientId) {
  if (!isValidId_(clientId)) return null;
  if (!checkRegisterRateLimit_()) return null;

  // Aynı anda gelen iki kayıt isteği aynı clientId için iki satır açmasın.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return null;
  try {
    const sheet = getClientsSheet_();
    if (findClientRow_(sheet, clientId)) return null; // bu clientId zaten kayıtlı, tekrar secret verilmez

    const secret = Utilities.getUuid() + Utilities.getUuid();
    const secretHash = hash_(secret);
    sheet.appendRow([clientId, secretHash, new Date().toLocaleString('tr-TR')]);
    CacheService.getScriptCache().put(clientCacheKey_(clientId), secretHash, CLIENT_CACHE_TTL);
    return secret;
  } finally {
    lock.releaseLock();
  }
}

function isValidClient_(clientId, secret) {
  if (!isValidId_(clientId) || !secret) return false;
  const secretHash = hash_(secret);
  const cache = CacheService.getScriptCache();
  const key = clientCacheKey_(clientId);

  let stored = cache.get(key);
  if (!stored) {
    const row = findClientRow_(getClientsSheet_(), clientId);
    if (!row) return false;
    stored = row.secretHash;
    cache.put(key, stored, CLIENT_CACHE_TTL);
  }
  return stored === secretHash;
}

// ───────────────────────────────────────────────────────────
// Google Sheets formula/CSV injection koruması (SEC-016).
// Hücre değeri '=', '+', '-' veya '@' ile başlıyorsa Sheets bunu
// formül sanıp çalıştırabilir — başına tek tırnak ekleyerek metne çeviriyoruz.
// ───────────────────────────────────────────────────────────
function sanitizeCell_(value) {
  let s = String(value == null ? '' : value);
  if (s.length > MAX_CELL_LENGTH) s = s.slice(0, MAX_CELL_LENGTH);
  // '=', '+', '-', '@' yanında satır başındaki sekme/satır sonu karakterleri de
  // bazı elektronik tablolarda formül olarak yorumlanabilir (OWASP CSV injection).
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'register') {
      const secret = registerClient_(data.clientId);
      if (!secret) return response({ success: false, error: 'Kayıt oluşturulamadı.' });
      return response({ success: true, clientId: data.clientId, secret });
    }

    if (!isValidClient_(data.clientId, data.secret)) {
      return response({ success: false, error: 'Yetkisiz istek.' });
    }

    // Gönderim uçları dakikada birkaç istekle sınırlı; durum sorguları daha
    // sık olabilir (uygulama odağa her dönüşte/bildirimde sorar).
    if ((action === 'submit' || action === 'evalSubmit') && !checkActionRateLimit_(data.clientId, 'submit', 5)) {
      return response({ success: false, error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' });
    }
    if ((action === 'check' || action === 'checkEval') && !checkActionRateLimit_(data.clientId, 'check', 30)) {
      return response({ success: false, error: 'Çok fazla istek. Lütfen biraz sonra tekrar deneyin.' });
    }

    if (action === 'submit') {
      return handleSubmit(data);
    }
    if (action === 'evalSubmit') {
      return handleEvalSubmit(data);
    }

    if (action === 'markSeen') {
      return handleMarkSeen(data);
    }

    if (action === 'setPushToken') {
      return handleSetPushToken(data);
    }

    // Durum sorguları (check/checkEval) eskiden doGet ile, secret sorgu
    // dizesinde (URL'de) gönderiliyordu — Google'ın erişim günlüklerinde tam
    // URL görünebilir. Artık diğer her şey gibi POST gövdesinde gidiyor.
    if (action === 'check') {
      return handleCheck(data.clientId);
    }
    if (action === 'checkEval') {
      return handleSimpleCheck({ clientId: data.clientId }, EVAL_SHEET_NAME);
    }

    // Kullanıcı bekleyen (henüz uzman yanıtlamadığı) bir isteğini geri çekip
    // yenisini gönderebilsin diye — eskiden bekleyen bir istek asla iptal
    // edilemiyordu, uzman hiç yanıtlamazsa kullanıcı sonsuza kadar kilitli kalırdı.
    if (action === 'cancel') {
      return handleCancel(data, SHEET_NAME, findRowByClientId, 11);
    }
    if (action === 'cancelEval') {
      return handleCancel(data, EVAL_SHEET_NAME, findLastEvalRow_, 6);
    }

    return response({ success: false, error: 'Geçersiz aksiyon.' });

  } catch (err) {
    Logger.log('doPost hatası: ' + err.message);
    return response({ success: false, error: 'Sunucu hatası.' });
  }
}

// check/checkEval artık doPost üzerinden gidiyor (bkz. yukarıdaki not) — bu uç
// nokta artık istemci tarafından kullanılmıyor, yalnızca geriye dönük/manuel
// test amaçlı basit bir hata döndürür.
function doGet(e) {
  return response({ success: false, error: 'Bu uç nokta artık kullanılmıyor.' });
}

function handleSubmit(data) {
  const sheet = getSS_().getSheetByName(SHEET_NAME);

  if (!data.clientId || !data.budget || !data.yearMin || !data.yearMax) {
    return response({ success: false, error: 'Zorunlu alanlar eksik.' });
  }

  // Kontrol + ekleme atomik olsun: iki eşzamanlı gönderim çift kayıt açmasın.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return response({ success: false, error: 'Sunucu meşgul, lütfen tekrar deneyin.' });
  }
  try {
    const existing = findRowByClientId(sheet, data.clientId);
    if (existing && (existing.status === 'BEKLİYOR' || existing.status === 'HAZIR')) {
      return response({ success: false, error: 'Zaten aktif bir öneriniz var.' });
    }

    const requestId = Utilities.getUuid();
    const now = new Date().toLocaleString('tr-TR');

    sheet.appendRow([
      requestId,
      sanitizeCell_(data.clientId),
      sanitizeCell_(data.budget),
      sanitizeCell_(data.yearMin),
      sanitizeCell_(data.yearMax),
      sanitizeCell_(data.caseType || 'Belirtilmedi'),
      sanitizeCell_(data.fuel || 'Belirtilmedi'),
      sanitizeCell_(data.gear || 'Belirtilmedi'),
      sanitizeCell_(data.description || 'Belirtilmedi'),
      now,
      'BEKLİYOR',
      ''
    ]);

    return response({ success: true, requestId });
  } finally {
    lock.releaseLock();
  }
}

function handleCheck(clientId) {
  const sheet = getSS_().getSheetByName(SHEET_NAME);
  const row = findRowByClientId(sheet, clientId);

  if (!row) {
    return response({ success: true, status: 'YOK' });
  }

  // Uzman durumu HAZIR yapıp öneri metnini yazmayı unutursa (ya da sırayla ters
  // girerse) istemciye boş bir "hazır" cevap gitmesin — metin gelene kadar hâlâ
  // bekleniyor gibi göster.
  const isHazirButEmpty = row.status === 'HAZIR' && !String(row.recommendation || '').trim();
  const status = isHazirButEmpty ? 'BEKLİYOR' : row.status;

  return response({
    success: true,
    status: status,
    recommendation: row.recommendation || null,
    requestId: row.requestId,
    budget: row.budget,
    yearMin: row.yearMin,
    yearMax: row.yearMax,
    fuel: row.fuel,
    caseType: row.caseType,
    createdAt: row.createdAt,
  });
}

// data.target 'evaluation' ise Değerlendirme sayfasındaki son satırı, yoksa
// (varsayılan) Araç Öneri sayfasındaki satırı GÖRÜLDÜ yapar. Eskiden yalnızca
// öneri sayfası destekleniyordu; değerlendirmelerin "görüldü" diye bir durumu
// hiç olmadığı için HAZIR sonrası yeni istek göndermek için handleEvalSubmit
// yalnızca BEKLİYOR'u engelliyordu (HAZIR'ı değil) — artık ikisi de aynı
// şekilde çalışıyor.
function handleMarkSeen(data) {
  const isEval = data.target === 'evaluation';
  const sheetName = isEval ? EVAL_SHEET_NAME : SHEET_NAME;
  const statusCol = isEval ? 6 : 11;
  const sheet = getSS_().getSheetByName(sheetName);
  const row = isEval ? findLastEvalRow_(sheet, data.clientId) : findRowByClientId(sheet, data.clientId);

  if (row && row.status === 'HAZIR') {
    sheet.getRange(row.rowIndex, statusCol).setValue('GÖRÜLDÜ');
    return response({ success: true });
  }

  return response({ success: false, error: 'Kayıt bulunamadı.' });
}

// Bir kullanıcının SON (en yeni) satırını döndürür — "Yeni Öneri İste" sonrası
// eski satır değil, yeni istek görünsün. Önce yalnızca clientId sütunu okunur,
// sonra tek satır çekilir (tüm tabloyu okumaz).
function findRowByClientId(sheet, clientId) {
  const last = sheet.getLastRow();
  if (last < 2) return null;

  const ids = sheet.getRange(2, 2, last - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(clientId)) {
      const rowIndex = i + 2;
      const v = sheet.getRange(rowIndex, 1, 1, 12).getValues()[0];
      return {
        rowIndex: rowIndex,
        requestId: v[0],
        clientId: v[1],
        budget: v[2],
        yearMin: v[3],
        yearMax: v[4],
        caseType: v[5],
        fuel: v[6],
        gear: v[7],
        description: v[8],
        createdAt: v[9],
        status: v[10],
        recommendation: v[11],
      };
    }
  }
  return null;
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Yalnızca hâlâ BEKLİYOR durumundaki bir isteği iptal eder (uzman zaten
// yanıtladıysa — HAZIR/GÖRÜLDÜ — iptal anlamsız, kullanıcı cevabı görüp
// "Yeni İstek Gönder" ile devam etmeli). İptal edilen satır 'İPTAL EDİLDİ'
// durumuna geçer ki handleSubmit/handleEvalSubmit'in "zaten aktif bir isteğiniz
// var" kontrolü onu bir daha engellemesin.
function handleCancel(data, sheetName, findRowFn, statusCol) {
  const sheet = getSS_().getSheetByName(sheetName);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return response({ success: false, error: 'Sunucu meşgul, lütfen tekrar deneyin.' });
  }
  try {
    const row = findRowFn(sheet, data.clientId);
    if (!row) return response({ success: false, error: 'Kayıt bulunamadı.' });
    if (row.status !== 'BEKLİYOR') {
      return response({ success: false, error: 'Yalnızca bekleyen bir istek iptal edilebilir.' });
    }
    sheet.getRange(row.rowIndex, statusCol).setValue('İPTAL EDİLDİ');
    return response({ success: true });
  } finally {
    lock.releaseLock();
  }
}

function handleEvalSubmit(data) {
  const sheet = getSS_().getSheetByName(EVAL_SHEET_NAME);
  if (!data.clientId || !data.message) {
    return response({ success: false, error: 'Zorunlu alanlar eksik.' });
  }

  // Kontrol + ekleme atomik olsun: aynı anda gelen iki istek çift kayıt açmasın.
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return response({ success: false, error: 'Sunucu meşgul, lütfen tekrar deneyin.' });
  }
  try {
    // handleSubmit (Araç Öneri) ile aynı kural: HAZIR durumundaki bir istek de
    // henüz "görüldü" işaretlenmemiş demektir — yeni istek onu ezmesin.
    const existing = findLastEvalRow_(sheet, data.clientId);
    const existingStatus = existing ? (existing.status || 'BEKLİYOR') : null;
    if (existingStatus === 'BEKLİYOR' || existingStatus === 'HAZIR') {
      return response({ success: false, error: 'Zaten aktif bir isteğiniz var.' });
    }

    const requestId = Utilities.getUuid();
    const now = new Date().toLocaleString('tr-TR');
    sheet.appendRow([
      requestId,
      sanitizeCell_(data.clientId),
      sanitizeCell_(data.ilanNo || 'Belirtilmedi'),
      sanitizeCell_(data.message),
      now,
      'BEKLİYOR',
      ''
    ]);
    return response({ success: true, requestId });
  } finally {
    lock.releaseLock();
  }
}

// Bir kullanıcının SON değerlendirme satırını (7 sütun) döndürür; yalnızca
// clientId sütununu tarayıp tek satır okur.
function findLastEvalRow_(sheet, clientId) {
  if (!sheet) return null;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const ids = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === String(clientId)) {
      const v = sheet.getRange(i + 2, 1, 1, 7).getValues()[0];
      return {
        rowIndex: i + 2,
        requestId: v[0],
        ilanNo: v[2],
        message: v[3],
        createdAt: v[4],
        status: v[5],
        answer: v[6],
      };
    }
  }
  return null;
}

// Kullanıcının SON değerlendirme satırını döndürür (yalnızca clientId
// sütununu tarayıp tek satır okur).
function handleSimpleCheck(data, sheetName) {
  const row = findLastEvalRow_(getSS_().getSheetByName(sheetName), data.clientId);
  if (!row) {
    return response({ success: true, status: 'YOK' });
  }
  // handleCheck ile aynı koruma: HAZIR ama yanıt metni boşsa BEKLİYOR göster.
  const rawStatus = row.status || 'BEKLİYOR';
  const isHazirButEmpty = rawStatus === 'HAZIR' && !String(row.answer || '').trim();
  return response({
    success:   true,
    status:    isHazirButEmpty ? 'BEKLİYOR' : rawStatus,
    answer:    row.answer || null,
    ilanNo:    row.ilanNo || null,
    message:   row.message || null,
    requestId: row.requestId || null,
    createdAt: row.createdAt || null,
  });
}

// ───────────────────────────────────────────────────────────
// Push bildirimi — uzman cevabı hazırladığında (durum sütunu HAZIR olunca)
// kullanıcının telefonuna Expo push servisiyle bildirim gönderilir.
// ───────────────────────────────────────────────────────────

const PUSH_COLUMN = 4; // Clients sayfasında pushToken sütunu (D)

function isExpoPushToken_(token) {
  return typeof token === 'string' && token.length <= 200 &&
    /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

function handleSetPushToken(data) {
  if (!isExpoPushToken_(data.pushToken)) {
    return response({ success: false, error: 'Geçersiz bildirim adresi.' });
  }
  const row = findClientRow_(getClientsSheet_(), data.clientId);
  if (!row) return response({ success: false, error: 'Kayıt bulunamadı.' });
  getClientsSheet_().getRange(row.rowIndex, PUSH_COLUMN).setValue(data.pushToken);
  return response({ success: true });
}

function getPushTokenFor_(clientId) {
  const sheet = getClientsSheet_();
  const row = findClientRow_(sheet, clientId);
  if (!row) return null;
  const token = sheet.getRange(row.rowIndex, PUSH_COLUMN).getValue();
  return isExpoPushToken_(token) ? token : null;
}

// clientId verilirse ve Expo "DeviceNotRegistered" derse (uygulama silinmiş/
// token artık geçersiz), o cihazın kayıtlı push token'ı temizlenir — aksi
// halde her HAZIR olayında aynı ölü token'a boşuna istek atılmaya devam ederdi.
function sendExpoPush_(token, title, body, type, clientId) {
  const res = UrlFetchApp.fetch('https://exp.host/--/api/v2/push/send', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ to: token, title: title, body: body, sound: 'default', data: { type: type } }),
    muteHttpExceptions: true,
  });
  const text = res.getContentText();
  Logger.log('Push yanıtı: ' + res.getResponseCode() + ' ' + text);
  try {
    const parsed = JSON.parse(text);
    const ticket = parsed && parsed.data;
    const errorCode = ticket && ticket.details && ticket.details.error;
    if (ticket && ticket.status === 'error' && errorCode === 'DeviceNotRegistered' && clientId) {
      const row = findClientRow_(getClientsSheet_(), String(clientId));
      if (row) getClientsSheet_().getRange(row.rowIndex, PUSH_COLUMN).setValue('');
    }
  } catch (err) {
    // Push yanıtı ayrıştırılamadı — sessizce geç, bu bilgi olmadan da devam edilebilir.
  }
}

// Kurulabilir (installable) düzenleme tetikleyicisi — basit onEdit tetikleyicisi
// dış servise (UrlFetchApp) erişemediği için setupTriggers() ile kurulur.
//
// İki durumda da bildirim gönderilebilir (uzmanın hangi sırayla doldurduğu
// önemli değil): (1) durum sütunu HAZIR'a çekilir VE yanıt hücresi zaten
// doluysa, (2) durum zaten HAZIR iken yanıt hücresi sonradan doldurulursa.
// Yanıt hâlâ boşsa (durum önce, metin sonra girilecekse) bildirim atlanır —
// istemci de aynı şekilde boş bir "hazır" göstermez (bkz. handleCheck).
//
// Çok satırlı düzenlemeyi (birden çok hücre yapıştırma) de destekler — tek
// hücrelik varsayımla yazılmış eski hâli, bir sütuna birden fazla durumu aynı
// anda yapıştırınca hiçbirine bildirim göndermiyordu. Çoklu düzenlemede
// e.oldValue verilmediği için (Sheets kısıtı) her satır yalnızca GÜNCEL
// durumuna bakılarak değerlendirilir; bu, aynı satıra ikinci kez dokunulmadıkça
// zaten HAZIR olan bir satırın nadiren tekrar bildirim üretmesi anlamına
// gelebilir (kabul edilebilir, tek satırlık düzenlemede olmaz).
function onSheetEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    const name = sheet.getName();

    let statusCol, answerCol, title, body, type;
    if (name === SHEET_NAME) {
      statusCol = 11; answerCol = 12; type = 'suggestion';
      title = '🚗 Öneriniz Hazır!';
      body = 'Uzmanımız araç önerinizi hazırladı. Görmek için uygulamayı açın.';
    } else if (name === EVAL_SHEET_NAME) {
      statusCol = 6; answerCol = 7; type = 'evaluation';
      title = '🔎 Değerlendirmeniz Hazır!';
      body = 'Uzmanımız yanıtınızı hazırladı. Görmek için uygulamayı açın.';
    } else {
      return;
    }

    const editedCol = e.range.getColumn();
    const numCols = e.range.getNumColumns();
    const touchesStatus = editedCol <= statusCol && statusCol <= editedCol + numCols - 1;
    const touchesAnswer  = editedCol <= answerCol && answerCol <= editedCol + numCols - 1;
    if (!touchesStatus && !touchesAnswer) return;

    const numRows = e.range.getNumRows();
    const isSingleCell = numRows === 1 && numCols === 1;

    for (let i = 0; i < numRows; i++) {
      const row = e.range.getRow() + i;

      if (isSingleCell) {
        // Tek hücre: eski/yeni değeri e.oldValue/e.value'dan biliyoruz, gereksiz
        // (zaten HAZIR olan bir satıra dokunmadan) tekrar bildirim göndermeyiz.
        const isStatusEdit = editedCol === statusCol && String(e.value) === 'HAZIR' && String(e.oldValue) !== 'HAZIR';
        const isAnswerEdit  = editedCol === answerCol;
        if (!isStatusEdit && !isAnswerEdit) continue;
      }

      const currentStatus = String(sheet.getRange(row, statusCol).getValue());
      if (currentStatus !== 'HAZIR') continue;
      const answer = String(sheet.getRange(row, answerCol).getValue() || '');
      if (!answer.trim()) continue;

      const clientId = String(sheet.getRange(row, 2).getValue());
      const token = getPushTokenFor_(clientId);
      if (token) sendExpoPush_(token, title, body, type, clientId);
    }
  } catch (err) {
    Logger.log('onSheetEdit hatası: ' + err.message);
  }
}

// Bir kez elle çalıştırın (Apps Script editöründe fonksiyon seçip ▶ Çalıştır).
// İstenen izinleri onaylayın. Tekrar çalıştırmak güvenlidir, çift tetikleyici oluşturmaz.
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onSheetEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetEdit')
    .forSpreadsheet(SPREADSHEET_ID)
    .onEdit()
    .create();
  Logger.log('Tetikleyici kuruldu.');
}
