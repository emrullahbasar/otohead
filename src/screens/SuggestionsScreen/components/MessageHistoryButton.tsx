import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { tokens } from '../../../config/tokens';

const t = tokens;

interface Props {
  onPress: () => void;
  unread?: boolean;
  // Form uzun bir ScrollView olduğunda sabit (absolute) buton, kaydırınca
  // altındaki alanların (ör. "Kullanım amacı" kutusu) üzerine biniyordu.
  // inline=true verildiğinde normal akışta (kaydırılınca içerikle birlikte
  // kayan) bir düğme olarak render edilir — sabit/floating hiç kullanılmaz.
  inline?: boolean;
}

// Instagram/Messenger'daki gibi sağ üstte duran, geçmiş konuşmaya götüren bir
// "mesajlar" düğmesi. Uzmandan henüz görülmemiş bir yanıt varsa köşesinde
// kırmızı bir nokta belirir, kutu açılınca söner.
export function MessageHistoryButton({ onPress, unread, inline }: Props) {
  return (
    <Pressable style={inline ? s.buttonInline : s.button} onPress={onPress} hitSlop={8}>
      {unread && <View style={s.badge} />}
      <Text style={s.icon}>💬</Text>
      <Text style={s.label} numberOfLines={1}>Mesajlar</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    position: 'absolute',
    top: t.spacing.md,
    right: t.spacing.base,
    width: 104,
    paddingVertical: t.spacing.sm,
    borderRadius: 18,
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonInline: {
    width: 104,
    paddingVertical: t.spacing.sm,
    borderRadius: 18,
    backgroundColor: t.color.bg.surface,
    borderWidth: 1,
    borderColor: t.color.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: t.color.danger.default,
    borderWidth: 2,
    borderColor: t.color.bg.surface,
    zIndex: 11,
  },
  icon: {
    fontSize: 30,
  },
  label: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: 2,
  },
});
