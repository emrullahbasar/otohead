import { useState, useCallback, useEffect, useRef } from 'react';
import { getClientId, getConfig, setConfig } from '../services/database';
import { fetchBrands, fetchModels } from '../services/carApi';
import {
  submitSellEstimate,
  syncPushToken,
  checkSellEstimate,
  markAsSeen,
  cancelSellEstimate,
  SellEstimateResult,
  SellEstimateRequest,
  SellPanels,
  SellPanelKey,
  SellPanelStatus,
  SELL_PANEL_KEYS,
} from '../services/suggestionApi';

const CACHE_KEY = 'lastSellEstimate';
const DISMISSED_KEY = 'dismissedSellEstimate';
const UNCERTAIN = 'BELIRSIZ';

// Dokunulmamış bir parça "Orijinal" sayılır (kullanıcı sadece değişen/boyalı
// olanları işaretler) — bkz. SellEstimateForm.tsx.
const DEFAULT_PANELS: SellPanels = SELL_PANEL_KEYS.reduce((acc, key) => {
  acc[key] = 'Orijinal';
  return acc;
}, {} as SellPanels);

const NO_RESULT: SellEstimateResult = {
  status: 'YOK', price: null, requestId: null, name: null, brand: null, model: null,
  package: null, year: null, km: null, panels: null, heavyDamage: false, createdAt: null,
};

const persist = (result: SellEstimateResult) => {
  setConfig(CACHE_KEY, result.status === 'YOK' ? 'YOK' : JSON.stringify(result)).catch(() => {});
};

export const useSellEstimate = () => {
  const [clientId,       setClientId]       = useState('');
  const [name,           setName]           = useState('');
  const [brand,          setBrand]          = useState('');
  const [model,          setModel]          = useState('');
  const [pkg,            setPkg]            = useState('');
  const [year,           setYear]           = useState('');
  const [km,             setKm]             = useState('');
  const [panels,         setPanels]         = useState<SellPanels>(DEFAULT_PANELS);
  const [heavyDamage,    setHeavyDamage]    = useState(false);
  const [brands,         setBrands]         = useState<string[]>([]);
  const [models,         setModels]         = useState<string[]>([]);
  const [loadingModels,  setLoadingModels]  = useState(false);
  const [modalType,      setModalType]      = useState<'brand' | 'model' | 'year' | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusError,    setStatusError]    = useState('');
  const [error,          setError]          = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [result,         setResult]         = useState<SellEstimateResult | null>(null);
  const [cancelling,     setCancelling]     = useState(false);
  const checkedRef  = useRef(false);
  const seqRef      = useRef(0);
  const inFlightRef = useRef(false);
  const resultRef   = useRef<SellEstimateResult | null>(null);
  resultRef.current = result;
  const knownNoneRef  = useRef(false);
  const cacheReadyRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => { fetchBrands().then(setBrands).catch(() => {}); }, []);

  const loadModels = useCallback((selectedBrand: string) => {
    setLoadingModels(true);
    fetchModels(selectedBrand)
      .then(setModels)
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, []);

  useEffect(() => {
    getClientId().then(setClientId).catch(() => {});
    cacheReadyRef.current = getConfig(CACHE_KEY).then(raw => {
      if (!raw || raw === 'YOK') { knownNoneRef.current = true; return; }
      if (raw === UNCERTAIN) return;
      try {
        const cached = JSON.parse(raw) as SellEstimateResult;
        setResult(prev => prev ?? cached);
      } catch {
        // bozuk önbelleği yok say
      }
    }).catch(() => {});
  }, []);

  const applyDismissed = async (data: SellEstimateResult): Promise<SellEstimateResult> => {
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
      const raw = await checkSellEstimate(clientId);
      if (seq !== seqRef.current) return;
      const data = await applyDismissed(raw);
      if (seq !== seqRef.current) return;
      knownNoneRef.current = data.status === 'YOK';
      setResult(data);
      persist(data);
      if (data.status === 'BEKLİYOR') syncPushToken();
      if (data.status === 'HAZIR') {
        await markAsSeen(clientId, 'sell');
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

  const checkOnMount = useCallback(async () => {
    if (checkedRef.current || !clientId) return;
    checkedRef.current = true;
    await cacheReadyRef.current;
    if (knownNoneRef.current) return;
    await runCheck(false);
  }, [clientId, runCheck]);

  const setPanel = useCallback((key: SellPanelKey, status: SellPanelStatus) => {
    setPanels(prev => ({ ...prev, [key]: status }));
  }, []);

  const validate = (): string | null => {
    if (!brand.trim())  return 'Marka zorunludur.';
    if (!model.trim())  return 'Model zorunludur.';
    if (!pkg.trim())    return 'Motor seçeneği ve araç paketi zorunludur.';
    if (!year.trim())   return 'Model yılı zorunludur.';
    if (!km.trim())     return 'Kilometre zorunludur.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!clientId) { setError('Sistem hazırlanıyor, lütfen bekleyin.'); return; }

    setLoading(true);
    try {
      const payload: SellEstimateRequest = {
        clientId, name: name.trim() || 'Belirtilmedi',
        brand: brand.trim(), model: model.trim(), package: pkg.trim(),
        year: year.trim(), km: km.trim(), panels, heavyDamage,
      };
      await submitSellEstimate(payload);
      setSubmitted(true);
      knownNoneRef.current = false;
      persist({ ...NO_RESULT, status: 'BEKLİYOR' });
      syncPushToken();
      setName(''); setBrand(''); setModel(''); setPkg(''); setYear(''); setKm('');
      setPanels(DEFAULT_PANELS);
      setHeavyDamage(false);
      forceCheck();
    } catch (err: any) {
      knownNoneRef.current = false;
      setConfig(CACHE_KEY, UNCERTAIN).catch(() => {});
      setError(err?.message || 'İstek gönderilemedi. İnternet bağlantınızı kontrol edin.');
      if (String(err?.message).includes('Zaten')) forceCheck();
    } finally {
      setLoading(false);
    }
  }, [clientId, name, brand, model, pkg, year, km, panels, heavyDamage, forceCheck]);

  const reset = useCallback(() => {
    const id = resultRef.current?.requestId;
    if (id) setConfig(DISMISSED_KEY, id).catch(() => {});
    if (clientId) markAsSeen(clientId, 'sell').catch(() => {});
    seqRef.current++;
    inFlightRef.current = false;
    setCheckingStatus(false);
    setStatusError('');
    setSubmitted(false);
    setResult(null);
    persist(NO_RESULT);
    knownNoneRef.current = true;
    setName(''); setBrand(''); setModel(''); setPkg(''); setYear(''); setKm('');
    setPanels(DEFAULT_PANELS);
    setHeavyDamage(false);
  }, [clientId]);

  const cancelPending = useCallback(async () => {
    setCancelling(true);
    setStatusError('');
    try {
      await cancelSellEstimate();
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
    brand, setBrand,
    model, setModel,
    pkg, setPkg,
    year, setYear,
    km, setKm,
    panels, setPanel,
    heavyDamage, setHeavyDamage,
    brands, models, loadingModels, loadModels,
    modalType, setModalType,
    loading, checkingStatus, statusError, error,
    submitted, result,
    cancelling, cancelPending,
    handleSubmit, checkStatus, forceCheck, checkOnMount, reset,
  };
};
