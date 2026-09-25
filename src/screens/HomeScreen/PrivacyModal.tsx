import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, ScrollView, StyleSheet, Share, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getClientId } from '../../services/database';
import { PRIVACY_POLICY_URL, CONTACT_EMAIL } from '../../config/legal';
import { tokens } from '../../config/tokens';

const t = tokens;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [clientId, setClientId] = useState('');

  useEffect(() => {
    if (visible) getClientId().then(setClientId).catch(() => setClientId(''));
  }, [visible]);

  const openPolicy = async () => {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch {
      Alert.alert('Açılamadı', `Gizlilik politikası şu adreste yayınlanır:\n${PRIVACY_POLICY_URL}`);
    }
  };

  const shareId = () => {
    if (!clientId) return;
    Share.share({ message: clientId }).catch(() => {});
  };

  const requestDeletion = async () => {
    const subject = encodeURIComponent('OtoHead - Verilerimin silinmesi talebi');
    const body = encodeURIComponent(
      `Cihaz kimliğim: ${clientId}\n\n` +
      'Bu cihaza ait Araç Danışmanlık ve Değerlendirme kayıtlarımın silinmesini talep ediyorum.',
    );
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert(
        'E-posta uygulaması bulunamadı',
        `Silme talebinizi ${CONTACT_EMAIL} adresine, cihaz kimliğinizi belirterek gönderebilirsiniz.`,
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.root, { paddingTop: insets.top + t.spacing.base }]}>
        <View style={s.header}>
          <Text style={s.title}>Gizlilik ve Veriler</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.close}>✕</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + t.spacing['2xl'] }]}>
          <Text style={s.sectionTitle}>Verileriniz nerede?</Text>
          <Text style={s.body}>
            Araçlarınız, bakım ve yakıt kayıtlarınız yalnızca bu telefonda tutulur, sunucuya gönderilmez.
            Fiş fotoğrafları cihazınızda okunur ve hiçbir yere gönderilmez.
          </Text>
          <Text style={s.body}>
            Yalnızca Araç Danışmanlık ve Değerlendirme isteklerinizde yazdığınız bilgiler, rastgele bir
            cihaz kimliğiyle birlikte uzman ekibimize iletilir.
          </Text>

          <Text style={s.sectionTitle}>Cihaz kimliğiniz</Text>
          <View style={s.idBox}>
            <Text style={s.idText} selectable>{clientId || 'Yükleniyor...'}</Text>
          </View>
          <Text style={s.hint}>
            Danışmanlık kayıtlarınız bu kimlikle saklanır. Silme talebinde bu kimliği belirtmeniz gerekir.
          </Text>
          <Pressable style={s.secondaryButton} onPress={shareId} disabled={!clientId}>
            <Text style={s.secondaryText}>Kimliği Paylaş / Kopyala</Text>
          </Pressable>

          <Pressable style={s.primaryButton} onPress={requestDeletion} disabled={!clientId}>
            <Text style={s.primaryText}>Verilerimin Silinmesini İste</Text>
          </Pressable>
          <Text style={s.hint}>
            E-posta uygulamanız cihaz kimliğinizle hazır bir mesaj açar. Danışmanlık kullanmadıysanız
            sunucumuzda size ait veri bulunmaz.
          </Text>

          <Pressable style={s.linkRow} onPress={openPolicy}>
            <Text style={s.linkText}>Gizlilik Politikasının Tamamını Oku</Text>
            <Text style={s.linkArrow}>›</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.color.bg.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: t.spacing.base,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  title: {
    ...t.typography.h3,
    color: t.color.text.primary,
  },
  close: {
    fontSize: 20,
    color: t.color.text.muted,
  },
  content: {
    padding: t.spacing.base,
  },
  sectionTitle: {
    ...t.typography.label,
    color: t.color.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: t.spacing.lg,
    marginBottom: t.spacing.sm,
  },
  body: {
    ...t.typography.bodySm,
    color: t.color.text.primary,
    lineHeight: 21,
    marginBottom: t.spacing.sm,
  },
  hint: {
    ...t.typography.caption,
    color: t.color.text.muted,
    lineHeight: 18,
    marginTop: t.spacing.sm,
  },
  idBox: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.default,
    padding: t.spacing.md,
  },
  idText: {
    ...t.typography.bodySm,
    color: t.color.text.primary,
    fontVariant: ['tabular-nums'],
  },
  primaryButton: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    paddingVertical: t.spacing.md,
    alignItems: 'center',
    marginTop: t.spacing.lg,
  },
  primaryText: {
    ...t.typography.bodySm,
    color: t.color.text.inverse,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.brand.primary,
    paddingVertical: t.spacing.md,
    alignItems: 'center',
    marginTop: t.spacing.md,
  },
  secondaryText: {
    ...t.typography.bodySm,
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: t.spacing.xl,
    paddingVertical: t.spacing.md,
    borderTopWidth: 1,
    borderTopColor: t.color.border.divider,
  },
  linkText: {
    ...t.typography.bodySm,
    color: t.color.brand.primary,
  },
  linkArrow: {
    fontSize: 20,
    color: t.color.text.muted,
  },
});
