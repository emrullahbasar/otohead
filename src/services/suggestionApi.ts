import { getClientSecret, setClientSecret } from './database';

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
  caseType:       string[] | null;
  createdAt:      string | null;
}

export interface SimpleResult {
  status:    SuggestionStatus;
  answer:    string | null;
  ilanNo:    string | null;
  message:   string | null;
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

// Her cihaz için Apps Script'ten kişiye özel bir yetkilendirme sırrı alır ve
// yerelde saklar. Eskiden tüm kullanıcılar için tek/sabit bir secretKey
// uygulama bundle'ına gömülüydü (SEC-001) — artık her clientId'nin kendi
// sırrı var ve bu sır hiçbir zaman uygulama koduna/bundle'ına gömülmüyor.
async function ensureSecret(clientId: string): Promise<string> {
  const existing = await getClientSecret();
  if (existing) return existing;

  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'register', clientId }),
  });
  if (!response.ok) throw new Error('Kayıt oluşturulamadı.');
  const text = await response.text();
  const result = JSON.parse(text);
  if (!result.success || !result.secret) throw new Error(result.error || 'Kayıt oluşturulamadı.');

  await setClientSecret(result.secret);
  return result.secret;
}

export async function submitSuggestion(data: SubmitRequest): Promise<void> {
  const secret = await ensureSecret(data.clientId);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'submit', secret, ...data }),
  });
  if (!response.ok) throw new Error('İstek gönderilemedi.');
  const text = await response.text();
  const result = JSON.parse(text);
  if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
}

export async function submitEvaluation(data: SimpleRequest): Promise<void> {
  const secret = await ensureSecret(data.clientId);
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'evalSubmit', secret, ...data }),
  });
  if (!response.ok) throw new Error('İstek gönderilemedi.');
  const text = await response.text();
  const result = JSON.parse(text);
  if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
}

export async function checkEvaluation(clientId: string): Promise<SimpleResult> {
  const secret = await ensureSecret(clientId);
  const url = `${APPS_SCRIPT_URL}?action=checkEval&clientId=${encodeURIComponent(clientId)}&secret=${encodeURIComponent(secret)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Durum kontrol edilemedi.');
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
  return result as SimpleResult;
}

export async function checkSuggestion(clientId: string): Promise<SuggestionResult> {
  const secret = await ensureSecret(clientId);
  const url = `${APPS_SCRIPT_URL}?action=check&clientId=${encodeURIComponent(clientId)}&secret=${encodeURIComponent(secret)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Durum kontrol edilemedi.');
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Bir hata oluştu.');
  return result as SuggestionResult;
}

export async function markAsSeen(clientId: string): Promise<void> {
  const secret = await ensureSecret(clientId);
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'markSeen', secret, clientId }),
  });
}
