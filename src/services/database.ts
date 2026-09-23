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

// Yeni kurulumda birkaç yerden aynı anda çağrılabilir; iki çağrının ikisi de
// "kimlik yok" görüp çakışan INSERT yapmasın diye tek seferde çalıştırılır.
let clientIdInFlight: Promise<string> | null = null;

export const getClientId = (): Promise<string> => {
  if (!clientIdInFlight) {
    clientIdInFlight = (async () => {
      const database = await getDB();
      const read = () => database.getFirstAsync<{ value: string }>(
        `SELECT value FROM client_config WHERE key = 'clientId'`
      );
      const existing = await read();
      if (existing) return existing.value;

      await database.runAsync(
        `INSERT OR IGNORE INTO client_config (key, value) VALUES ('clientId', ?)`,
        [uuidv4()]
      );
      const created = await read();
      if (!created) throw new DatabaseError('Cihaz kimliği oluşturulamadı.');
      return created.value;
    })().finally(() => { clientIdInFlight = null; });
  }
  return clientIdInFlight;
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

export const getConfig = async (key: string): Promise<string | null> => {
  const database = await getDB();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM client_config WHERE key = ?`,
    [key]
  );
  return row?.value ?? null;
};

export const setConfig = async (key: string, value: string): Promise<void> => {
  const database = await getDB();
  await database.runAsync(
    `INSERT OR REPLACE INTO client_config (key, value) VALUES (?, ?)`,
    [key, value]
  );
};

// Sunucu bu clientId için yeniden kayıt vermeyi reddettiğinde (kayıt zaten var
// ama yerel sır eşleşmiyor) cihazı kilitli bırakmamak için yeni kimlik üretir.
export const rotateClientId = async (): Promise<string> => {
  const database = await getDB();
  const newId = uuidv4();
  await database.runAsync(
    `INSERT OR REPLACE INTO client_config (key, value) VALUES ('clientId', ?)`,
    [newId]
  );
  await database.runAsync(`DELETE FROM client_config WHERE key = 'clientSecret'`);
  // Eski kimliğe ait önbellekler yeni kimlikte geçersizdir.
  await database.runAsync(
    `DELETE FROM client_config WHERE key IN ('pushTokenSent', 'lastSuggestion', 'lastEvaluation', 'dismissedSuggestion', 'dismissedEvaluation')`
  );
  return newId;
};

// Sunucu tarafında kayıt silinmiş/değişmişse yerelde geçersiz kalan sırrı
// temizler — bkz. suggestionApi.ts'teki "Yetkisiz istek" kendi kendini onarma.
export const clearClientSecret = async (): Promise<void> => {
  const database = await getDB();
  await database.runAsync(`DELETE FROM client_config WHERE key = 'clientSecret'`);
};