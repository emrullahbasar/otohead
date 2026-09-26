import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '../config/tokens';

const t = tokens;

interface Props {
  icon:     string;
  title:    string;
  subtitle: string;
}

// Ana sekmelerin (Ana Sayfa, Yakıt Takip, Araç Yönetimi, Danışmanlık) ortak
// başlığı — hepsi aynı tasarımı kullansın diye tek yerde tutulur. Marka
// rengiyle boyanmış başlık + küçük ikon + altında ince bir vurgu çizgisi,
// eski sade siyah-beyaz başlıklara göre biraz daha canlı ama hâlâ sade.
export function ScreenHeader({ icon, title, subtitle }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + 20 }]}>
      <View style={s.titleRow}>
        <Text style={s.icon}>{icon}</Text>
        <Text style={s.title}>{title}</Text>
      </View>
      <Text style={s.subtitle}>{subtitle}</Text>
      <View style={s.accent} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: t.color.bg.surface,
    paddingHorizontal: t.spacing.base,
    paddingBottom: t.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    ...t.typography.h1,
    color: t.color.brand.primary,
  },
  subtitle: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
    marginTop: 4,
  },
  accent: {
    height: 3,
    width: 40,
    borderRadius: 2,
    backgroundColor: t.color.brand.primary,
    marginTop: t.spacing.md,
  },
});
