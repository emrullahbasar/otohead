import {
  getClientId, getClientSecret, setClientSecret, clearClientSecret, rotateClientId,
  getConfig, setConfig,
} from './database';
import { getExpoPushToken } from '../notifications/pushToken';

const APPS_SCRIPT_URL = process.env.EXPO_PUBLIC_APPS_SCRIPT_URL ?? '';

export type SuggestionStatus = 'BEKLİYOR' | 'HAZIR' | 'GÖRÜLDÜ' | 'YOK';

export interface SuggestionResult {
  status:         SuggestionStatus;
  recommendation: string | null;
  requestId:      string | null;
  budget:         string | null;
  yearMin:        string | null;
  yearMax:        string | null;
  fuel:           string | null;
  caseType:       string[] | string | null;
  createdAt:      string | null;
}

export interface SimpleResult {
  status:    SuggestionStatus;
  answer:    string | null;
  ilanNo:    string | null;
  message:   string | null;
  requestId: string | null;
  createdAt: string | null;
}

export interface SubmitRequest {
  clientId:    string;
  budget:      string;
  yearMin:     string;
  yearMax:     string;
  caseType:    string;
  fuel:        string;
  gear:        string;
  description: string;
}

export interface SimpleRequest {
  clientId: string;
  ilanNo:   string;
  message:  string;
}

const AUTH_ERROR = 'Yetkisiz istek.';
const REGISTER_REFUSED = 'Kayıt oluşturulamadı.';
const REQUEST_TIMEOUT_MS = 35000;
const TIMEOUT_ERROR = 'Sunucu şu anda yanıt vermekte gecikiyor. Lütfen birkaç saniye sonra tekrar deneyin.';
const INVALID_RESPONSE = 'Sunucudan geçersiz yanıt alındı. Lütfen tekrar deneyin.';

// Apps Script bazen 20+ saniye gecikebiliyor — zaman aşımı olmadan fetch
// sonsuza kadar bekler, kullanıcı hiçbir geri bildirim almadan ekranda
// takılı kalır. Bu, isteği makul bir sürede kesip net bir hata verir.
async function fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw new Error(TIMEOUT_ERROR);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Google bazen JSON yerine HTML hata sayfası döndürür (kota, geçici arıza);
// kullanıcıya "JSON Parse error" yerine anlaşılır bir mesaj gösterilir.
async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(INVALID_RESPONSE);
  }
}

// Her cihaz için Apps Script'ten kişiye özel bir yetkilendirme sırrı alır ve
// yerelde saklar. Eskiden tüm kullanıcılar için tek/sabit bir secretKey
// uygulama bundle'ına gömülüydü (SEC-001) — artık her clientId'nin kendi
// sırrı var ve bu sır hiçbir zaman uygulama koduna/bundle'ına gömülmüyor.
async function registerSecret(clientId: string): Promise<string> {
  const response = await fetchWithTimeout(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'register', clientId }),
  });
  if (!response.ok) throw new Error('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.');
  const result = await readJson(response);
  if (!result.success || !result.secret) throw new Error(result.error || REGISTER_REFUSED);

  await setClientSecret(result.secret);
  return result.secret;
}

interface Credentials { clientId: string; secret: string }

// Sunucu bu clientId için yeniden kayıt vermeyi açıkça reddederse (kayıt zaten
// var ama yerelde eşleşen sır yok) cihaz kilitli kalmasın diye yeni kimlik alır.
// Ağ/zaman aşımı hatalarında kimlik değiştirilmez.
async function registerOrRotate(clientId: string): Promise<Credentials> {
  try {
    return { clientId, secret: await registerSecret(clientId) };
  } catch (err) {
    if (err instanceof Error && err.message === REGISTER_REFUSED) {
      const newId = await rotateClientId();
      return { clientId: newId, secret: await registerSecret(newId) };
    }
    throw err;
  }
}

// Kimlik alma/yenileme işlemleri aynı anda yalnızca bir kez çalışır: durum
// kontrolü ve gönderim eşzamanlı başlarsa iki kayıt isteği çakışıp sunucunun
// ikinciyi reddetmesine ve gereksiz yere kimlik değişmesine yol açardı.
let credentialsInFlight: Promise<Credentials> | null = null;
let refreshInFlight: Promise<Credentials> | null = null;

function ensureCredentials(): Promise<Credentials> {
  if (!credentialsInFlight) {
    credentialsInFlight = (async () => {
      const clientId = await getClientId();
      const existing = await getClientSecret();
      if (existing) return { clientId, secret: existing };
      return registerOrRotate(clientId);
    })().finally(() => { credentialsInFlight = null; });
  }
  return credentialsInFlight;
}

function refreshCredentials(failed: Credentials): Promise<Credentials> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const clientId = await getClientId();
      const stored = await getClientSecret();
      // Başka bir istek sırrı zaten yenilemişse tekrar yenileme.
      if (stored && stored !== failed.secret) return { clientId, secret: stored };
      await clearClientSecret();
      return registerOrRotate(clientId);
    })().finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

// Sunucu tarafında kayıt silinmiş/değişmişse yerelde saklanan sır geçersiz
// kalabilir ("Yetkisiz istek" hatası) — bu durumda sırrı temizleyip yeniden
// kayıt olur ve isteği bir kez daha dener, kullanıcı hiçbir şey yapmadan.
// clientId her zaman veritabanından okunur; çağıranın verdiği değer eski
// (döndürülmüş) olabilir.
async function withAuthRetry<T>(run: (creds: Credentials) => Promise<T>): Promise<T> {
  const creds = await ensureCredentials();
  try {
    return await run(creds);
  } catch (err) {
    if (err instanceof Error && err.message === AUTH_ERROR) {
      return run(await refreshCredentials(creds));
    }
    throw err;
  }
}

// Salt okunur isteklerde (durum kontrolü) geçici hatalarda (zaman aşımı,
// bozuk yanıt) bir kez daha dener — Apps Script'in ara sıra 20+ saniyelik
// gecikmeleri ve geçici hata sayfaları genelde tek seferliktir.
async function retryOnTransient<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error && (err.message === TIMEOUT_ERROR || err.message === INVALID_RESPONSE)) {
      return fn();
    }
    throw err;
  }
}

// Gönderim zaman aşımına/ağ hatasına uğradığında istek sunucuya ulaşmış olabilir.
// Kullanıcıya hata gösterip tekrar göndermesini istemeden önce bekleyen bir
// kayıt olup olmadığına bakılır (mükerrer istek oluşmasın).
async function landedDespiteError(err: unknown, check: () => Promise<{ status: SuggestionStatus }>): Promise<boolean> {
  const transient = err instanceof TypeError ||
    (err instanceof Error && (err.message === TIMEOUT_ERROR || err.message === INVALID_RESPONSE));
  if (!transient) return false;
  try {
    return (await check()).status === 'BEKLİYOR';
  } catch {
    return false;
  }
}

export async function submitSuggestion(data: SubmitRequest): Promise<void> {
  try {
    await withAuthRetry(async ({ clientId, secret }) => {
      const response = await fetchWithTimeout(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'submit', ...data, clientId, secret }),
      });
      if (!response.ok) throw new Error('İstek gönderilemedi.');
      const result = await readJson(response);
      if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
    });
  } catch (err) {
    if (await landedDespiteError(err, () => checkSuggestion(data.clientId))) return;
    throw err;
  }
}

export async function submitEvaluation(data: SimpleRequest): Promise<void> {
  try {
    await withAuthRetry(async ({ clientId, secret }) => {
      const response = await fetchWithTimeout(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'evalSubmit', ...data, clientId, secret }),
      });
      if (!response.ok) throw new Error('İstek gönderilemedi.');
      const result = await readJson(response);
      if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
    });
  } catch (err) {
    if (await landedDespiteError(err, () => checkEvaluation(data.clientId))) return;
    throw err;
  }
}

export async function checkEvaluation(_clientId: string): Promise<SimpleResult> {
  return withAuthRetry(({ clientId, secret }) => retryOnTransient(async () => {
    const url = `${APPS_SCRIPT_URL}?action=checkEval&clientId=${encodeURIComponent(clientId)}&secret=${encodeURIComponent(secret)}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error('Durum kontrol edilemedi.');
    const result = await readJson(response);
    if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
    return result as SimpleResult;
  }));
}

export async function checkSuggestion(_clientId: string): Promise<SuggestionResult> {
  return withAuthRetry(({ clientId, secret }) => retryOnTransient(async () => {
    const url = `${APPS_SCRIPT_URL}?action=check&clientId=${encodeURIComponent(clientId)}&secret=${encodeURIComponent(secret)}`;
    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error('Durum kontrol edilemedi.');
    const result = await readJson(response);
    if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
    return result as SuggestionResult;
  }));
}

export async function markAsSeen(_clientId: string): Promise<void> {
  await withAuthRetry(async ({ clientId, secret }) => {
    await fetchWithTimeout(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'markSeen', secret, clientId }),
    });
  });
}

// Telefonun push adresini sunucuya bildirir ki uzman cevabı hazırladığında
// uygulama kapalıyken bildirim gönderilebilsin. Adres (bu kimlik için)
// değişmediyse tekrar göndermez; hata sessizce yutulur (bildirim isteğe bağlıdır).
export async function syncPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token) return;

    const sentKey = `${await getClientId()}|${token}`;
    if ((await getConfig('pushTokenSent')) === sentKey) return;

    const usedClientId = await withAuthRetry(async ({ clientId, secret }) => {
      const response = await fetchWithTimeout(APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'setPushToken', clientId, secret, pushToken: token }),
      });
      if (!response.ok) throw new Error('Bildirim kaydı yapılamadı.');
      const result = await readJson(response);
      if (!result.success) throw new Error(result.error || 'Bildirim kaydı yapılamadı.');
      return clientId;
    });
    await setConfig('pushTokenSent', `${usedClientId}|${token}`);
  } catch {
    // sessizce geç
  }
}
