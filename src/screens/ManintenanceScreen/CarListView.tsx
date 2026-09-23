import React from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Alert, StyleSheet,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car } from '../../types';
import { CarCard } from './components/CarCard';
import { styles } from './styles';
import { tokens } from '../../config/tokens';

const t = tokens;

interface Props {
  cars: Car[];
  showCarForm: boolean;
  setShowCarForm: (val: boolean) => void;
  brand: string;
  model: string;
  year: string;
  nickname: string;
  setNickname: (val: string) => void;
  setModalType: (val: 'brand' | 'model' | 'year' | 'recordType' | null) => void;
  handleAddCar: () => void;
  handleDeleteCar: (id: string) => void;
  setSelectedCar: (car: Car) => void;
}

export const CarListView = ({
  cars, showCarForm, setShowCarForm,
  brand, model, year, nickname,
  setNickname, setModalType,
  handleAddCar, handleDeleteCar, setSelectedCar,
}: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.mainHeader, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.mainHeaderText}>Araç Yönetimi</Text>
        <Text style={styles.mainHeaderSub}>
          Bakım, muayene, sigorta ve daha fazlasını takip edin
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {cars.length === 0 && !showCarForm && (
          <Text style={styles.empty}>Henüz araç eklenmedi.</Text>
        )}

        {cars.map(car => (
          <CarCard
            key={car.id}
            car={car}
            onDelete={handleDeleteCar}
            onPress={setSelectedCar}
          />
        ))}

        {showCarForm && (
          <View style={styles.form}>
            <Pressable
              style={styles.selector}
              onPress={() => setModalType('brand')}
            >
              <Text style={brand ? styles.selectorText : styles.selectorPlaceholder}>
                {brand || 'Marka seçin'}
              </Text>
              <Text style={styles.selectorArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.selector}
              onPress={() => brand
                ? setModalType('model')
                : Alert.alert('Uyarı', 'Önce marka seçin.')
              }
            >
              <Text style={model ? styles.selectorText : styles.selectorPlaceholder}>
                {model || 'Model seçin'}
              </Text>
              <Text style={styles.selectorArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.selector}
              onPress={() => setModalType('year')}
            >
              <Text style={year ? styles.selectorText : styles.selectorPlaceholder}>
                {year || 'Yıl seçin'}
              </Text>
              <Text style={styles.selectorArrow}>›</Text>
            </Pressable>

            <TextInput
              style={styles.input}
              placeholder="Araç adı veya plaka (isteğe bağlı)"
              placeholderTextColor={t.color.text.muted}
              value={nickname}
              onChangeText={setNickname}
              returnKeyType="done"
            />

            <Pressable style={styles.button} onPress={handleAddCar}>
              <Text style={styles.buttonText}>Kaydet</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setShowCarForm(false)}>
              <Text style={styles.cancelText}>İptal</Text>
            </Pressable>
          </View>
        )}

        {!showCarForm && (
          <Pressable style={styles.button} onPress={() => setShowCarForm(true)}>
            <Text style={styles.buttonText}>+ Araç Ekle</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};