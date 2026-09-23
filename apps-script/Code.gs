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

    return response({ success: false, error: 'Geçersiz aksiyon.' });

  } catch (err) {
    Logger.log('doPost hatası: ' + err.message);
    return response({ success: false, error: 'Sunucu hatası.' });
  }
}

function doGet(e) {
  try {
    const clientId = e.parameter.clientId;
    const secret = e.parameter.secret;
    if (!isValidClient_(clientId, secret)) {
      return response({ success: false, error: 'Yetkisiz istek.' });
    }

    const action = e.parameter.action;

    if (action === 'check' && clientId) {
      return handleCheck(clientId);
    }
    if (action === 'checkEval' && clientId) {
      return handleSimpleCheck({ clientId }, EVAL_SHEET_NAME);
    }

    return response({ success: false, error: 'Geçersiz istek.' });

  } catch (err) {
    Logger.log('doGet hatası: ' + err.message);
    return response({ success: false, error: 'Sunucu hatası.' });
  }
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

  return response({
    success: true,
    status: row.status,
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

function handleMarkSeen(data) {
  const sheet = getSS_().getSheetByName(SHEET_NAME);
  const row = findRowByClientId(sheet, data.clientId);

  if (row && row.status === 'HAZIR') {
    sheet.getRange(row.rowIndex, 11).setValue('GÖRÜLDÜ');
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
    const existing = findLastEvalRow_(sheet, data.clientId);
    if (existing && (existing.status || 'BEKLİYOR') === 'BEKLİYOR') {
      return response({ success: false, error: 'Zaten bekleyen bir isteğiniz var.' });
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
  return response({
    success:   true,
    status:    row.status || 'BEKLİYOR',
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

function sendExpoPush_(token, title, body, type) {
  const res = UrlFetchApp.fetch('https://exp.host/--/api/v2/push/send', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ to: token, title: title, body: body, sound: 'default', data: { type: type } }),
    muteHttpExceptions: true,
  });
  Logger.log('Push yanıtı: ' + res.getResponseCode() + ' ' + res.getContentText());
}

// Kurulabilir (installable) düzenleme tetikleyicisi — basit onEdit tetikleyicisi
// dış servise (UrlFetchApp) erişemediği için setupTriggers() ile kurulur.
function onSheetEdit(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    const name = sheet.getName();

    let statusCol, title, body, type;
    if (name === SHEET_NAME) {
      statusCol = 11; type = 'suggestion';
      title = '🚗 Öneriniz Hazır!';
      body = 'Uzmanımız araç önerinizi hazırladı. Görmek için uygulamayı açın.';
    } else if (name === EVAL_SHEET_NAME) {
      statusCol = 6; type = 'evaluation';
      title = '🔎 Değerlendirmeniz Hazır!';
      body = 'Uzmanımız yanıtınızı hazırladı. Görmek için uygulamayı açın.';
    } else {
      return;
    }

    if (e.range.getColumn() !== statusCol || e.range.getNumRows() !== 1) return;
    if (String(e.value) !== 'HAZIR' || String(e.oldValue) === 'HAZIR') return;

    const clientId = sheet.getRange(e.range.getRow(), 2).getValue();
    const token = getPushTokenFor_(String(clientId));
    if (token) sendExpoPush_(token, title, body, type);
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
