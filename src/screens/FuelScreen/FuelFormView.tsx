import React, { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { styles } from './styles';
import FuelReceiptScanner from './FuelReceiptScanner';
import { FuelForm } from '../../hooks/useFuelForm';
import { formatDateToString, parseDateString } from '../../utils/dateUtils';
import { parseWholeNumberInput } from '../../utils/numberFormat';
import { tokens } from '../../config/tokens';

const t = tokens;

interface Props {
  record: FuelForm;
  updateField: <K extends keyof FuelForm>(field: K, value: FuelForm[K]) => void;
  onSave: () => void;
  onReceiptScanned: (data: Partial<FuelForm>) => void;
  hasHistory: boolean;
}

export default function FuelFormView({ record, updateField, onSave, onReceiptScanned, hasHistory }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const todayLabel = formatDateToString(new Date());

  return (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Yeni Kayıt Ekle</Text>

      {/* ✅ YENİ — Fiş tarayıcı */}
      <FuelReceiptScanner onDataExtracted={onReceiptScanned} />

      <Text style={styles.label}>TARİH</Text>
      <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: record.date ? '#020202' : '#52525B' }}>
          📅 {record.date || `Bugün (${todayLabel})`}
        </Text>
      </Pressable>

      <Text style={styles.label}>YAKIT LİTRE FİYATI (TL)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Örn: 42.50"
        placeholderTextColor={t.color.text.muted}
        value={record.pricePerLiter}
        onChangeText={(v) => updateField('pricePerLiter', v)}
        maxLength={10}
      />

      <Text style={styles.label}>ALINAN YAKIT (LİTRE)</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="Örn: 45"
        placeholderTextColor={t.color.text.muted}
        value={record.totalLiters}
        onChangeText={(v) => updateField('totalLiters', v)}
        maxLength={10}
      />

      {hasHistory && (
        <>
          <Text style={styles.label}>ÖNCEKİ KİLOMETRE</Text>
          <TextInput
            style={[styles.input, styles.autoFillInput]}
            keyboardType="number-pad"
            value={record.previousKm}
            placeholder="Önceki kayıttaki kilometre"
            placeholderTextColor={t.color.text.muted}
            onChangeText={(v) => updateField('previousKm', parseWholeNumberInput(v))}
          />
        </>
      )}

      <Text style={styles.label}>GÜNCEL KİLOMETRE</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="Aracın şu anki KM'si"
        placeholderTextColor={t.color.text.muted}
        value={record.currentKm}
        onChangeText={(v) => updateField('currentKm', parseWholeNumberInput(v))}
      />
      {!hasHistory && (
        <Text style={styles.firstRecordNote}>
          İlk kayıtta yalnızca güncel kilometreyi girmeniz yeterli. Bu kilometre başlangıç noktası olur; tüketim sonucu bir sonraki full dolumdan sonra hesaplanır ve önceki kilometre o zaman otomatik gelir.
        </Text>
      )}

      <Text style={styles.label}>İSTASYON (İSTEĞE BAĞLI)</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Shell, BP, Opet"
        placeholderTextColor={t.color.text.muted}
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

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={parseDateString(record.date) ?? new Date()}
        maximumDate={new Date()}
        display="inline"
        onConfirm={(date: Date) => { updateField('date', formatDateToString(date)); setShowDatePicker(false); }}
        onCancel={() => setShowDatePicker(false)}
        confirmTextIOS="Tamam"
        cancelTextIOS="Vazgeç"
        pickerContainerStyleIOS={{ backgroundColor: '#FFFFFF' }}
        textColor="#0D1520"
        isDarkModeEnabled={false}
      />
    </View>
  );
}