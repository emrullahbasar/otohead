import carsData from '../data/cars.json';

const cars = carsData as Record<string, string[]>;

// Marka/model listesi uygulamanın içinde (yaklaşık 3 KB) — sunucu veya internet
// gerekmez, çevrimdışı da çalışır.
export const fetchBrands = async (): Promise<string[]> =>
  Object.keys(cars);

export const fetchModels = async (brand: string): Promise<string[]> =>
  cars[brand] ?? [];
