import { Alert } from 'react-native';
import {
  scheduleSmartReminders,
  sendRecordCreatedNotification,
} from '../notifications';

const SMART_TYPES = [
  'Muayene', 'Sigorta', 'Kasko', 'Periyodik Bakım',
  'Lastik Değişimi', 'Fren Bakımı', 'Triger Seti', 'Akü Değişimi',
];

const TICARI_TYPES = ['Muayene'];

const askIsTicari = (): Promise<boolean> =>
  new Promise(resolve =>
    Alert.alert(
      '🚗 Araç Tipi',
      'Aracınız ticari araç mı?',
      [
        { text: 'Hayır (Binek)', onPress: () => resolve(false) },
        { text: 'Evet (Ticari)', onPress: () => resolve(true)  },
      ],
      { cancelable: false }
    )
  );

export interface ReminderResult {
  nextDate: string;
  nextKm:   string;
}

export const useMaintenanceReminders = () => {
  const scheduleForRecord = async (
    carName:    string,
    recordType: string,
    recordDate: string,
    recordKm:   string,
    existingNextDate?: string,
    existingNextKm?:  string,
  ): Promise<ReminderResult> => {
    let finalNextDate = existingNextDate || '';
    let finalNextKm   = existingNextKm   || '';

    if (SMART_TYPES.includes(recordType) && carName) {
      let isTicari = false;
      if (TICARI_TYPES.includes(recordType)) {
        isTicari = await askIsTicari();
      }

      const result = await scheduleSmartReminders(
        carName, recordType, recordDate, recordKm, isTicari,
      );

      if (!finalNextDate && result.nextDate) finalNextDate = result.nextDate;
      if (!finalNextKm   && result.nextKm)   finalNextKm   = result.nextKm;
    } else if (carName) {
      await sendRecordCreatedNotification(carName, recordType || 'İşlem');
    }

    return { nextDate: finalNextDate, nextKm: finalNextKm };
  };

  const scheduleForUpdate = async (
    carName:    string,
    editType:   string,
    editDate:   string,
    editKm:     string,
    existingNextDate?: string,
    existingNextKm?:  string,
  ): Promise<ReminderResult> => {
    let finalNextDate = existingNextDate || '';
    let finalNextKm   = existingNextKm   || '';

    if (SMART_TYPES.includes(editType) && carName) {
      let isTicari = false;
      if (TICARI_TYPES.includes(editType)) {
        isTicari = await askIsTicari();
      }

      const result = await scheduleSmartReminders(
        carName, editType, editDate, editKm, isTicari,
      );

      if (!finalNextDate && result.nextDate) finalNextDate = result.nextDate;
      if (!finalNextKm   && result.nextKm)   finalNextKm   = result.nextKm;
    } else if (carName) {
      await sendRecordCreatedNotification(carName, `${editType} güncellendi`);
    }

    return { nextDate: finalNextDate, nextKm: finalNextKm };
  };

  return { scheduleForRecord, scheduleForUpdate };
};