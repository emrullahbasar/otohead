import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FuelRecord, FuelAnalysis } from '../types';
import { getFuelRecords, addFuelRecord, deleteFuelRecord } from '../services/fuelApi';
import { computeAnalysis, filterRecords, FilterType } from '../utils/fuelUtils';
import { getErrorMessage } from '../config/errors';
import { FuelForm } from './useFuelForm';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const useFuelRecords = (
  selectedCarId: string | null,
  onRecordsLoaded: (previousKm: string) => void,
  onReset: () => void,
) => {
  const [history,         setHistory]         = useState<FuelRecord[]>([]);
  const [analysis,        setAnalysis]        = useState<FuelAnalysis | null>(null);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const [filter,          setFilter]          = useState<FilterType>('last5');

  const loadRecordsForCar = useCallback(async (carId: string) => {
    const records = await getFuelRecords(carId);
    setHistory(records);
    const { analysis: a, pending } = computeAnalysis(records);
    setAnalysis(a);
    setPendingAnalysis(pending);
    if (records.length > 0) {
      onRecordsLoaded(String(records[0].currentKm));
    } else {
      onReset();
    }
  }, [onRecordsLoaded, onReset]);

  const handleCalculateAndSave = useCallback(async (
    record: FuelForm,
    currentKm: string,
  ) => {
    if (!selectedCarId) return;
    if (!record.pricePerLiter || !record.totalLiters || !record.currentKm) {
      Alert.alert('Eksik Bilgi', 'Litre fiyatı, alınan yakıt ve güncel kilometre zorunludur.');
      return;
    }

    const previousKm = parseFloat(record.previousKm || '0');
    const currentKmValue = parseFloat(record.currentKm);
    if (record.previousKm && currentKmValue < previousKm) {
      Alert.alert('Hatalı Kilometre', 'Güncel kilometre, önceki kilometreden küçük olamaz.');
      return;
    }

    try {
      const newRecord: FuelRecord = {
        id:            generateId(),
        date:          new Date().toLocaleDateString('tr-TR'),
        pricePerLiter: parseFloat(record.pricePerLiter.replace(',', '.')),
        totalLiters:   parseFloat(record.totalLiters.replace(',', '.')),
        previousKm,
        currentKm:     currentKmValue,
        isFull:        record.isFull,
        station:       record.station || undefined,
      };

      await addFuelRecord(newRecord, selectedCarId);
      await loadRecordsForCar(selectedCarId);
    } catch (err) {
      console.error('Kayıt hatası:', err);
      Alert.alert('Hata', getErrorMessage(err));
      throw err;
    }
  }, [selectedCarId, loadRecordsForCar]);

  const handleDeleteRecord = useCallback(async (id: string) => {
    await deleteFuelRecord(id);
    if (selectedCarId) await loadRecordsForCar(selectedCarId);
  }, [selectedCarId, loadRecordsForCar]);

  const filteredHistory = filterRecords(history, filter);

  return {
    history,
    filteredHistory,
    filter,
    setFilter,
    analysis,
    pendingAnalysis,
    loadRecordsForCar,
    handleCalculateAndSave,
    handleDeleteRecord,
  };
};