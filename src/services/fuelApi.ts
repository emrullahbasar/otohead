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
    const rows = await db.getAllAsync<FuelRecordRow>(
      `SELECT * FROM fuel_records WHERE carId = ? ORDER BY rowid DESC`,
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
  } catch (err) {
  console.error('addFuelRecord hatası:', err);
  throw new DatabaseError('Yakıt kaydı eklenemedi.');
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

export const deleteFuelRecord = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(`DELETE FROM fuel_records WHERE id = ?`, [id]);
  } catch {
    throw new DatabaseError('Kayıt silinemedi.');
  }
};