export interface MaintenanceRecord {
  id: string;
  type: string;
  date: string;
  km: string;
  nextDate?: string;   
  nextKm?: string;     
  note?: string;       
  price?: string;      
}

export interface FuelRecord {
  id: string;
  date: string;
  pricePerLiter: number;
  totalLiters: number;
  previousKm: number;
  currentKm: number;
  isFull: boolean;
  station?: string;
}

export interface FuelAnalysis {
  totalDistance: number;
  consumptionPer100Km: number;
  costPerKm: number;
  totalCost: number;
  totalLiters: number;
  isPending: boolean;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  nickname: string;
  records: MaintenanceRecord[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}