import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaintenanceRecord } from '../../../types';
import { styles } from '../styles';

const formatKm = (km: string): string => {
  const num = parseInt(km, 10);
  if (isNaN(num)) return km;
  return num.toLocaleString('tr-TR');
};

interface Props {
  record: MaintenanceRecord;
  onDelete: (id: string) => void;
  onPress: (record: MaintenanceRecord) => void;
}

export const RecordCard = ({ record, onDelete, onPress }: Props) => {
  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable style={styles.deleteAction} onPress={() => onDelete(record.id)}>
          <Text style={styles.deleteActionText}>Sil</Text>
        </Pressable>
      )}
    >
      <Pressable
        style={({ pressed }) => [styles.recordCard, pressed && styles.recordCardPressed]}
        onPress={() => onPress(record)}
      >
        <View style={styles.recordCardHeader}>
          <Text style={styles.recordType}>{record.type}</Text>
          <Text style={styles.recordCardArrow}>›</Text>
        </View>
        <Text style={styles.recordDetail}>📅 {record.date}</Text>
        <Text style={styles.recordDetail}>🚗 {formatKm(record.km)} km</Text>
        {record.nextDate
          ? <Text style={styles.recordDetail}>📆 Sonraki: {record.nextDate}{record.nextKm ? ` / ${formatKm(record.nextKm)} km` : ''}</Text>
          : null
        }
        {record.price
          ? <Text style={styles.recordDetail}>💰 {formatKm(record.price)} ₺</Text>
          : null
        }
      </Pressable>
    </Swipeable>
  );
};