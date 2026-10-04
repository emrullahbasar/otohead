import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Car } from '../../../types';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';

const t = tokens;

interface Props {
  car: Car;
  onDelete: (id: string) => void;
  onPress: (car: Car) => void;
}

export const CarCard = ({ car, onDelete, onPress }: Props) => {
  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable style={styles.deleteAction} onPress={() => onDelete(car.id)}>
          <Text style={styles.deleteActionText}>Sil</Text>
        </Pressable>
      )}
    >
      <Pressable
        style={({ pressed }) => [styles.carCard, pressed && styles.carCardPressed]}
        onPress={() => onPress(car)}
      >
        <View style={styles.carCardLeft}>
          <Text style={styles.carNickname}>
            {car.nickname || `${car.brand} ${car.model}`}
          </Text>
          {/* Takma ad yoksa üst satır zaten "Marka Model" gösteriyor — aynısını
              ikinci kez yazmayalım. */}
          {car.nickname ? (
            <Text style={styles.carTitle}>
              {car.brand} {car.model}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <View style={styles.carYear}>
              <Text style={styles.carYearText}>{car.year}</Text>
            </View>
            <View style={[styles.carYear, { backgroundColor: t.color.bg.muted }]}>
              <Text style={[styles.carYearText, { color: t.color.text.muted }]}>
                {car.records.length} bakım kaydı
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.carArrow}>›</Text>
      </Pressable>
    </Swipeable>
  );
};