import { useEffect, useState } from 'react';
import { hasConsultingEntitlement } from '../services/entitlements';

// null = henüz kontrol edilmedi (yükleniyor), true/false = kesinleşti.
export const useConsultingEntitlement = () => {
  const [entitled, setEntitled] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    hasConsultingEntitlement().then(v => { if (!cancelled) setEntitled(v); });
    return () => { cancelled = true; };
  }, []);

  return entitled;
};
