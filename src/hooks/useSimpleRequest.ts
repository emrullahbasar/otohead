import { useState, useCallback, useEffect } from 'react';
import { getClientId } from '../services/database';
import {
  submitEvaluation,
  checkEvaluation,
  SimpleResult,
  SimpleRequest,
} from '../services/suggestionApi';

export const useSimpleRequest = () => {
  const [clientId,       setClientId]       = useState('');
  const [ilanNo,         setIlanNo]         = useState('');
  const [message,        setMessage]        = useState('');
  const [loading,        setLoading]        = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error,          setError]          = useState('');
  const [submitted,      setSubmitted]      = useState(false);
  const [result,         setResult]         = useState<SimpleResult | null>(null);

  useEffect(() => {
    getClientId().then(setClientId).catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId) return;
    checkStatus();
  }, [clientId]);

  const checkStatus = useCallback(async () => {
    if (!clientId) return;
    setCheckingStatus(true);
    try {
      const data = await checkEvaluation(clientId);
      setResult(data);
    } catch {
      // sessizce geç
    } finally {
      setCheckingStatus(false);
    }
  }, [clientId]);

  const validate = (): string | null => {
    if (!message.trim()) return 'Mesaj alanı zorunludur.';
    if (message.trim().length < 10) return 'Lütfen daha ayrıntılı bir mesaj yazın.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    if (!clientId) { setError('Sistem hazırlanıyor, lütfen bekleyin.'); return; }

    setLoading(true);
    try {
      const payload: SimpleRequest = { clientId, ilanNo, message };
      await submitEvaluation(payload);
      setSubmitted(true);
      setIlanNo('');
      setMessage('');
      const data = await checkEvaluation(clientId);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'İstek gönderilemedi. İnternet bağlantınızı kontrol edin.');
    } finally {
      setLoading(false);
    }
  }, [clientId, ilanNo, message]);

  const reset = useCallback(() => {
    setSubmitted(false);
    setResult(null);
    setIlanNo('');
    setMessage('');
  }, []);

  return {
    ilanNo, setIlanNo,
    message, setMessage,
    loading, checkingStatus, error,
    submitted, result,
    handleSubmit, checkStatus, reset,
  };
};