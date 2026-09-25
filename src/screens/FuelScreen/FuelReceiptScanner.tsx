import React, { useState } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { tokens } from '../../config/tokens';
import { FuelForm } from '../../hooks/useFuelForm';
import { buildRows, parseFuelReceipt, OcrWord, ReceiptData } from '../../utils/receiptParser';

const t = tokens;

interface Props {
  onDataExtracted: (data: Partial<Pick<FuelForm, 'pricePerLiter' | 'totalLiters' | 'currentKm' | 'station' | 'date'>>) => void;
}

// ML Kit çıktısını kelime + konum listesine çevirir. Eğim açısı kelimenin
// köşe noktalarından hesaplanır (fiş hafif eğik çekilmişse satırlar bozulmasın).
function toWords(result: TextRecognitionResult): OcrWord[] {
  const words: OcrWord[] = [];
  for (const block of result.blocks) {
    for (const line of block.lines) {
      for (const element of line.elements) {
        if (!element.frame) continue;
        const corners = element.cornerPoints ?? line.cornerPoints;
        const angle = corners
          ? Math.atan2(corners[1].y - corners[0].y, corners[1].x - corners[0].x)
          : undefined;
        words.push({
          text:   element.text,
          top:    element.frame.top,
          left:   element.frame.left,
          width:  element.frame.width,
          height: element.frame.height,
          angle,
        });
      }
    }
  }
  return words;
}

// İki farklı yöntemle okur ve birleştirir: (1) kelimeleri konumlarına göre satırlara
// dizerek (bölünmüş bloklara dayanıklı), (2) ML Kit'in kendi satır metinleriyle.
// Aynı alan ikisinde de varsa (1) tercih edilir; eksik kalanlar (2)'den tamamlanır.
function extractFromResult(result: TextRecognitionResult): ReceiptData {
  const byPosition = parseFuelReceipt(buildRows(toWords(result)));
  const byLines = parseFuelReceipt(result.blocks.flatMap(b => b.lines.map(l => l.text)));
  return {
    date:          byPosition.date          ?? byLines.date,
    pricePerLiter: byPosition.pricePerLiter ?? byLines.pricePerLiter,
    totalLiters:   byPosition.totalLiters   ?? byLines.totalLiters,
    totalAmount:   byPosition.totalAmount   ?? byLines.totalAmount,
    currentKm:     byPosition.currentKm     ?? byLines.currentKm,
    station:       byPosition.station       ?? byLines.station,
    fuelType:      byPosition.fuelType      ?? byLines.fuelType,
  };
}

export default function FuelReceiptScanner({ onDataExtracted }: Props) {
  const [scanning, setScanning] = useState(false);

  const handleScan = async (fromCamera: boolean) => {
    // İzin kontrolü
    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Kamera kullanmak için izin vermeniz gerekiyor. Ayarlar > OtoHead > Kamera');
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeriye erişmek için izin vermeniz gerekiyor. Ayarlar > OtoHead > Fotoğraflar');
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
      const extracted = extractFromResult(recognized);

      const hasData = extracted.pricePerLiter || extracted.totalLiters || extracted.totalAmount;
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
        date:          extracted.date,
      });

      const summary = [
        extracted.date          && `Tarih: ${extracted.date}`,
        extracted.totalLiters   && `Litre: ${extracted.totalLiters}`,
        extracted.pricePerLiter && `Litre fiyatı: ${extracted.pricePerLiter} TL`,
        extracted.totalAmount   && `Toplam tutar: ${extracted.totalAmount} TL`,
        extracted.fuelType      && `Yakıt: ${extracted.fuelType}`,
        extracted.station       && `İstasyon: ${extracted.station}`,
        extracted.currentKm     && `Kilometre: ${extracted.currentKm}`,
      ].filter(Boolean);

      const missing = [
        !extracted.date          && 'Tarih',
        !extracted.pricePerLiter && 'Litre fiyatı',
        !extracted.totalLiters   && 'Litre',
      ].filter(Boolean);

      Alert.alert(
        'Fiş Okundu ✓',
        `${summary.join('\n')}${missing.length ? `\n\nOkunamayan: ${missing.join(', ')}` : ''}\n\nLütfen bilgileri kontrol edin.`,
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