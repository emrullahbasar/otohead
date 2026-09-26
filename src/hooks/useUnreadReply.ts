import { useState, useEffect, useCallback } from 'react';
import { getConfig, setConfig } from '../services/database';

// Uzman yanıtı artık yalnızca Mesajlar kutusunda gösteriliyor (sekme içinde
// değil) — kullanıcı "yeni bir yanıt var mı" bilgisini mesaj butonundaki
// kırmızı noktadan anlasın diye bu hook, o isteğin (requestId) daha önce
// açılıp açılmadığını yerelde saklar. Sunucudaki HAZIR/GÖRÜLDÜ durumu
// ("yeni istek gönderilebilir mi") ile bu tamamen ayrı bir kavramdır.
export const useUnreadReply = (
  storageKey: string,
  requestId: string | null | undefined,
  hasAnswer: boolean,
) => {
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!hasAnswer || !requestId) { setUnread(false); return; }
    getConfig(storageKey)
      .then(lastSeen => { if (!cancelled) setUnread(lastSeen !== requestId); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [storageKey, requestId, hasAnswer]);

  const markSeen = useCallback(() => {
    if (!requestId) return;
    setConfig(storageKey, requestId).catch(() => {});
    setUnread(false);
  }, [storageKey, requestId]);

  return { unread, markSeen };
};
