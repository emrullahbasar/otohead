import React from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView,
  Platform, KeyboardAvoidingView,
} from 'react-native';
import { useFuel } from '../../hooks/useFuel';
import FuelAnalysisView from './FuelAnalysisView';
import FuelFormView from './FuelFormView';
import FuelHistoryView from './FuelHistoryView';
import { styles } from './styles';
import { tokens } from '../../config/tokens';
import { ScreenHeader } from '../../components/ScreenHeader';

const t = tokens;

export default function FuelScreen() {
  const {
    cars, selectedCar, selectedCarId, handleSelectCar, loadingCars,
    record, history, filteredHistory,
    filter, setFilter, analysis, pendingAnalysis,
    updateField, handleReceiptScanned,
    handleCalculateAndSave, handleDeleteRecord,
  } = useFuel();

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        // iOS numeric/decimal klavyede Bitti tuşu yok; kullanıcı klavyeyi kaydırarak kapatabilsin.
        keyboardDismissMode="on-drag"
      >
        <ScreenHeader
          icon="⛽"
          title="Yakıt Takip"
          subtitle="Tüketim ve maliyet analizi"
        />

        {loadingCars ? (
          <View style={carStyles.loadingBox}>
            <ActivityIndicator color={t.color.brand.primary} />
          </View>
        ) : cars.length === 0 ? (
          <View style={carStyles.emptyBox}>
            <Text style={carStyles.emptyText}>
              Yakıt takibi için önce Araç Yönetimi'nden araç ekleyin.
            </Text>
          </View>
        ) : (
          <View style={carStyles.wrapper}>
            <Text style={carStyles.label}>ARAÇ SEÇİN</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={carStyles.row}
            >
              {cars.map(car => {
                const isSelected = car.id === selectedCarId;
                const name = car.nickname || `${car.brand} ${car.model}`;
                return (
                  <Pressable
                    key={car.id}
                    style={[carStyles.chip, isSelected && carStyles.chipActive]}
                    onPress={() => handleSelectCar(car.id)}
                  >
                    <Text style={[carStyles.chipName, isSelected && carStyles.chipNameActive]}>
                      {name}
                    </Text>
                    <Text style={[carStyles.chipYear, isSelected && carStyles.chipYearActive]}>
                      {car.year}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {selectedCarId && (
          <>
            <FuelAnalysisView
              analysis={analysis}
              pendingAnalysis={pendingAnalysis}
              historyLength={history.length}
            />
            <FuelFormView
              record={record}
              updateField={updateField}
              onSave={handleCalculateAndSave}
              onReceiptScanned={handleReceiptScanned}
              hasHistory={history.length > 0}
            />
            <FuelHistoryView
              filteredHistory={filteredHistory}
              historyLength={history.length}
              filter={filter}
              setFilter={setFilter}
              onDelete={handleDeleteRecord}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const carStyles = StyleSheet.create({
  loadingBox: {
    alignItems: 'center',
    paddingVertical: t.spacing.lg,
  },
  emptyBox: {
    margin: t.spacing.base,
    padding: t.spacing.lg,
    backgroundColor: t.color.warning.bg,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.warning.border,
  },
  emptyText: {
    ...t.typography.bodySm,
    color: t.color.warning.default,
    textAlign: 'center',
    lineHeight: 20,
  },
  wrapper: {
    marginHorizontal: t.spacing.base,
    marginTop: t.spacing.base,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  label: {
    ...t.typography.label,
    color: t.color.text.muted,
    letterSpacing: 0.6,
    marginBottom: t.spacing.md,
  },
  row: {
    gap: t.spacing.sm,
  },
  chip: {
    paddingHorizontal: t.spacing.md,
    paddingVertical: t.spacing.sm,
    borderRadius: t.radius.full,
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.base,
    alignItems: 'center',
    minWidth: 80,
  },
  chipActive: {
    backgroundColor: t.color.brand.primary,
    borderColor: t.color.brand.primary,
  },
  chipName: {
    ...t.typography.bodySm,
    color: t.color.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipNameActive: {
    color: '#FFFFFF',
  },
  chipYear: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'center',
    marginTop: 1,
  },
  chipYearActive: {
    color: 'rgba(255,255,255,0.7)',
  },
});