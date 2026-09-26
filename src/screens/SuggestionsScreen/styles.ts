import { StyleSheet } from 'react-native';
import { tokens } from '../../config/tokens';

const t = tokens;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.color.bg.base,
  },
  headerBox: {
    backgroundColor: t.color.bg.surface,
    paddingHorizontal: t.spacing.base,
    paddingBottom: t.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.divider,
  },
  header: {
    ...t.typography.h1,
    color: t.color.text.primary,
  },
  headerSub: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: 4,
  },
  fieldHint: {
    ...t.typography.caption,
    color: t.color.text.muted,
    marginTop: -t.spacing.xs,
    marginBottom: t.spacing.sm,
  },

  // Form
  form: {
    backgroundColor: t.color.bg.surface,
    margin: t.spacing.base,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    borderWidth: 1,
    borderColor: t.color.border.default,
  },
  label: {
    ...t.typography.label,
    color: t.color.text.muted,
    marginBottom: t.spacing.xs,
    marginTop: t.spacing.md,
    // textTransform:'uppercase' kaldırıldı — Türkçe "i" yanlışlıkla "I" oluyordu.
    // Metinler artık trUpper() ile (tr-TR yereline duyarlı) büyütülüyor.
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.xs,
    fontSize: 15,
    backgroundColor: t.color.bg.base,
    color: t.color.text.primary,
  },
  multilineInput: {
    height: 110,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: t.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  selector: {
    borderWidth: 1,
    borderColor: t.color.border.default,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginBottom: t.spacing.xs,
    backgroundColor: t.color.bg.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 15,
    color: t.color.text.primary,
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: t.color.text.muted,
  },
  selectorArrow: {
    fontSize: 18,
    color: t.color.brand.secondary,
  },
  button: {
    backgroundColor: t.color.brand.primary,
    borderRadius: t.radius.lg,
    padding: t.spacing.base,
    alignItems: 'center',
    marginTop: t.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...t.typography.button,
    color: '#FFFFFF',
  },
  errorBox: {
    backgroundColor: t.color.danger.bg,
    borderRadius: t.radius.md,
    padding: t.spacing.md,
    marginHorizontal: t.spacing.base,
    marginTop: t.spacing.xs,
    borderWidth: 1,
    borderColor: t.color.danger.border,
  },
  errorText: {
    ...t.typography.bodySm,
    color: t.color.danger.default,
  },
  loadingBox: {
    alignItems: 'center',
    marginTop: t.spacing.xl,
    marginBottom: t.spacing.md,
  },
  loadingText: {
    ...t.typography.bodySm,
    color: t.color.brand.primary,
    marginTop: t.spacing.md,
  },
  result: {
    margin: t.spacing.base,
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: t.color.border.default,
    marginBottom: t.spacing['2xl'],
  },
  resultHeader: {
    backgroundColor: t.color.brand.pale,
    padding: t.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: t.color.border.default,
  },
  resultTitle: {
    ...t.typography.h3,
    color: t.color.brand.primary,
  },
  resultText: {
    ...t.typography.body,
    color: t.color.text.secondary,
    lineHeight: 26,
    padding: t.spacing.base,
  },
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
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: t.color.border.default,
  },
  modalTitle: {
    ...t.typography.h2,
    color: t.color.text.primary,
    marginBottom: t.spacing.xs,
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
  cancelText: {
    ...t.typography.body,
    color: t.color.text.secondary,
    fontWeight: '600',
  },
});