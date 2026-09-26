// RN'in CSS `textTransform: 'uppercase'`'ı JS runtime'ın VARSAYILAN (Türkçe
// olmayan) yerelini kullanır: "i" -> "I" (noktasız) olur, "İ" (noktalı büyük I)
// değil. Bu yüzden "istasyon" gibi kelimeler "ISTASYON" olur, doğrusu
// "İSTASYON"dur. Etiketleri elle büyük harf yazıp CSS dönüşümünü kaldırmak
// yerine (statik metinler için mümkün), PROP olarak gelen ya da tekrar
// kullanılan metinlerde bu fonksiyon kullanılır — Türkçe yerel-duyarlı büyütme.
export const trUpper = (s: string): string => s.toLocaleUpperCase('tr-TR');
