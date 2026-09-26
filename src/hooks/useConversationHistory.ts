import { useState, useCallback, useRef } from 'react';
import {
  fetchSuggestionHistory, fetchEvaluationHistory,
  SuggestionHistoryItem, EvaluationHistoryItem,
} from '../services/suggestionApi';

export type ConversationTarget = 'suggestion' | 'evaluation';

// Sohbet ekranının ihtiyaç duyduğu ortak alanlara indirgenmiş tek biçim —
// öneri ve değerlendirme kayıtlarının farklı alan adlarını (recommendation/
// answer, budget/ilanNo...) burada tek bir "istek metni + yanıt metni" hâline
// getiriyoruz ki ConversationModal ikisini de aynı şekilde çizebilsin.
export interface ConversationEntry {
  key:         string;
  requestText: string;
  date:        string;
  answer:      string;
}

const toEntry = (target: ConversationTarget, item: SuggestionHistoryItem | EvaluationHistoryItem): ConversationEntry => {
  if (target === 'suggestion') {
    const s = item as SuggestionHistoryItem;
    return {
      key: s.requestId,
      requestText: `${s.budget || ''} TL${s.yearMin ? ` • ${s.yearMin}-${s.yearMax}` : ''}${s.fuel ? ` • ${s.fuel}` : ''}`,
      date: s.createdAt,
      answer: s.recommendation || '',
    };
  }
  const e = item as EvaluationHistoryItem;
  return {
    key: e.requestId,
    requestText: e.ilanNo && e.ilanNo !== 'Belirtilmedi' ? `İlan No: ${e.ilanNo}` : (e.message || 'Değerlendirme isteği'),
    date: e.createdAt,
    answer: e.answer || '',
  };
};

export const useConversationHistory = (target: ConversationTarget) => {
  const [entries, setEntries] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState('');
  const loadedRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (loadedRef.current && !force) return;
    setLoading(true);
    setError('');
    try {
      const items = target === 'suggestion'
        ? await fetchSuggestionHistory()
        : await fetchEvaluationHistory();
      setEntries(items.map(item => toEntry(target, item)));
      loadedRef.current = true;
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçmiş yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [target]);

  return { entries, loading, loaded, error, load };
};
