# SECURITY-REVIEW-2026-10-05 — OtoHead (taze saldırgan-gözüyle inceleme)

Tarih: 2026-10-05
Kapsam: `apps-script/Code.gs` (canlı backend), `src/**` (istemci), build/konfig
(`app.config.ts`, `eas.json`, `.gitignore`), git geçmişi, bağımlılıklar.
Metodoloji: OWASP MASVS v2 / MASTG + manuel saldırgan modelleme (threat modeling).
Yöntem: yalnızca statik analiz — canlı uç nokta/ APK üzerinde aktif test yapılmadı.

Bu inceleme, 2026-09-22 denetiminden (bkz. `SECURITY-AUDIT.md`) **sonraki** duruma bakar.
O denetimden bu yana en büyük değişiklik: Express tabanlı `backend/` servisi ve tüm AI
(Gemini) desteği **tamamen kaldırıldı**. Dolayısıyla eski raporun backend'e dair bulguları
(SEC-002/003/006/018) artık konu dışıdır — o kod tabanı yok.

## Özet

**Yeni Critical/High bulgu yok.** Uygulamanın güvenlik mimarisi sağlam:

- **Kimlik doğrulama modeli doğru kurulmuş.** Her cihaz kendi `clientId`'si için sunucuda
  üretilen, bundle'a asla gömülmeyen bir `secret` alıyor (`register` akışı). Tüm yazma/okuma
  uçları `isValidClient_(clientId, secret)` ile doğrulanıyor. Statik/paylaşımlı anahtar yok.
- **IDOR yok.** Tüm handler'lar yetkisi doğrulanmış `data.clientId` üzerinde çalışıyor; bir
  istemci yalnızca kendi `(clientId, secret)` çiftiyle erişebildiği için başka bir kullanıcının
  verisine erişemiyor. `clientId` tahmin edilemez UUID v4, `secret` sunucu-rastgele.
- **Enjeksiyon yüzeyi kapalı.** SQLite sorgularının tamamı parametreli (string interpolation
  yok). Sheets'e yazılan her kullanıcı girdisi `sanitizeCell_()` ile formül/CSV injection'a
  karşı nötrleniyor. `carApi.fetchModels` prototype-pollution'a (`__proto__`, `constructor`)
  karşı `hasOwnProperty` ile korunuyor.
- **Sır hijyeni temiz.** Git geçmişinde `.env.example` dışında hiçbir sır/veritabanı/anahtar
  dosyası yok (geçmiş `--diff-filter=A` ile tarandı). Kodda gömülü API key/token yok.
  `.gitignore` `.env`, native anahtarlar, `google-services.json`, service-account dosyalarını
  kapsıyor.
- **İzin yüzeyi minimal.** Yalnızca `CAMERA`; gereksiz izinler (`SYSTEM_ALERT_WINDOW`,
  depolama/medya) `blockedPermissions` ile manifest'ten çıkarılıyor. `allowBackup=false`.
- **Taşıma güvenliği.** Tüm trafik Apps Script HTTPS uç noktasına; durum sorguları artık
  POST gövdesinde (secret URL/query'de değil, erişim günlüklerine sızmıyor).

Bu inceleme kapsamında **3 adet Low/hijyen seviyesi iyileştirme** uygulandı (aşağıda), ayrıca
kodla kapatılamayan **manuel doğrulama kalemleri** listelendi.

## Bu PR'da uygulanan iyileştirmeler

| ID | Başlık | Severity | Durum |
|---|---|---|---|
| REV-001 | Kök repoda CI güvenlik otomasyonu yoktu (gitleaks + npm audit) | Low (hijyen) | ⏳ Workflow hazır (bkz. Ek A); `workflow` token izni gerektirdiği için PR'a ayrı adımda ekleniyor |
| REV-002 | Bazı kimlik-doğrulamalı uçlarda (`setPushToken`, `markSeen`, `cancel*`) rate-limit yoktu | Low | ✅ `Code.gs` doPost'a `misc` hız sınırı (30/dk) eklendi |
| REV-003 | `SECURITY.md` kapsamı bayat — artık silinmiş `backend/` reposuna atıf veriyordu | Info | ✅ Güncellendi + otomatik tarama bölümü eklendi |
| REV-004 | `fuelApi.getFuelRecords` okuma hatası yanlış mesajla/log'la yutuluyordu (copy-paste) | Low (doğruluk) | ✅ Okuma yoluna doğru hata mesajı |

### REV-001 — CI güvenlik otomasyonu (kök repo)

`REMEDIATION-PLAN.md` P2#17, gitleaks + npm audit otomasyonunun **yalnızca** (o zaman ayrı bir
repo olan, şimdi silinmiş) `backend/` için kurulduğunu, kök reponun kapsanmadığını belgeliyor.
Projenin geçmişinde tam da bir sır sızıntısı yaşandığı için (SEC-002: `backend/.env`
commit'lenmişti) sır taramasının kök repoda **sert gate** olması değerli. Eklenen workflow:

- `secret-scan` işi (gitleaks) — başarısızsa CI kırmızı olur, PR bloklanır.
- `dependency-audit` işi (npm audit) — bilgilendirir, `continue-on-error` ile build'i bloklamaz
  (kalan uyarılar Expo tooling transitive'i, bkz. REV sonrası "Bağımlılıklar").

> ℹ️ Workflow dosyasının (`.github/workflows/security.yml`) tam içeriği **Ek A**'dadır.
> GitHub'a `.github/workflows/` altına dosya push etmek token'da `workflow` izni gerektirir;
> bu yüzden dosya bu PR'a iki yoldan biriyle eklenebilir: (a) `gh auth refresh -h github.com -s workflow`
> sonrası push, ya da (b) GitHub web arayüzünden **Add file → Create new file** ile
> `.github/workflows/security.yml` oluşturup Ek A içeriğini yapıştırmak (scope gerektirmez).

### REV-002 — Eksik rate-limit

`doPost` yalnızca iki kovayı sınırlıyordu: gönderim uçları (`submit`/`evalSubmit`/`sellSubmit`/
`followUp`, 5/dk) ve sorgu uçları (`check*`/`history`, 30/dk). `markSeen`, `setPushToken` ve
`cancel*` uçları kimlik doğrulamasından geçiyor ama **hiçbir hız sınırına** bağlı değildi.
Etki düşük (bir istemci yalnızca kendi satırını etkiler), ancak kimliği geçerli ama bozuk/
kötü niyetli bir istemci bu yazma uçlarını spam'leyip Sheets üzerinde gereksiz okuma/yazma
ürettirebilirdi. Yeni `misc` kovası (30/dk) normal kullanımda asla aşılmaz.

> ⚠️ Bu değişiklik **Apps Script tarafında yeniden dağıtım (Deploy → Manage deployments →
> yeni sürüm) gerektirir** — yalnızca repoyu merge etmek canlı davranışı değiştirmez.

### REV-004 — `fuelApi.getFuelRecords` yanlış hata yolu

Okuma fonksiyonunun `catch` bloğu, bir ekleme fonksiyonundan kopyalandığı için yakıt
kayıtları okunamadığında `console.error('addFuelRecord hatası')` basıp `'Yakıt kaydı
eklenemedi.'` fırlatıyordu — yanıltıcı log ve kullanıcı mesajı. Güvenlik açığı değil ama
hata görünürlüğünü bozan bir doğruluk hatası; okuma yoluna doğru mesaj kondu
(`'Yakıt kayıtları okunamadı.'`).

## Kodla kapatılamayan / manuel doğrulama kalemleri

Bunlar statik analizle teyit edilemez; sahibinin (uygulama/Google hesabı erişimi olan) elle
doğrulaması gerekir:

1. **Apps Script Web App dağıtım erişimi (ÖNEMLİ).** Dağıtımın "Who has access" ayarı
   pratikte "Anyone" olmak zorunda (uygulama anonim çağırıyor), ama "Execute as" **mutlaka
   sahibin kendisi** olmalı ve betik bu secret modeli dışında başka bir yetki (örn. Drive geneli)
   istememeli. Deploy ekranından doğrulanmalı.
2. **Eski sızmış `GEMINI_API_KEY`.** Artık kullanılmıyor (AI desteği kaldırıldı) ama Google
   tarafında hâlâ geçerli olabilir — https://aistudio.google.com/apikey üzerinden iptal edilmeli
   (SECURITY-AUDIT.md'de de not düşülmüştü).
3. **iOS tarafı denetlenmedi.** `/ios` üretilmiş değil; ATS, (varsa) TLS pinning, pasteboard/
   ekran görüntüsü koruması bir Mac'te `npx expo prebuild --platform ios` sonrası Info.plist
   üzerinden gözden geçirilmeli (eski SEC-013 hâlâ açık).
4. **SQLite şifrelemesi (SQLCipher).** Yerel veri hassas değil (araç/bakım/yakıt kayıtları,
   sunucuya foto gitmiyor) ve `allowBackup=false` olduğu için risk düşük; sahibin bilinçli
   kararıyla atlanmıştı (SEC-008). Değişiklik yok.

## Bağımlılıklar

`npm audit --package-lock-only`: 35 zafiyet (11 orta, 24 yüksek). İncelendi — **tamamı Expo
build/dev tooling transitive'i** (`@expo/config`, `expo-manifests`, `expo-dev-client/launcher`,
`@expo/prebuild-config`, `expo-notifications`'ın tooling bağımlılıkları). `npm audit fix --force`
Expo SDK'yı kırar; doğru yol düzenli `expo install --check` / SDK yükseltmesidir. Çalışma
zamanında (shipped app) doğrudan sömürülebilir bir yüzey değil. Önceki denetimin kararıyla
tutarlı: zorla düzeltme uygulanmadı.

## Sonuç

Backend sadeleştikten (Express + AI kaldırıldıktan) sonraki durum, saldırgan modellemesi
açısından önceki denetimden **daha dar ve daha güvenli** bir yüzey sunuyor. Yeni Critical/High
yok; bu PR hijyen/defense-in-depth seviyesinde 3 iyileştirme ve CI otomasyonu getiriyor.
Kalan gerçek işler kodda değil, dağıtım/hesap ayarlarında ve iOS denetiminde (yukarıdaki
manuel kalemler).

## Ek A — `.github/workflows/security.yml`

Aşağıdaki içeriği `.github/workflows/security.yml` olarak ekleyin (bkz. REV-001).

```yaml
name: security

# Kök repo için güvenlik otomasyonu. Daha önce aynı tarama yalnızca (artık
# silinmiş) backend/ reposunda vardı; kök proje hiç taranmıyordu — bkz.
# REMEDIATION-PLAN.md P2#17. Bu workflow o boşluğu kapatır.
#
# İki ayrı güvence:
#   1) gitleaks  — commit'lere sır (API key, token, .env içeriği) sızmasını
#      SERT olarak engeller. Projenin geçmişinde tam da bu yaşandı (SEC-002:
#      backend/.env commit'lenmişti), bu yüzden bu iş başarısız olursa CI kırmızı olur.
#   2) npm audit — bağımlılık zafiyetlerini raporlar. Kalan uyarıların çoğu
#      Expo build-tooling'in transitive'idir ve `--force` native build'i bozar
#      (SEC-012), bu yüzden bu iş bilgilendirir ama build'i BLOKLAMAZ.

on:
  push:
    branches: [master, main]
  pull_request:
  workflow_dispatch:

permissions:
  contents: read

jobs:
  secret-scan:
    name: Sır taraması (gitleaks)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # gitleaks tüm geçmişi tarayabilsin
      - name: gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  dependency-audit:
    name: Bağımlılık denetimi (npm audit)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: npm audit (yüksek+ zafiyetler)
        # Bilgilendirir ama build'i bloklamaz: kalan yüksek uyarılar Expo
        # tooling transitive'idir, düzeltmesi breaking (bkz. SECURITY-AUDIT.md
        # SEC-012). Çıktı iş özetinde görünür; sır taraması asıl sert gate'tir.
        continue-on-error: true
        run: |
          npm audit --audit-level=high | tee audit.txt
          {
            echo '### npm audit özeti'
            echo ''
            echo '```'
            tail -n 20 audit.txt
            echo '```'
          } >> "$GITHUB_STEP_SUMMARY"
```
