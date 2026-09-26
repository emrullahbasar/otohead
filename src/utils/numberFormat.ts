// Kilometre gibi tam sayı alanları: kullanıcı ayraç olarak nokta, virgül veya
// boşluk kullanabilir — hepsi ayıklanır, yalnızca rakamlar anlamlıdır. Eskiden
// yalnızca virgül ayıklanıyordu; "85.000" yazınca nokta ve sonrası (parseInt/
// parseFloat tarafından ondalık sanılıp) sessizce düşüyor, "85" kaydediliyordu.
const MAX_WHOLE_DIGITS = 9; // ~999.999.999 km/₺ — anlamsız derecede büyük girişi engeller

export const parseWholeNumberInput = (value: string): string =>
  value.replace(/[^\d]/g, '').slice(0, MAX_WHOLE_DIGITS);

export const formatWholeNumberDisplay = (value: string | number): string => {
  const raw = parseWholeNumberInput(String(value));
  if (!raw) return '';
  const num = parseInt(raw, 10);
  return isNaN(num) ? '' : num.toLocaleString('tr-TR'); // "85.000" — kartlarla aynı biçim
};

// Tutar alanları (₺): Türkçe kural — virgül ondalık ayracı, nokta binlik ayracı.
// Son yazılan ayraç ondalık kabul edilir (en fazla 2 basamak), öncesindeki
// ayraçlar binlik sayılıp ayıklanır. Depolama için kanonik "1250.75" (nokta
// ondalık) döner; ekranda formatAmountDisplay ile Türkçe biçime çevrilir.
const MAX_AMOUNT_INT_DIGITS = 10;

export const parseAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^\d.,]/g, '');
  const lastSep = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  if (lastSep === -1) return cleaned.replace(/[.,]/g, '').slice(0, MAX_AMOUNT_INT_DIGITS);

  const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, '').slice(0, MAX_AMOUNT_INT_DIGITS);
  const decPart = cleaned.slice(lastSep + 1).replace(/[.,]/g, '').slice(0, 2);
  return decPart ? `${intPart}.${decPart}` : intPart ? `${intPart}.` : '';
};

export const amountToNumber = (value: string): number => {
  const n = parseFloat(value);
  return isNaN(n) ? 0 : n;
};

export const formatAmountDisplay = (value: string | number): string => {
  const str = typeof value === 'number' ? String(value) : value;
  if (!str) return '';
  const [intRaw, decRaw] = parseAmountInput(str).split('.');
  const intNum = parseInt(intRaw || '0', 10);
  const intFmt = isNaN(intNum) ? '0' : intNum.toLocaleString('tr-TR');
  return decRaw !== undefined ? `${intFmt},${decRaw}` : intFmt;
};
