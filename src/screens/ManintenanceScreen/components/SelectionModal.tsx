import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, Platform,
  Pressable, ActivityIndicator, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { styles } from '../styles';
import { YEARS, MAINTENANCE_TYPES } from '../../../hooks/useMaintenance';
import { tokens } from '../../../config/tokens';

const t = tokens;

interface Props {
  modalType: 'brand' | 'model' | 'year' | 'recordType' | null;
  setModalType: (type: 'brand' | 'model' | 'year' | 'recordType' | null) => void;
  loading: boolean;
  brands: string[];
  models: string[];
  setBrand: (val: string) => void;
  setModel: (val: string) => void;
  setYear: (val: string) => void;
  setRecordType: (val: string) => void;
  loadModels: (brand: string) => void;
}

const MODAL_TITLES: Record<string, string> = {
  brand:      'Marka Seç',
  model:      'Model Seç',
  year:       'Yıl Seç',
  recordType: 'İşlem Türü Seç',
};

export const SelectionModal = ({
  modalType, setModalType, loading,
  brands, models,
  setBrand, setModel, setYear, setRecordType, loadModels,
}: Props) => {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText,      setOtherText]      = useState('');

  if (modalType === null) return null;

  const items: string[] =
    modalType === 'brand'      ? brands :
    modalType === 'model'      ? models :
    modalType === 'year'       ? YEARS  :
    MAINTENANCE_TYPES;

  const closeModal = () => {
    setModalType(null);
    setShowOtherInput(false);
    setOtherText('');
  };

  const handleSelect = (item: string) => {
    if (modalType === 'recordType' && item === 'Diğer') {
      setShowOtherInput(true);
      return;
    }
    if (modalType === 'brand') {
      setBrand(item);
      setModel('');
      loadModels(item);
    } else if (modalType === 'model') {
      setModel(item);
    } else if (modalType === 'year') {
      setYear(item);
    } else if (modalType === 'recordType') {
      setRecordType(item);
    }
    closeModal();
  };

  const confirmOtherText = () => {
    const trimmed = otherText.trim();
    if (!trimmed) return;
    setRecordType(trimmed);
    closeModal();
  };

  return (
    <Modal visible transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <Pressable
        style={styles.modalOverlay}
        onPress={closeModal}
      >
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {showOtherInput ? 'İşlem Türünü Yazın' : MODAL_TITLES[modalType]}
            </Text>
            {showOtherInput ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Örn. Bujii Değişimi"
                  placeholderTextColor={t.color.text.muted}
                  value={otherText}
                  onChangeText={setOtherText}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={confirmOtherText}
                />
                <Pressable
                  style={[styles.button, { marginTop: t.spacing.md }]}
                  onPress={confirmOtherText}
                >
                  <Text style={styles.buttonText}>Tamam</Text>
                </Pressable>
              </>
            ) : loading ? (
              <ActivityIndicator
                size="large"
                color={t.color.brand.primary}
                style={{ margin: 20 }}
              />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {items.map(item => (
                  <Pressable
                    key={item}
                    style={({ pressed }) => [
                      styles.modalItem,
                      pressed && { backgroundColor: t.color.bg.muted },
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <Pressable
              style={styles.modalCancel}
              onPress={closeModal}
            >
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};