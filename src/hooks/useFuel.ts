import { useEffect } from 'react';
import { useCarSelector } from './useCarSelector';
import { useFuelForm }    from './useFuelForm';
import { useFuelRecords } from './useFuelRecords';

export const useFuel = () => {
  const carSelector = useCarSelector();
  const fuelForm    = useFuelForm();
  const fuelRecords = useFuelRecords(
    carSelector.selectedCarId,
    (previousKm) => fuelForm.updateField('previousKm', previousKm),
    () => fuelForm.resetForm(),
  );

  // Araç değişince kayıtları yükle, formu sıfırla
  useEffect(() => {
    if (!carSelector.selectedCarId) {
      fuelForm.resetForm();
      return;
    }
    fuelRecords.loadRecordsForCar(carSelector.selectedCarId);
    fuelForm.resetForm();
    fuelRecords.setFilter('last5');
  }, [carSelector.selectedCarId]);

  const handleCalculateAndSave = async () => {
    // Eksik/hatalı girişte form silinmesin; yalnızca kayıt başarılıysa sıfırla.
    const saved = await fuelRecords.handleCalculateAndSave(
      fuelForm.record,
      fuelForm.record.currentKm,
    );
    if (saved) fuelForm.resetForm(fuelForm.record.currentKm);
  };

  return {
    // Araç
    cars:          carSelector.cars,
    selectedCar:   carSelector.selectedCar,
    selectedCarId: carSelector.selectedCarId,
    loadingCars:   carSelector.loadingCars,
    handleSelectCar: carSelector.handleSelectCar,
    // Form
    record:              fuelForm.record,
    updateField:         fuelForm.updateField,
    handleReceiptScanned: fuelForm.handleReceiptScanned,
    // Kayıtlar
    history:              fuelRecords.history,
    filteredHistory:      fuelRecords.filteredHistory,
    filter:               fuelRecords.filter,
    setFilter:            fuelRecords.setFilter,
    analysis:             fuelRecords.analysis,
    pendingAnalysis:      fuelRecords.pendingAnalysis,
    handleCalculateAndSave,
    handleDeleteRecord:   fuelRecords.handleDeleteRecord,
  };
};