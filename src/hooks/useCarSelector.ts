import { useState, useEffect } from 'react';
import { Car } from '../types';
import { loadCars } from '../services/storage';

export const useCarSelector = () => {
  const [cars,          setCars]          = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [loadingCars,   setLoadingCars]   = useState(true);

  useEffect(() => {
    loadCars()
      .then(loaded => {
        setCars(loaded);
        if (loaded.length > 0) setSelectedCarId(loaded[0].id);
      })
      .finally(() => setLoadingCars(false));
  }, []);

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