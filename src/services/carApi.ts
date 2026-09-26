import carsData from '../data/cars.json';

const cars = carsData as Record<string, string[]>;

// Marka/model listesi uygulamanın içinde (yaklaşık 3 KB) — sunucu veya internet
// gerekmez, çevrimdışı da çalışır.
export const fetchBrands = async (): Promise<string[]> =>
  Object.keys(cars);

// hasOwnProperty ile kontrol ediyoruz: "brand" kullanıcının kendi yazdığı bir
// metin olabilir (Diğer → serbest giriş). "constructor", "toString", "__proto__"
// gibi bir marka yazılırsa düz `cars[brand]` erişimi Object.prototype'daki bir
// FONKSİYONA denk gelip diziymiş gibi kullanılmaya çalışılınca uygulama çöküyordu.
export const fetchModels = async (brand: string): Promise<string[]> => {
  if (!Object.prototype.hasOwnProperty.call(cars, brand)) return [];
  const models = cars[brand];
  return Array.isArray(models) ? models : [];
};
