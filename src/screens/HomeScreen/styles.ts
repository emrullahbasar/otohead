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
  // Tek kart, ortada ince bir ayraçla bölünmüş. Emoji/daire ikon yok —
  // ScreenHeader'daki vurgu çizgisi motifi (küçük dolgun lacivert çubuk)
  // burada da tekrar kullanılıyor, uygulamanın kendi kimliğiyle tutarlı.
  statsRow: {
    flexDirection: 'row',
    backgroundColor: t.color.bg.surface,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.border.default,
    marginHorizontal: t.spacing.base,
    marginVertical: t.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.lg,
  },
  statCardPressed: {
    backgroundColor: t.color.bg.muted,
  },
  statDivider: {
    width: 1,
    marginVertical: t.spacing.md,
    backgroundColor: t.color.border.divider,
  },
  statNumber: {
    ...t.typography.display,
    color: t.color.brand.primary,
  },
  statLabel: {
    ...t.typography.overline,
    color: t.color.text.muted,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Yakıt Kaydı bölmesi (sağ yarı) ──
  // "Araçlarınız" (sol) sabit tek bir Pressable iken sağ yarı, araç sayısına
  // göre şekil değiştirir: 0 araç → boş durum, 1 araç → tek büyük hücre
  // (araç adı başlık olarak üstte), 2-4 araç → küçük bir ızgara. statCard'daki
  // dolgu/hizalama burada (fuelFill/fuelGrid) tekrarlanır çünkü dış sarmalayıcı
  // (statCardRight) artık kendisi Pressable değil, içi duruma göre değişen
  // düz bir View.
  statCardRight: {
    flex: 1,
  },
  fuelFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.lg,
  },
  fuelCarNameSingle: {
    ...t.typography.overline,
    color: t.color.text.muted,
    marginBottom: 2,
  },
  fuelGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingVertical: t.spacing.sm,
    paddingHorizontal: t.spacing.xs,
  },
  fuelGridCell: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: t.spacing.sm,
  },
  fuelGridCarName: {
    ...t.typography.caption,
    fontSize: 10,
    color: t.color.text.muted,
    marginBottom: 2,
  },
  fuelGridCount: {
    ...t.typography.h2,
    color: t.color.brand.primary,
  },

  // ── Hoş geldin / Yaklaşan bakım ──
  // İkisi de statsRow ile HİZMETLER arasında, aynı dar aralıkla dizilir — hiç
  // araç yoksa yalnızca welcomeBanner görünür, diğeri kendi koşuluna bağlı
  // (maintenanceAlert varsa) ayrı belirir.
  welcomeBanner: {
    marginHorizontal: t.spacing.base,
    marginBottom: t.spacing.lg,
    padding: t.spacing.base,
    backgroundColor: t.color.brand.pale,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.brand.primary,
  },
  welcomeTitle: {
    ...t.typography.h3,
    color: t.color.text.primary,
    marginBottom: 4,
  },
  welcomeText: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    lineHeight: 20,
  },
  alertBanner: {
    marginHorizontal: t.spacing.base,
    marginBottom: t.spacing.lg,
    padding: t.spacing.base,
    backgroundColor: t.color.warning.bg,
    borderRadius: t.radius.lg,
    borderWidth: 1,
    borderColor: t.color.warning.border,
  },
  alertTitle: {
    ...t.typography.h3,
    color: t.color.warning.default,
    marginBottom: 4,
  },
  alertText: {
    ...t.typography.bodySm,
    color: t.color.text.secondary,
    lineHeight: 20,
  },
  bannerPressed: {
    opacity: 0.85,
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
  numberBlock: {
    width: 44,
    height: 30,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.bg.muted,
    marginBottom: 6,
  },
  labelBlock: {
    width: 64,
    height: 11,
    borderRadius: t.radius.sm,
    backgroundColor: t.color.bg.muted,
  },
});