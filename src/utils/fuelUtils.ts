import { FuelRecord, FuelAnalysis } from '../types';

export type FilterType = 'last5' | '1month' | '6months' | '1year';

export function computeAnalysis(records: FuelRecord[]): {
  analysis: FuelAnalysis | null;
  pending:  boolean;
} {
  const fullFills = records.filter(r => r.isFull);
  if (fullFills.length < 2) {
    return { analysis: null, pending: records.length > 0 };
  }
  const latest   = fullFills[0];
  const previous = fullFills[1];
  const distance    = latest.currentKm - previous.currentKm;
  const liters      = latest.totalLiters;
  const totalCost   = latest.pricePerLiter * latest.totalLiters;
  const consumption = distance > 0 ? (liters / distance) * 100 : 0;
  const costPerKm   = distance > 0 ? totalCost / distance : 0;
  return {
    analysis: {
      totalDistance:       distance,
      consumptionPer100Km: parseFloat(consumption.toFixed(2)),
      costPerKm:           parseFloat(costPerKm.toFixed(2)),
      totalCost:           parseFloat(totalCost.toFixed(2)),
      totalLiters:         liters,
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