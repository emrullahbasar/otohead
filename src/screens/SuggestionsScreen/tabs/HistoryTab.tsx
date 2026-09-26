import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { useSuggestionHistory } from '../../../hooks/useSuggestionHistory';
import { SuggestionHistoryItem, EvaluationHistoryItem } from '../../../services/suggestionApi';

const t = tokens;

interface Props {
  history: ReturnType<typeof useSuggestionHistory>;
}

function HistoryCard({
  icon, title, subtitle, date, text, expanded, onToggle,
}: {
  icon: string; title: string; subtitle?: string | null; date: string;
  text: string; expanded: boolean; onToggle: () => void;
}) {
  return (
    <Pressable style={styles.result} onPress={onToggle}>
      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{icon} {title}</Text>
        {subtitle ? (
          <Text
            style={{ color: t.color.text.muted, ...t.typography.caption, marginTop: 4 }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={{ color: t.color.text.muted, ...t.typography.caption, marginTop: 2 }}>
          {date}
        </Text>
      </View>
      {expanded && <Text style={styles.resultText}>{text}</Text>}
      {!expanded && (
        <Text style={[styles.resultText, { color: t.color.brand.primary, paddingTop: 0 }]}>
          Yanıtı görmek için dokunun ›
        </Text>
      )}
    </Pressable>
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
            <HistoryCard
              key={item.requestId}
              icon="🚗"
              title={`${item.budget || ''} TL${item.yearMin ? ` • ${item.yearMin}-${item.yearMax}` : ''}`}
              subtitle={item.fuel || null}
              date={item.createdAt}
              text={item.recommendation || ''}
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
            <HistoryCard
              key={item.requestId}
              icon="🔎"
              title={item.ilanNo && item.ilanNo !== 'Belirtilmedi' ? `İlan No: ${item.ilanNo}` : 'Değerlendirme'}
              subtitle={item.message}
              date={item.createdAt}
              text={item.answer || ''}
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
