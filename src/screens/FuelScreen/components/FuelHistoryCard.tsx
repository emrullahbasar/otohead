import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { FuelRecord } from '../../../types';
import { styles } from '../styles';

interface Props {
  item:     FuelRecord;
  onDelete: (id: string) => void;
}

export default function FuelHistoryCard({ item, onDelete }: Props) {
  const totalCost  = (item.pricePerLiter * item.totalLiters).toFixed(2);
  const kmDiff     = item.currentKm - item.previousKm;

  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable style={styles.deleteAction} onPress={() => onDelete(item.id)}>
          <Text style={styles.deleteActionText}>Sil</Text>
        </Pressable>
      )}
    >
      <View style={[styles.historyCard, item.isFull && styles.historyCardFull]}>
        {/* Üst satır — tarih + badge */}
        <View style={styles.historyHeader}>
          <Text style={styles.dateText}>📅 {item.date}</Text>
          <View style={[styles.badge, item.isFull ? styles.badgeFull : styles.badgePartial]}>
            <Text style={styles.badgeText}>{item.isFull ? 'Full' : 'Parça'}</Text>
          </View>
        </View>

        {/* Alt satır — sol: detay, sağ: harcama */}
        <View style={styles.historyBody}>
          <View>
            <Text style={styles.detailText}>
              ⛽ {item.totalLiters} lt × {item.pricePerLiter} ₺
            </Text>
            <Text style={styles.subDetailText}>
              🚗 {item.currentKm.toLocaleString('tr-TR')} km
            </Text>
            {item.station
              ? <Text style={styles.subDetailText}>📍 {item.station}</Text>
              : null
            }
            {kmDiff > 0
              ? <Text style={styles.subDetailText}>📏 +{kmDiff.toLocaleString('tr-TR')} km yapıldı</Text>
              : null
            }
          </View>

          {/* Harcama — sağ taraf */}
          <View style={styles.kmDiffBox}>
            <Text style={styles.kmDiffValue}>{totalCost}</Text>
            <Text style={styles.kmDiffLabel}>₺</Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );
}