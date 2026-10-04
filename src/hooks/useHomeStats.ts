import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadCars } from '../services/storage';
import { getFuelRecordCounts } from '../services/fuelApi';

// Ana Sayfa'daki "Yakıt Kaydı" bölmesinde gösterilecek en fazla araç sayısı —
// daha fazlası sığmaz/okunaksız olur, kullanıcı tam listeyi Yakıt Takip'te görür.
const MAX_FUEL_CARS = 4;

export interface HomeFuelCar {
  id:    string;
  name:  string;
  count: number;
}

export const useHomeStats = () => {
  const [carCount, setCarCount] = useState(0);
  const [fuelCars, setFuelCars] = useState<HomeFuelCar[]>([]);
  const [loading, setLoading] = useState(true);
  // İlk yüklemeden sonraki tazelemeler sessizce olsun — eskiden sekmeye her
  // dönüşte "loading" true'ya çekilip iskelet kartlar bir an için yanıp sönüyordu.
  const loadedOnce = useRef(false);

  // Ana Sayfa'ya her dönüldüğünde tazele — Araç Yönetimi'nde eklenen/silinen
  // araç sayıları, Yakıt Takip'te eklenen/silinen kayıtlar eskiden yalnızca
  // ilk açılışta hesaplanıyordu.
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    if (!loadedOnce.current) setLoading(true);
    try {
      const cars = await loadCars();
      setCarCount(cars.length);
      const counts = await getFuelRecordCounts();
      setFuelCars(
        cars.slice(0, MAX_FUEL_CARS).map(car => ({
          id:    car.id,
          name:  car.nickname || `${car.brand} ${car.model}`,
          count: counts[car.id] || 0,
        }))
      );
    } finally {
      loadedOnce.current = true;
      setLoading(false);
    }
  };

  return { carCount, fuelCars, loading };
};
