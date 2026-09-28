import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { SuggestionForm } from '../components/SuggestionForm';
import { MessageHistoryButton } from '../components/MessageHistoryButton';
import { ConversationModal } from '../components/ConversationModal';
import { useSuggestion } from '../../../hooks/useSuggestion';
import { useConversationHistory } from '../../../hooks/useConversationHistory';
import { useUnreadReply } from '../../../hooks/useUnreadReply';

const t = tokens;

interface Props {
  suggestion: ReturnType<typeof useSuggestion>;
}

export default function FindTab({ suggestion }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const history = useConversationHistory('suggestion');
  const [showHistory, setShowHistory] = useState(false);
  const hasAnswer = suggestion.suggestion?.status === 'HAZIR' || suggestion.suggestion?.status === 'GÖRÜLDÜ';
  const { unread, markSeen } = useUnreadReply('unread_suggestion_reply', suggestion.suggestion?.requestId, hasAnswer);

  const openHistory = () => {
    setShowHistory(true);
    history.load();
    markSeen();
  };

  // Doğrulama/gönderim hatası sayfanın üstünde gösterilir; kullanıcı aşağıdaki
  // düğmeye basmış olabilir, hatayı görsün diye yukarı kaydır.
  useEffect(() => {
    if (suggestion.error) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [suggestion.error]);

  let content: React.ReactNode;

  if (hasAnswer) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          Yanıtınız Hazır!
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22, marginBottom: t.spacing.xl }]}>
          Uzman yanıtını Mesajlar bölümünden görüntüleyebilirsiniz.
        </Text>
        <Pressable style={styles.button} onPress={openHistory}>
          <Text style={styles.buttonText}>💬 Mesajları Görüntüle</Text>
        </Pressable>
        <Pressable style={{ marginTop: t.spacing.lg, padding: t.spacing.sm }} onPress={suggestion.resetSubmitted}>
          <Text style={{ ...t.typography.bodySm, color: t.color.brand.primary, textAlign: 'center', fontWeight: '600' }}>
            Yeni Öneri İste
          </Text>
        </Pressable>
      </View>
    );
  } else if (suggestion.suggestion?.status === 'BEKLİYOR') {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>⏳</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          Öneriniz Hazırlanıyor
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22, marginBottom: t.spacing.xl }]}>
          Uzman ekibimiz talebinizi inceliyor.
        </Text>
        <Pressable
          style={[styles.button, suggestion.checkingStatus && styles.buttonDisabled]}
          onPress={suggestion.checkStatus}
          disabled={suggestion.checkingStatus}
        >
          {suggestion.checkingStatus
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>Durumu Kontrol Et</Text>
          }
        </Pressable>
        {suggestion.statusError !== '' && (
          <Text style={[styles.errorText, { textAlign: 'center', marginTop: t.spacing.md }]}>
            ⚠️ {suggestion.statusError}
          </Text>
        )}
        <Pressable
          style={{ marginTop: t.spacing.lg, padding: t.spacing.sm }}
          disabled={suggestion.cancelling}
          onPress={() => Alert.alert(
            'İsteği İptal Et',
            'Bekleyen öneri isteğinizi geri çekmek istediğinize emin misiniz? Uzman ekibimiz bu isteği artık hazırlamayacak.',
            [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'İsteği İptal Et', style: 'destructive', onPress: suggestion.cancelPending },
            ],
          )}
        >
          <Text style={{ ...t.typography.bodySm, color: t.color.danger.default, textAlign: 'center' }}>
            {suggestion.cancelling ? 'İptal ediliyor...' : 'İsteği İptal Et'}
          </Text>
        </Pressable>
      </View>
    );
  } else if (suggestion.submitted) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İsteğiniz Alındı!
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22 }]}>
          Uzman ekibimiz en kısa sürede araç önerinizi hazırlayacaktır. Yanıtınız hazır olduğunda
          Mesajlar bölümünde görünecektir.
        </Text>
        <Pressable
          style={[styles.button, { marginTop: t.spacing.xl }, suggestion.checkingStatus && styles.buttonDisabled]}
          onPress={suggestion.checkStatus}
          disabled={suggestion.checkingStatus}
        >
          {suggestion.checkingStatus
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
            Kriterlerinize uygun araç önerisi almak için aşağıdaki formu doldurun. Uzman ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </Text>
        </View>
        {suggestion.error !== '' && (
          <View style={[styles.errorBox, { margin: t.spacing.base }]}>
            <Text style={styles.errorText}>⚠️ {suggestion.error}</Text>
          </View>
        )}
        {suggestion.checkingStatus && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: t.spacing.md }}>
            <ActivityIndicator size="small" color={t.color.brand.primary} />
            <Text style={{ ...t.typography.caption, color: t.color.text.muted, marginLeft: t.spacing.sm }}>
              Önceki isteğiniz kontrol ediliyor...
            </Text>
          </View>
        )}
        <SuggestionForm
          name={suggestion.name}           setName={suggestion.setName}
          budget={suggestion.budget}       setBudget={suggestion.setBudget}
          yearMin={suggestion.yearMin}     setYearMin={suggestion.setYearMin}
          yearMax={suggestion.yearMax}     setYearMax={suggestion.setYearMax}
          brand={suggestion.brand}
          caseType={suggestion.caseType}   setCaseType={suggestion.setCaseType}
          fuel={suggestion.fuel}
          gear={suggestion.gear}
          extra={suggestion.extra}         setExtra={suggestion.setExtra}
          touched={suggestion.touched}
          loading={suggestion.loading}
          setModalType={suggestion.setModalType}
          handleSearch={suggestion.handleSearch}
          onExtraFocus={() => {
            setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
          }}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {content}
      <MessageHistoryButton onPress={openHistory} unread={unread} />
      <ConversationModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        title="Öneri Geçmişi"
        entries={history.entries}
        loading={history.loading}
        loaded={history.loaded}
        error={history.error}
      />
    </View>
  );
}
