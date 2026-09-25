import { useState, useCallback, useEffect, useRef } from 'react';
import { getClientId, getConfig, setConfig } from '../services/database';
import {
  checkSuggestion,
  markAsSeen,
  syncPushToken,
  SuggestionResult,
} from '../services/suggestionApi';

const CACHE_KEY = 'lastSuggestion';
const DISMISSED_KEY = 'dismissedSuggestion';
const UNCERTAIN = 'BELIRSIZ';

const NO_SUGGESTION: SuggestionResult = {
  status: 'YOK', recommendation: null, requestId: null, budget: null,
  yearMin: null, yearMax: null, fuel: null, caseType: null, createdAt: null,
};

// Son bilinen durum yerelde saklanır: sekme açılırken sunucu cevabını beklemeden
// hemen gösterilir, arkadan tazelenir.
// 'YOK' işareti "sunucuda bu cihaza ait istek yok" bilgisinin kesinleştiğini gösterir;
// böyle bir cihazın sekmeyi her açışında sunucuya sormasına gerek kalmaz.
const persist = (result: SuggestionResult) => {
  setConfig(CACHE_KEY, result.status === 'YOK' ? 'YOK' : JSON.stringify(result)).catch(() => {});
};

export const useSuggestionStatus = () => {
  const [clientId,       setClientId]       = useState('');
  const [suggestion,     setSuggestion]     = useState<SuggestionResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const [statusError,    setStatusError]    = useState('');
  const checkedRef    = useRef(false);
  const seqRef        = useRef(0);      // yalnızca en son başlatılan sorgunun sonucu uygulanır
  const inFlightRef   = useRef(false);
  const suggestionRef = useRef<SuggestionResult | null>(null);
  suggestionRef.current = suggestion;
  const knownNoneRef  = useRef(false);   // sunucuda istek olmadığı kesin
  const cacheReadyRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    getClientId().then(setClientId).catch(() => {});
    cacheReadyRef.current = getConfig(CACHE_KEY).then(raw => {
      // Kayıt hiç yoksa bu cihaz bu servise hiç istek göndermemiştir (cihaz kimliği kurulumda
      // üretilir); sunucuda ona ait istek olamaz, bu yüzden sormaya ve kayıt oluşturmaya gerek yok.
      if (!raw || raw === 'YOK') { knownNoneRef.current = true; return; }
      if (raw === UNCERTAIN) return;   // gönderim hatası: isteğin ulaşıp ulaşmadığı belirsiz, sor
      try {
        const cached = JSON.parse(raw) as SuggestionResult;
        setSuggestion(prev => prev ?? cached);
      } catch {
        // bozuk önbelleği yok say
      }
    }).catch(() => {});
  }, []);

  // Kullanıcı "Yeni Öneri İste" dediği eski cevap, sunucu son satırı hep
  // döndürdüğü için uygulama her açıldığında geri gelmesin.
  const applyDismissed = async (result: SuggestionResult): Promise<SuggestionResult> => {
    if (result.status !== 'GÖRÜLDÜ' && result.status !== 'HAZIR') return result;
    const dismissed = await getConfig(DISMISSED_KEY).catch(() => null);
    return dismissed && result.requestId === dismissed ? NO_SUGGESTION : result;
  };

  const runCheck = useCallback(async (force: boolean) => {
    if (!clientId) return;
    if (inFlightRef.current && !force) return;
    inFlightRef.current = true;
    const seq = ++seqRef.current;
    setCheckingStatus(true);
    setStatusError('');
    try {
      const raw = await checkSuggestion(clientId);
      if (seq !== seqRef.current) return;
      const result = await applyDismissed(raw);
      if (seq !== seqRef.current) return;

      knownNoneRef.current = result.status === 'YOK';
      setSuggestion(result);
      persist(result);
      // Kullanıcı cevabı beklerken bildirim izni sonradan verilmiş olabilir.
      if (result.status === 'BEKLİYOR') syncPushToken();
      if (result.status === 'HAZIR') {
        await markAsSeen(clientId);
        if (seq === seqRef.current) {
          const seen = { ...result, status: 'GÖRÜLDÜ' as const };
          setSuggestion(seen);
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

  // onPress gibi olay işleyicilerine doğrudan verilebilsin diye argümansız.
  const checkStatus = useCallback(() => runCheck(false), [runCheck]);
  // Devam eden (eski) sorguyu geçersiz kılıp yenisini başlatır — gönderimden sonra kullanılır.
  const forceCheck  = useCallback(() => runCheck(true),  [runCheck]);

  const checkOnMount = useCallback(async () => {
    if (checkedRef.current || !clientId) return;
    checkedRef.current = true;
    await cacheReadyRef.current;
    if (knownNoneRef.current) return;
    await runCheck(false);
  }, [clientId, runCheck]);

  // Gönderim başarılı olunca: "istek yok" bilgisi artık geçersiz. Sunucu sorgusu
  // başarısız olsa ve uygulama kapansa bile sonraki açılışta bekleyen istek görünsün.
  const markSubmitted = useCallback(() => {
    knownNoneRef.current = false;
    persist({ ...NO_SUGGESTION, status: 'BEKLİYOR' });
  }, []);

  // Gönderim hata verdi ama istek sunucuya ulaşmış olabilir: bir sonraki açılışta mutlaka sor.
  const markUncertain = useCallback(() => {
    knownNoneRef.current = false;
    setConfig(CACHE_KEY, UNCERTAIN).catch(() => {});
  }, []);

  const resetStatus = useCallback(() => {
    const id = suggestionRef.current?.requestId;
    if (id) setConfig(DISMISSED_KEY, id).catch(() => {});
    seqRef.current++;
    inFlightRef.current = false;
    setCheckingStatus(false);
    setStatusError('');
    setSubmitted(false);
    setSuggestion(null);
    persist(NO_SUGGESTION);
    knownNoneRef.current = true;
    checkedRef.current = false;
  }, []);

  return {
    clientId,
    suggestion, setSuggestion,
    checkingStatus, statusError,
    submitted, setSubmitted,
    checkedRef,
    checkStatus, forceCheck,
    checkOnMount,
    markSubmitted,
    markUncertain,
    resetStatus,
  };
};
