import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// TR formatındaki tarihi Date'e çevir
const parseTRDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const d = new Date(
    parseInt(parts[2], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[0], 10),
  );
  return isNaN(d.getTime()) ? null : d;
};

// Date'i TR formatına çevir
const toTRDate = (date: Date): string => {
  return date.toLocaleDateString('tr-TR');
};

// Tarihe gün ekle
const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};


const addYears = (date: Date, years: number): Date => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
};

// ─────────────────────────────────────────
// 1. Anlık bildirim — işlem kaydedildi
// ─────────────────────────────────────────
export async function sendRecordCreatedNotification(
  carName: string,
  recordType: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ İşlem Kaydedildi',
      body: `${carName} aracınız için "${recordType}" işlemi başarıyla kaydedildi.`,
    },
    trigger: null,
  });
}

// ─────────────────────────────────────────
// 2. Tarih bazlı hatırlatıcı
// ─────────────────────────────────────────
export async function scheduleDateReminder(
  carName: string,
  recordType: string,
  nextDateStr: string,
  reminderDays: number,
): Promise<void> {
  const targetDate = parseTRDate(nextDateStr);
  if (!targetDate) return;

  const reminderDate = new Date(targetDate);
  reminderDate.setDate(reminderDate.getDate() - reminderDays);
  reminderDate.setHours(9, 0, 0, 0);

  if (reminderDate <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚠️ ${recordType} Yaklaşıyor`,
      body: `${carName} aracınızın ${recordType.toLowerCase()} tarihi ${reminderDays} güne kaldı! (${nextDateStr})`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });
}

// ─────────────────────────────────────────
// 4. ANA FONKSİYON — Akıllı otomatik hesap
// ─────────────────────────────────────────
export interface SmartReminderResult {
  nextDate?: string;   // Forma otomatik doldurulacak
  nextKm?: string;     // Forma otomatik doldurulacak
}

// Km'ye bağlı bakım türlerinin varsayılan aralıkları (hangisi önce gelirse: km veya yıl).
// Formdaki açıklama metinleri de bu tabloyu kullanır.
export const KM_INTERVALS: Record<string, { km: number; years: number }> = {
  'Periyodik Bakım': { km: 10000, years: 1 },
  'Lastik Değişimi': { km: 40000, years: 2 },
  'Triger Seti':     { km: 60000, years: 4 },
  'Fren Bakımı':     { km: 30000, years: 2 },
};

// Kullanıcı formda kendi sonraki tarih/km değerini girdiyse hatırlatıcılar onu kullanır;
// boşsa tür başına varsayılan aralık hesaplanır.
export interface SmartReminderOverrides {
  nextDate?: string;   // TR format (gg.aa.yyyy)
  nextKm?: string;
}

export async function scheduleSmartReminders(
  carName: string,
  recordType: string,
  recordDate: string,       // İşlem tarihi (TR format)
  recordKm: string,         // İşlem anındaki km
  isTicari: boolean = false,
  overrides: SmartReminderOverrides = {},
): Promise<SmartReminderResult> {

  const baseDate = parseTRDate(recordDate) || new Date();
  const baseKm = parseInt(recordKm) || 0;
  const result: SmartReminderResult = {};

  const userKm = parseInt(overrides.nextKm || '', 10);
  const pickKm = (defaultAdd: number): number =>
    userKm > baseKm ? userKm : baseKm + defaultAdd;
  const pickDate = (auto: Date): string =>
    overrides.nextDate && parseTRDate(overrides.nextDate) ? overrides.nextDate : toTRDate(auto);

  switch (recordType) {

    // ── Muayene ──────────────────────────────
    case 'Muayene': {
      const years = isTicari ? 1 : 2;
      const nextDateStr = pickDate(addYears(baseDate, years));
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Muayene', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Muayene', nextDateStr, 7);
      break;
    }

    // ── Sigorta ──────────────────────────────
    case 'Sigorta': {
      const nextDateStr = pickDate(addYears(baseDate, 1));
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Sigorta', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Sigorta', nextDateStr, 7);
      break;
    }

    // ── Kasko ─────────────────────────────────
    case 'Kasko': {
      const nextDateStr = pickDate(addYears(baseDate, 1));
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Kasko', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Kasko', nextDateStr, 7);
      break;
    }

    // ── Periyodik Bakım ───────────────────────
    // Hangisi önce gelirse: +10.000 km veya +1 yıl
    case 'Periyodik Bakım': {
      const iv = KM_INTERVALS['Periyodik Bakım'];
      const nextKm = pickKm(iv.km);
      const nextDateStr = pickDate(addYears(baseDate, iv.years));
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      // Tarih bazlı: 1 ay ve 1 hafta önce
      await scheduleDateReminder(carName, 'Periyodik Bakım', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Periyodik Bakım', nextDateStr, 7);
      break;
    }

    // ── Lastik Değişimi ───────────────────────
    case 'Lastik Değişimi': {
      const iv = KM_INTERVALS['Lastik Değişimi'];
      const nextKm = pickKm(iv.km);
      const nextDateStr = pickDate(addYears(baseDate, iv.years));
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Lastik Değişimi', nextDateStr, 30);
      break;
    }

    // ── Triger Seti ───────────────────────────
    case 'Triger Seti': {
      const iv = KM_INTERVALS['Triger Seti'];
      const nextKm = pickKm(iv.km);
      const nextDateStr = pickDate(addYears(baseDate, iv.years));
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Triger Seti', nextDateStr, 30);
      break;
    }

    // ── Fren Bakımı ───────────────────────────
    case 'Fren Bakımı': {
      const iv = KM_INTERVALS['Fren Bakımı'];
      const nextKm = pickKm(iv.km);
      const nextDateStr = pickDate(addYears(baseDate, iv.years));
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Fren Bakımı', nextDateStr, 30);
      break;
    }

    // ── Akü Değişimi ──────────────────────────
    case 'Akü Değişimi': {
      const nextDateStr = pickDate(addYears(baseDate, 3));
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Akü Değişimi', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Akü Değişimi', nextDateStr, 7);
      break;
    }

    default:
      break;
  }

  return result;
}

// Geriye dönük uyumluluk
export const scheduleInspectionReminder = (carName: string, dateStr: string) =>
  scheduleDateReminder(carName, 'Muayene', dateStr, 7);