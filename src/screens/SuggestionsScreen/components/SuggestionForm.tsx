import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';
import { formatWholeNumberDisplay, parseWholeNumberInput } from '../../../utils/numberFormat';
import { trUpper } from '../../../utils/textCase';

interface Props {
  budget:      string; setBudget:   (val: string) => void;
  yearMin:     string; setYearMin:  (val: string) => void;
  yearMax:     string; setYearMax:  (val: string) => void;
  caseType:    string[];
  setCaseType: (val: string[]) => void;
  fuel:        string[];
  gear:        string[];
  extra:       string; setExtra:    (val: string) => void;
  touched:     { caseType: boolean; fuel: boolean; gear: boolean };
  loading:     boolean;
  setModalType:(val: 'fuel' | 'gear' | 'caseType' | null) => void;
  handleSearch:() => void;
  onExtraFocus?: () => void;
}

// Uygulama genelinde tutarlı olsun diye kartlarla aynı biçim (tr-TR, nokta binlik).
const formatNumber = formatWholeNumberDisplay;

// Seçim label'ı — dokunulmadıysa "Seçin", dokunulup "Fark Etmez" seçildiyse
// (boş dizi) "Fark Etmez" gösterir. touched olmadan boş diziyi "Fark Etmez"
// sanmak, hiç açılmamış bir alanı zaten cevaplanmış gibi gösterirdi.
const getLabel = (selected: string[], isTouched: boolean): string => {
  if (!isTouched) return 'Seçin';
  if (selected.length === 0) return 'Fark Etmez';
  return selected.join(', ');
};

export const SuggestionForm = ({
  budget, setBudget,
  yearMin, setYearMin,
  yearMax, setYearMax,
  caseType, setCaseType,
  fuel, gear,
  extra, setExtra,
  touched,
  loading, setModalType, handleSearch,
  onExtraFocus,
}: Props) => {
  const yearMinRef = useRef<TextInput>(null);
  const yearMaxRef = useRef<TextInput>(null);
  const extraRef   = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      <Text style={styles.label}>{trUpper('Bütçe (TL)')}</Text>
      <TextInput
        style={styles.input}
        placeholder="örn. 500.000"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={formatNumber(budget)}
        onChangeText={text => setBudget(parseWholeNumberInput(text))}
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => yearMinRef.current?.focus()}
        blurOnSubmit={false}
        editable={!loading}
      />

      <Text style={styles.label}>{trUpper('Yıl Aralığı')}</Text>
      <View style={styles.row}>
        <TextInput
          ref={yearMinRef}
          style={[styles.input, styles.halfInput]}
          placeholder="Min (2018)"
          placeholderTextColor={styles.selectorPlaceholder.color}
          value={yearMin}
          onChangeText={text => setYearMin(text.replace(/\D/g, ''))}
          maxLength={4}
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
          onChangeText={text => setYearMax(text.replace(/\D/g, ''))}
          maxLength={4}
          keyboardType="numeric"
          returnKeyType="next"
          onSubmitEditing={() => extraRef.current?.focus()}
          blurOnSubmit={false}
          editable={!loading}
        />
      </View>

      <Text style={styles.label}>
        {trUpper(`Kasa Tipi${caseType.length > 0 ? ` (${caseType.length} seçildi)` : ''}`)}
      </Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('caseType')}
      >
        <Text style={touched.caseType ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
          {getLabel(caseType, touched.caseType)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>
        {trUpper(`Yakıt Tipi${fuel.length > 0 ? ` (${fuel.length} seçildi)` : ''}`)}
      </Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('fuel')}
      >
        <Text style={touched.fuel ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
          {getLabel(fuel, touched.fuel)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>
        {trUpper(`Vites Tipi${gear.length > 0 ? ` (${gear.length} seçildi)` : ''}`)}
      </Text>
      <Pressable
        style={styles.selector}
        onPress={() => !loading && setModalType('gear')}
      >
        <Text style={touched.gear ? styles.selectorText : styles.selectorPlaceholder} numberOfLines={1}>
          {getLabel(gear, touched.gear)}
        </Text>
        <Text style={styles.selectorArrow}>›</Text>
      </Pressable>

      <Text style={styles.label}>{trUpper('Kullanım Amacınızı Açıklayın')}</Text>
      <TextInput
        ref={extraRef}
        style={[styles.input, styles.multilineInput]}
        placeholder="örn. 4 kişilik küçük çocuklu bir aileyiz. Şehir içi ve ara sıra uzun yol kullanımı..."
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={extra}
        onChangeText={setExtra}
        maxLength={1000}
        onFocus={onExtraFocus}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
        editable={!loading}
        scrollEnabled
      />
      <Text style={styles.fieldHint}>
        Size en uygun aracı önerebilmemiz için birkaç cümle (3-4 cümle) yazmanız yeterli olacaktır 🙂
      </Text>
      <Text style={styles.fieldHint}>
        Lütfen isim, telefon numarası gibi kişisel bilgi yazmayın.
      </Text>

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