import { useState, useCallback, useRef } from 'react';
import {
  fetchSuggestionHistory, fetchEvaluationHistory,
  SuggestionHistoryItem, EvaluationHistoryItem,
} from '../services/suggestionApi';

export const useSuggestionHistory = () => {
  const [suggestions, setSuggestions] = useState<SuggestionHistoryItem[]>([]);
  const [evaluations,  setEvaluations] = useState<EvaluationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState('');
  const loadedRef = useRef(false);

  const load = useCallback(async (force = false) => {
    if (loadedRef.current && !force) return;
    setLoading(true);
    setError('');
    try {
      const [sugg, evals] = await Promise.all([
        fetchSuggestionHistory(),
        fetchEvaluationHistory(),
      ]);
      setSuggestions(sugg);
      setEvaluations(evals);
      loadedRef.current = true;
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Geçmiş yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { suggestions, evaluations, loading, loaded, error, load };
};
