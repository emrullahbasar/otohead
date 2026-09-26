import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { MaintenanceRecord } from '../../../types';
import { styles } from '../styles';
import { formatWholeNumberDisplay, formatAmountDisplay } from '../../../utils/numberFormat';

const formatKm = formatWholeNumberDisplay;

interface Props {
  record: MaintenanceRecord;
  onDelete: (id: string) => void;
  onPress: (record: MaintenanceRecord) => void;
  // Hedef km - aracın son bilinen km'si. Yalnızca o türün en son kaydı için verilir.
  remainingKm?: number;
}

export const RecordCard = ({ record, onDelete, onPress, remainingKm }: Props) => {
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
        {remainingKm !== undefined
          ? remainingKm <= 0
            ? <Text style={[styles.recordDetail, styles.kmDue]}>🚨 Hedef km'ye ulaşıldı / geçildi</Text>
            : <Text style={[styles.recordDetail, remainingKm <= 2000 && styles.kmSoon]}>
                🔔 Hedefe kalan: {remainingKm.toLocaleString('tr-TR')} km
              </Text>
          : null
        }
        {record.price
          ? <Text style={styles.recordDetail}>💰 {formatAmountDisplay(record.price)} ₺</Text>
          : null
        }
      </Pressable>
    </Swipeable>
  );
};