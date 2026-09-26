import { FuelRecord, FuelAnalysis } from '../types';

export type FilterType = 'last5' | '1month' | '6months' | '1year';

// Kayıtlar km'ye göre kronolojik sıraya konur (kilometre yalnızca artar; kullanıcının
// sonradan geçmiş tarihli bir kayıt eklemesi de doğru sıralanır, ekleme sırası değil).
function chronological(records: FuelRecord[]): FuelRecord[] {
  return [...records].sort((a, b) => a.currentKm - b.currentKm);
}

// Tüketim, son iki FULL dolum arasındaki mesafeyi ve o aralıktaki TÜM dolumları
// (aralardaki parça dolumlar dahil) kullanır — yalnızca son dolumu almak parça
// dolumlarda litre/maliyeti eksik gösterirdi.
export function computeAnalysis(records: FuelRecord[]): {
  analysis: FuelAnalysis | null;
  pending:  boolean;
} {
  const chrono = chronological(records);
  const fullIdxs = chrono.reduce<number[]>((acc, r, i) => (r.isFull ? [...acc, i] : acc), []);
  if (fullIdxs.length < 2) {
    return { analysis: null, pending: records.length > 0 };
  }
  const prevFullIdx = fullIdxs[fullIdxs.length - 2];
  const lastFullIdx = fullIdxs[fullIdxs.length - 1];
  const span = chrono.slice(prevFullIdx + 1, lastFullIdx + 1); // aradaki parçalar + son full

  const distance  = chrono[lastFullIdx].currentKm - chrono[prevFullIdx].currentKm;
  const liters    = span.reduce((sum, r) => sum + r.totalLiters, 0);
  const totalCost = span.reduce((sum, r) => sum + r.pricePerLiter * r.totalLiters, 0);

  // Aynı km'de iki dolum (mesafe 0) tüketimi hesaplanamaz hale getirir; veri
  // toplanıyor durumuna dön, yanlış "0 lt/100km" göstermeyelim.
  if (distance <= 0) {
    return { analysis: null, pending: true };
  }

  const consumption = (liters / distance) * 100;
  const costPerKm   = totalCost / distance;
  return {
    analysis: {
      totalDistance:       distance,
      consumptionPer100Km: parseFloat(consumption.toFixed(2)),
      costPerKm:           parseFloat(costPerKm.toFixed(2)),
      totalCost:           parseFloat(totalCost.toFixed(2)),
      totalLiters:         parseFloat(liters.toFixed(2)),
      isPending:           false,
    },
    pending: false,
  };
}

export function filterRecords(records: FuelRecord[], filter: FilterType): FuelRecord[] {
  if (filter === 'last5') return records.slice(0, 5);
  const now   = new Date();
  const limit = new Date();
  if (filter === '1month')  limit.setMonth(now.getMonth() - 1);
  if (filter === '6months') limit.setMonth(now.getMonth() - 6);
  if (filter === '1year')   limit.setFullYear(now.getFullYear() - 1);
  return records.filter(r => {
    const [d, m, y] = r.date.split('.').map(Number);
    return new Date(y, m - 1, d) >= limit;
  });
}