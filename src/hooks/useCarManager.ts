import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Car } from '../types';
import { loadCars, saveCar, deleteCar } from '../services/storage';
import { fetchBrands, fetchModels } from '../services/carApi';

export const useCarManager = () => {
  const [cars,        setCars]        = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showCarForm, setShowCarForm] = useState(false);
  const [brand,       setBrand]       = useState('');
  const [model,       setModel]       = useState('');
  const [year,        setYear]        = useState('');
  const [nickname,    setNickname]    = useState('');
  const [brands,      setBrands]      = useState<string[]>([]);
  const [models,      setModels]      = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    loadSavedCars();
    loadBrands();
  }, []);

  const loadSavedCars = async () => {
    const saved = await loadCars();
    setCars(saved);
  };

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await fetchBrands();
      setBrands(data);
    } catch {
      Alert.alert('Hata', 'Markalar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (selectedBrand: string) => {
    setLoading(true);
    try {
      const data = await fetchModels(selectedBrand);
      setModels(data);
    } catch {
      Alert.alert('Hata', 'Modeller yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async () => {
    if (!brand || !model || !year) {
      Alert.alert('Hata', 'Marka, model ve yıl zorunludur.');
      return;
    }
    const newCar: Car = {
      id:       Date.now().toString(),
      brand, model, year,
      nickname: nickname || `${brand} ${model}`,
      records:  [],
    };
    await saveCar(newCar);
    setCars(prev => [newCar, ...prev]);
    setBrand(''); setModel(''); setYear(''); setNickname('');
    setShowCarForm(false);
  };

  const handleDeleteCar = (carId: string) => {
    Alert.alert(
      'Aracı Sil',
      'Bu aracı ve tüm kayıtlarını silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil', style: 'destructive',
          onPress: async () => {
            await deleteCar(carId);
            setCars(prev => prev.filter(c => c.id !== carId));
            if (selectedCar?.id === carId) setSelectedCar(null);
          },
        },
      ]
    );
  };

  const updateCarInList = (updatedCar: Car) => {
    setCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
    setSelectedCar(updatedCar);
  };

  return {
    cars, setCars,
    selectedCar, setSelectedCar,
    showCarForm, setShowCarForm,
    brand, setBrand,
    model, setModel,
    year, setYear,
    nickname, setNickname,
    brands, models, loading,
    loadModels,
    handleAddCar, handleDeleteCar,
    updateCarInList,
  };
};