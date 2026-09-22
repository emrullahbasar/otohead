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
// 3. Km bazlı anlık bildirim
// ─────────────────────────────────────────
export async function scheduleMaintenanceReminder(
  carName: string,
  maintenanceType: string,
  targetKm: number,
  currentKm: number,
): Promise<void> {
  const remaining = targetKm - currentKm;
  const thresholds = [2000, 1000, 500];

  for (const threshold of thresholds) {
    if (remaining <= threshold) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔧 Bakım Hatırlatıcı',
          body: `${carName} - ${maintenanceType} için yaklaşık ${threshold} km kaldı!`,
        },
        trigger: null,
      });
    }
  }
}

// ─────────────────────────────────────────
// 4. ANA FONKSİYON — Akıllı otomatik hesap
// ─────────────────────────────────────────
export interface SmartReminderResult {
  nextDate?: string;   // Forma otomatik doldurulacak
  nextKm?: string;     // Forma otomatik doldurulacak
}

export async function scheduleSmartReminders(
  carName: string,
  recordType: string,
  recordDate: string,       // İşlem tarihi (TR format)
  recordKm: string,         // İşlem anındaki km
  isTicari: boolean = false,
): Promise<SmartReminderResult> {

  const baseDate = parseTRDate(recordDate) || new Date();
  const baseKm = parseInt(recordKm) || 0;
  const result: SmartReminderResult = {};

  switch (recordType) {

    // ── Muayene ──────────────────────────────
    case 'Muayene': {
      const years = isTicari ? 1 : 2;
      const nextDate = addYears(baseDate, years);
      const nextDateStr = toTRDate(nextDate);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Muayene', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Muayene', nextDateStr, 7);
      break;
    }

    // ── Sigorta ──────────────────────────────
    case 'Sigorta': {
      const nextDate = addYears(baseDate, 1);
      const nextDateStr = toTRDate(nextDate);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Sigorta', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Sigorta', nextDateStr, 7);
      break;
    }

    // ── Kasko ─────────────────────────────────
    case 'Kasko': {
      const nextDate = addYears(baseDate, 1);
      const nextDateStr = toTRDate(nextDate);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Kasko', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Kasko', nextDateStr, 7);
      break;
    }

    // ── Periyodik Bakım ───────────────────────
    // Hangisi önce gelirse: +10.000 km veya +1 yıl
    case 'Periyodik Bakım': {
      const nextKm = baseKm + 10000;
      const nextDate = addYears(baseDate, 1);
      const nextDateStr = toTRDate(nextDate);
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      // Tarih bazlı: 1 ay ve 1 hafta önce
      await scheduleDateReminder(carName, 'Periyodik Bakım', nextDateStr, 30);
      await scheduleDateReminder(carName, 'Periyodik Bakım', nextDateStr, 7);

      // Km bazlı: 2000 km kala anlık bildirim
      await scheduleMaintenanceReminder(carName, 'Periyodik Bakım', nextKm, baseKm);
      break;
    }

    // ── Lastik Değişimi ───────────────────────
    case 'Lastik Değişimi': {
      const nextKm = baseKm + 40000;
      const nextDate = addYears(baseDate, 2);
      const nextDateStr = toTRDate(nextDate);
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Lastik Değişimi', nextDateStr, 30);
      await scheduleMaintenanceReminder(carName, 'Lastik Değişimi', nextKm, baseKm);
      break;
    }

    // ── Triger Seti ───────────────────────────
    case 'Triger Seti': {
      const nextKm = baseKm + 60000;
      const nextDate = addYears(baseDate, 4);
      const nextDateStr = toTRDate(nextDate);
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Triger Seti', nextDateStr, 30);
      await scheduleMaintenanceReminder(carName, 'Triger Seti', nextKm, baseKm);
      break;
    }

    // ── Fren Bakımı ───────────────────────────
    case 'Fren Bakımı': {
      const nextKm = baseKm + 30000;
      const nextDate = addYears(baseDate, 2);
      const nextDateStr = toTRDate(nextDate);
      result.nextKm = String(nextKm);
      result.nextDate = nextDateStr;

      await scheduleDateReminder(carName, 'Fren Bakımı', nextDateStr, 30);
      await scheduleMaintenanceReminder(carName, 'Fren Bakımı', nextKm, baseKm);
      break;
    }

    // ── Akü Değişimi ──────────────────────────
    case 'Akü Değişimi': {
      const nextDate = addYears(baseDate, 3);
      const nextDateStr = toTRDate(nextDate);
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