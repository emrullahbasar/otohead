import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../config/tokens';
import { styles as sharedStyles } from '../styles';
import { ConversationEntry } from '../../../hooks/useConversationHistory';
import { FOLLOWUP_MAX_LENGTH } from '../../../services/suggestionApi';

const t = tokens;

// createdAt (sunucu) ISO biçiminde gelir; takip mesajı damgaları ise zaten
// okunur bir Türkçe yerel biçimde (ör. "30.09.2026 10:07:58") — bu ikincisi
// Date olarak ayrıştırılamaz, o zaman olduğu gibi gösterilir.
function formatDate(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  visible: boolean;
  title:   string;
  onClose: () => void;
  entries: ConversationEntry[];
  loading: boolean;
  loaded:  boolean;
  error:   string;
  // Uzman en az bir kez yanıtladıysa (mevcut isteğin durumu HAZIR/GÖRÜLDÜ)
  // true olur — bu, "Mesajlar" ekranından doğrudan takip mesajı yazılabilmesi
  // için gerekli koşul. Kalan hak sayısı null ise henüz bilinmiyor demektir.
  canFollowUp: boolean;
  remaining:   number | null;
  onSend:      (message: string) => Promise<void>;
}

// Instagram/Messenger tarzı: tam ekran, geri tuşuyla kapanan sohbet geçmişi.
// Uzmanın yanıtladığı istekler salt okunur balonlar olarak akar; en altta,
// uzman zaten yanıtlamışsa ve kalan mesaj hakkı varsa, kullanıcı yeni bir
// istek göndermeden doğrudan buradan takip mesajı yazabilir (bkz. onSend).
export function ConversationModal({
  visible, title, onClose, entries, loading, loaded, error,
  canFollowUp, remaining, onSend,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [draft,     setDraft]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [sendError, setSendError] = useState('');
  const [justSent,  setJustSent]  = useState(false);

  // entries.length yalnızca farklı isteklerin (satırların) sayısını sayar —
  // bir takip mesajı gönderildiğinde satır sayısı değişmez, yalnızca mevcut
  // satırın mesaj listesi uzar. Bu yüzden bağımlılık toplam mesaj sayısı
  // olmalı, aksi halde yeni gönderilen mesaj balonu görünüme kaymaz.
  const totalMessages = entries.reduce((n, e) => n + e.messages.length, 0);
  useEffect(() => {
    if (visible && loaded && entries.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);
    }
  }, [visible, loaded, entries.length, totalMessages]);

  // Modal her kapanıp açıldığında (farklı bir isteğe bakılıyor olabilir)
  // taslak/hata/onay durumu sıfırlansın.
  useEffect(() => {
    if (!visible) { setDraft(''); setSendError(''); setJustSent(false); }
  }, [visible]);

  const initialLoading = loading && !loaded;
  const isEmpty = loaded && !loading && entries.length === 0;
  const trimmedDraft = draft.trim();
  const noMessagesLeft = remaining !== null && remaining <= 0;

  const handleSend = async () => {
    if (!trimmedDraft || sending) return;
    setSending(true);
    setSendError('');
    try {
      await onSend(trimmedDraft);
      setDraft('');
      setJustSent(true);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Mesaj gönderilemedi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: t.color.bg.base }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
      >
        <View style={[cs.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} hitSlop={12} style={{ width: 80 }}>
            <Text style={cs.back} numberOfLines={1}>‹ Geri</Text>
          </Pressable>
          <Text style={cs.title} numberOfLines={1}>{title}</Text>
          <View style={{ width: 80 }} />
        </View>

        {initialLoading && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={t.color.brand.primary} />
            <Text style={{ ...t.typography.bodySm, color: t.color.brand.primary, marginTop: t.spacing.md }}>
              Mesajlar yükleniyor...
            </Text>
          </View>
        )}

        {error !== '' && (
          <View style={[sharedStyles.errorBox, { margin: t.spacing.base }]}>
            <Text style={sharedStyles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {isEmpty && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
            <Text style={{ fontSize: 44, marginBottom: t.spacing.md }}>💬</Text>
            <Text style={{ ...t.typography.body, color: t.color.text.muted, textAlign: 'center' }}>
              Henüz bir mesajınız yok. İlk isteğinizi gönderdiğinizde uzman yanıtı burada görünecek.
            </Text>
          </View>
        )}

        {!initialLoading && entries.length > 0 && (
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: t.spacing.base, paddingBottom: insets.bottom + t.spacing.xl }}
            showsVerticalScrollIndicator={false}
          >
            {entries.map(entry => (
              <View key={entry.key} style={{ marginBottom: t.spacing.xl }}>
                {entry.messages.map(msg => (
                  msg.sender === 'user' ? (
                    <View key={msg.key} style={{ marginBottom: t.spacing.sm }}>
                      <View style={cs.userRow}>
                        <View style={cs.userBubble}>
                          <Text style={cs.userText}>{msg.text}</Text>
                        </View>
                      </View>
                      {msg.date && <Text style={cs.date}>{formatDate(msg.date)}</Text>}
                    </View>
                  ) : (
                    <View key={msg.key} style={[cs.expertRow, { marginBottom: t.spacing.sm }]}>
                      <View style={cs.expertBubble}>
                        <Text style={cs.expertLabel}>🧑‍🔧 Uzman</Text>
                        <Text style={cs.expertText}>{msg.text}</Text>
                      </View>
                    </View>
                  )
                ))}
                {entry.waiting && (
                  <Text style={cs.waitingText}>Uzman yanıtı bekleniyor...</Text>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {canFollowUp && (
          <View style={[cs.composer, { paddingBottom: insets.bottom + t.spacing.sm }]}>
            {noMessagesLeft ? (
              <Text style={cs.composerNote}>
                Mesaj hakkınız doldu. Yeni bir istek gönderdiğinizde tekrar mesajlaşabilirsiniz.
              </Text>
            ) : (
              <>
                <View style={cs.composerRow}>
                  <TextInput
                    style={cs.composerInput}
                    placeholder="Uzmana bir mesaj yazın..."
                    placeholderTextColor={t.color.text.muted}
                    value={draft}
                    onChangeText={text => { setDraft(text); setJustSent(false); }}
                    maxLength={FOLLOWUP_MAX_LENGTH}
                    multiline
                    editable={!sending}
                  />
                  <Pressable
                    style={[cs.sendButton, (!trimmedDraft || sending) && cs.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!trimmedDraft || sending}
                  >
                    {sending
                      ? <ActivityIndicator size="small" color="#FFFFFF" />
                      : <Text style={cs.sendButtonText}>Gönder</Text>
                    }
                  </Pressable>
                </View>
                <View style={cs.composerFooter}>
                  <Text style={cs.composerHint}>
                    {remaining !== null ? `Kalan mesaj hakkı: ${remaining}` : ' '}
                  </Text>
                  <Text style={cs.composerHint}>{draft.length}/{FOLLOWUP_MAX_LENGTH}</Text>
                </View>
                {sendError !== '' && <Text style={cs.composerError}>⚠️ {sendError}</Text>}
                {justSent && sendError === '' && (
                  <Text style={cs.composerSuccess}>
                    Mesajınız gönderildi. Uzman yanıtlayınca burada göreceksiniz.
                  </Text>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const cs = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.base,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
    backgroundColor: t.color.bg.surface,
  },
  back: {
    ...t.typography.body,
    color: t.color.brand.primary,
  },
  title: {
    ...t.typography.h3,
    color: t.color.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '85%',
    backgroundColor: t.color.brand.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
  userText: {
    ...t.typography.bodySm,
    color: '#FFFFFF',
  },
  date: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: t.spacing.sm,
  },
  expertRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  expertBubble: {
    maxWidth: '85%',
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.md,
  },
  expertLabel: {
    ...t.typography.caption,
    color: t.color.brand.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  expertText: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    lineHeight: 20,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: t.color.border.divider,
    backgroundColor: t.color.bg.surface,
    paddingHorizontal: t.spacing.base,
    paddingTop: t.spacing.sm,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: t.spacing.sm,
  },
  composerInput: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.lg,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    ...t.typography.bodySm,
    color: t.color.text.primary,
  },
  sendButton: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    paddingHorizontal: t.spacing.md,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: t.color.border.strong,
  },
  sendButtonText: {
    ...t.typography.bodySm,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  composerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  composerHint: {
    ...t.typography.caption,
    color: t.color.text.muted,
  },
  composerError: {
    ...t.typography.caption,
    color: t.color.danger.default,
    marginTop: 4,
  },
  composerSuccess: {
    ...t.typography.caption,
    color: t.color.success.default,
    marginTop: 4,
  },
  waitingText: {
    ...t.typography.caption,
    color: t.color.text.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  composerNote: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'center',
    paddingVertical: t.spacing.sm,
  },
});
