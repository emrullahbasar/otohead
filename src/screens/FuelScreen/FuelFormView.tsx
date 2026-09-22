import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { styles } from './styles';
import FuelReceiptScanner from './FuelReceiptScanner';

interface FuelForm {
  pricePerLiter: string;
  totalLiters: string;
  previousKm: string;
  currentKm: string;
  isFull: boolean;
  station: string;
}

interface Props {
  record: FuelForm;
  updateField: <K extends keyof FuelForm>(field: K, value: FuelForm[K]) => void;
  onSave: () => void;
  onReceiptScanned: (data: Partial<FuelForm>) => void; // ✅ YENİ
}

export default function FuelFormView({ record, updateField, onSave, onReceiptScanned }: Props) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Yeni Kayıt Ekle</Text>

      {/* ✅ YENİ — Fiş tarayıcı */}
      <FuelReceiptScanner onDataExtracted={onReceiptScanned} />

      <Text style={styles.label}>Yakıt Litre Fiyatı (TL)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Örn: 42.50"
        placeholderTextColor="#aaa"
        value={record.pricePerLiter}
        onChangeText={(v) => updateField('pricePerLiter', v)}
      />

      <Text style={styles.label}>Alınan Yakıt (Litre)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Örn: 45"
        placeholderTextColor="#aaa"
        value={record.totalLiters}
        onChangeText={(v) => updateField('totalLiters', v)}
      />

      <Text style={styles.label}>Önceki Kilometre</Text>
      <TextInput
        style={[styles.input, styles.autoFillInput]}
        keyboardType="number-pad"
        value={record.previousKm}
        placeholder="Otomatik dolduruldu"
        placeholderTextColor="#aaa"
        onChangeText={(v) => updateField('previousKm', v)}
      />

      <Text style={styles.label}>Güncel Kilometre</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="Aracın şu anki KM'si"
        placeholderTextColor="#aaa"
        value={record.currentKm}
        onChangeText={(v) => updateField('currentKm', v)}
      />

      <Text style={styles.label}>İstasyon (isteğe bağlı)</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Shell, BP, Opet"
        placeholderTextColor="#aaa"
        value={record.station}
        onChangeText={(v) => updateField('station', v)}
      />

      <Pressable
        style={[styles.fullToggle, record.isFull && styles.fullToggleActive]}
        onPress={() => updateField('isFull', !record.isFull)}
      >
        <Text style={[styles.fullToggleText, record.isFull && styles.fullToggleTextActive]}>
          {record.isFull ? '✅ Depo Full Doldu' : '☐ Depoyu Fullediniz mi?'}
        </Text>
      </Pressable>

      {!record.isFull && (
        <Text style={styles.partialNote}>
          Parça dolum kaydedilecek. Tüketim analizi bir sonraki full dolumda hesaplanacaktır.
        </Text>
      )}

      <Pressable style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </Pressable>
    </View>
  );
}