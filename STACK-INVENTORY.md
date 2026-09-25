# STACK-INVENTORY.md — OtoHead

Tarih: 2026-09-22 | Denetleyen: Claude (agent) | Kapsam: `C:\mobile`

## 1. Dizin yapısı ve giriş noktaları

```
C:\mobile/                     ← Ana RN/Expo uygulaması — GIT REPOSU DEĞİL (bkz. SEC-011)
├── App.tsx                    giriş bileşeni (initTables, requestPermission)
├── index.ts                   registerRootComponent
├── app.json / app.config.ts   Expo config (ikisi de var — app.config.ts dotenv okuyor)
├── eas.json                   EAS build profilleri (development/preview/production)
├── .env                       ⚠ EXPO_PUBLIC_* secret içeriyor (SEC-001)
├── android/                   prebuild çıktısı, .gitignore'da ama diskte mevcut
├── src/
│   ├── config/                api.ts, errors.ts, theme.ts, tokens.ts
│   ├── hooks/                 useCarManager, useFuel*, useSuggestion*, ...
│   ├── navigation/             MainNavigator, RootNavigator
│   ├── notifications/          expo-notifications wrapper (yerel bildirimler)
│   ├── screens/                FuelScreen, HomeScreen, ManintenanceScreen, SuggestionsScreen
│   ├── services/                carApi, fuelApi, suggestionApi, storage, database (SQLite)
│   └── types/
├── backend/                    ⚠ AYRI proje, KENDİ .git reposu var (remote: GitHub, private görünüyor)
│   ├── src/ (Express + better-sqlite3 API — cars/users/ai/suggestions)
│   ├── data/arabamcepte.db*    ⚠ git'e tracked (SEC-010)
│   └── .env                    ⚠ git'e tracked + commit geçmişinde (SEC-002)
└── data/                       (boş / kullanım tespit edilmedi)
```

**Not:** Kullanıcının tarif ettiği prod backend "Google Apps Script + Google Sheets"dir
(`EXPO_PUBLIC_APPS_SCRIPT_URL`). `backend/` klasöründeki Express+SQLite API ayrı, görünüşe göre
paralel/deneme amaçlı bir backend — `src/config/api.ts` içinde local LAN IP'sine (`192.168.1.117:3000`)
işaret ediyor, yalnızca `fetchBrands`/`fetchModels` (marka/model listesi) bunu kullanıyor.
Üretim akışı (öneri/değerlendirme) tamamen Apps Script üzerinden gidiyor.

## 2. Bağımlılıklar (package.json)

**Root (mobil app):** Expo ~54.0.35, React Native ^0.81.5, React ^19.1.4.
Güvenlikle ilgili paketler:
- `@react-native-async-storage/async-storage` — repoda **kullanılmıyor** (grep: 0 sonuç)
- `expo-secure-store` / `react-native-keychain` / `react-native-mmkv` — **yok**
- `expo-sqlite` ~16.0.10 — kullanılıyor, **şifreleme yok**
- `react-native-webview` — **yok** (WebView saldırı yüzeyi yok)
- `babel-plugin-transform-remove-console` — devDependencies'te var ama babel.config'te
  aktif olup olmadığı doğrulanmadı → NEEDS-MANUAL-REVIEW

**backend/package.json:** express 5, better-sqlite3, jsonwebtoken, bcryptjs, helmet,
cors, express-rate-limit, openai (kullanılmıyor gibi — ai.routes.ts doğrudan fetch ile
Gemini REST'e gidiyor), mssql (kullanılmıyor görünüyor — NEEDS-MANUAL-REVIEW).

`npm audit --production`:
- Root: **35 zafiyet** (1 critical: `tar`, 19 high, 15 moderate) — çoğu build-time/dev
  toolchain transitive bağımlılığı (`@expo/fingerprint`, `browserslist`, react-native codegen).
- backend: **14 zafiyet** (1 critical: `shell-quote`, 9 high, 2 moderate, 2 low).

## 3. Native/build konfigürasyonu

- `android/app/src/main/AndroidManifest.xml`: `allowBackup="true"` ⚠ (app.json'da `false` —
  tutarsız, bkz. SEC-007). Sadece `MainActivity` exported (LAUNCHER intent, normal).
  INTERNET, CAMERA, READ/WRITE_EXTERNAL_STORAGE, READ_MEDIA_IMAGES, RECORD_AUDIO,
  SYSTEM_ALERT_WINDOW izinleri var — RECORD_AUDIO ve SYSTEM_ALERT_WINDOW kodda
  kullanım noktası bulunamadı → NEEDS-MANUAL-REVIEW (gereksizse kaldırılmalı).
- `network_security_config.xml` yok.
- iOS: `/ios` klasörü diskte yok (prebuild hiç çalıştırılmamış/temizlenmiş) →
  Info.plist/ATS/entitlements incelemesi bu ortamda **yapılamadı** → NEEDS-MANUAL-REVIEW.
- `app.config.ts` ve `app.json` **aynı anda mevcut** — Expo `app.config.ts` varsa onu
  önceliklendirir, `app.json` şu an ölü/yanıltıcı konfig gibi duruyor (ör. `allowBackup`
  yalnızca app.json'da tanımlı, app.config.ts'de yok) → yapılandırma çatallanması riski.
- `eas.json`: secret inline yazılmamış, EAS Secrets kullanımı doğrulanmadı → NEEDS-MANUAL-REVIEW.

## 4. Ortam / secret dosyaları

| Dosya | Git durumu | İçerik |
|---|---|---|
| `C:\mobile\.env` | Git yok (repo değil) | `EXPO_PUBLIC_API_IP`, `EXPO_PUBLIC_API_PORT`, `EXPO_PUBLIC_APPS_SCRIPT_URL`, `EXPO_PUBLIC_SCRIPT_KEY` |
| `C:\mobile\backend\.env` | **backend git reposunda tracked**, 2 commit'te de var | `GEMINI_API_KEY`, `EXPO_PUBLIC_API_IP`, `EXPO_PUBLIC_API_PORT`, `JWT_SECRET`; çalışma kopyasında ayrıca `ADMIN_KEY` (henüz commit'lenmemiş) |
| `backend/.gitignore` | `.env` listede var ama **zaten tracked olduğu için işe yaramıyor** | — |

`backend` reposunun remote'u: `https://github.com/emrullahbasar/arabamcepte-backend.git`
(unauthenticated GitHub API sorgusu "Not Found" döndü → muhtemelen private, ama doğrulanmalı).
Local branch origin'den 1 commit ileride (henüz push edilmemiş).

## 5. Uygulamanın konuştuğu endpoint'ler

1. `https://script.google.com/macros/s/AKfycbz.../exec` — prod backend (Apps Script).
   Bu repoda kaynağı yok → sunucu tarafı davranışı bağımsız doğrulanamadı.
2. `http://192.168.1.117:3000/api/*` — yerel/dev Express API (marka/model listesi).
3. `https://generativelanguage.googleapis.com/...` (Gemini) — yalnızca backend/ (Express)
   tarafından çağrılıyor, client'tan direkt çağrı **yok** (iyi mimari karar).
4. `https://exp.host/--/api/v2/push/send` — Expo push bildirim gönderimi (backend'den).

## 6. Veri sınıflandırması

| Veri | Nerede | Hassasiyet |
|---|---|---|
| Araç bilgisi (marka/model/km/bakım) | expo-sqlite (cihazda, şifresiz) | Orta — kullanıcıya özel ama kimlik doğrulayıcı değil |
| Yakıt fişi fotoğrafı | Cihazda geçici (ImagePicker URI), sunucuya **yüklenmiyor** (ML Kit on-device OCR) | Düşük |
| `clientId` (Math.random tabanlı UUID) | sqlite `client_config` + Apps Script'e gönderiliyor | Orta — tek "kimlik" bu, bkz. SEC-004 |
| Öneri/değerlendirme formu (bütçe, açıklama) | Google Sheets (Apps Script üzerinden) | Orta — PII olabilir (kullanıcı serbest metin girebilir) |
| Kullanıcı hesabı (email/password) | Yalnızca `backend/` (Express, muhtemelen kullanılmıyor prod'da) — bcrypt hash'li | Yüksek (eğer aktif kullanılırsa) |

---
Sonraki fazlar (secret sızıntısı, veri saklama/aktarım, platform, backend yetkilendirme,
bağımlılıklar) `SECURITY-AUDIT.md` içinde detaylandırılmıştır.
