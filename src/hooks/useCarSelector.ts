import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Car } from '../types';
import { loadCars } from '../services/storage';

// initialCarId/initialTs: Ana Sayfa'daki yakıt kaydı bölmesinden belirli bir
// araçla açılmak için (bkz. HomeScreen.tsx). ts değişmediği sürece yalnızca
// BİR KEZ uygulanır — aksi halde kullanıcı sekme içinde elle başka bir araç
// seçse bile her odaklanmada initialCarId'ye geri dönerdi.
export const useCarSelector = (initialCarId?: string, initialTs?: number) => {
  const [cars,          setCars]          = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);
  const [loadingCars,   setLoadingCars]   = useState(true);
  const consumedTsRef = useRef<number | undefined>(undefined);

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
            const applyInitial = initialCarId !== undefined
              && initialTs !== undefined
              && consumedTsRef.current !== initialTs
              && loaded.some(c => c.id === initialCarId);
            if (applyInitial) {
              consumedTsRef.current = initialTs;
              return initialCarId as string;
            }
            if (prev && loaded.some(c => c.id === prev)) return prev;
            return loaded.length > 0 ? loaded[0].id : null;
          });
        })
        .finally(() => { if (!cancelled) setLoadingCars(false); });
      return () => { cancelled = true; };
    }, [initialCarId, initialTs])
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