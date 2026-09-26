import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FuelRecord } from '../../types';
import FuelHistoryCard from './components/FuelHistoryCard';
import { styles } from './styles';
import { tokens } from '../../config/tokens';

const t = tokens;

type FilterType = 'last5' | '1month' | '6months' | '1year';

interface Props {
  filteredHistory: FuelRecord[];
  historyLength:   number; // filtrelenmemiş toplam kayıt sayısı
  filter:          FilterType;
  setFilter:       (f: FilterType) => void;
  onDelete:        (id: string) => void;
}

const FILTER_LABELS: Record<FilterType, string> = {
  last5:    'Son 5',
  '1month': '1 Ay',
  '6months':'6 Ay',
  '1year':  '1 Yıl',
};

export default function FuelHistoryView({ filteredHistory, historyLength, filter, setFilter, onDelete }: Props) {
  // Hiç yakıt kaydı yoksa filtre çubuğunu da gösterme.
  if (historyLength === 0) {
    return <Text style={styles.emptyText}>Henüz yakıt kaydı bulunmuyor.</Text>;
  }

  const totalCost = filteredHistory
    .reduce((sum, item) => sum + item.pricePerLiter * item.totalLiters, 0)
    .toFixed(2);

  return (
    <>
      <Text style={styles.historyTitle}>GEÇMİŞ KAYITLAR</Text>

      <View style={fh.row}>
        <View style={fh.filters}>
          {(['last5', '1month', '6months', '1year'] as FilterType[]).map(f => (
            <Pressable
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {FILTER_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={fh.totalBox}>
          <Text style={fh.totalLabel}>Toplam</Text>
          <Text style={fh.totalValue}>{totalCost} ₺</Text>
        </View>
      </View>

      {/* Bu filtrede kayıt yoksa filtre çubuğu görünür kalır; kullanıcı başka
          bir filtreye dönebilir (eskiden bu durumda çubuk tamamen kayboluyordu). */}
      {filteredHistory.length === 0 ? (
        <Text style={styles.emptyText}>Bu dönemde kayıt yok.</Text>
      ) : (
        filteredHistory.map(item => (
          <FuelHistoryCard key={item.id} item={item} onDelete={onDelete} />
        ))
      )}
    </>
  );
}

const fh = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: t.spacing.base,
    marginBottom: t.spacing.md,
    gap: t.spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: t.spacing.sm,
    flex: 1,
  },
  totalBox: {
    backgroundColor: t.color.brand.light,
    borderRadius: t.radius.md,
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  totalLabel: {
    ...t.typography.caption,
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  totalValue: {
    ...t.typography.h3,
    color: t.color.brand.primary,
  },
});