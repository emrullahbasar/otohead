import { getDB } from './database';
import { FuelRecord } from '../types';
import { DatabaseError } from '../config/errors';

interface FuelRecordRow {
  id:            string;
  carId:         string;
  date:          string;
  pricePerLiter: number;
  totalLiters:   number;
  previousKm:    number;
  currentKm:     number;
  isFull:        number;
  station:       string | null;
}

export const getFuelRecords = async (carId: string): Promise<FuelRecord[]> => {
  try {
    const db = await getDB();
    // Kilometreye göre sıralı (yalnızca artar) — ekleme sırasına göre değil,
    // gerçek kronolojik sıraya göre gösterir; geriye dönük eklenen bir kayıt
    // listenin başına sıçramaz.
    const rows = await db.getAllAsync<FuelRecordRow>(
      `SELECT * FROM fuel_records WHERE carId = ? ORDER BY currentKm DESC, rowid DESC`,
      [carId]
    );
    return rows.map(r => ({
      id:            r.id,
      date:          r.date,
      pricePerLiter: r.pricePerLiter,
      totalLiters:   r.totalLiters,
      previousKm:    r.previousKm,
      currentKm:     r.currentKm,
      isFull:        r.isFull === 1,
      station:       r.station ?? undefined,
    }));
  } catch {
    throw new DatabaseError('Yakıt kayıtları okunamadı.');
  }
};

export const addFuelRecord = async (
  record: FuelRecord,
  carId: string,
): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(
      `INSERT INTO fuel_records
        (id, carId, date, pricePerLiter, totalLiters, previousKm, currentKm, isFull, station)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        carId,
        record.date,
        record.pricePerLiter,
        record.totalLiters,
        record.previousKm,
        record.currentKm,
        record.isFull ? 1 : 0,
        record.station ?? null,
      ]
    );
  } catch {
    throw new DatabaseError('Yakıt kaydı eklenemedi.');
  }
};

// Ana Sayfa'daki yakıt kaydı dökümü için — her aracın kaç yakıt kaydı
// olduğunu tek sorguda döndürür (araç başına ayrı ayrı getFuelRecords
// çağırıp saymaktan kaçınmak için).
export const getFuelRecordCounts = async (): Promise<Record<string, number>> => {
  try {
    const db = await getDB();
    const rows = await db.getAllAsync<{ carId: string; cnt: number }>(
      `SELECT carId, COUNT(*) as cnt FROM fuel_records GROUP BY carId`
    );
    const counts: Record<string, number> = {};
    rows.forEach(r => { counts[r.carId] = r.cnt; });
    return counts;
  } catch {
    throw new DatabaseError('Yakıt kayıtları okunamadı.');
  }
};

export const deleteFuelRecord = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(`DELETE FROM fuel_records WHERE id = ?`, [id]);
  } catch {
    throw new DatabaseError('Kayıt silinemedi.');
  }
};