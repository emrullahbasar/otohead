import { useState, useCallback, useEffect, useRef } from 'react';
import { getClientId, getConfig, setConfig } from '../services/database';
import {
  submitEvaluation,
  syncPushToken,
  checkEvaluation,
  SimpleResult,
  SimpleRequest,
} from '../services/suggestionApi';

const CACHE_KEY = 'lastEvaluation';
const DISMISSED_KEY = 'dismissedEvaluation';
const UNCERTAIN = 'BELIRSIZ';

const NO_RESULT: SimpleResult = {
  status: 'YOK', answer: null, ilanNo: null, message: null, requestId: null, createdAt: null,
};

// 'YOK' işareti "sunucuda bu cihaza ait istek yok" bilgisinin kesinleştiğini gösterir.
const persist = (result: SimpleResult) => {
  setConfig(CACHE_KEY, result.status === 'YOK' ? 'YOK' : JSON.stringify(result)).catch(() => {});
};

export const useSimpleRequest = () => {
  const [clientId,       setClientId]       = useState('');
  const [ilanNo,         setIlanNo]         = useState('');
  const [message,        setMessage]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusError,    setStatusError]    = useState('');
  const [error,          setError]          = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [result,         setResult]         = useState<SimpleResult | null>(null);
  const checkedRef  = useRef(false);
  const seqRef      = useRef(0);
  const inFlightRef = useRef(false);
  const resultRef   = useRef<SimpleResult | null>(null);
  resultRef.current = result;
  const knownNoneRef  = useRef(false);
  const cacheReadyRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    getClientId().then(setClientId).catch(() => {});
    cacheReadyRef.current = getConfig(CACHE_KEY).then(raw => {
      // Kayıt hiç yoksa bu cihaz hiç istek göndermemiştir; sunucuya sormaya gerek yok.
      if (!raw || raw === 'YOK') { knownNoneRef.current = true; return; }
      if (raw === UNCERTAIN) return;   // gönderim hatası: isteğin ulaşıp ulaşmadığı belirsiz, sor
      try {
        const cached = JSON.parse(raw) as SimpleResult;
        setResult(prev => prev ?? cached);
      } catch {
        // bozuk önbelleği yok say
      }
    }).catch(() => {});
  }, []);

  const applyDismissed = async (data: SimpleResult): Promise<SimpleResult> => {
    if (data.status !== 'GÖRÜLDÜ' && data.status !== 'HAZIR') return data;
    const dismissed = await getConfig(DISMISSED_KEY).catch(() => null);
    return dismissed && data.requestId === dismissed ? NO_RESULT : data;
  };

  const runCheck = useCallback(async (force: boolean) => {
    if (!clientId) return;
    if (inFlightRef.current && !force) return;
    inFlightRef.current = true;
    const seq = ++seqRef.current;
    setCheckingStatus(true);
    setStatusError('');
    try {
      const raw = await checkEvaluation(clientId);
      if (seq !== seqRef.current) return;
      const data = await applyDismissed(raw);
      if (seq !== seqRef.current) return;
      knownNoneRef.current = data.status === 'YOK';
      setResult(data);
      persist(data);
      if (data.status === 'BEKLİYOR') syncPushToken();
    } catch (err) {
      if (seq === seqRef.current) {
        setStatusError(err instanceof Error ? err.message : 'Durum kontrol edilemedi.');
      }
    } finally {
      if (seq === seqRef.current) {
        inFlightRef.current = false;
        setCheckingStatus(false);
      }
    }
  }, [clientId]);

  const checkStatus = useCallback(() => runCheck(false), [runCheck]);
  const forceCheck  = useCallback(() => runCheck(true),  [runCheck]);

  // Değerlendirme sekmesi ilk açıldığında bir kez sorgular (sekme açılmadan
  // sunucuya gereksiz istek atılmaz).
  const checkOnMount = useCallback(async () => {
    if (checkedRef.current || !clientId) return;
    checkedRef.current = true;
    await cacheReadyRef.current;
    if (knownNoneRef.current) return;
    await runCheck(false);
  }, [clientId, runCheck]);

  const validate = (): string | null => {
    if (!message.trim()) return 'Mesaj alanı zorunludur.';
    if (message.trim().length < 10) return 'Lütfen daha ayrıntılı bir mesaj yazın.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!clientId) { setError('Sistem hazırlanıyor, lütfen bekleyin.'); return; }

    setLoading(true);
    try {
      const payload: SimpleRequest = { clientId, ilanNo: ilanNo.trim(), message: message.trim() };
      await submitEvaluation(payload);
      setSubmitted(true);
      knownNoneRef.current = false;
      persist({ ...NO_RESULT, status: 'BEKLİYOR' });
      syncPushToken();
      setIlanNo('');
      setMessage('');
      forceCheck();
    } catch (err: any) {
      // İstek sunucuya ulaşmış olabilir: bir sonraki açılışta mutlaka sor.
      knownNoneRef.current = false;
      setConfig(CACHE_KEY, UNCERTAIN).catch(() => {});
      setError(err?.message || 'İstek gönderilemedi. İnternet bağlantınızı kontrol edin.');
      if (String(err?.message).includes('Zaten')) forceCheck();
    } finally {
      setLoading(false);
    }
  }, [clientId, ilanNo, message, forceCheck]);

  const reset = useCallback(() => {
    const id = resultRef.current?.requestId;
    if (id) setConfig(DISMISSED_KEY, id).catch(() => {});
    seqRef.current++;
    inFlightRef.current = false;
    setCheckingStatus(false);
    setStatusError('');
    setSubmitted(false);
    setResult(null);
    persist(NO_RESULT);
    knownNoneRef.current = true;
    setIlanNo('');
    setMessage('');
  }, []);

  return {
    clientId,
    ilanNo, setIlanNo,
    message, setMessage,
    loading, checkingStatus, statusError, error,
    submitted, result,
    handleSubmit, checkStatus, forceCheck, checkOnMount, reset,
  };
};
