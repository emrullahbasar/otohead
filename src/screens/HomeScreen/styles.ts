import { StyleSheet } from 'react-native';
import { tokens } from '../../config/tokens';

export const t = tokens;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: t.color.bg.base,
  },
  content: {
    flexGrow: 1,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    gap: t.spacing.md,
    paddingHorizontal: t.spacing.base,
    paddingVertical: t.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  statCardPressed: {
    backgroundColor: t.color.bg.muted,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: t.spacing.sm,
  },
  statNumber: {
    ...t.typography.h1,
    color: t.color.brand.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'center',
  },

  // ── Section Header ──
  sectionHeader: {
    paddingHorizontal: t.spacing.base,
    paddingTop: t.spacing.sm,
    paddingBottom: t.spacing.md,
  },
  sectionTitle: {
    ...t.typography.overline,
    color: t.color.text.muted,
  },

  // ── Menu List ──
  menuList: {
    marginHorizontal: t.spacing.base,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.default,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: t.spacing.base,
    paddingHorizontal: t.spacing.base,
    gap: t.spacing.md,
    backgroundColor: t.color.bg.surface,
  },
  menuItemPressed: {
    backgroundColor: t.color.bg.muted,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: t.radius.md,
    backgroundColor: t.color.brand.pale,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  menuText: {
    flex: 1,
    gap: 2,
  },
  menuTitle: {
    ...t.typography.h3,
    color: t.color.text.primary,
  },
  menuSub: {
    ...t.typography.caption,
    color: t.color.text.muted,
  },
  menuArrow: {
    fontSize: 20,
    color: t.color.text.muted,
    marginTop: -2,
  },

  // ── Footer ──
  footer: {
    paddingTop: t.spacing['2xl'],
    alignItems: 'center',
  },
  footerText: {
    ...t.typography.caption,
    // Eskiden border rengiyle (#E2E8F0) yazılıyordu — kontrastı 1,16:1, beyaz
    // zeminde fiilen görünmüyordu ("Gizlilik ve Veriler" bağlantısı dahil).
    color: t.color.text.muted,
  },
});

export const sk = StyleSheet.create({
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: t.color.bg.muted,
    marginBottom: t.spacing.sm,
  },
  lineWide: {
    width: 40,
    height: 20,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.bg.muted,
    marginBottom: 4,
  },
  lineNarrow: {
    width: 52,
    height: 12,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.bg.muted,
  },
});