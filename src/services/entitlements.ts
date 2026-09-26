import { getConfig, setConfig } from './database';

// ───────────────────────────────────────────────────────────
// Premium/Pro hak kontrolü — ŞİMDİLİK GERÇEK BİR ÖDEME ALTYAPISI YOK.
// Bu, yerelde saklanan basit bir bayrak; App Store/Google Play IAP
// (react-native-iap vb.) ve Apps Script tarafında makbuz doğrulaması
// kurulduğunda, satın alma/restore akışının sonunda bu değeri
// setConsultingEntitlement(true) ile ayarlaması yeterli olacak şekilde
// tasarlandı. Varsayılan değer HER ZAMAN kilitli (false)'dır.
// ───────────────────────────────────────────────────────────

const CONSULTING_ENTITLEMENT_KEY = 'entitlement_consulting';

export async function hasConsultingEntitlement(): Promise<boolean> {
  const value = await getConfig(CONSULTING_ENTITLEMENT_KEY).catch(() => null);
  return value === 'true';
}

export async function setConsultingEntitlement(value: boolean): Promise<void> {
  await setConfig(CONSULTING_ENTITLEMENT_KEY, value ? 'true' : 'false');
}
