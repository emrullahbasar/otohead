import React, { useRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
} from 'react-native';
import { styles } from '../styles';

interface Props {
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
}

export const SimpleRequestForm = ({
  ilanNo, setIlanNo,
  message, setMessage,
  loading, error,
  onSubmit,
  placeholder,
  buttonText,
  ilanNoLabel,
  messageLabel,
}: Props) => {
  const messageRef = useRef<TextInput>(null);

  return (
    <View style={styles.form}>
      {error !== '' && (
        <View style={[styles.errorBox, { marginBottom: 12, marginHorizontal: 0 }]}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <Text style={styles.label}>{ilanNoLabel}</Text>
      <TextInput
        style={styles.input}
        placeholder="örn. 1234567890"
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={ilanNo}
        onChangeText={setIlanNo}
        keyboardType="numeric"
        returnKeyType="next"
        onSubmitEditing={() => messageRef.current?.focus()}
        blurOnSubmit={false}
        editable={!loading}
      />

      <Text style={styles.label}>{messageLabel}</Text>
      <TextInput
        ref={messageRef}
        style={[styles.input, styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor={styles.selectorPlaceholder.color}
        value={message}
        onChangeText={setMessage}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        returnKeyType="done"
        blurOnSubmit
        editable={!loading}
      />

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