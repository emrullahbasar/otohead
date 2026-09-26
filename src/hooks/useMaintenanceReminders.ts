import { Alert } from 'react-native';
import {
  applySmartReminders,
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

// Kullanıcının elle girdiği "sonraki km" değeri işlem km'sinden büyük değilse
// güvenilmez (anlamsız/hatalı giriş) — reddedip otomatik hesaplamaya bırakır.
const isValidOverrideKm = (km: string, baseKm: string): boolean => {
  const k = parseInt(km, 10);
  const b = parseInt(baseKm, 10) || 0;
  return Number.isFinite(k) && k > b;
};

// Kullanıcının elle girdiği "sonraki tarih" işlem tarihinden ileride değilse güvenilmez.
const isValidOverrideDate = (dateStr: string, baseDateStr: string): boolean => {
  const toComparable = (s: string): string | null => {
    const parts = s.split('.');
    if (parts.length !== 3) return null;
    const [d, m, y] = parts;
    return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  };
  const a = toComparable(dateStr);
  const b = toComparable(baseDateStr);
  return !!a && !!b && a > b;
};

export interface ReminderResult {
  nextDate: string;
  nextKm:   string;
}

export const useMaintenanceReminders = () => {
  const scheduleForRecord = async (
    recordId:   string,
    carName:    string,
    recordType: string,
    recordDate: string,
    recordKm:   string,
    existingNextDate?: string,
    existingNextKm?:  string,
  ): Promise<ReminderResult> => {
    let finalNextDate = (existingNextDate && isValidOverrideDate(existingNextDate, recordDate)) ? existingNextDate : '';
    let finalNextKm   = (existingNextKm   && isValidOverrideKm(existingNextKm, recordKm))       ? existingNextKm   : '';

    if (SMART_TYPES.includes(recordType) && carName) {
      let isTicari = false;
      if (TICARI_TYPES.includes(recordType)) {
        isTicari = await askIsTicari();
      }

      const result = await applySmartReminders(
        recordId, carName, recordType, recordDate, recordKm, isTicari,
        { nextDate: finalNextDate || existingNextDate, nextKm: finalNextKm || existingNextKm },
      );

      if (!finalNextDate && result.nextDate) finalNextDate = result.nextDate;
      if (!finalNextKm   && result.nextKm)   finalNextKm   = result.nextKm;
    } else if (carName) {
      await sendRecordCreatedNotification(carName, recordType || 'İşlem');
    }

    return { nextDate: finalNextDate, nextKm: finalNextKm };
  };

  const scheduleForUpdate = async (
    recordId:   string,
    carName:    string,
    editType:   string,
    editDate:   string,
    editKm:     string,
    existingNextDate?: string,
    existingNextKm?:  string,
  ): Promise<ReminderResult> => {
    let finalNextDate = (existingNextDate && isValidOverrideDate(existingNextDate, editDate)) ? existingNextDate : '';
    let finalNextKm   = (existingNextKm   && isValidOverrideKm(existingNextKm, editKm))       ? existingNextKm   : '';

    if (SMART_TYPES.includes(editType) && carName) {
      let isTicari = false;
      if (TICARI_TYPES.includes(editType)) {
        isTicari = await askIsTicari();
      }

      const result = await applySmartReminders(
        recordId, carName, editType, editDate, editKm, isTicari,
        { nextDate: finalNextDate || existingNextDate, nextKm: finalNextKm || existingNextKm },
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
