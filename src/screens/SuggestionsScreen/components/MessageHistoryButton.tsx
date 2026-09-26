import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { tokens } from '../../../config/tokens';

const t = tokens;

interface Props {
  onPress: () => void;
}

// Instagram/Messenger'daki gibi ekranın sağ üstünde sabit duran, geçmiş
// konuşmaya götüren bir "mesajlar" düğmesi.
export function MessageHistoryButton({ onPress }: Props) {
  return (
    <Pressable style={s.button} onPress={onPress} hitSlop={8}>
      <Text style={s.icon}>💬</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  button: {
    position: 'absolute',
    top: t.spacing.md,
    right: t.spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
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
  icon: {
    fontSize: 20,
  },
});
