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
// Yalnızca VİRGÜL ondalık ayıracı sayılır; NOKTA hiçbir zaman ondalık kabul
// edilmez, her zaman binlik ayıracı sayılıp ayıklanır. Bunun nedeni: alan
// kontrollü (controlled) bir TextInput — her tuş vuruşunda geri okunan metin,
// formatAmountDisplay'in bir önceki tuşta EKLEDİĞİ binlik "." işaretini de
// içeriyor (ör. "1.234"). Eskiden en son ayraç (nokta ya da virgül, hangisi
// sonda ise) ondalık sayılıyordu; bu, kullanıcı henüz hiçbir ayraç yazmamışken
// bile otomatik eklenen binlik noktasını "ondalık nokta" sanıp değeri 2
// haneye kısaltıyordu (4. haneden sonra tutar büyüyemez hâle geliyordu).
const MAX_AMOUNT_INT_DIGITS = 10;

export const parseAmountInput = (value: string): string => {
  const cleaned = value.replace(/[^\d,]/g, ''); // nokta burada zaten atılır (binlik ayracı)
  const lastComma = cleaned.lastIndexOf(',');
  if (lastComma === -1) return cleaned.slice(0, MAX_AMOUNT_INT_DIGITS);

  const intPart = cleaned.slice(0, lastComma).slice(0, MAX_AMOUNT_INT_DIGITS);
  const decPart = cleaned.slice(lastComma + 1).slice(0, 2);
  return decPart ? `${intPart}.${decPart}` : intPart ? `${intPart}.` : '';
};

export const formatAmountDisplay = (value: string | number): string => {
  const str = typeof value === 'number' ? String(value) : value;
  if (!str) return '';
  // NOT: burada parseAmountInput çağrılmaz — o fonksiyon artık yalnızca HAM
  // kullanıcı tuş girişini (virgül=ondalık) ayrıştırır. Buraya gelen `value`
  // ise zaten KANONİK biçimdedir (nokta=ondalık, ör. "1234.56" ya da "1234."),
  // bu yüzden doğrudan "." üzerinden bölünür.
  const [intRaw, decRaw] = str.split('.');
  const intNum = parseInt(intRaw || '0', 10);
  const intFmt = isNaN(intNum) ? '0' : intNum.toLocaleString('tr-TR');
  return decRaw !== undefined ? `${intFmt},${decRaw}` : intFmt;
};
