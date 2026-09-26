import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { styles } from '../styles';
import { tokens } from '../../../config/tokens';

const t = tokens;

// Gerçek satın alma altyapısı (App Store/Google Play IAP + makbuz doğrulama)
// henüz kurulmadı — bu yalnızca kilit ekranının kendisi. "Premium'a Yükselt"
// şimdilik bilgilendirme gösterir; IAP kurulunca burada gerçek satın alma
// akışı başlatılacak.
export function PremiumGate() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing['2xl'] }}>
      <Text style={{ fontSize: 56, marginBottom: t.spacing.md }}>🔒</Text>
      <Text style={[styles.header, { textAlign: 'center' }]}>Bu özellik Premium'da</Text>
      <Text style={[styles.headerSub, { textAlign: 'center', marginTop: t.spacing.sm, lineHeight: 22 }]}>
        Araç Değerlendirme, uzman ekibimizin ilanı tek tek incelediği premium bir hizmettir.
      </Text>
      <Pressable
        style={[styles.button, { marginTop: t.spacing.xl }]}
        onPress={() => Alert.alert('Çok Yakında', 'Premium satın alma yakında eklenecek.')}
      >
        <Text style={styles.buttonText}>Premium'a Yükselt</Text>
      </Pressable>
    </View>
  );
}
