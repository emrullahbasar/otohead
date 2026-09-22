import { useState } from 'react';
import { useCarManager } from './useCarManager';
import { useRecordManager } from './useRecordManager';

export { MAINTENANCE_TYPES, YEARS } from './useRecordManager';

export const useMaintenance = () => {
  const [modalType, setModalType] = useState<'brand' | 'model' | 'year' | 'recordType' | null>(null);

  const carManager    = useCarManager();
  const recordManager = useRecordManager(
    carManager.selectedCar,
    carManager.updateCarInList,
  );

  return {
    ...carManager,
    ...recordManager,
    modalType, setModalType,
  };
};