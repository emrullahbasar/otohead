import { getConfig } from './database';

export interface DanismanlikAlert {
  target:    'suggestion' | 'evaluation';
  requestId: string;
}

interface CachedResult {
  status:    string;
  requestId: string | null;
}

// "Araç Öneri" sekme rozeti için — canlı bir sunucu sorgusu YAPMAZ, yalnızca
// useSuggestionStatus.ts/useSimpleRequest.ts'in zaten tuttuğu yerel önbelleği
// (en son checkSuggestion/checkEval sonucu) okur. Bu yüzden rozet, kullanıcı
// Danışmanlık sekmesini en son ne zaman açıp durumu sorguladıysa o ana kadar
// güncel olabilir — push bildirimi geldiğinde zaten doğru sekmeye yönlendiriyor,
// bu rozet sadece bildirime dokunmadan uygulamayı açan kullanıcı için ek bir ipucu.
async function readCached(cacheKey: string, dismissedKey: string): Promise<CachedResult | null> {
  const raw = await getConfig(cacheKey);
  if (!raw || raw === 'YOK' || raw === 'BELİRSİZ') return null;
  try {
    const parsed = JSON.parse(raw) as CachedResult;
    if (parsed.status !== 'HAZIR' && parsed.status !== 'GÖRÜLDÜ') return null;
    if (!parsed.requestId) return null;
    // "Yeni Öneri İste" ile reddedilmiş eski cevap bir daha rozet tetiklemesin.
    const dismissed = await getConfig(dismissedKey);
    if (dismissed === parsed.requestId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function findDanismanlikAlerts(): Promise<DanismanlikAlert[]> {
  const out: DanismanlikAlert[] = [];
  const suggestion = await readCached('lastSuggestion', 'dismissedSuggestion');
  if (suggestion?.requestId) out.push({ target: 'suggestion', requestId: suggestion.requestId });
  const evaluation = await readCached('lastEvaluation', 'dismissedEvaluation');
  if (evaluation?.requestId) out.push({ target: 'evaluation', requestId: evaluation.requestId });
  return out;
}
