import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FuelRecord, FuelAnalysis } from '../types';
import { getFuelRecords, addFuelRecord, deleteFuelRecord } from '../services/fuelApi';
import { checkKmDueForCar } from '../services/kmAlerts';
import { confirmKmJump } from '../utils/kmGuard';
import { computeAnalysis, filterRecords, FilterType } from '../utils/fuelUtils';
import { getErrorMessage } from '../config/errors';
import { FuelForm } from './useFuelForm';
import { formatDateToString, parseDateString, isAfterToday } from '../utils/dateUtils';

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
  ): Promise<boolean> => {
    if (!selectedCarId) return false;
    if (!record.pricePerLiter || !record.totalLiters || !record.currentKm) {
      Alert.alert('Eksik Bilgi', 'Litre fiyatı, alınan yakıt ve güncel kilometre zorunludur.');
      return false;
    }

    const recordDate = record.date ? parseDateString(record.date) : new Date();
    if (!recordDate) {
      Alert.alert('Hatalı Tarih', 'Geçerli bir tarih seçin.');
      return false;
    }
    if (isAfterToday(recordDate)) {
      Alert.alert('Hatalı Tarih', 'Tarih bugünden ileri olamaz.');
      return false;
    }

    const previousKm = parseFloat(record.previousKm || '0');
    const currentKmValue = parseFloat(record.currentKm);
    if (record.previousKm && currentKmValue < previousKm) {
      Alert.alert('Hatalı Kilometre', 'Güncel kilometre, önceki kilometreden küçük olamaz.');
      return false;
    }

    // Aşırı büyük km atlamasında (ör. fazladan bir rakam) kaydetmeden önce onay iste.
    if (!(await confirmKmJump(selectedCarId, currentKmValue))) return false;

    try {
      const newRecord: FuelRecord = {
        id:            generateId(),
        date:          formatDateToString(recordDate),
        pricePerLiter: parseFloat(record.pricePerLiter.replace(',', '.')),
        totalLiters:   parseFloat(record.totalLiters.replace(',', '.')),
        previousKm,
        currentKm:     currentKmValue,
        isFull:        record.isFull,
        station:       record.station || undefined,
      };

      await addFuelRecord(newRecord, selectedCarId);
      await loadRecordsForCar(selectedCarId);
      // Girilen km bakım hedeflerine yaklaştıysa (aynı carId) bildirim gönder.
      await checkKmDueForCar(selectedCarId, currentKmValue);
      return true;
    } catch (err) {
      console.error('Kayıt hatası:', err);
      Alert.alert('Hata', getErrorMessage(err));
      return false;
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