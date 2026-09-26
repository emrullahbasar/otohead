import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../../../config/tokens';
import { styles as sharedStyles } from '../styles';
import { ConversationEntry } from '../../../hooks/useConversationHistory';

const t = tokens;

interface Props {
  visible: boolean;
  title:   string;
  onClose: () => void;
  entries: ConversationEntry[];
  loading: boolean;
  loaded:  boolean;
  error:   string;
}

// Instagram/Messenger tarzı: tam ekran, geri tuşuyla kapanan, kullanıcının
// isteği sağda / uzmanın yanıtı solda balon olarak akan salt-okunur bir
// sohbet geçmişi. Şu an için yanıt yazma kutusu yok (uzmanın tek seferlik
// yazılı cevabı dışında gerçek zamanlı bir mesajlaşma altyapısı yok).
export function ConversationModal({ visible, title, onClose, entries, loading, loaded, error }: Props) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && loaded && entries.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 60);
    }
  }, [visible, loaded, entries.length]);

  const initialLoading = loading && !loaded;
  const isEmpty = loaded && !loading && entries.length === 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: t.color.bg.base }}>
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
              <View key={entry.key} style={{ marginBottom: t.spacing.lg }}>
                <View style={cs.userRow}>
                  <View style={cs.userBubble}>
                    <Text style={cs.userText}>{entry.requestText}</Text>
                  </View>
                </View>
                <Text style={cs.date}>{entry.date}</Text>

                <View style={cs.expertRow}>
                  <View style={cs.expertBubble}>
                    <Text style={cs.expertLabel}>🧑‍🔧 Uzman</Text>
                    <Text style={cs.expertText}>{entry.answer || 'Yanıt metni bulunamadı.'}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
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
});
