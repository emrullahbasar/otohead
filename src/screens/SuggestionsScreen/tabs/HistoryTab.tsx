import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { useSuggestionHistory } from '../../../hooks/useSuggestionHistory';
import { SuggestionHistoryItem, EvaluationHistoryItem } from '../../../services/suggestionApi';

const t = tokens;

interface Props {
  history: ReturnType<typeof useSuggestionHistory>;
}

// Bir sohbet gibi: kullanıcının isteği sağda (kendi rengiyle), uzmanın yanıtı
// solda ayrı bir balonda — eskiden tek bir rapor kutusu gibiydi, kullanıcı
// bunun bir mesajlaşma akışı gibi görünmesini istedi.
function HistoryThread({
  icon, requestText, date, answer, expanded, onToggle,
}: {
  icon: string; requestText: string; date: string;
  answer: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <View style={bubbleStyles.thread}>
      <View style={bubbleStyles.userRow}>
        <View style={bubbleStyles.userBubble}>
          <Text style={bubbleStyles.userText}>{icon} {requestText}</Text>
        </View>
      </View>
      <Text style={bubbleStyles.date}>{date}</Text>

      <Pressable style={bubbleStyles.expertRow} onPress={onToggle}>
        <View style={bubbleStyles.expertBubble}>
          <Text style={bubbleStyles.expertLabel}>🧑‍🔧 Uzman</Text>
          <Text
            style={bubbleStyles.expertText}
            numberOfLines={expanded ? undefined : 3}
          >
            {answer || 'Yanıt metni bulunamadı.'}
          </Text>
          {!expanded && (
            <Text style={bubbleStyles.moreLink}>Devamını oku ›</Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}

export default function HistoryTab({ history }: Props) {
  const { suggestions, evaluations, loading, loaded, error, load } = history;
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: string) => setExpandedKey(prev => (prev === key ? null : key));

  const initialLoading = loading && !loaded;
  const isEmpty = loaded && !loading && suggestions.length === 0 && evaluations.length === 0;

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: t.spacing['3xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: t.spacing.base, paddingBottom: 0 }}>
        <Text style={styles.headerSub}>
          Uzman ekibimizin daha önce yanıtladığı öneri ve değerlendirme istekleriniz burada listelenir.
        </Text>
      </View>

      {error !== '' && (
        <View style={[styles.errorBox, { margin: t.spacing.base }]}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {initialLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={t.color.brand.primary} />
          <Text style={styles.loadingText}>Geçmiş yükleniyor...</Text>
        </View>
      )}

      {isEmpty && (
        <View style={{ alignItems: 'center', padding: t.spacing['2xl'] }}>
          <Text style={{ fontSize: 44, marginBottom: t.spacing.md }}>🗂️</Text>
          <Text style={[styles.headerSub, { textAlign: 'center' }]}>
            Henüz yanıtlanmış bir isteğiniz yok.
          </Text>
        </View>
      )}

      {suggestions.length > 0 && (
        <>
          <Text style={[styles.label, { marginLeft: t.spacing.base, marginTop: t.spacing.lg }]}>
            🚗 ARAÇ ÖNERİLERİ
          </Text>
          {suggestions.map(item => (
            <HistoryThread
              key={item.requestId}
              icon="🚗"
              requestText={`${item.budget || ''} TL${item.yearMin ? ` • ${item.yearMin}-${item.yearMax}` : ''}${item.fuel ? ` • ${item.fuel}` : ''}`}
              date={item.createdAt}
              answer={item.recommendation || ''}
              expanded={expandedKey === `s-${item.requestId}`}
              onToggle={() => toggle(`s-${item.requestId}`)}
            />
          ))}
        </>
      )}

      {evaluations.length > 0 && (
        <>
          <Text style={[styles.label, { marginLeft: t.spacing.base, marginTop: t.spacing.lg }]}>
            🔎 ARAÇ DEĞERLENDİRMELERİ
          </Text>
          {evaluations.map(item => (
            <HistoryThread
              key={item.requestId}
              icon="🔎"
              requestText={
                item.ilanNo && item.ilanNo !== 'Belirtilmedi'
                  ? `İlan No: ${item.ilanNo}`
                  : (item.message || 'Değerlendirme isteği')
              }
              date={item.createdAt}
              answer={item.answer || ''}
              expanded={expandedKey === `e-${item.requestId}`}
              onToggle={() => toggle(`e-${item.requestId}`)}
            />
          ))}
        </>
      )}

      {loaded && (
        <Pressable
          style={{ alignSelf: 'center', padding: t.spacing.md, marginTop: t.spacing.sm }}
          onPress={() => load(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={t.color.brand.primary} />
          ) : (
            <Text style={{ ...t.typography.bodySm, color: t.color.brand.primary }}>Yenile</Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const bubbleStyles = StyleSheet.create({
  thread: {
    paddingHorizontal: t.spacing.base,
    marginTop: t.spacing.md,
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
  moreLink: {
    ...t.typography.caption,
    color: t.color.brand.primary,
    marginTop: 4,
    fontWeight: '600',
  },
});
