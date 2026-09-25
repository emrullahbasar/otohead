import { Alert } from 'react-native';
import { getLatestKm } from '../services/kmAlerts';

// Son bilinen km'den bu kadar fazlası girilirse kullanıcıya bir kez onay sorulur
// (fazladan basılmış bir rakam, "bakım zamanı" bildirimlerini ve km takibini bozmasın).
export const SUSPICIOUS_KM_JUMP = 5000;

const fmtKm = (n: number): string => n.toLocaleString('tr-TR');

// true → devam et, false → kullanıcı düzeltmek istedi (kaydetme).
export async function confirmKmJump(carId: string, newKm: number): Promise<boolean> {
  if (!Number.isFinite(newKm) || newKm <= 0) return true;

  let latest;
  try {
    latest = await getLatestKm(carId);
  } catch {
    return true;
  }
  if (!latest) return true;

  const diff = newKm - latest.km;
  if (diff <= SUSPICIOUS_KM_JUMP) return true;

  return new Promise<boolean>(resolve => {
    Alert.alert(
      'Kilometreyi kontrol edin',
      `Girdiğiniz ${fmtKm(newKm)} km, son bilinen km'den (${fmtKm(latest.km)} km, ${latest.source} kaydı) ${fmtKm(diff)} km fazla. Doğru mu?`,
      [
        { text: 'Düzelt',        style: 'cancel', onPress: () => resolve(false) },
        { text: 'Doğru, Kaydet',                  onPress: () => resolve(true)  },
      ],
      { cancelable: false },
    );
  });
}
