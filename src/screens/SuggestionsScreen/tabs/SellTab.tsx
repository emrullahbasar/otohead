import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator, Alert,
} from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { SellEstimateForm } from '../components/SellEstimateForm';
import { SellSelectionModal } from '../components/SellSelectionModal';
import { useSellEstimate } from '../../../hooks/useSellEstimate';

const t = tokens;

interface Props {
  sell: ReturnType<typeof useSellEstimate>;
  onBack: () => void;
}

// "Satacağım Araç" akışı — EvaluateTab'ın basitleştirilmiş hâli: Mesajlar/
// takip mesajı YOK (bilerek, kullanıcı isteğiyle), tek seferlik gönder →
// bekle → uzman tahmini fiyatı yazar → büyük yeşil rakamla gösterilir.
export default function SellTab({ sell, onBack }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const hasAnswer = sell.result?.status === 'HAZIR' || sell.result?.status === 'GÖRÜLDÜ';

  useEffect(() => {
    if (sell.error) scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [sell.error]);

  let content: React.ReactNode;

  if (hasAnswer) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.lg }]}>
          Fiyat Tahminiz Hazır!
        </Text>
        <Text style={{ ...t.typography.bodySm, color: t.color.text.muted, textAlign: 'center' }}>
          Uzmanlarımızın aracınız için belirlediği piyasa rakamı
        </Text>
        <Text style={{
          fontSize: 40, fontWeight: '800', color: t.color.success.default,
          textAlign: 'center', marginTop: t.spacing.sm, marginBottom: t.spacing.xl,
        }}>
          {sell.result?.price || '—'}
        </Text>
        <Pressable style={{ padding: t.spacing.sm }} onPress={sell.reset}>
          <Text style={{ ...t.typography.bodySm, color: t.color.brand.primary, textAlign: 'center', fontWeight: '600' }}>
            Yeni Fiyat Tahmini İste
          </Text>
        </Pressable>
        <Pressable style={{ marginTop: t.spacing.md, padding: t.spacing.sm }} onPress={onBack}>
          <Text style={{ ...t.typography.bodySm, color: t.color.text.muted, textAlign: 'center' }}>
            ‹ Değerlendirme Türünü Değiştir
          </Text>
        </Pressable>
      </View>
    );
  } else if (sell.result?.status === 'BEKLİYOR') {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>⏳</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İnceleniyor
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22, marginBottom: t.spacing.xl }]}>
          Uzman ekibimiz aracınızı inceleyip piyasa fiyatını belirliyor.
        </Text>
        <Pressable
          style={[styles.button, sell.checkingStatus && styles.buttonDisabled]}
          onPress={sell.checkStatus}
          disabled={sell.checkingStatus}
        >
          {sell.checkingStatus
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.buttonText}>Durumu Kontrol Et</Text>
          }
        </Pressable>
        {sell.statusError !== '' && (
          <Text style={[styles.errorText, { textAlign: 'center', marginTop: t.spacing.md }]}>
            ⚠️ {sell.statusError}
          </Text>
        )}
        <Pressable
          style={{ marginTop: t.spacing.lg, padding: t.spacing.sm }}
          disabled={sell.cancelling}
          onPress={() => Alert.alert(
            'İsteği İptal Et',
            'Bekleyen fiyat tahmini isteğinizi geri çekmek istediğinize emin misiniz?',
            [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'İsteği İptal Et', style: 'destructive', onPress: sell.cancelPending },
            ],
          )}
        >
          <Text style={{ ...t.typography.bodySm, color: t.color.danger.default, textAlign: 'center' }}>
            {sell.cancelling ? 'İptal ediliyor...' : 'İsteği İptal Et'}
          </Text>
        </Pressable>
      </View>
    );
  } else if (sell.submitted) {
    content = (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İsteğiniz Alındı!
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22 }]}>
          Uzman ekibimiz en kısa sürede aracınız için piyasa fiyatı tahmini hazırlayacaktır.
        </Text>
        <Pressable
          style={[styles.button, { marginTop: t.spacing.xl }, sell.checkingStatus && styles.buttonDisabled]}
          onPress={sell.checkStatus}
          disabled={sell.checkingStatus}
        >
          {sell.checkingStatus
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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: t.spacing.base, paddingBottom: 0 }}>
          <Pressable onPress={onBack} hitSlop={8}>
            <Text style={{ ...t.typography.bodySm, color: t.color.brand.primary, fontWeight: '600' }}>‹ Geri</Text>
          </Pressable>
        </View>
        <Text style={[styles.headerSub, { paddingHorizontal: t.spacing.base }]}>
          Aracınızın bilgilerini ve kaporta durumunu girin, uzman ekibimiz piyasa değerini tahmin etsin.
        </Text>
        <SellEstimateForm
          name={sell.name} setName={sell.setName}
          brand={sell.brand} model={sell.model} year={sell.year}
          pkg={sell.pkg} setPkg={sell.setPkg}
          km={sell.km} setKm={sell.setKm}
          panels={sell.panels} setPanel={sell.setPanel}
          heavyDamage={sell.heavyDamage} setHeavyDamage={sell.setHeavyDamage}
          loading={sell.loading} error={sell.error}
          onSubmit={sell.handleSubmit}
          setModalType={sell.setModalType}
        />
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {content}
      <SellSelectionModal
        modalType={sell.modalType}
        setModalType={sell.setModalType}
        loading={sell.loadingModels}
        brands={sell.brands}
        models={sell.models}
        setBrand={sell.setBrand}
        setModel={sell.setModel}
        setYear={sell.setYear}
        loadModels={sell.loadModels}
      />
    </View>
  );
}
