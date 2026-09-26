import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadCars } from '../services/storage';

export const useHomeStats = () => {
  const [carCount, setCarCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // İlk yüklemeden sonraki tazelemeler sessizce olsun — eskiden sekmeye her
  // dönüşte "loading" true'ya çekilip iskelet kartlar bir an için yanıp sönüyordu.
  const loadedOnce = useRef(false);

  // Ana Sayfa'ya her dönüldüğünde tazele — Araç Yönetimi'nde eklenen/silinen
  // araç/kayıt sayıları eskiden yalnızca ilk açılışta hesaplanıyordu.
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
      const total = cars.reduce((sum, car) => sum + car.records.length, 0);
      setRecordCount(total);
    } finally {
      loadedOnce.current = true;
      setLoading(false);
    }
  };

  return { carCount, recordCount, loading };
};