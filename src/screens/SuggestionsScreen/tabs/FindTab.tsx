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
import { sendFollowUp } from '../../../services/suggestionApi';

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

  // Uzman en az bir kez yanıtladıysa ve kalan hakkı varsa, Mesajlar ekranından
  // yeni bir istek açmadan doğrudan takip mesajı gönderilebilir. Gönderim
  // sonrası ana durumu (BEKLİYOR'a döndüğü için) tazeleriz — geçmiş listesini
  // hemen yenilemiyoruz, çünkü BEKLİYOR olan satır handleHistory'de görünmez
  // (yalnızca yanıtlanmış istekler listelenir); uzman yeniden yanıtlayınca
  // bir sonraki açılışta tam sohbet (eski + yeni) zaten görünür.
  const handleSendFollowUp = async (message: string) => {
    await sendFollowUp(message, 'suggestion');
    suggestion.forceCheck();
    // Gönderilen mesajın sohbette hemen kendi balonuyla görünmesi için geçmiş
    // zorla yeniden yüklenir — aksi halde eski (bir kereye mahsus) önbellek
    // gösterilmeye devam eder ve mesaj sanki hiç gönderilmemiş gibi görünürdü.
    history.load(true);
  };

  // Doğrulama/gönderim hatası sayfanın üstünde gösterilir; kullanıcı aşağıdaki
  // düğmeye basmış olabilir, hatayı görsün diye yukarı kaydır.
  useEffect(() => {
    if (suggestion.error) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [suggestion.error]);

  // Form (else dalı) uzun bir ScrollView olduğu için "Mesajlar" düğmesi orada
  // sabit/floating değil, içerikle birlikte kayan (inline) bir düğme olarak
  // gösterilir — aksi halde kaydırınca "Kullanım amacı" kutusunun üzerine
  // biniyordu. Diğer (cevap hazır/bekliyor/gönderildi) durumlar kaydırılmayan
  // sabit ekranlar olduğu için orada normal sabit düğme kullanılır.
  const isFormState = !hasAnswer && suggestion.suggestion?.status !== 'BEKLİYOR' && !suggestion.submitted;

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
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.sm, padding: t.spacing.base, paddingBottom: 0 }}>
          <Text style={[styles.headerSub, { flex: 1 }]}>
            Kriterlerinize uygun araç önerisi almak için aşağıdaki formu doldurun. Uzman ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </Text>
          <MessageHistoryButton inline onPress={openHistory} unread={unread} />
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
          caseType={suggestion.caseType}
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
      {!isFormState && <MessageHistoryButton onPress={openHistory} unread={unread} />}
      <ConversationModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        title="Öneri Geçmişi"
        entries={history.entries}
        loading={history.loading}
        loaded={history.loaded}
        error={history.error}
        canFollowUp={hasAnswer}
        remaining={suggestion.suggestion?.remaining ?? null}
        onSend={handleSendFollowUp}
      />
    </View>
  );
}
