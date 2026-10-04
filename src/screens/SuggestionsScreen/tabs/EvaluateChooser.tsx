import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { tokens } from '../../../config/tokens';
import { useSimpleRequest } from '../../../hooks/useSimpleRequest';
import { useSellEstimate } from '../../../hooks/useSellEstimate';
import EvaluateTab from './EvaluateTab';
import SellTab from './SellTab';

const t = tokens;

interface Props {
  evaluation: ReturnType<typeof useSimpleRequest>;
  sell:       ReturnType<typeof useSellEstimate>;
}

type SubTab = 'choose' | 'buy' | 'sell';

// "Araç Değerlendirme" sekmesi artık tek bir form değil, iki ayrı amaç için
// bir yönlendirme ekranı: Alacağım Araç (mevcut değerlendirme akışı,
// EvaluateTab — değişmedi) ve Satacağım Araç (yeni, SellTab — fiyat tahmini).
// Kullanıcı daha önce bir akışta istek başlattıysa (BEKLİYOR/HAZIR/gönderildi)
// sekmeye her dönüşte seçim ekranına geri atılmasın diye ilk açılışta otomatik
// o akışa geçilir.
export default function EvaluateChooser({ evaluation, sell }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('choose');
  const autoPickedRef = useRef(false);

  useEffect(() => {
    if (autoPickedRef.current) return;
    const evalActive = !!evaluation.result && evaluation.result.status !== 'YOK';
    const sellActive = !!sell.result && sell.result.status !== 'YOK';
    if (evaluation.submitted || evalActive) {
      autoPickedRef.current = true;
      setSubTab('buy');
    } else if (sell.submitted || sellActive) {
      autoPickedRef.current = true;
      setSubTab('sell');
    }
  }, [evaluation.result, evaluation.submitted, sell.result, sell.submitted]);

  if (subTab === 'buy')  return <EvaluateTab evaluation={evaluation} onBack={() => setSubTab('choose')} />;
  if (subTab === 'sell') return <SellTab sell={sell} onBack={() => setSubTab('choose')} />;

  return (
    <View style={{ flex: 1, padding: t.spacing.base }}>
      <Text style={cs.intro}>
        Hangi konuda destek almak istiyorsunuz?
      </Text>

      <Pressable
        style={({ pressed }) => [cs.card, pressed && cs.cardPressed]}
        onPress={() => setSubTab('buy')}
      >
        <View style={{ flex: 1 }}>
          <Text style={cs.cardTitle}>Alacağım Araç</Text>
          <Text style={cs.cardSub}>Beğendiğiniz bir ilan hakkında uzman görüşü alın.</Text>
        </View>
        <Text style={cs.cardArrow}>›</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [cs.card, pressed && cs.cardPressed]}
        onPress={() => setSubTab('sell')}
      >
        <View style={{ flex: 1 }}>
          <Text style={cs.cardTitle}>Satacağım Araç</Text>
          <Text style={cs.cardSub}>Aracınızın kaporta durumunu girin, piyasa fiyat tahmini alın.</Text>
        </View>
        <Text style={cs.cardArrow}>›</Text>
      </Pressable>
    </View>
  );
}

const cs = StyleSheet.create({
  intro: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
    marginBottom: t.spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.default,
    padding: t.spacing.base,
    marginBottom: t.spacing.md,
  },
  cardPressed: {
    backgroundColor: t.color.bg.muted,
  },
  cardTitle: {
    ...t.typography.h3,
    color: t.color.text.primary,
    marginBottom: 2,
  },
  cardSub: {
    ...t.typography.caption,
    color: t.color.text.muted,
    lineHeight: 18,
  },
  cardArrow: {
    fontSize: 20,
    color: t.color.text.muted,
  },
});
