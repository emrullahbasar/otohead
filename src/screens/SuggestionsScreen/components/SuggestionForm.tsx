import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';

interface Props {
  budget:      string; setBudget:   (val: string) => void;
  yearMin:     string; setYearMin:  (val: string) => void;
  yearMax:     string; setYearMax:  (val: string) => void;
  caseType:    string[];
  setCaseType: (val: string[]) => void;
  fuel:        string[];
  gear:        string;
  extra:       string; setExtra:    (val: string) => void;
  loading:     boolean;
  setModalType:(val: 'fuel' | 'gear' | 'caseType' | null) => void;
  handleSearch:() => void;
}

const formatNumber = (value: string): string => {
  const raw = value.replace(/,/g, '');
  if (!raw) return '';
  const num = parseInt(raw, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

// Seçim label'ı — boş veya "Fark Etmez" durumunu handle eder
const getLabel = (selected: string[], emptyLabel = 'Seçin'): string => {
  if (selected.length === 0) return 'Fark Etmez';
  return selected.join(', ');
};

const getGearLabel = (gear: string): string => {
  if (!gear || gear === '') return 'Seçin';
  if (gear === 'Fark Etmez') return 'Fark Etmez';
  return gear;
};

export const SuggestionForm = ({
  budget, setBudget,
  yearMin, setYearMin,
  yearMax, setYearMax,
  caseType, setCaseType,
  fuel, gear,
  extra, setExtra,
  loading, setModalType, handleSearch,
}: Props) => {
  const yearMinRef = useRef<TextInput>(null);
  const yearMaxRef = useRef<TextInput>(null);
  const extraRef   = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      <Text style={styles.label}>Bütçe (TL)</Text>
      <TextInput
        style={styles.input}
        placeholder="örn. 500.000"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={formatNumber(budget)}
        onChangeText={text => setBudget(text.replace(/\D/g, ''))}
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => yearMinRef.current?.focus()}
        blurOnSubmit={false}
        editable={!loading}
      />

      <Text style={styles.label}>Yıl Aralığı</Text>
      <View style={styles.row}>
        <TextInput
          ref={yearMinRef}
          style={[styles.input, styles.halfInput]}
          placeholder="Min (2018)"
          placeholderTextColor={styles.selectorPlaceholder.color}
          value={yearMin}
          onChangeText={setYearMin}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => yearMaxRef.current?.focus()}
          blurOnSubmit={false}
          editable={!loading}
        />
        <TextInput
          ref={yearMaxRef}
          style={[styles.input, styles.halfInput]}
          placeholder="Max (2024)"
          placeholderTextColor={styles.selectorPlaceholder.color}
          value={yearMax}
          onChangeText={setYearMax}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => extraRef.current?.focus()}
          blurOnSubmit={false}
          editable={!loading}
        />
      </View>

      <Text style={styles.label}>
        Kasa Tipi{caseType.length > 0 ? ` (${caseType.length} seçildi)` : ''}
      </Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('caseType')}
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {getLabel(caseType)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>
        Yakıt Tipi{fuel.length > 0 ? ` (${fuel.length} seçildi)` : ''}
      </Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('fuel')}
      >
        <Text style={styles.selectorText} numberOfLines={1}>
          {getLabel(fuel)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>Vites Tipi</Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('gear')}
      >
        <Text style={gear ? styles.selectorText : styles.selectorPlaceholder}>
          {getGearLabel(gear)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>Kullanım Amacınızı Açıklayın</Text>
      <TextInput
        ref={extraRef}
        style={[styles.input, styles.multilineInput]}
        placeholder="örn. 4 kişilik küçük çocuklu bir aileyiz. Şehir içi ve ara sıra uzun yol kullanımı..."
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={extra}
        onChangeText={setExtra}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
        editable={!loading}
        scrollEnabled
      />

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSearch}
        disabled={loading}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Gönderiliyor...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Öneri İste</Text>
        )}
      </Pressable>
    </View>
  );
};