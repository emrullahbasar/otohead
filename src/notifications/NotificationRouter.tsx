import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { navigationRef } from '../navigation/navigationRef';

// Uzman cevabı bildirimine dokunulunca uygulamayı doğrudan Danışmanlık
// sekmesinde (ilgili alt sekmeyle) açar. Uygulama kapalıyken bildirimle
// açılma (soğuk başlangıç) da bu bileşen üzerinden yakalanır.
export default function NotificationRouter() {
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const id = response.notification.request.identifier;
    if (handledId.current === id) return;
    handledId.current = id;

    const type = response.notification.request.content.data?.type;
    if (type !== 'suggestion' && type !== 'evaluation') return;

    navigationRef.navigate('Araç Öneri', {
      tab: type === 'evaluation' ? 'evaluate' : 'find',
      ts: Date.now(),
    });
  }, [response]);

  return null;
}
