import { StyleSheet } from 'react-native';
import { tokens } from '../../config/tokens';

const t = tokens;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: t.color.bg.base,
  },
  scrollContainer: {
    paddingBottom: t.spacing['3xl'],
  },

  // Analysis Card
  analysisCard: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    margin: t.spacing.base,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  analysisTitle: {
    ...t.typography.h3,
    color: t.color.text.primary,
    textAlign: 'center',
  },
  analysisSubTitle: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: t.spacing.lg,
  },
  analysisGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  analysisDivider: {
    width: 1,
    height: 36,
    backgroundColor: t.color.border.divider,
  },
  analysisItem: {
    alignItems: 'center',
    gap: 4,
  },
  analysisValue: {
    ...t.typography.h2,
    color: t.color.brand.primary,
  },
  analysisLabel: {
    ...t.typography.caption,
    color: t.color.text.muted,
    textAlign: 'center',
  },
  analysisCost: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    textAlign: 'center',
    marginTop: t.spacing.base,
    borderTopWidth: 1,
    borderTopColor: t.color.border.divider,
    paddingTop: t.spacing.md,
  },

  // Pending Card
  pendingCard: {
    backgroundColor: t.color.warning.bg,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    margin: t.spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.color.warning.border,
  },
  pendingIcon: {
    fontSize: 28,
    marginBottom: t.spacing.sm,
  },
  pendingText: {
    ...t.typography.h3,
    color: t.color.text.primary,
    marginBottom: 4,
  },
  pendingSubText: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form Card
  formCard: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.lg,
    margin: t.spacing.base,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  sectionTitle: {
    ...t.typography.h3,
    color: t.color.text.primary,
    marginBottom: t.spacing.base,
  },
  label: {
    ...t.typography.label,
    color: t.color.text.muted,
    marginBottom: t.spacing.xs,
    marginTop: t.spacing.md,
    // textTransform:'uppercase' KALDIRILDI — RN'in yerel-duyarsız büyütmesi
    // Türkçe "i"yi "I" yapıyordu ("İSTASYON" değil "ISTASYON"). Metinler artık
    // zaten büyük harfle ve doğru Türkçe karakterle yazılıyor.
    letterSpacing: 0.6,
  },

  // Input
  input: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    fontSize: 15,
    color: t.color.text.primary,
    backgroundColor: t.color.bg.base,
    marginBottom: 4,
  },
  autoFillInput: {
    borderColor: t.color.brand.secondary,
    backgroundColor: t.color.brand.pale,
  },
  firstRecordNote: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: -t.spacing.xs,
    marginBottom: t.spacing.sm,
  },

  // Full Toggle
  fullToggle: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginTop: t.spacing.md,
    alignItems: 'center',
    backgroundColor: t.color.bg.base,
  },
  fullToggleActive: {
    borderColor: t.color.brand.primary,
    backgroundColor: t.color.brand.pale,
  },
  fullToggleText: {
    ...t.typography.body,
    color: t.color.text.muted,
  },
  fullToggleTextActive: {
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  partialNote: {
    ...t.typography.caption,
    color: t.color.warning.default,
    textAlign: 'center',
    marginTop: t.spacing.sm,
  },

  // Button
  saveButton: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
    marginTop: t.spacing.lg,
  },
  saveButtonText: {
    ...t.typography.button,
    color: '#FFFFFF',
  },

  // Filter
  filterRow: {
    flexDirection: 'row',
    gap: t.spacing.sm,
    marginHorizontal: t.spacing.base,
    marginBottom: t.spacing.md,
  },
  filterButton: {
    paddingVertical: t.spacing.xs + 2,
    paddingHorizontal: t.spacing.md,
    borderRadius: t.radius.full,
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.surface,
  },
  filterButtonActive: {
    backgroundColor: t.color.brand.primary,
    borderColor: t.color.brand.primary,
  },
  filterText: {
    ...t.typography.label,
    color: t.color.text.secondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },

  // Delete
  deleteAction: {
    backgroundColor: t.color.danger.default,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    height: '85%',
    marginVertical: t.spacing.xs,
    borderRadius: t.radius.md,
  },
  deleteActionText: {
    ...t.typography.label,
    color: '#FFFFFF',
  },

  // History
  historyTitle: {
    ...t.typography.overline,
    color: t.color.text.muted,
    marginHorizontal: t.spacing.base,
    marginBottom: t.spacing.sm,
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: t.color.text.muted,
    marginTop: t.spacing['2xl'],
    ...t.typography.bodySm,
  },
  historyCard: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    marginBottom: t.spacing.sm,
    marginHorizontal: t.spacing.base,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  historyCardFull: {
    borderLeftWidth: 3,
    borderLeftColor: t.color.brand.primary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.sm,
  },
  dateText: {
    ...t.typography.label,
    color: t.color.text.primary,
  },
  badge: {
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 3,
    borderRadius: t.radius.sm,
  },
  badgeFull: {
    backgroundColor: t.color.brand.light,
  },
  badgePartial: {
    backgroundColor: t.color.warning.bg,
  },
  badgeText: {
    ...t.typography.caption,
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  historyBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
  },
  subDetailText: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: 2,
  },
  kmDiffBox: {
    alignItems: 'flex-end',
  },
  kmDiffValue: {
    ...t.typography.h2,
    color: t.color.success.default,
  },
  kmDiffLabel: {
    ...t.typography.caption,
    color: t.color.success.default,
  },

  // Selector placeholder color (used by SuggestionForm for placeholderTextColor)
  selectorPlaceholder: {
    color: t.color.text.muted,
    fontSize: 15,
  },
});