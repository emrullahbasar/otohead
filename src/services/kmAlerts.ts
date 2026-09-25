import * as Notifications from 'expo-notifications';
import { getDB, getConfig, setConfig } from './database';

// Hedef km'ye kalan mesafe bu eşiklerin altına indikçe bir kez bildirim gider.
// 0 = hedef km'ye ulaşıldı/geçildi.
const LEVELS = [2000, 1000, 500, 0];

const fmtKm = (n: number): string => n.toLocaleString('tr-TR');

export interface LatestKm {
  km:     number;
  source: 'yakıt' | 'bakım';
  date:   string;
}

// Aracın bilinen en yüksek kilometresi (yakıt ve bakım kayıtları birlikte, aynı carId).
export async function getLatestKm(carId: string): Promise<LatestKm | null> {
  const db = await getDB();
  const fuel = await db.getFirstAsync<{ currentKm: number; date: string }>(
    'SELECT currentKm, date FROM fuel_records WHERE carId = ? ORDER BY currentKm DESC, rowid DESC LIMIT 1',
    [carId],
  );
  const maint = await db.getFirstAsync<{ km: number; date: string }>(
    'SELECT km, date FROM maintenance_records WHERE carId = ? AND km IS NOT NULL ORDER BY km DESC, rowid DESC LIMIT 1',
    [carId],
  );
  const f: LatestKm | null = fuel  ? { km: fuel.currentKm, source: 'yakıt', date: fuel.date  } : null;
  const m: LatestKm | null = maint ? { km: maint.km,       source: 'bakım', date: maint.date } : null;
  if (f && m) return f.km >= m.km ? f : m;
  return f ?? m;
}

// Aracın her bakım türü için EN SON kaydındaki "sonraki bakım km"sini güncel km ile karşılaştırır;
// hedefe 2000/1000/500 km kala (ve geçince) bildirim gönderir. Aynı eşik için tekrar göndermez.
// knownKm: az önce girilen km (yakıt/bakım kaydı); veritabanındaki en yüksek km ile birlikte değerlendirilir.
export async function checkKmDueForCar(carId: string, knownKm?: number): Promise<void> {
  try {
    const db = await getDB();
    const latest = await getLatestKm(carId);
    const current = Math.max(knownKm || 0, latest?.km || 0);
    if (!current) return;

    const rows = await db.getAllAsync<{ id: string; type: string; nextKm: number }>(
      `SELECT m.id, m.type, m.nextKm FROM maintenance_records m
        WHERE m.carId = ? AND m.nextKm IS NOT NULL
          AND m.rowid = (SELECT MAX(rowid) FROM maintenance_records WHERE carId = m.carId AND type = m.type)`,
      [carId],
    );
    if (!rows.length) return;

    const car = await db.getFirstAsync<{ brand: string; model: string; nickname: string | null }>(
      'SELECT brand, model, nickname FROM cars WHERE id = ?',
      [carId],
    );
    const carName = car ? (car.nickname || `${car.brand} ${car.model}`) : 'Aracınız';

    for (const r of rows) {
      const remaining = r.nextKm - current;
      let level: number | null = null;
      for (const l of LEVELS) if (remaining <= l) level = l;   // sağlanan en sıkı eşik
      if (level === null) continue;

      const key = `kmAlert:${r.id}:${r.nextKm}`;
      const prev = await getConfig(key);
      if (prev !== null && Number(prev) <= level) continue;
      await setConfig(key, String(level));

      const due = remaining <= 0;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: due ? '🔧 Bakım Zamanı Geldi' : '🔧 Bakım Yaklaşıyor',
          body: due
            ? `${carName} • ${r.type}: hedef km'ye (${fmtKm(r.nextKm)} km) ulaşıldı. Şu an ${fmtKm(current)} km.`
            : `${carName} • ${r.type}: şu an ${fmtKm(current)} km, hedef ${fmtKm(r.nextKm)} km. Yaklaşık ${fmtKm(remaining)} km kaldı.`,
        },
        trigger: null,
      });
    }
  } catch (err) {
    // Hatırlatıcı kritik bir akış değil; kayıt işlemini asla bozmasın.
    console.warn('checkKmDueForCar hatası:', err);
  }
}
