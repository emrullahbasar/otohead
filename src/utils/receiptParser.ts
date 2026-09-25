// Yakıt fişi ayrıştırıcı — OCR çıktısından tarih, litre, litre fiyatı, tutar,
// kilometre ve istasyon çıkarır. Saf fonksiyonlardır (React Native'e bağlı değil).

export interface OcrWord {
  text: string;
  top: number;
  left: number;
  width: number;
  height: number;
  /** Kelimenin taban çizgisinin eğimi (radyan); yoksa 0 sayılır. */
  angle?: number;
}

export interface ReceiptData {
  date?:          string; // gg.aa.yyyy
  pricePerLiter?: string; // 80.70
  totalLiters?:   string; // 9.91
  totalAmount?:   string; // 800.00
  currentKm?:     string;
  station?:       string;
  fuelType?:      string; // yalnızca bilgi amaçlı
}

const TR_MAP: Record<string, string> = {
  'İ': 'I', 'ı': 'I', 'Ş': 'S', 'ş': 'S', 'Ğ': 'G', 'ğ': 'G',
  'Ü': 'U', 'ü': 'U', 'Ö': 'O', 'ö': 'O', 'Ç': 'C', 'ç': 'C',
};

// Anahtar kelime eşleşmesi için Türkçe harfleri ASCII büyük harfe çevirir
// (uzunluk korunur, indeksler orijinal metinle aynı kalır).
const ascii = (s: string): string =>
  s.replace(/[İıŞşĞğÜüÖöÇç]/g, c => TR_MAP[c]).toUpperCase();

const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

// ── Satır oluşturma ─────────────────────────────────────────────────────────
// ML Kit, "9,91 LT X" ile sağa yaslı "80,70" gibi aralarında geniş boşluk olan
// parçaları ayrı bloklara böler ve blok sırası satırları karıştırır. Kelimeleri
// konumlarına göre yeniden satırlara diziyoruz; fişin hafif eğik çekilmesini
// kelimelerin ortanca eğim açısıyla düzeltiyoruz.
export function buildRows(words: OcrWord[]): string[] {
  const valid = words.filter(w =>
    w.text && w.text.trim() && isFinite(w.top) && isFinite(w.left) && w.height > 0,
  );
  if (valid.length === 0) return [];

  const angle = median(valid.map(w => w.angle ?? 0));
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const pts = valid.map(w => {
    const cx = w.left + w.width / 2;
    const cy = w.top + w.height / 2;
    return {
      text: w.text.trim(),
      height: w.height,
      x: cx * cos + cy * sin,
      y: -cx * sin + cy * cos,
    };
  }).sort((a, b) => a.y - b.y);

  interface Row { items: typeof pts; cy: number; h: number }
  const rows: Row[] = [];
  for (const p of pts) {
    let best: Row | null = null;
    let bestDist = Infinity;
    for (const r of rows) {
      const dist = Math.abs(p.y - r.cy);
      if (dist <= 0.55 * Math.min(p.height, r.h) && dist < bestDist) {
        best = r;
        bestDist = dist;
      }
    }
    if (best) {
      best.items.push(p);
      const n = best.items.length;
      best.cy = (best.cy * (n - 1) + p.y) / n;
      best.h  = (best.h  * (n - 1) + p.height) / n;
    } else {
      rows.push({ items: [p], cy: p.y, h: p.height });
    }
  }

  return rows
    .sort((a, b) => a.cy - b.cy)
    .map(r => r.items.sort((a, b) => a.x - b.x).map(i => i.text).join(' '));
}

// ── Yardımcılar ─────────────────────────────────────────────────────────────

// OCR'ın rakam yerine harf okuduğu yaygın durumlar: 8O,70 → 80,70, 2l → 21
function fixDigits(row: string): string {
  // Bir rakamın (veya rakam + ayraç) hemen ardından gelen ve yanında başka harf
  // olmayan O, 0 sayılır. Ardışık O'lar ("8OO,OO") için kararlı hale gelene kadar tekrarlanır.
  const notLetter = '(?![A-NP-Za-np-zÇĞİÖŞÜçğıöşü])';
  const afterDigit = new RegExp(`(?<=\\d)[Oo]${notLetter}`, 'g');
  const afterSeparator = new RegExp(`(?<=\\d[.,\\-/:])[Oo]${notLetter}`, 'g');
  let s = row;
  let previous: string;
  do {
    previous = s;
    s = s.replace(afterDigit, '0').replace(afterSeparator, '0');
  } while (s !== previous);
  return s.replace(/(?<=\d)[lI](?=\d)/g, '1');
}

// "1.234,56" / "800,00" / "80.70" / "*800,00" → sayı
function toNumber(raw: string): number {
  let s = raw.replace(/[^\d.,]/g, '');
  const lastComma = s.lastIndexOf(',');
  const lastDot   = s.lastIndexOf('.');
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal  = lastComma > lastDot ? ',' : '.';
    const thousand = decimal === ',' ? '.' : ',';
    s = s.split(thousand).join('').replace(decimal, '.');
  } else if (lastComma >= 0) {
    s = s.replace(',', '.');
  }
  return parseFloat(s);
}

function format(value: number, minDecimals: number): string {
  const decimals = (String(value).split('.')[1] || '').length;
  return value.toFixed(Math.max(minDecimals, Math.min(decimals, 3)));
}

const plausibleLiters = (n: number) => isFinite(n) && n >= 0.5 && n <= 300;
const plausiblePrice  = (n: number) => isFinite(n) && n >= 5   && n <= 500;
const plausibleTotal  = (n: number) => isFinite(n) && n >= 1   && n <= 200000;

const AMOUNT = String.raw`\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]\d{2}`;

// ── Tarih ───────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

function validDate(d: number, m: number, y: number, now: Date): string | undefined {
  if (y < 2000 || y > now.getFullYear()) return undefined;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return undefined;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  if (date >= tomorrow) return undefined; // gelecekteki tarih büyük ihtimalle yanlış okuma
  return `${pad(d)}.${pad(m)}.${y}`;
}

function findDate(rows: string[], now: Date): string | undefined {
  for (const row of rows) {
    const dmy = /(?<!\d)(\d{1,2})[-./](\d{1,2})[-./](\d{4}|\d{2})(?!\d)/g;
    for (const m of row.matchAll(dmy)) {
      const year = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
      const result = validDate(parseInt(m[1], 10), parseInt(m[2], 10), year, now);
      if (result) return result;
    }
    const ymd = /(?<!\d)(20\d{2})[-./](\d{1,2})[-./](\d{1,2})(?!\d)/g;
    for (const m of row.matchAll(ymd)) {
      const result = validDate(parseInt(m[3], 10), parseInt(m[2], 10), parseInt(m[1], 10), now);
      if (result) return result;
    }
  }
  return undefined;
}

// ── İstasyon ────────────────────────────────────────────────────────────────

const BRANDS: [RegExp, string][] = [
  [/\bPETROL\s*OFISI\b|\bPO\b/, 'Petrol Ofisi'],
  [/\bSHELL\b/, 'Shell'],
  [/\bOPET\b/, 'Opet'],
  [/\bTOTAL(?:ENERGIES)?\b/, 'TotalEnergies'],
  [/\bAYTEMIZ\b/, 'Aytemiz'],
  [/\bALPET\b/, 'Alpet'],
  [/\bLUKOIL\b/, 'Lukoil'],
  [/\bMOIL\b/, 'Moil'],
  [/\bKADOIL\b/, 'Kadoil'],
  [/\bSUNPET\b/, 'Sunpet'],
  [/\bPETLINE\b/, 'Petline'],
  [/\bPARKOIL\b/, 'Parkoil'],
  [/\bSOCAR\b/, 'Socar'],
  [/\bTURKIYE\s*PETROLLERI\b|\bTP\b/, 'Türkiye Petrolleri'],
  [/\bGO\s*PETROL\b|\bGOPET\b/, 'GO'],
  [/\bBP\b/, 'BP'],
];

// "DEMİRLER" → "Demirler" (Türkçe büyük/küçük harf kuralları elle uygulanır;
// Hermes'te locale duyarlı toLocaleUpperCase güvenilir değil)
function titleCaseTr(s: string): string {
  return s
    .replace(/I/g, 'ı').replace(/İ/g, 'i')
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_m, sp: string, c: string) =>
      sp + (c === 'i' ? 'İ' : c === 'ı' ? 'I' : c.toUpperCase()));
}

function findStation(rows: string[]): string | undefined {
  const top = rows.slice(0, 8);
  for (const row of top) {
    const a = ascii(row);
    for (const [pattern, name] of BRANDS) {
      if (pattern.test(a)) return name;
    }
  }
  // Marka bulunamadı: firma unvanının başını kullan ("DEMİRLER PETROL ÜRÜNLERİ OTO..." → "Demirler Petrol Ürünleri")
  const first = rows.find(r => /[A-Za-zÇĞİÖŞÜçğıöşü]{3,}/.test(r));
  if (!first) return undefined;
  const a = ascii(first);
  const cut = a.search(/\b(OTO|OTOMOTIV|GIDA|TURZ|TURIZM|SAN|TIC|INS|LTD|STI|A\.?S|ANONIM|LIMITED)\b/);
  const name = (cut > 2 ? first.slice(0, cut) : first).replace(/[^\p{L}\d\s&.-]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (name.length < 3) return undefined;
  return titleCaseTr(name).slice(0, 40).trim();
}

// ── Yakıt türü (yalnızca bilgi) ─────────────────────────────────────────────

function findFuelType(rows: string[]): string | undefined {
  const text = ascii(rows.join('\n'));
  if (/\bLPG\b|OTOGAZ/.test(text)) return 'LPG';
  if (/MOTORIN|DIZEL|DIESEL/.test(text)) return 'Dizel';
  if (/KURSUNSUZ|BENZIN|BENZIN/.test(text)) return 'Benzin';
  if (/ELEKTRIK|SARJ/.test(text)) return 'Elektrik';
  return undefined;
}

// ── Kilometre ───────────────────────────────────────────────────────────────

function findKm(rows: string[]): string | undefined {
  for (const row of rows) {
    const a = ascii(row);
    const m = a.match(/\bKM\b\.?[:\s]*(\d{1,3}(?:[.,]\d{3})+|\d{3,7})\b/) ||
              a.match(/(\d{4,7})\s*KM\b/);
    if (m) {
      const value = parseInt(m[1].replace(/[.,]/g, ''), 10);
      if (value >= 100 && value <= 2000000) return String(value);
    }
  }
  return undefined;
}

// ── Litre / fiyat / tutar ───────────────────────────────────────────────────

const LT_X_PRICE = /(\d+[.,]\d{1,3})\s*(?:LTR?|LITRE|L)\b\s*(?:[X×*]\s*)?(\d{1,3}[.,]\d{2,3})/;

function findTotal(rows: string[]): number | undefined {
  const groups: RegExp[] = [
    /GENEL\s*TOPLAM|\bTOPLAM\b|\bTOP\.?\b/,
    /TUTAR|ODENECEK|ODENEN/,
    /K\.?\s*KARTI|KREDI\s*KARTI|BANKA\s*KARTI|NAKIT|\bPOS\b/,
  ];
  for (const keyword of groups) {
    for (const row of rows) {
      const a = ascii(row);
      if (!keyword.test(a) || /KDV|ARA\s*TOPLAM/.test(a)) continue;
      const amounts = [...a.matchAll(new RegExp(AMOUNT, 'g'))].map(m => toNumber(m[0]));
      const last = amounts[amounts.length - 1];
      if (last !== undefined && plausibleTotal(last)) return last;
    }
  }
  return undefined;
}

function findLitersAndPrice(rows: string[]): { liters?: number; price?: number; fromLine: boolean } {
  for (const row of rows) {
    const m = ascii(row).match(LT_X_PRICE);
    if (m) {
      const liters = toNumber(m[1]);
      const price  = toNumber(m[2]);
      if (plausibleLiters(liters) && plausiblePrice(price)) return { liters, price, fromLine: true };
    }
  }

  let liters: number | undefined;
  let price: number | undefined;
  for (const row of rows) {
    const a = ascii(row);
    if (liters === undefined) {
      const m = a.match(/(\d+[.,]\d{1,3})\s*(?:LTR?|LITRE)\b/) ||
                a.match(/(?:MIKTAR|LITRE|ALINAN\s*YAKIT)[:\s]*(\d+[.,]\d{1,3})/);
      if (m && plausibleLiters(toNumber(m[1]))) liters = toNumber(m[1]);
    }
    if (price === undefined) {
      const m = a.match(/(?:BIRIM\s*FIYAT|LT\s*FIYAT|LITRE\s*FIYAT|B\.\s*FIYAT|FIYAT)[:\s]*[*₺]?\s*(\d{1,3}[.,]\d{2,3})/) ||
                a.match(/(\d{2,3}[.,]\d{2,3})\s*(?:TL|₺)?\s*\/\s*(?:LTR?|LITRE|L)\b/);
      if (m && plausiblePrice(toNumber(m[1]))) price = toNumber(m[1]);
    }
  }
  return { liters, price, fromLine: false };
}

// ── Ana fonksiyon ───────────────────────────────────────────────────────────

export function parseFuelReceipt(rawRows: string[], now: Date = new Date()): ReceiptData {
  const rows = rawRows.map(fixDigits).filter(r => r.trim().length > 0);
  const result: ReceiptData = {};

  const found = findLitersAndPrice(rows);
  const total = findTotal(rows);
  let { liters, price } = found;

  if (found.fromLine) {
    // "9,91 LT X 80,70" aynı satırdan geldiği için en güvenilir kaynak; tutar kullanılmaz.
  } else if (liters !== undefined && price !== undefined && total !== undefined) {
    const computedPrice = total / liters;
    const mismatch = Math.abs(liters * price - total) > Math.max(1, 0.01 * total);
    if (mismatch && plausiblePrice(computedPrice)) price = computedPrice;
  } else if (liters !== undefined && price === undefined && total !== undefined) {
    const computedPrice = total / liters;
    if (plausiblePrice(computedPrice)) price = computedPrice;
  } else if (liters === undefined && price !== undefined && total !== undefined) {
    const computedLiters = total / price;
    if (plausibleLiters(computedLiters)) liters = computedLiters;
  }

  if (liters !== undefined) result.totalLiters   = format(liters, 2);
  if (price  !== undefined) result.pricePerLiter = format(price, 2);
  if (total  !== undefined) result.totalAmount   = format(total, 2);

  result.date     = findDate(rows, now);
  result.currentKm = findKm(rows);
  result.station  = findStation(rawRows);
  result.fuelType = findFuelType(rows);

  return result;
}
