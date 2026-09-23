import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

const TOKEN_TIMEOUT_MS = 8000;

// Bildirim izni verilmemişse veya token alınamazsa null döner — push isteğe
// bağlıdır, uygulamanın hiçbir akışını engellememeli.
export async function getExpoPushToken(): Promise<string | null> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const token = await Promise.race([
      Notifications.getExpoPushTokenAsync({ projectId }),
      new Promise<null>(resolve => setTimeout(() => resolve(null), TOKEN_TIMEOUT_MS)),
    ]);
    return token ? token.data : null;
  } catch {
    return null;
  }
}
