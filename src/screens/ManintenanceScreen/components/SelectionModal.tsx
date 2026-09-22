import React from 'react';
import {
  View, Text, Modal, ScrollView,
  Pressable, ActivityIndicator,
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
  if (modalType === null) return null;

  const items: string[] =
    modalType === 'brand'      ? brands :
    modalType === 'model'      ? models :
    modalType === 'year'       ? YEARS  :
    MAINTENANCE_TYPES;

  const handleSelect = (item: string) => {
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
    setModalType(null);
  };

  return (
    <Modal visible transparent animationType="slide">
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setModalType(null)}
      >
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{MODAL_TITLES[modalType]}</Text>
            {loading ? (
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
              onPress={() => setModalType(null)}
            >
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};