import { useState, useCallback } from 'react';

export type ModalType = 'fuel' | 'gear' | 'caseType' | null;

interface SuggestionForm {
  budget:   string;
  yearMin:  string;
  yearMax:  string;
  caseType: string[];
  fuel:     string[];
  gear:     string;
  extra:    string;
}

const INITIAL_FORM: SuggestionForm = {
  budget: '', yearMin: '', yearMax: '',
  caseType: [], fuel: [], gear: '', extra: '',
};

export const useSuggestionForm = () => {
  const [form,      setForm]      = useState<SuggestionForm>(INITIAL_FORM);
  const [modalType, setModalType] = useState<ModalType>(null);

  const updateField = useCallback(<K extends keyof SuggestionForm>(
    field: K, value: SuggestionForm[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const validate = (): string | null => {
    if (!form.budget.trim()) return 'Bütçe alanı zorunludur.';
    if (!form.yearMin.trim() || !form.yearMax.trim()) return 'Yıl aralığı zorunludur.';
    if (parseInt(form.yearMin) > parseInt(form.yearMax)) return 'Minimum yıl, maksimum yıldan büyük olamaz.';
    if (parseInt(form.yearMin) < 1990 || parseInt(form.yearMax) > new Date().getFullYear() + 1) {
      return 'Geçerli bir yıl aralığı giriniz.';
    }
    return null;
  };

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
  }, []);

  const buildPayload = (clientId: string) => ({
    clientId,
    budget:      form.budget,
    yearMin:     form.yearMin,
    yearMax:     form.yearMax,
    caseType:    form.caseType.length > 0 ? form.caseType.join(', ') : 'Belirtilmedi',
    fuel:        form.fuel.length > 0     ? form.fuel.join(', ')     : 'Belirtilmedi',
    gear:        form.gear                                            || 'Belirtilmedi',
    description: form.extra                                           || 'Belirtilmedi',
  });

  return {
    form,
    modalType, setModalType,
    updateField,
    validate,
    resetForm,
    buildPayload,
  };
};