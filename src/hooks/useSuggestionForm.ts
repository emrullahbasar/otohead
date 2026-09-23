import { useState, useCallback } from 'react';

export type ModalType = 'fuel' | 'gear' | 'caseType' | null;

interface SuggestionForm {
  budget:   string;
  yearMin:  string;
  yearMax:  string;
  caseType: string[];
  fuel:     string[];
  gear:     string[];
  extra:    string;
}

const INITIAL_FORM: SuggestionForm = {
  budget: '', yearMin: '', yearMax: '',
  caseType: [], fuel: [], gear: [], extra: '',
};

// Kasa/Yakıt "Fark Etmez" seçilince boş diziye döner (SelectionModal), bu yüzden
// "hiç dokunulmadı" ile "Fark Etmez seçildi" durumunu ayırt etmek için ayrı bir
// touched bayrağı tutuyoruz — yoksa geçerli bir "Fark Etmez" seçimi de zorunluluk
// hatası olarak reddedilir.
interface Touched {
  caseType: boolean;
  fuel:     boolean;
  gear:     boolean;
}

const INITIAL_TOUCHED: Touched = { caseType: false, fuel: false, gear: false };

export const useSuggestionForm = () => {
  const [form,      setForm]      = useState<SuggestionForm>(INITIAL_FORM);
  const [touched,   setTouched]   = useState<Touched>(INITIAL_TOUCHED);
  const [modalType, setModalType] = useState<ModalType>(null);

  const updateField = useCallback(<K extends keyof SuggestionForm>(
    field: K, value: SuggestionForm[K]
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'caseType' || field === 'fuel' || field === 'gear') {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  }, []);

  const validate = (): string | null => {
    if (!form.budget.trim()) return 'Bütçe alanı zorunludur.';
    if (!/^\d+$/.test(form.budget) || parseInt(form.budget, 10) <= 0) return 'Geçerli bir bütçe giriniz.';
    if (!form.yearMin.trim() || !form.yearMax.trim()) return 'Yıl aralığı zorunludur.';
    if (!/^\d{4}$/.test(form.yearMin) || !/^\d{4}$/.test(form.yearMax)) {
      return 'Yılları 4 haneli giriniz (örn. 2018).';
    }
    if (parseInt(form.yearMin, 10) > parseInt(form.yearMax, 10)) return 'Minimum yıl, maksimum yıldan büyük olamaz.';
    if (parseInt(form.yearMin, 10) < 1990 || parseInt(form.yearMax, 10) > new Date().getFullYear() + 1) {
      return 'Geçerli bir yıl aralığı giriniz.';
    }
    if (!touched.caseType) return 'Kasa tipi seçimi zorunludur.';
    if (!touched.fuel) return 'Yakıt tipi seçimi zorunludur.';
    if (!touched.gear) return 'Vites tipi seçimi zorunludur.';
    if (!form.extra.trim()) return 'Kullanım amacınızı açıklamanız zorunludur.';
    return null;
  };

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setTouched(INITIAL_TOUCHED);
  }, []);

  const buildPayload = (clientId: string) => ({
    clientId,
    budget:      form.budget,
    yearMin:     form.yearMin,
    yearMax:     form.yearMax,
    caseType:    form.caseType.length > 0 ? form.caseType.join(', ') : 'Belirtilmedi',
    fuel:        form.fuel.length > 0     ? form.fuel.join(', ')     : 'Belirtilmedi',
    gear:        form.gear.length > 0     ? form.gear.join(', ')     : 'Belirtilmedi',
    description: form.extra                                           || 'Belirtilmedi',
  });

  return {
    form,
    touched,
    modalType, setModalType,
    updateField,
    validate,
    resetForm,
    buildPayload,
  };
};