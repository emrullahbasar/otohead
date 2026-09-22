import { useState, useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { getClientId } from '../services/database';
import {
  checkSuggestion,
  markAsSeen,
  SuggestionResult,
} from '../services/suggestionApi';

const sendReadyNotification = async () => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚗 Öneriniz Hazır!',
        body:  'Araç öneriniz hazırlandı. Görmek için uygulamayı açın.',
      },
      trigger: null,
    });
  } catch {
    // sessizce geç
  }
};

export const useSuggestionStatus = () => {
  const [clientId,       setClientId]       = useState('');
  const [suggestion,     setSuggestion]     = useState<SuggestionResult | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [submitted,      setSubmitted]      = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    getClientId().then(setClientId).catch(() => {});
  }, []);

  useEffect(() => {
    Notifications.getExpoPushTokenAsync({
      projectId: 'ccd47d7f-a085-4f9c-8beb-e7045ec2c347',
    }).catch(() => {});
  }, []);

  const checkStatus = useCallback(async () => {
    if (!clientId || checkingStatus) return;
    setCheckingStatus(true);
    try {
      const result = await checkSuggestion(clientId);
      setSuggestion(result);
      if (result.status === 'HAZIR') {
        await sendReadyNotification();
        await markAsSeen(clientId);
        setSuggestion(prev => prev ? { ...prev, status: 'GÖRÜLDÜ' } : prev);
      }
    } catch {
      // sessizce geç
    } finally {
      setCheckingStatus(false);
    }
  }, [clientId, checkingStatus]);

  const checkOnMount = useCallback(async () => {
    if (checkedRef.current || !clientId) return;
    checkedRef.current = true;
    await checkStatus();
  }, [clientId, checkStatus]);

  const resetStatus = useCallback(() => {
    setSubmitted(false);
    setSuggestion(null);
    checkedRef.current = false;
  }, []);

  return {
    clientId,
    suggestion, setSuggestion,
    checkingStatus,
    submitted, setSubmitted,
    checkedRef,
    checkStatus,
    checkOnMount,
    resetStatus,
  };
};