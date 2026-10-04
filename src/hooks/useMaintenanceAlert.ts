import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { findMostUrgentMaintenance, MaintenanceAlert } from '../services/kmAlerts';

// Ana Sayfa'daki "yaklaşan bakım" şeridi için — tüm araçlar arasında en acil
// bakımı bulur, sekmeye her dönüldüğünde tazeler (bkz. useHomeStats.ts'teki
// aynı desen).
export const useMaintenanceAlert = () => {
  const [alert, setAlert] = useState<MaintenanceAlert | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      findMostUrgentMaintenance()
        .then(result => { if (!cancelled) setAlert(result); })
        .catch(() => { if (!cancelled) setAlert(null); });
      return () => { cancelled = true; };
    }, [])
  );

  return alert;
};
