import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Car } from '../types';
import { loadCars } from '../services/storage';

export const useCarSelector = () => {
  const [cars,          setCars]          = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [loadingCars,   setLoadingCars]   = useState(true);

  // useFocusEffect: sekmeye her dönüldüğünde yeniden yükler — Araç Yönetimi'nde
  // eklenen/silinen bir araç bu ekrana da yansısın diye (önceden yalnızca ilk
  // mount'ta yükleniyordu, tab navigator ekranı unmount etmediği için başka
  // sekmede yapılan değişiklikler hiç görünmüyordu).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      loadCars()
        .then(loaded => {
          if (cancelled) return;
          setCars(loaded);
          setSelectedCarId(prev => {
            if (prev && loaded.some(c => c.id === prev)) return prev;
            return loaded.length > 0 ? loaded[0].id : null;
          });
        })
        .finally(() => { if (!cancelled) setLoadingCars(false); });
      return () => { cancelled = true; };
    }, [])
  );

  const handleSelectCar = (carId: string) => {
    if (carId === selectedCarId) return;
    setSelectedCarId(carId);
  };

  const selectedCar = cars.find(c => c.id === selectedCarId) ?? null;

  return {
    cars,
    selectedCar,
    selectedCarId,
    loadingCars,
    handleSelectCar,
  };
};