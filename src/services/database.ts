import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseError } from '../config/errors';

let db: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (!db) {
    try {
      db = await SQLite.openDatabaseAsync('arabamcepte.db');
    } catch {
      throw new DatabaseError('Veritabanı açılamadı.');
    }
  }
  return db;
};

export const initTables = async (): Promise<void> => {
  try {
    const database = await getDB();

    await database.execAsync(`PRAGMA journal_mode = WAL;`);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS client_config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS cars (
        id       TEXT PRIMARY KEY,
        brand    TEXT NOT NULL,
        model    TEXT NOT NULL,
        year     TEXT NOT NULL,
        nickname TEXT
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id       TEXT PRIMARY KEY NOT NULL,
        carId    TEXT NOT NULL,
        type     TEXT NOT NULL,
        date     TEXT NOT NULL,
        km       INTEGER,
        nextKm   INTEGER,
        nextDate TEXT,
        note     TEXT,
        price    REAL
      );
    `);

    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS fuel_records (
        id            TEXT PRIMARY KEY,
        carId         TEXT NOT NULL DEFAULT 'default',
        date          TEXT NOT NULL,
        pricePerLiter REAL NOT NULL,
        totalLiters   REAL NOT NULL,
        previousKm    REAL NOT NULL,
        currentKm     REAL NOT NULL,
        isFull        INTEGER NOT NULL DEFAULT 0,
        station       TEXT
      );
    `);

    // Migration — mevcut tabloya carId ekle, zaten varsa hata fırlatır ignore et
    try {
      await database.execAsync(
        `ALTER TABLE fuel_records ADD COLUMN carId TEXT NOT NULL DEFAULT 'default';`
      );
    } catch {
      // Kolon zaten mevcut
    }

  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError('Veritabanı tabloları oluşturulamadı.');
  }
};

export const getClientId = async (): Promise<string> => {
  const database = await getDB();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM client_config WHERE key = 'clientId'`
  );
  if (row) return row.value;

  const newId = uuidv4();
  await database.runAsync(
    `INSERT INTO client_config (key, value) VALUES ('clientId', ?)`,
    [newId]
  );
  return newId;
};

// Apps Script'in bu clientId için verdiği kişiye özel yetkilendirme sırrı —
// bkz. src/services/suggestionApi.ts ensureSecret(). Global/statik bir anahtar
// DEĞİL, yalnızca bu cihaza ait, sunucu tarafında clientId'ye bağlı üretilir.
export const getClientSecret = async (): Promise<string | null> => {
  const database = await getDB();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM client_config WHERE key = 'clientSecret'`
  );
  return row?.value ?? null;
};

export const setClientSecret = async (secret: string): Promise<void> => {
  const database = await getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO client_config (key, value) VALUES ('clientSecret', ?)`,
    [secret]
  );
};