import { StyleSheet } from 'react-native';
import { tokens } from '../../config/tokens';

const t = tokens;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.color.bg.base,
  },

  // Ana Header
  mainHeader: {
    backgroundColor: t.color.bg.surface,
    paddingBottom: t.spacing.lg,
    paddingHorizontal: t.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  mainHeaderText: {
    ...t.typography.h1,
    color: t.color.text.primary,
  },
  mainHeaderSub: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: 4,
  },

  // Araç detay header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: t.spacing.base,
    paddingHorizontal: t.spacing.base,
    backgroundColor: t.color.bg.surface,
    gap: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  backButton: {
    ...t.typography.body,
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  headerCarName: {
    ...t.typography.h2,
    color: t.color.text.primary,
  },
  headerCarSub: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    padding: t.spacing.base,
  },
  empty: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
    textAlign: 'center',
    marginTop: t.spacing['3xl'],
    marginBottom: t.spacing.lg,
    fontStyle: 'italic',
  },

  // Araç Kartı
  carCard: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    marginBottom: t.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  carCardPressed: {
    backgroundColor: t.color.bg.muted,
  },
  carCardLeft: {
    flex: 1,
    gap: 3,
  },
  carNickname: {
    ...t.typography.h3,
    color: t.color.text.primary,
  },
  carTitle: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
  },
  carYear: {
    alignSelf: 'flex-start',
    backgroundColor: t.color.brand.light,
    paddingHorizontal: t.spacing.sm,
    paddingVertical: 2,
    borderRadius: t.radius.sm,
    marginTop: 2,
  },
  carYearText: {
    ...t.typography.caption,
    color: t.color.brand.primary,
    fontWeight: '600',
  },
  carArrow: {
    fontSize: 20,
    color: t.color.text.muted,
  },

  // Kayıt Kartı
  recordCard: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    marginBottom: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderLeftWidth: 3,
    borderLeftColor: t.color.brand.primary,
  },
  recordCardPressed: {
    backgroundColor: t.color.bg.muted,
  },
  recordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.xs,
  },
  recordCardArrow: {
    fontSize: 18,
    color: t.color.text.muted,
  },
  recordType: {
    ...t.typography.h3,
    color: t.color.brand.primary,
  },
  recordDetail: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    marginTop: 2,
    lineHeight: 20,
  },
  // Hedef km'ye kalan mesafe satırı (RecordCard)
  kmSoon: {
    color: t.color.warning.default,
    fontWeight: '600',
  },
  kmDue: {
    color: t.color.danger.default,
    fontWeight: '700',
  },

  // Delete
  deleteAction: {
    backgroundColor: t.color.danger.default,
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    borderRadius: t.radius.md,
    marginBottom: t.spacing.sm,
  },
  deleteActionText: {
    ...t.typography.label,
    color: '#FFFFFF',
  },

  // Form
  form: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    marginBottom: t.spacing.sm,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },

  // Selector
  selector: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    backgroundColor: t.color.bg.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    ...t.typography.body,
    color: t.color.text.primary,
  },
  selectorPlaceholder: {
    ...t.typography.body,
    color: t.color.text.muted,
  },
  selectorArrow: {
    fontSize: 18,
    color: t.color.brand.secondary,
  },

  // Input
  input: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.sm,
    fontSize: 15,
    backgroundColor: t.color.bg.base,
    color: t.color.text.primary,
  },
  fieldHint: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginBottom: t.spacing.sm,
    marginHorizontal: 2,
  },

  // Buttons
  button: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
    marginBottom: t.spacing.sm,
  },
  buttonText: {
    ...t.typography.button,
    color: '#FFFFFF',
  },
  cancelButton: {
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.surface,
  },
  cancelText: {
    ...t.typography.button,
    color: t.color.text.secondary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 21, 32, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: t.color.bg.surface,
    borderTopLeftRadius: t.radius.xl,
    borderTopRightRadius: t.radius.xl,
    padding: t.spacing.lg,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderTopColor: t.color.border.default,
  },
  modalTitle: {
    ...t.typography.h2,
    color: t.color.text.primary,
    marginBottom: t.spacing.base,
    textAlign: 'center',
  },
  modalItem: {
    padding: t.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  modalItemText: {
    ...t.typography.body,
    color: t.color.text.secondary,
  },
  modalCancel: {
    marginTop: t.spacing.md,
    padding: t.spacing.base,
    alignItems: 'center',
  },

  // Detail Modal
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 21, 32, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: t.spacing.lg,
  },
  detailBox: {
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.xl,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  detailHeader: {
    backgroundColor: t.color.bg.base,
    padding: t.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.default,
  },
  detailType: {
    ...t.typography.h2,
    color: t.color.brand.primary,
  },
  detailClose: {
    fontSize: 20,
    color: t.color.text.muted,
  },
  detailContent: {
    padding: t.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  detailRowLabel: {
    ...t.typography.bodySm,
    color: t.color.text.muted,
  },
  detailRowValue: {
    ...t.typography.bodySm,
    fontWeight: '600',
    color: t.color.text.primary,
  },
  detailNoteBox: {
    paddingVertical: t.spacing.md,
  },
  detailNote: {
    ...t.typography.body,
    color: t.color.text.secondary,
    marginTop: 4,
    lineHeight: 22,
  },
  detailLabel: {
    ...t.typography.label,
    color: t.color.brand.secondary,
    marginBottom: t.spacing.xs,
    marginTop: t.spacing.md,
    // textTransform:'uppercase' kaldırıldı (Türkçe "i" -> yanlışlıkla "I" olur,
    // "İ" olmalı) — etiketler artık zaten doğru Türkçe büyük harfle yazılı.
  },
  detailInput: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    fontSize: 15,
    backgroundColor: t.color.bg.base,
    color: t.color.text.primary,
    marginBottom: 4,
  },
  detailActions: {
    padding: t.spacing.base,
    borderTopWidth: 1,
    borderTopColor: t.color.border.default,
    gap: t.spacing.sm,
  },
  detailEditBtn: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
  },
  detailEditBtnText: {
    ...t.typography.button,
    color: '#FFFFFF',
  },
  detailSaveBtn: {
    backgroundColor: t.color.brand.secondary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
  },
  detailSaveBtnText: {
    ...t.typography.button,
    color: '#FFFFFF',
  },
  detailCancelBtn: {
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: t.color.border.default,
    backgroundColor: t.color.bg.surface,
  },
  detailCancelBtnText: {
    ...t.typography.button,
    color: t.color.text.secondary,
  },
});