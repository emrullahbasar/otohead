import { getDB, getRecordNotificationIdsForCar, clearRecordNotificationRowsForCar } from './database';
import { Car, MaintenanceRecord } from '../types';
import { DatabaseError } from '../config/errors';
import { cancelNotificationIds } from '../notifications';

// DB'den gelen ham satır tipleri
interface CarRow {
  id: string;
  brand: string;
  model: string;
  year: string;
  nickname: string | null;
}

interface MaintenanceRecordRow {
  id: string;
  carId: string;
  type: string;
  date: string;
  km: number | null;
  nextKm: number | null;
  nextDate: string | null;
  note: string | null;
  price: number | null;
}

export const loadCars = async (): Promise<Car[]> => {
  try {
    const db = await getDB();
    const cars = await db.getAllAsync<CarRow>(
      'SELECT * FROM cars ORDER BY rowid DESC'
    );

    const result: Car[] = [];
    for (const car of cars) {
      const records = await db.getAllAsync<MaintenanceRecordRow>(
        'SELECT * FROM maintenance_records WHERE carId = ? ORDER BY rowid DESC',
        [car.id]
      );
      result.push({
        id: car.id,
        brand: car.brand,
        model: car.model,
        year: car.year,
        nickname: car.nickname || '',
        records: records.map(r => ({
          id: r.id,
          type: r.type,
          date: r.date,
          km: String(r.km || ''),
          nextKm: r.nextKm ? String(r.nextKm) : '',
          nextDate: r.nextDate || '',
          note: r.note || '',
          price: r.price ? String(r.price) : '',
        })),
      });
    }
    return result;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Araçlar yüklenemedi.');
  }
};

export const saveCar = async (car: Car): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(
      'INSERT OR REPLACE INTO cars (id, brand, model, year, nickname) VALUES (?, ?, ?, ?, ?)',
      [car.id, car.brand, car.model, car.year, car.nickname]
    );
  } catch {
    throw new DatabaseError('Araç kaydedilemedi.');
  }
};

export const deleteCar = async (carId: string): Promise<void> => {
  try {
    const db = await getDB();
    // "Aracı ve tüm kayıtlarını sil" uyarısına rağmen eskiden yakıt kayıtları
    // ve kurulmuş hatırlatma alarmları silinmeden kalıyordu (ulaşılamaz veri +
    // silinen bir araç için yıllar sonra bildirim). Hepsini burada temizle.
    const notificationIds = await getRecordNotificationIdsForCar(carId);
    await cancelNotificationIds(notificationIds);
    await clearRecordNotificationRowsForCar(carId);
    await db.runAsync('DELETE FROM fuel_records WHERE carId = ?', [carId]);
    await db.runAsync('DELETE FROM maintenance_records WHERE carId = ?', [carId]);
    await db.runAsync('DELETE FROM cars WHERE id = ?', [carId]);
  } catch {
    throw new DatabaseError('Araç silinemedi.');
  }
};

export const saveMaintenanceRecord = async (
  record: MaintenanceRecord,
  carId: string,
): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(
      'INSERT OR REPLACE INTO maintenance_records (id, carId, type, date, km, nextKm, nextDate, note, price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        record.id, carId, record.type, record.date, record.km,
        record.nextKm ?? null, record.nextDate ?? null,
        record.note ?? null, record.price ?? null,
      ]
    );
  } catch {
    throw new DatabaseError('İşlem kaydedilemedi.');
  }
};

export const updateMaintenanceRecord = async (
  record: MaintenanceRecord,
): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync(
      'UPDATE maintenance_records SET type=?, date=?, km=?, nextKm=?, nextDate=?, note=?, price=? WHERE id=?',
      [
        record.type, record.date, record.km,
        record.nextKm ?? null, record.nextDate ?? null,
        record.note ?? null, record.price ?? null,
        record.id,
      ]
    );
  } catch {
    throw new DatabaseError('İşlem güncellenemedi.');
  }
};

export const deleteMaintenanceRecord = async (recordId: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.runAsync('DELETE FROM maintenance_records WHERE id = ?', [recordId]);
  } catch {
    throw new DatabaseError('İşlem silinemedi.');
  }
};