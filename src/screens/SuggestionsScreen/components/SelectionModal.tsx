import React from 'react';
import { View, Text, Modal, ScrollView, Pressable, StyleSheet } from 'react-native';
import { styles } from '../styles';
import { theme } from '../../../config/theme';
import { CASE_TYPES } from '../../../hooks/useSuggestion';

interface SelectionModalProps {
  modalType:    'fuel' | 'gear' | 'caseType' | null;
  setModalType: (val: 'fuel' | 'gear' | 'caseType' | null) => void;
  fuelTypes:    string[];
  gearTypes:    string[];
  setFuel:      (val: string[]) => void;
  setGear:      (val: string[]) => void;
  caseType:     string[];
  setCaseType:  (val: string[]) => void;
  fuel:         string[];
  gear:         string[];
}

export const SelectionModal = ({
  modalType, setModalType,
  fuelTypes, gearTypes,
  setFuel, setGear,
  caseType, setCaseType,
  fuel, gear,
}: SelectionModalProps) => {

  if (modalType === null) return null;

  const toggleCaseType = (type: string) => {
    if (type === 'Fark Etmez') { setCaseType([]); return; }
    caseType.includes(type)
      ? setCaseType(caseType.filter(t => t !== type))
      : setCaseType([...caseType, type]);
  };

  const toggleFuel = (type: string) => {
    if (type === 'Fark Etmez') { setFuel([]); return; }
    fuel.includes(type)
      ? setFuel(fuel.filter(t => t !== type))
      : setFuel([...fuel, type]);
  };

  const toggleGear = (type: string) => {
    if (type === 'Fark Etmez') { setGear([]); return; }
    gear.includes(type)
      ? setGear(gear.filter(t => t !== type))
      : setGear([...gear, type]);
  };

  const renderCheckList = (
    items: string[],
    selected: string[],
    onToggle: (type: string) => void,
    onDone: () => void,
    title: string,
    subtitle?: string,
  ) => (
    <Modal visible transparent animationType="slide">
      {/* Dışarıya basınca kapat */}
      <Pressable style={styles.modalOverlay} onPress={onDone}>
        <Pressable onPress={e => e.stopPropagation()}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle && (
              <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 12, marginTop: -10 }}>
                {subtitle}
              </Text>
            )}
            <ScrollView keyboardShouldPersistTaps="handled">
              {items.map(type => {
                const isSelected = type === 'Fark Etmez'
                  ? selected.length === 0
                  : selected.includes(type);
                return (
                  <Pressable
                    key={type}
                    style={[checkStyles.item, isSelected && checkStyles.itemActive]}
                    onPress={() => onToggle(type)}
                  >
                    <View style={[checkStyles.box, isSelected && checkStyles.boxActive]}>
                      {isSelected && <Text style={checkStyles.check}>✓</Text>}
                    </View>
                    <Text style={[styles.modalItemText, isSelected && { color: theme.accent }]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable style={[styles.button, { marginTop: 12 }]} onPress={onDone}>
              <Text style={styles.buttonText}>Tamam</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  if (modalType === 'caseType') {
    return renderCheckList(
      [...CASE_TYPES.filter(t => t !== 'Fark Etmez'), 'Fark Etmez'],
      caseType,
      toggleCaseType,
      () => setModalType(null),
      'Kasa Tipi',
      'Birden fazla seçebilirsiniz',
    );
  }

  if (modalType === 'fuel') {
    return renderCheckList(
      [...fuelTypes.filter(t => t !== 'Fark Etmez'), 'Fark Etmez'],
      fuel,
      toggleFuel,
      () => setModalType(null),
      'Yakıt Tipi',
      'Birden fazla seçebilirsiniz',
    );
  }

  // Vites modal
  return renderCheckList(
    [...gearTypes.filter(t => t !== 'Fark Etmez'), 'Fark Etmez'],
    gear,
    toggleGear,
    () => setModalType(null),
    'Vites Tipi',
    'Birden fazla seçebilirsiniz',
  );
};

const checkStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemActive: {
    backgroundColor: theme.accentLight,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: {
    borderColor: theme.accent,
    backgroundColor: theme.accent,
  },
  check: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});