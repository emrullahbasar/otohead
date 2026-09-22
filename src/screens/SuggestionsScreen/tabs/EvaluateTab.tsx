import React from 'react';
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';
import { SimpleRequestForm } from '../components/SimpleRequestForm';
import { useSimpleRequest } from '../../../hooks/useSimpleRequest';

const t = tokens;

interface Props {
  evaluation: ReturnType<typeof useSimpleRequest>;
}

export default function EvaluateTab({ evaluation }: Props) {
  if (evaluation.result?.status === 'HAZIR' || evaluation.result?.status === 'GÖRÜLDÜ') {
    return (
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
  }

  if (evaluation.result?.status === 'BEKLİYOR') {
    return (
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
      </View>
    );
  }

  if (evaluation.submitted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
        <Text style={{ fontSize: 44, marginBottom: t.spacing.base }}>✅</Text>
        <Text style={[styles.header, { textAlign: 'center', marginBottom: t.spacing.sm }]}>
          İsteğiniz Alındı!
        </Text>
        <Text style={[styles.headerSub, { textAlign: 'center', lineHeight: 22 }]}>
          Uzman ekibimiz en kısa sürede yanıt verecektir.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: t.spacing['3xl'] }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      automaticallyAdjustKeyboardInsets={true}
    >
      <View style={{ padding: t.spacing.base, paddingBottom: 0 }}>
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
        placeholder="örn. Şu ilan numaralı xxx ,2018 VW Passat 1.6 TDI DSG alınır mı? Fiyatı uygun mu? Nelere dikkat etmeliyim?"
        buttonText="🔎 Değerlendirme İste"
        ilanNoLabel="İlan Numarası"
        messageLabel="Değerlendirme İsteğiniz"
      />
    </ScrollView>
  );
}