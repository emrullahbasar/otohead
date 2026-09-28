import { useState, useCallback, useEffect, useRef } from 'react';
import { getClientId, getConfig, setConfig } from '../services/database';
import {
  submitEvaluation,
  syncPushToken,
  checkEvaluation,
  markAsSeen,
  cancelEvaluation,
  SimpleResult,
  SimpleRequest,
} from '../services/suggestionApi';

const CACHE_KEY = 'lastEvaluation';
const DISMISSED_KEY = 'dismissedEvaluation';
const UNCERTAIN = 'BELIRSIZ';

const NO_RESULT: SimpleResult = {
  status: 'YOK', answer: null, name: null, ilanNo: null, message: null, requestId: null, createdAt: null,
};

// 'YOK' işareti "sunucuda bu cihaza ait istek yok" bilgisinin kesinleştiğini gösterir.
const persist = (result: SimpleResult) => {
  setConfig(CACHE_KEY, result.status === 'YOK' ? 'YOK' : JSON.stringify(result)).catch(() => {});
};

export const useSimpleRequest = () => {
  const [clientId,       setClientId]       = useState('');
  const [name,           setName]           = useState('');
  const [ilanNo,         setIlanNo]         = useState('');
  const [message,        setMessage]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusError,    setStatusError]    = useState('');
  const [error,          setError]          = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [result,         setResult]         = useState<SimpleResult | null>(null);
  const [cancelling,     setCancelling]     = useState(false);
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
      // Öneri akışıyla aynı: HAZIR görülünce sunucuda GÖRÜLDÜ'e çekilir —
      // böylece yeni bir değerlendirme isteği göndermek engellenmez kalmaz.
      if (data.status === 'HAZIR') {
        await markAsSeen(clientId, 'evaluation');
        if (seq === seqRef.current) {
          const seen = { ...data, status: 'GÖRÜLDÜ' as const };
          setResult(seen);
          persist(seen);
        }
      }
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
      const payload: SimpleRequest = {
        clientId, name: name.trim() || 'Belirtilmedi', ilanNo: ilanNo.trim(), message: message.trim(),
      };
      await submitEvaluation(payload);
      setSubmitted(true);
      knownNoneRef.current = false;
      persist({ ...NO_RESULT, status: 'BEKLİYOR' });
      syncPushToken();
      setName('');
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
    // Otomatik markAsSeen daha önce ağ hatasıyla başarısız olduysa bir şans daha.
    if (clientId) markAsSeen(clientId, 'evaluation').catch(() => {});
    seqRef.current++;
    inFlightRef.current = false;
    setCheckingStatus(false);
    setStatusError('');
    setSubmitted(false);
    setResult(null);
    persist(NO_RESULT);
    knownNoneRef.current = true;
    setName('');
    setIlanNo('');
    setMessage('');
  }, []);

  // Uzman hiç yanıtlamazsa kullanıcı sonsuza kadar "İnceleniyor" ekranında
  // kilitli kalmasın diye bekleyen isteği geri çeker.
  const cancelPending = useCallback(async () => {
    setCancelling(true);
    setStatusError('');
    try {
      await cancelEvaluation();
      seqRef.current++;
      inFlightRef.current = false;
      setSubmitted(false);
      setResult(null);
      persist(NO_RESULT);
      knownNoneRef.current = true;
      checkedRef.current = false;
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'İstek iptal edilemedi.');
    } finally {
      setCancelling(false);
    }
  }, []);

  return {
    clientId,
    name, setName,
    ilanNo, setIlanNo,
    message, setMessage,
    loading, checkingStatus, statusError, error,
    submitted, result,
    cancelling, cancelPending,
    handleSubmit, checkStatus, forceCheck, checkOnMount, reset,
  };
};
