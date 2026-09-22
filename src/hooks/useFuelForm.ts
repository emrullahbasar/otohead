import { useState, useCallback } from 'react';

export interface FuelForm {
  pricePerLiter: string;
  totalLiters:   string;
  previousKm:    string;
  currentKm:     string;
  isFull:        boolean;
  station:       string;
}

export const EMPTY_FORM: FuelForm = {
  pricePerLiter: '',
  totalLiters:   '',
  previousKm:    '',
  currentKm:     '',
  isFull:        false,
  station:       '',
};

export const useFuelForm = () => {
  const [record, setRecord] = useState<FuelForm>(EMPTY_FORM);

  const updateField = useCallback(<K extends keyof FuelForm>(
    field: K, value: FuelForm[K]
  ) => {
    setRecord(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleReceiptScanned = useCallback((data: Partial<FuelForm>) => {
    setRecord(prev => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
      ),
    }));
  }, []);

  const resetForm = useCallback((previousKm?: string) => {
    setRecord({ ...EMPTY_FORM, previousKm: previousKm || '' });
  }, []);

  return {
    record,
    setRecord,
    updateField,
    handleReceiptScanned,
    resetForm,
  };
};