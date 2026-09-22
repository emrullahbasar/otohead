import { useState, useEffect } from 'react';
import { loadCars } from '../services/storage';

export const useHomeStats = () => {
  const [carCount, setCarCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const cars = await loadCars();
      setCarCount(cars.length);
      const total = cars.reduce((sum, car) => sum + car.records.length, 0);
      setRecordCount(total);
    } finally {
      setLoading(false);
    }
  };

  return { carCount, recordCount, loading };
};