export const tokens = {
  color: {
    bg: {
      base:     '#F7F8FA',
      surface:  '#FFFFFF',
      elevated: '#FFFFFF',
      muted:    '#F0F2F5',
    },
    brand: {
      primary:   '#0F2D52',
      secondary: '#1A4A8A',
      light:     '#E8EEF7',
      pale:      '#F0F4FA',
    },
    text: {
      primary:   '#0D1520',
      secondary: '#4A5568',
      muted:     '#8A9AB0',
      inverse:   '#FFFFFF',
      brand:     '#0F2D52',
    },
    border: {
      default:  '#E2E8F0',
      strong:   '#CBD5E0',
      focus:    '#0F2D52',
      divider:  '#EDF2F7',
    },
    success: { default: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    warning: { default: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    danger:  { default: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
    info:    { default: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  },

  typography: {
    display: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.5 },
    h1:      { fontSize: 22, fontWeight: '700' as const, lineHeight: 30, letterSpacing: -0.3 },
    h2:      { fontSize: 18, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
    h3:      { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0   },
    bodyLg:  { fontSize: 16, fontWeight: '400' as const, lineHeight: 26, letterSpacing: 0   },
    body:    { fontSize: 15, fontWeight: '400' as const, lineHeight: 24, letterSpacing: 0   },
    bodySm:  { fontSize: 14, fontWeight: '400' as const, lineHeight: 22, letterSpacing: 0   },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18, letterSpacing: 0.1 },
    label:   { fontSize: 12, fontWeight: '600' as const, lineHeight: 16, letterSpacing: 0.4 },
    button:  { fontSize: 15, fontWeight: '600' as const, lineHeight: 20, letterSpacing: 0.2 },
    overline:{ fontSize: 11, fontWeight: '600' as const, lineHeight: 14, letterSpacing: 1.0 },
  },

  spacing: {
    xs:   4,
    sm:   8,
    md:   12,
    base: 16,
    lg:   20,
    xl:   24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
  },

  radius: {
    sm:   6,
    md:   10,
    lg:   14,
    xl:   18,
    full: 999,
  },

  elevation: {
    none: {},
    sm: {
      shadowColor: '#0D1520',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#0D1520',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
} as const;