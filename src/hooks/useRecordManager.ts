import { useState } from 'react';
import { Alert } from 'react-native';
import { Car, MaintenanceRecord } from '../types';
import {
  saveMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../services/storage';

export const MAINTENANCE_TYPES = [
  'Periyodik Bakım', 'Sigorta', 'Kasko', 'Muayene',
  'Lastik Değişimi', 'Fren Bakımı', 'Triger Seti',
  'Akü Değişimi', 'Cam Suyu', 'Diğer',
];

export const YEARS = Array.from({ length: 30 }, (_, i) => (2025 - i).toString());

const getTodayDate = () => new Date().toLocaleDateString('tr-TR');

export const useRecordManager = (
  selectedCar:    Car | null,
  updateCarInList:(car: Car) => void,
) => {
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [recordType,     setRecordType]     = useState('');
  const [recordDate,     setRecordDate]     = useState(getTodayDate());
  const [recordNextDate, setRecordNextDate] = useState('');
  const [recordKm,       setRecordKm]       = useState('');
  const [recordNextKm,   setRecordNextKm]   = useState('');
  const [recordNote,     setRecordNote]     = useState('');
  const [recordPrice,    setRecordPrice]    = useState('');

  const resetForm = () => {
    setRecordType('');
    setRecordDate(getTodayDate());
    setRecordNextDate('');
    setRecordKm('');
    setRecordNextKm('');
    setRecordNote('');
    setRecordPrice('');
    setShowRecordForm(false);
  };

  const handleAddRecord = async (
    finalNextDate: string,
    finalNextKm:   string,
  ) => {
    if (!recordType || !recordDate || !recordKm) {
      Alert.alert('Hata', 'Tür, tarih ve kilometre zorunludur.');
      return;
    }
    if (!selectedCar) return;

    const newRecord: MaintenanceRecord = {
      id:       Date.now().toString(),
      type:     recordType,
      date:     recordDate,
      km:       recordKm,
      nextKm:   finalNextKm   || undefined,
      nextDate: finalNextDate || undefined,
      note:     recordNote    || undefined,
      price:    recordPrice   || undefined,
    };

    await saveMaintenanceRecord(newRecord, selectedCar.id);
    const updatedCar = { ...selectedCar, records: [newRecord, ...selectedCar.records] };
    updateCarInList(updatedCar);
    resetForm();
  };

  const handleDeleteRecord = (recordId: string) => {
    if (!selectedCar) return;
    Alert.alert(
      'Kaydı Sil',
      'Bu kaydı silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            await deleteMaintenanceRecord(recordId);
            const updatedCar = {
              ...selectedCar,
              records: selectedCar.records.filter(r => r.id !== recordId),
            };
            updateCarInList(updatedCar);
          },
        },
      ]
    );
  };

  const handleUpdateRecord = async (updatedRecord: MaintenanceRecord) => {
    if (!selectedCar) return;
    await updateMaintenanceRecord(updatedRecord);
    const updatedCar = {
      ...selectedCar,
      records: selectedCar.records.map(r =>
        r.id === updatedRecord.id ? updatedRecord : r
      ),
    };
    updateCarInList(updatedCar);
  };

  return {
    showRecordForm, setShowRecordForm,
    recordType,    setRecordType,
    recordDate,    setRecordDate,
    recordNextDate, setRecordNextDate,
    recordKm,      setRecordKm,
    recordNextKm,  setRecordNextKm,
    recordNote,    setRecordNote,
    recordPrice,   setRecordPrice,
    handleAddRecord,
    handleDeleteRecord,
    handleUpdateRecord,
    resetForm,
  };
};