import { tokens } from './tokens';

export const theme = {
  // Backgrounds
  bg:          tokens.color.bg.base,
  card:        tokens.color.bg.surface,
  cardAlt:     tokens.color.bg.muted,
  cardHover:   tokens.color.bg.muted,

  // Borders
  border:      tokens.color.border.default,
  borderLight: tokens.color.border.divider,

  // Brand
  accent:      tokens.color.brand.primary,
  accentMid:   tokens.color.brand.secondary,
  accentLight: tokens.color.brand.light,
  accentGlow:  'rgba(15, 45, 82, 0.12)',

  // Text
  textPrimary:   tokens.color.text.primary,
  textSecondary: tokens.color.text.secondary,
  textMuted:     tokens.color.text.muted,

  // Semantic
  success:    tokens.color.success.default,
  successBg:  tokens.color.success.bg,
  warning:    tokens.color.warning.default,
  warningBg:  tokens.color.warning.bg,
  danger:     tokens.color.danger.default,
  dangerBg:   tokens.color.danger.bg,

  overlay: 'rgba(13, 21, 32, 0.55)',
} as const;