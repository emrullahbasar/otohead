import React, { useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { tokens } from '../../config/tokens';

const t = tokens;

interface ExtractedData {
  pricePerLiter?: string;
  totalLiters?: string;
  currentKm?: string;
}

interface Props {
  onDataExtracted: (data: Partial<{
    pricePerLiter: string;
    totalLiters: string;
    currentKm: string;
    station: string;
  }>) => void;
}

const PATTERNS = {
  pricePerLiter: [
    /birim\s*fiyat[:\s]*([0-9]+[.,][0-9]+)/i,
    /lt\s*fiyat[:\s]*([0-9]+[.,][0-9]+)/i,
    /litre\s*fiyat[:\s]*([0-9]+[.,][0-9]+)/i,
    /unit\s*price[:\s]*([0-9]+[.,][0-9]+)/i,
    /fiyat[:\s]*([0-9]{2,3}[.,][0-9]{2,3})/i,
    /([0-9]{2,3}[.,][0-9]{2,3})\s*(?:tl|₺)?\s*\/?\s*(?:lt|litre|l\b)/i,
  ],
  totalLiters: [
    /(?:toplam\s*)?miktar[:\s]*([0-9]+[.,][0-9]+)\s*(?:lt|litre|l\b)/i,
    /([0-9]+[.,][0-9]+)\s*(?:lt|litre)\b/i,
    /alınan\s*yakıt[:\s]*([0-9]+[.,][0-9]+)/i,
    /tutar\s*lt[:\s]*([0-9]+[.,][0-9]+)/i,
    /lt[:\s]*([0-9]+[.,][0-9]{2,3})/i,
  ],
  km: [
    /km[:\s]*([0-9]+(?:[.,][0-9]+)?)/i,
    /kilometre[:\s]*([0-9]+)/i,
    /sayaç[:\s]*([0-9]+)/i,
    /odometer[:\s]*([0-9]+)/i,
    /([0-9]{4,6})\s*km/i,
  ],
  station: [
    /^(shell|bp|opet|total|türkiye\s*petrolleri|tp|alpet|aytemiz|go\s*petrol|eko|petrol\s*ofisi|po\b)/im,
  ],
};

function tryMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1].replace(',', '.');
    }
  }
  return undefined;
}

function extractFromText(text: string): ExtractedData & { station?: string } {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/[İ]/g, 'I')
    .replace(/[ı]/g, 'i');
  return {
    pricePerLiter: tryMatch(normalized, PATTERNS.pricePerLiter),
    totalLiters:   tryMatch(normalized, PATTERNS.totalLiters),
    currentKm:     tryMatch(normalized, PATTERNS.km),
    station:       tryMatch(normalized, PATTERNS.station),
  };
}

export default function FuelReceiptScanner({ onDataExtracted }: Props) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async (fromCamera: boolean) => {
    // İzin kontrolü
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor. Ayarlar > ArabamCepte > Kamera');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor. Ayarlar > ArabamCepte > Fotoğraflar');
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: 'images' as any,
      quality: 1,
      allowsEditing: !fromCamera,
    };

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled) return;

    setScanning(true);
    try {
      const uri = result.assets[0].uri;
      const recognized = await TextRecognition.recognize(uri);
      const rawText = recognized.blocks.map(b => b.text).join('\n');
      const extracted = extractFromText(rawText);

      const hasData = extracted.pricePerLiter || extracted.totalLiters || extracted.currentKm;
      if (!hasData) {
        Alert.alert(
          'Fiş Okunamadı',
          'Fişi daha iyi ışıkta, düz bir zemine koyarak tekrar deneyin.',
          [{ text: 'Tamam' }],
        );
        return;
      }

      onDataExtracted({
        pricePerLiter: extracted.pricePerLiter,
        totalLiters:   extracted.totalLiters,
        currentKm:     extracted.currentKm,
        station:       extracted.station,
      });

      const filled = [
        extracted.pricePerLiter && 'Litre Fiyatı',
        extracted.totalLiters   && 'Litre Miktarı',
        extracted.currentKm     && 'Kilometre',
        extracted.station       && 'İstasyon',
      ].filter(Boolean);

      Alert.alert(
        'Fiş Okundu ✓',
        `Otomatik doldurulan alanlar:\n${filled.join(', ')}\n\nLütfen bilgileri kontrol edin.`,
        [{ text: 'Tamam' }],
      );
    } catch {
      Alert.alert('Hata', 'Fiş taranırken bir sorun oluştu.');
    } finally {
      setScanning(false);
    }
  };

  const handlePress = () => {
    Alert.alert(
      'Fiş Tara',
      'Fişi nasıl eklemek istersiniz?',
      [
        { text: 'Kamera', onPress: () => handleScan(true) },
        { text: 'Galeriden Seç', onPress: () => handleScan(false) },
        { text: 'İptal', style: 'cancel' },
      ],
    );
  };

  return (
    <Pressable
      style={({ pressed }) => [sc.banner, pressed && sc.bannerPressed]}
      onPress={handlePress}
      disabled={scanning}
    >
      {scanning ? (
        <View style={sc.row}>
          <ActivityIndicator color={t.color.bg.surface} size="small" />
          <Text style={[sc.bannerTitle, { marginLeft: t.spacing.sm }]}>Fiş taranıyor...</Text>
        </View>
      ) : (
        <View style={sc.row}>
          <View style={sc.iconWrap}>
            <Text style={sc.icon}>📷</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={sc.bannerTitle}>Fişten Otomatik Doldur</Text>
            <Text style={sc.bannerSub}>Fotoğraf çek veya galeriden seç — alanlar otomatik dolar</Text>
          </View>
          <Text style={sc.arrow}>›</Text>
        </View>
      )}
    </Pressable>
  );
}

const sc = StyleSheet.create({
  banner: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    marginBottom: t.spacing.base,
  },
  bannerPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: t.radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  bannerTitle: {
    ...t.typography.h3,
    color: t.color.text.inverse,
  },
  bannerSub: {
    ...t.typography.caption,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  arrow: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.6)',
  },
});