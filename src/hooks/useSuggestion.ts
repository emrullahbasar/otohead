import { useState, useCallback } from 'react';
import { useSuggestionForm } from './useSuggestionForm';
import { useSuggestionStatus } from './useSuggestionStatus';
import { submitSuggestion, syncPushToken } from '../services/suggestionApi';

export const FUEL_TYPES  = ['Benzin', 'Dizel', 'LPG', 'Hybrid', 'Elektrik', 'Fark Etmez'];
export const GEAR_TYPES  = ['Manuel', 'Otomatik', 'Fark Etmez'];
export const CASE_TYPES  = ['Sedan', 'Hatchback', 'Station Wagon', 'MPV', 'SUV', 'Cabrio', 'Coupe', 'Pick-up', 'Fark Etmez'];

export type { ModalType } from './useSuggestionForm';

export const useSuggestion = () => {
  const formHook   = useSuggestionForm();
  const statusHook = useSuggestionStatus();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSearch = useCallback(async () => {
    setError('');
    const validationError = formHook.validate();
    if (validationError) { setError(validationError); return; }
    if (!statusHook.clientId) { setError('Sistem hazırlanıyor, lütfen bekleyin.'); return; }

    setLoading(true);
    try {
      const payload = formHook.buildPayload(statusHook.clientId);
      await submitSuggestion(payload);
      statusHook.setSubmitted(true);
      statusHook.markSubmitted();
      syncPushToken();
      formHook.resetForm();
      statusHook.checkedRef.current = false;
      // Gönderim başarılı; durum sorgusu arka planda çalışır (eski/yavaş bir
      // sorgu varsa onu geçersiz kılar), başarısız olursa hata gösterilmez.
      statusHook.forceCheck();
    } catch (err: any) {
      statusHook.markUncertain();
      setError(err?.message || 'İstek gönderilemedi.');
      // Sunucuda zaten bekleyen bir istek varsa ekran gerçek durumu göstersin.
      if (String(err?.message).includes('Zaten')) statusHook.forceCheck();
    } finally {
      setLoading(false);
    }
  }, [formHook, statusHook]);

  return {
    // Form
    budget:   formHook.form.budget,   setBudget:   (v: string)   => formHook.updateField('budget', v),
    yearMin:  formHook.form.yearMin,  setYearMin:  (v: string)   => formHook.updateField('yearMin', v),
    yearMax:  formHook.form.yearMax,  setYearMax:  (v: string)   => formHook.updateField('yearMax', v),
    caseType: formHook.form.caseType, setCaseType: (v: string[]) => formHook.updateField('caseType', v),
    fuel:     formHook.form.fuel,     setFuel:     (v: string[]) => formHook.updateField('fuel', v),
    gear:     formHook.form.gear,     setGear:     (v: string[]) => formHook.updateField('gear', v),
    extra:    formHook.form.extra,    setExtra:    (v: string)   => formHook.updateField('extra', v),
    touched:      formHook.touched,
    modalType:    formHook.modalType,
    setModalType: formHook.setModalType,
    // Status
    clientId:      statusHook.clientId,
    suggestion:    statusHook.suggestion,
    checkingStatus: statusHook.checkingStatus,
    statusError:   statusHook.statusError,
    submitted:     statusHook.submitted,
    checkStatus:   statusHook.checkStatus,
    forceCheck:    statusHook.forceCheck,
    checkOnMount:  statusHook.checkOnMount,
    resetSubmitted: statusHook.resetStatus,
    cancelling:    statusHook.cancelling,
    cancelPending: statusHook.cancelPending,
    // Search
    loading,
    error,
    handleSearch,
  };
};