import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { SimpleRequestForm } from '../components/SimpleRequestForm';
import { MessageHistoryButton } from '../components/MessageHistoryButton';
import { ConversationModal } from '../components/ConversationModal';
import { PremiumGate } from '../components/PremiumGate';
import { useSimpleRequest } from '../../../hooks/useSimpleRequest';
import { useConversationHistory } from '../../../hooks/useConversationHistory';
import { useConsultingEntitlement } from '../../../hooks/useConsultingEntitlement';

const t = tokens;

// Gerçek IAP/satın alma altyapısı kurulana kadar premium kilidi geçici olarak
// kapalı (test edebilmek için) — kilit ekranı ve hak kontrolü kodu duruyor,
// hazır olunca bu bayrak true yapılacak.
const PREMIUM_GATE_ENABLED = false;

interface Props {
  evaluation: ReturnType<typeof useSimpleRequest>;
}

export default function EvaluateTab({ evaluation }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const history = useConversationHistory('evaluation');
  const [showHistory, setShowHistory] = useState(false);
  const entitled = useConsultingEntitlement();

  const openHistory = () => {
    setShowHistory(true);
    history.load();
  };

  useEffect(() => {
    if (evaluation.error) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [evaluation.error]);

  // Hak bilgisi yüklenene kadar (ilk açılış, çok kısa) boş ekran yerine bir
  // spinner göster — "önce kilitli, sonra açık" gibi bir yanıp sönme olmasın.
  if (PREMIUM_GATE_ENABLED && entitled === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={t.color.brand.primary} />
      </View>
    );
  }

  if (PREMIUM_GATE_ENABLED && !entitled) {
    return <PremiumGate />;
  }

  let content: React.ReactNode;

  if (evaluation.result?.status === 'HAZIR' || evaluation.result?.status === 'GÖRÜLDÜ') {
    content = (
      <ScrollView contentContainerStyle={{ padding: t.spacing.base }}>
        <View style={{ alignItems: 'center', marginBottom: t.spacing.xl }}>
          <Text style={{ fontSize: 44, marginBottom: t.spacing.md }}>🔎</Text>
          <Text style={[styles.header, { textAlign: 'center' }]}>Değerlendirme Hazır!</Text>
        </View>
        <View style={styles.result}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>✅ Uzman Yanıtı</Text>
            {evaluation.result.ilanNo && evaluation.result.ilanNo !== 'Belirtilmedi' && (
              <Text style={{ color: t.color.text.muted, ...t.typography.caption, marginTop: 4 }}>
                İlan No: {evaluation.result.ilanNo}
              </Text>
            )}
          </View>
          <Text style={styles.resultText}>{evaluation.result.answer}</Text>
        </View>
        <Pressable style={[styles.button, { marginTop: t.spacing.sm }]} onPress={evaluation.reset}>
          <Text style={styles.buttonText}>Yeni İstek Gönder</Text>
        </Pressable>
      </ScrollView>
    );
  } else if (evaluation.result?.status === 'BEKLİYOR') {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>⏳</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İnceleniyor
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22, marginBottom: t.spacing.xl }]}>
          Uzman ekibimiz aracı inceliyor.
        </Text>
        <Pressable
          style={[styles.button, evaluation.checkingStatus && styles.buttonDisabled]}
          onPress={evaluation.checkStatus}
          disabled={evaluation.checkingStatus}
        >
          {evaluation.checkingStatus
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>Durumu Kontrol Et</Text>
          }
        </Pressable>
        {evaluation.statusError !== '' && (
          <Text style={[styles.errorText, { textAlign: 'center', marginTop: t.spacing.md }]}>
            ⚠️ {evaluation.statusError}
          </Text>
        )}
        <Pressable
          style={{ marginTop: t.spacing.lg, padding: t.spacing.sm }}
          disabled={evaluation.cancelling}
          onPress={() => Alert.alert(
            'İsteği İptal Et',
            'Bekleyen değerlendirme isteğinizi geri çekmek istediğinize emin misiniz? Uzman ekibimiz bu isteği artık incelemeyecek.',
            [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'İsteği İptal Et', style: 'destructive', onPress: evaluation.cancelPending },
            ],
          )}
        >
          <Text style={{ ...t.typography.bodySm, color: t.color.danger.default, textAlign: 'center' }}>
            {evaluation.cancelling ? 'İptal ediliyor...' : 'İsteği İptal Et'}
          </Text>
        </Pressable>
      </View>
    );
  } else if (evaluation.submitted) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İsteğiniz Alındı!
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22 }]}>
          Uzman ekibimiz en kısa sürede yanıt verecektir.
        </Text>
        <Pressable
          style={[styles.button, { marginTop: t.spacing.xl }, evaluation.checkingStatus && styles.buttonDisabled]}
          onPress={evaluation.checkStatus}
          disabled={evaluation.checkingStatus}
        >
          {evaluation.checkingStatus
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>Durumu Kontrol Et</Text>
          }
        </Pressable>
      </View>
    );
  } else {
    content = (
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: t.spacing['3xl'] }}
        keyboardShouldPersistTaps="handled"
        // iOS numeric/decimal klavyede Bitti tuşu yok; kullanıcı klavyeyi kaydırarak kapatabilsin.
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: t.spacing.base, paddingBottom: 0, paddingRight: 116 }}>
          <Text style={styles.headerSub}>
            Beğendiğiniz araç veya araçlar hakkında uzman görüşü alın.
          </Text>
        </View>
        <SimpleRequestForm
          ilanNo={evaluation.ilanNo}
          setIlanNo={evaluation.setIlanNo}
          message={evaluation.message}
          setMessage={evaluation.setMessage}
          loading={evaluation.loading}
          error={evaluation.error}
          onSubmit={evaluation.handleSubmit}
          placeholder="Bu aracı almayı düşünüyorum, Fiyatı ve durumu hakkında uzman görüşü alabilir miyim?"
          buttonText="🔎 Değerlendirme İste"
          ilanNoLabel="İlan Numarası"
          messageLabel="Değerlendirme İsteğiniz"
          onMessageFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {content}
      <MessageHistoryButton onPress={openHistory} />
      <ConversationModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        title="Değerlendirme Geçmişi"
        entries={history.entries}
        loading={history.loading}
        loaded={history.loaded}
        error={history.error}
      />
    </View>
  );
}
