import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';
import { trUpper } from '../../../utils/textCase';

interface Props {
  name:         string;
  setName:      (v: string) => void;
  ilanNo:       string;
  setIlanNo:    (v: string) => void;
  message:      string;
  setMessage:   (v: string) => void;
  loading:      boolean;
  error:        string;
  onSubmit:     () => void;
  placeholder:  string;
  buttonText:   string;
  ilanNoLabel:  string;
  messageLabel: string;
  onMessageFocus?: () => void;
}

export const SimpleRequestForm = ({
  name, setName,
  ilanNo, setIlanNo,
  message, setMessage,
  loading, error,
  onSubmit,
  placeholder,
  buttonText,
  ilanNoLabel,
  messageLabel,
  onMessageFocus,
}: Props) => {
  const ilanNoRef  = useRef<TextInput>(null);
  const messageRef = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      {error !== '' && (
        <View style={[styles.errorBox, { marginBottom: 12, marginHorizontal: 0 }]}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <Text style={styles.label}>{trUpper('İsminiz (isteğe bağlı)')}</Text>
      <TextInput
        style={styles.input}
        placeholder="Size nasıl hitap edelim?"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={name}
        onChangeText={setName}
        maxLength={40}
        returnKeyType="next"
        onSubmitEditing={() => ilanNoRef.current?.focus()}
        blurOnSubmit={false}
        editable={!loading}
      />

      <Text style={styles.label}>{trUpper(ilanNoLabel)}</Text>
      <TextInput
        ref={ilanNoRef}
        style={styles.input}
        placeholder="örn. 1181405293"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={ilanNo}
        onChangeText={t => setIlanNo(t.replace(/\D/g, ''))}
        maxLength={20}
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => messageRef.current?.focus()}
        blurOnSubmit={false}
        editable={!loading}
      />

      <Text style={styles.label}>{trUpper(messageLabel)}</Text>
      <TextInput
        ref={messageRef}
        style={[styles.input, styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={message}
        onChangeText={setMessage}
        maxLength={1000}
        onFocus={onMessageFocus}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
        editable={!loading}
      />
      <Text style={styles.fieldHint}>
        Lütfen telefon numarası, adres gibi ek kişisel bilgi paylaşmayın.
      </Text>

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={loading}
      >
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={[styles.buttonText, { marginLeft: 8 }]}>Gönderiliyor...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>{buttonText}</Text>
        )}
      </Pressable>
    </View>
  );
};