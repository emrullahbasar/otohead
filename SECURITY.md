# Güvenlik Politikası

OtoHead bireysel geliştirilen bir mobil uygulamadır.

## Güvenlik açığı bildirimi

Bir güvenlik açığı bulduysanız lütfen **GitHub issue açmayın** (herkese açık olur).
Bunun yerine doğrudan e-posta ile bildirin:

**basaremrullah044@gmail.com**

Bildiriminizde şunları ekleyin:
- Açığın kısa açıklaması ve etkisi
- Tekrar üretme adımları (mümkünse)
- Etkilenen dosya/uç nokta

## Yanıt süresi

Bu bir tek kişilik proje olduğu için kesin bir SLA verilemiyor, ancak kritik bulgular
mümkün olan en kısa sürede değerlendirilir.

## Kapsam

- Bu repo (OtoHead mobil uygulaması)
- Google Apps Script backend'i (`apps-script/Code.gs` — araç önerisi / değerlendirme / satış tahmini akışı)

> Not: Eski Express tabanlı `backend/` servisi tamamen kaldırıldı (AI desteğiyle
> birlikte); artık tek sunucu tarafı Google Apps Script'tir.

## Otomatik tarama

CI güvenlik workflow'u (`.github/workflows/security.yml` — içeriği
[SECURITY-REVIEW-2026-10-05.md](./SECURITY-REVIEW-2026-10-05.md) Ek A'da) her push ve
pull request'te şunları çalıştırır:

- **gitleaks** — commit'lere sır (API key, token, `.env` içeriği) sızmasını sert olarak engeller.
- **npm audit** — bağımlılık zafiyetlerini raporlar (bilgilendirici; Expo tooling
  transitive uyarıları build'i bloklamaz, bkz. REMEDIATION-PLAN.md P2#17).

## Geçmiş güvenlik çalışması

2026-09-22 tarihinde kapsamlı bir güvenlik denetimi yapıldı ve bulunan tüm Critical/High
bulgular kapatıldı — bkz. [SECURITY-AUDIT.md](./SECURITY-AUDIT.md) ve
[REMEDIATION-PLAN.md](./REMEDIATION-PLAN.md).

2026-10-05 tarihinde (Express backend kaldırıldıktan sonraki durum için) taze bir
saldırgan-gözüyle inceleme yapıldı — bkz. [SECURITY-REVIEW-2026-10-05.md](./SECURITY-REVIEW-2026-10-05.md).
