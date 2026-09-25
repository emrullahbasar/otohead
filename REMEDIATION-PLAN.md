# REMEDIATION-PLAN.md — OtoHead

Öncelik kovaları `SECURITY-AUDIT.md`'deki bulgu ID'lerine referans verir. Efor tahminleri
kabaca: **S** = <1 saat, **M** = birkaç saat, **L** = 1 gün+.

## P0 — Şimdi (release'i durdur / ilk fırsatta)

| # | Aksiyon | İlgili | Efor | Durum |
|---|---|---|---|---|
| 1a | `JWT_SECRET`'ı rotate et | SEC-002 | S | ✅ Tamamlandı |
| 1b | `ADMIN_KEY`'i rotate et (bonus) | SEC-003 | S | ✅ Tamamlandı |
| 1c | `GEMINI_API_KEY`'i rotate et | SEC-002 | S | ✅ Farklı yoldan çözüldü — AI desteği tamamen kaldırıldı, anahtar artık hiç kullanılmıyor (Google tarafında iptali yine önerilir) |
| 2 | `backend/.env`'i git history'den temizle, force-push | SEC-002, SEC-010 | M | ✅ Tamamlandı (`filter-branch` + `git push --force-with-lease`) |
| 3 | `backend/data/*.db*` dosyalarını index'ten çıkar | SEC-010 | S | ✅ Tamamlandı |
| 4 | Root `.gitignore`'a düz `.env` ekle | SEC-011 | S | ✅ Tamamlandı |
| 5 | Apps Script kaynağına eriş, SEC-005'i kapat/teyit et | SEC-001, SEC-005 | M | ✅ Tamamlandı — SEC-016/SEC-017 yeni bulgular eklendi |

## P1 — Bu sprint — ✅ TAMAMLANDI (2026-09-22)

| # | Aksiyon | İlgili | Durum |
|---|---|---|---|
| 6 | Paylaşımlı `EXPO_PUBLIC_SCRIPT_KEY` yerine cihaza özel kimlik modeli (`register` akışı) | SEC-001 | ✅ Canlıda doğrulandı — eski sızmış anahtar artık reddediliyor |
| 7 | ~~`/api/ai` endpoint'ine auth/rate limit ekle~~ — gerek kalmadı, route tamamen silindi | SEC-006 | ✅ |
| 8 | Admin endpoint'lerini `timingSafeEqual` + rate limit ile sertleştir | SEC-003 | ✅ SHA-256 hash üzerinden sabit-zamanlı karşılaştırma, 15dk'da 20 deneme limiti |
| 9 | `clientId` üretimini `crypto`-tabanlı RNG'ye taşı | SEC-004 | ✅ `uuid` v4 + `react-native-get-random-values` |
| 10 | `app.config.ts`'e `android.allowBackup: false` ekle, prebuild'i yenile | SEC-007 | ✅ Manifest doğrulandı — `allowBackup="false"` |
| 11 | `app.json` / `app.config.ts` çakışmasını çöz | SEC-014 | ✅ Birleştirildi, `app.json` silindi |
| 12 | `npm audit fix`, kullanılmayan bağımlılıkları kaldır | SEC-012 | ✅ Root 35→20, backend 4→0 |
| 13 | Dev-only local HTTP endpoint'ini koddan çıkar | SEC-009 | ✅ `.env` üzerinden okunuyor, tanımsızsa devre dışı |
| 20 | Apps Script formula/CSV injection sanitizasyonu | SEC-016 | ✅ `sanitizeCell_()` eklendi ve deploy edildi |
| 21 | Apps Script hata mesajlarını generic'leştir | SEC-017 | ✅ `Logger.log` + generic mesaj |
| 22 | (madde 6 ile birleşti — HMAC yerine gerçek "her cihaza özel secret" modeli uygulandı, HMAC'in client-embedded key ile hiçbir güvenlik kazanımı sağlamayacağı değerlendirildi) | SEC-001 | ✅ |

**Not — HMAC yerine register modeli:** Planın orijinal #6/#22 maddeleri "HMAC imzalı istek"
öneriyordu. Uygulama sırasında bunun yanlış çözüm olduğu fark edildi: client'a gömülü herhangi
bir HMAC imzalama anahtarı, statik `secretKey` kadar kolay çıkarılabilir — kriptografik olarak
hiçbir ek güvenlik sağlamaz. Bunun yerine her cihazın kendi (sunucuda üretilen, asla bundle'a
gömülmeyen) `secret`'ını aldığı bir `register` akışı kuruldu. Detaylar SECURITY-AUDIT.md →
"SEC-001 kalıcı çözümü" bölümünde, canlı doğrulama komutlarıyla birlikte.

## P2 — Backlog

| # | Aksiyon | İlgili | Efor | Durum |
|---|---|---|---|---|
| 14 | `expo prebuild --platform ios` çalıştırıp iOS ATS/pinning/pasteboard denetimini tamamla | SEC-013 | M | ❌ Bu ortamda imkansız — CocoaPods çözümlemesi macOS/Linux gerektiriyor. Bir Mac'te tekrar denenmeli |
| 15 | Gereksiz Android izinlerini (RECORD_AUDIO, SYSTEM_ALERT_WINDOW) doğrula/kaldır | SEC-015 | S | ✅ Tamamlandı — kullanılmayan push-notification paketleri kaldırıldı, `blockedPermissions` eklendi, ikisi de manifest'te `tools:node="remove"` |
| 16 | SQLite için SQLCipher/alan-bazlı şifreleme değerlendirmesi | SEC-008 | L | ⏸ Kullanıcı kararıyla atlandı — allowBackup kapandığı için risk/efor dengesi uygun değil |
| 17 | CI pipeline'ına `gitleaks` + `npm audit` ekle | — | M | ✅ `backend/` için tamamlandı (GitHub Actions, her push/PR'da çalışıyor). Root henüz remote'a bağlı değil, remote eklenince aynısı oraya da eklenebilir |
| 18 | Root projeyi git'e al, `SECURITY.md` ekle | SEC-011 | S | ✅ Yerel `git init` + ilk commit yapıldı (remote/GitHub eklenmedi, kullanıcı kararı bekliyor). `SECURITY.md` eklenmedi |
| 19 | Runtime koruma (root/jailbreak tespiti, obfuscation) | — | L | ⏸ Kullanıcı kararıyla atlandı — MVP için gereksiz karmaşıklık |

## Tamamlanan ek işler (plan dışı, talep üzerine)

| # | Aksiyon | İlgili | Durum |
|---|---|---|---|
| 23 | Gemini AI desteğini uygulamadan tamamen kaldır (`ai.routes.ts`, `GEMINI_API_KEY`, `openai` bağımlılığı, client'taki `ai:` endpoint tanımı) | SEC-006 | ✅ Tamamlandı |
| 24 | `backend/node_modules`'u git geçmişinden temizle | SEC-018 | ✅ Tamamlandı (`.git` 76M→213K, force-push edildi) |

---

**P0 durumu (2026-09-22):** 7/7 madde tamamlandı (GEMINI_API_KEY rotasyonu, AI desteğinin
tamamen kaldırılmasıyla farklı bir yoldan çözüldü). Detaylar `SECURITY-AUDIT.md` →
"Uygulanan P0 Aksiyonları" bölümünde.

**P1 durumu (2026-09-22):** 12/12 madde tamamlandı. Raporun açılışındaki tüm Critical/High
bulgular kapandı. Detaylar `SECURITY-AUDIT.md` → "Uygulanan P1 Aksiyonları" bölümünde
(canlı doğrulama komutları dahil).

**P2 durumu (2026-09-22):** 3/6 madde tamamlandı (15, 17-backend, 18), 2 madde kullanıcı
kararıyla bilinçli olarak atlandı (16 SQLCipher, 19 runtime koruma), 1 madde bu ortamda
teknik olarak imkansız (14 iOS — Mac gerekiyor).

**Gerçekten kalan açık maddeler:**
- SEC-013: iOS denetimi — bir Mac'te `npx expo prebuild --platform ios` çalıştırıp
  Info.plist/ATS/pinning manuel incelenmeli
- SEC-012 kalanı: root'ta `--force`/breaking-change gerektiren ~20 bağımlılık zafiyeti
  (çoğu Expo build-tooling'in transitive'i, native build'i bozma riski var — düzenli
  `expo upgrade` ile organik olarak azalır)
- Root repo henüz bir GitHub/remote'a bağlı değil — istenirse eklenebilir
- `SECURITY.md` dosyası eklenmedi (istenirse P2'ye tekrar alınabilir)

**Sonuç:** Denetimin açılışındaki tüm Critical/High bulgular ve P2'nin makul olan kısmı
kapandı. Kalanlar ya bu ortamın teknik sınırları (iOS/Mac) ya da kullanıcının bilinçli
"gerek yok" kararları.
