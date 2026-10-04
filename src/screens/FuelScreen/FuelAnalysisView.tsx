import React from 'react';
import { View, Text } from 'react-native';
import { FuelAnalysis } from '../../types';
import { styles } from './styles';

interface Props {
  analysis: FuelAnalysis | null;
  pendingAnalysis: boolean;
  historyLength: number;
}

export default function FuelAnalysisView({ analysis, pendingAnalysis, historyLength }: Props) {
  if (analysis && !pendingAnalysis) {
    return (
      <View style={styles.analysisCard}>
        <Text style={styles.analysisTitle}>Ortalama Tüketim Analizi</Text>
        <Text style={styles.analysisSubTitle}>Doğru sonucu sadece son iki full dolum arası verir</Text>
        <View style={styles.analysisGrid}>
          <View style={styles.analysisItem}>
            <Text style={styles.analysisValue}>{analysis.consumptionPer100Km}</Text>
            <Text style={styles.analysisLabel}>lt/100km</Text>
          </View>
          <View style={styles.analysisDivider} />
          <View style={styles.analysisItem}>
            <Text style={styles.analysisValue}>{analysis.costPerKm} ₺</Text>
            <Text style={styles.analysisLabel}>km başı maliyet</Text>
          </View>
          <View style={styles.analysisDivider} />
          <View style={styles.analysisItem}>
            <Text style={styles.analysisValue}>{analysis.totalDistance}</Text>
            <Text style={styles.analysisLabel}>km yol</Text>
          </View>
        </View>
        <Text style={styles.analysisCost}>
          Son Harcama: {analysis.totalCost.toFixed(2)} ₺
        </Text>
      </View>
    );
  }

  if (pendingAnalysis && historyLength > 0) {
    return (
      <View style={styles.pendingCard}>
        <Text style={styles.pendingIcon}>⏳</Text>
        <Text style={styles.pendingText}>Verileriniz toplanıyor...</Text>
        <Text style={styles.pendingSubText}>
          Kesin tüketim sonucunuz bir sonraki full dolumda görünecektir.
        </Text>
      </View>
    );
  }

  return null;
}