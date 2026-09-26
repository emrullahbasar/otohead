import { useState } from 'react';
import { Alert } from 'react-native';
import { Car, MaintenanceRecord } from '../types';
import {
  saveMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../services/storage';
import { getErrorMessage } from '../config/errors';
import { checkKmDueForCar } from '../services/kmAlerts';
import { cancelRecordReminders } from '../notifications';

export const MAINTENANCE_TYPES = [
  'Periyodik Bakım', 'Sigorta', 'Kasko', 'Muayene', 'Triger Seti',
  'Lastik Değişimi', 'Rot Balans', 'Fren Bakımı', 'Akü Değişimi', 'Diğer',
];

export const YEARS = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

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

  // Kayıt zorunlu alanlarını kontrol eder; geçerliyse bu kayıt için kullanılacak
  // kimliği döndürür. Hatırlatıcılar kurulmadan ÖNCE çağrılmalı — aksi halde
  // kaydedilmeyen (doğrulaması geçmeyen) bir girişte bile alarm kuruluyordu.
  const validateNewRecord = (): string | null => {
    if (!recordType || !recordDate || !recordKm) {
      Alert.alert('Hata', 'Tür, tarih ve kilometre zorunludur.');
      return null;
    }
    if (!selectedCar) return null;
    return Date.now().toString();
  };

  const handleAddRecord = async (
    recordId:      string,
    finalNextDate: string,
    finalNextKm:   string,
  ) => {
    if (!selectedCar) return;

    const newRecord: MaintenanceRecord = {
      id:       recordId,
      type:     recordType,
      date:     recordDate,
      km:       recordKm,
      nextKm:   finalNextKm   || undefined,
      nextDate: finalNextDate || undefined,
      note:     recordNote    || undefined,
      price:    recordPrice   || undefined,
    };

    try {
      await saveMaintenanceRecord(newRecord, selectedCar.id);
      const updatedCar = { ...selectedCar, records: [newRecord, ...selectedCar.records] };
      updateCarInList(updatedCar);
      resetForm();
      // Bu kayıttaki km, aynı araca ait diğer bakım hedeflerine yaklaştıysa bildir.
      await checkKmDueForCar(selectedCar.id, parseInt(newRecord.km, 10) || undefined);
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err));
    }
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
            try {
              await deleteMaintenanceRecord(recordId);
              // Bu kayda bağlı kurulmuş (gelecekteki) hatırlatıcıları da iptal et,
              // yoksa silinen bir kayıt için yıllar sonra bildirim gelirdi.
              await cancelRecordReminders(recordId);
              const updatedCar = {
                ...selectedCar,
                records: selectedCar.records.filter(r => r.id !== recordId),
              };
              updateCarInList(updatedCar);
            } catch (err) {
              Alert.alert('Hata', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const handleUpdateRecord = async (updatedRecord: MaintenanceRecord) => {
    if (!selectedCar) return;
    try {
      await updateMaintenanceRecord(updatedRecord);
      const updatedCar = {
        ...selectedCar,
        records: selectedCar.records.map(r =>
          r.id === updatedRecord.id ? updatedRecord : r
        ),
      };
      updateCarInList(updatedCar);
      await checkKmDueForCar(selectedCar.id, parseInt(updatedRecord.km, 10) || undefined);
    } catch (err) {
      Alert.alert('Hata', getErrorMessage(err));
    }
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
    validateNewRecord,
    handleAddRecord,
    handleDeleteRecord,
    handleUpdateRecord,
    resetForm,
  };
};