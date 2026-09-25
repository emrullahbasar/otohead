# Mağaza Yayın Rehberi (iç kullanım — mağazaya gönderilmez)

Bu dosya, App Store ve Google Play formlarını doldururken kullanılacak cevapları ve yayın öncesi yapılacakları içerir. Cevaplar **kodun gerçek davranışına** göre yazıldı (ağ isteği yalnızca `src/services/suggestionApi.ts` → Apps Script; analitik/reklam/çökme raporlama SDK'sı yok).

> Hukuki ve vergisel konularda (KVKK, VERBİS, yurt dışı aktarım, gelir/KDV) mali müşavir veya avukat görüşü alınmalı; bu doküman hukuki tavsiye değildir.

---

## 1. Gizlilik Politikası'nı yayınlama

Mağazalar herkese açık bir **URL** ister (giriş gerektirmeyen). Ana kod deposu private olduğu için onu kullanamayız (private depoda GitHub Pages ücretli plan ister).

**En kolay yol:**
1. GitHub'da **ayrı, herkese açık** yeni bir depo aç: `OtoHeadLegal` (içinde kod olmayacak, yalnızca politika).
2. `legal/gizlilik-politikasi.md` içeriğini bu depoya `index.md` olarak koy (ad ve e-posta zaten dolduruldu).
3. Depo → Settings → Pages → Branch: `main` / root → Save.
4. Yayın adresi: `https://emrullahbasar.github.io/OtoHeadLegal/`

Alternatif: Google Sites veya Notion'da herkese açık sayfa. Her durumda **giriş istemeyen** bir adres olmalı.


---

## 2. Apple — App Privacy ("Gizlilik Etiketi") cevapları

**Tracking (izleme):** Hayır. Uygulama veriyi reklam/izleme amacıyla kullanmıyor ve ATT izni istemiyor.

| Veri türü | Toplanıyor mu | Kullanıcıya bağlı | Amaç |
|---|---|---|---|
| Identifiers → **Device ID** (uygulamanın ürettiği rastgele cihaz kimliği + bildirim adresi) | Evet | Evet | App Functionality |
| User Content → **Other User Content** (danışmanlık/değerlendirme isteği metinleri) | Evet | Evet | App Functionality |
| Purchases → **Purchase History** (ücretli paket işlem doğrulaması) | Evet — *satın alma eklendiğinde* | Evet | App Functionality |
| Photos or Videos | **Hayır** (fiş fotoğrafı cihazda okunur, gönderilmez) | — | — |
| Contact Info, Location, Contacts, Usage Data, Diagnostics | **Hayır** | — | — |

**Encryption:** `ITSAppUsesNonExemptEncryption: false` zaten ayarlı (yalnızca standart HTTPS).

---

## 3. Google Play — Data Safety cevapları

**Veri toplama:** Evet (yalnızca aşağıdakiler). **Veri paylaşımı (üçüncü taraflarla):** Hayır — hizmet sağlayıcılar (Google Apps Script, Expo push) kullanıcı adına veri işleyen "servis sağlayıcı" sayılır, "paylaşım" değildir.

| Kategori | Tür | Toplanıyor | Paylaşılıyor | Zorunlu mu | Amaç |
|---|---|---|---|---|---|
| Device or other IDs | Device or other IDs | Evet | Hayır | İsteğe bağlı (yalnızca Danışmanlık kullanılırsa) | App functionality |
| Messages / User content | Other in-app messages | Evet | Hayır | İsteğe bağlı | App functionality |
| Financial info | Purchase history | Evet — *satın alma eklendiğinde* | Hayır | İsteğe bağlı | App functionality |
| Photos and videos | — | **Hayır** | — | — | — |
| Personal info, Location, Health, Contacts, App activity, Web browsing | — | **Hayır** | — | — | — |

- **Veriler aktarım sırasında şifreleniyor mu:** Evet (HTTPS).
- **Kullanıcı verilerinin silinmesini isteyebilir mi:** Evet — e-posta ile başvuru (Gizlilik Politikası bölüm 7). *Play Console "veri silme talebi için URL/e-posta" ister: aynı iletişim adresini ver.*
- **Hedef kitle:** 13 yaş ve üstü / genel kitle; çocuklara yönelik değil.

---

## 4. İzin gerekçeleri (formlarda ve inceleme notunda)

| İzin | Neden |
|---|---|
| Kamera | Yakıt fişini fotoğraflayıp yazıları cihazda okumak |
| Fotoğraflar/Galeri | Daha önce çekilmiş fiş fotoğrafını seçmek |
| Bildirimler | Bakım/sigorta/muayene hatırlatıcıları ve uzman yanıtı hazır bildirimi |

---

## 5. App Review notu (Apple ve Google inceleme notu alanı, **İngilizce**)

```
OtoHead is a vehicle-management app (maintenance, fuel and insurance tracking).
Most features work offline with local data and need no account.

The paid "Consulting" feature sends a vehicle-recommendation request or a listing-
evaluation request to a human expert, who replies manually. Because a person writes
each reply, it can take from a few minutes to several hours. To review this feature
without waiting:
  1. Open the Danışmanlık (Consulting) tab and submit a request.
  2. Contact us at emrullah-basar@outlook.com; we will reply to your test request right
     away (typically within 15 minutes during the review window) and the app shows a
     push notification and the answer.
The app does not use accounts. Purchases are handled only through Apple In-App
Purchase / Google Play Billing. A "Restore Purchases" button is available.
```

*İnceleme sırasında bildirim gelince hemen yanıt verebilecek durumda olmalısın (Sheets'te durumu `HAZIR` yap). Aksi hâlde "özellik test edilemedi" gerekçesiyle red gelebilir.*

---

## 6. Yayın öncesi teknik yapılacaklar

Koddan tespit edilenler; öncelik sırasıyla:

1. ~~Uygulama içi "Gizlilik" bölümü~~ — **yapıldı** (Ana Sayfa altındaki "Gizlilik ve Veriler": kimlik paylaşma, silme talebi e-postası, politika bağlantısı). Politika adresi yayınlanınca `src/config/legal.ts` içindeki adresi doğrula.
2. **"Satın Almaları Geri Yükle" butonu** (Apple için zorunlu) — uygulama içi satın alma işiyle birlikte.
3. ~~Kullanılmayan paketleri temizle~~ — **yapıldı** (7 paket kaldırıldı; yeni derlemede yerel modüller de küçülür).
4. **Android izinlerini gözden geçir:** `READ_EXTERNAL_STORAGE` ve `READ_MEDIA_IMAGES` (`app.config.ts`) Google Play'de "fotoğraf/video izinleri" politikası kapsamındadır ve ek beyan isteyebilir. Fotoğraf seçici sistem seçicisini kullandığı için büyük olasılıkla gerekmiyor; Android derlemesinde test edip kaldırmak Play incelemesini kolaylaştırır.
5. ~~Paket kimliği~~ — **yapıldı** (`com.emrullah4.otohead`); yeni kimlikle iOS ve Android derlemeleri bekliyor.
6. **Mağaza açıklamasında** "sınırsız danışmanlık" gibi ifadelerden kaçın (gerçekte 5 takip hakkı ile sınırlı); ekran görüntüleri ve açıklama uygulamanın gerçek işleviyle uyuşmalı.
7. **Uygulama ikonu ve adı** son hâline gelmeli (ad OtoHead; başka bir markayla karışmadığından emin ol).

---

## 7. Mali müşavir / avukata sorulacaklar

- Şahıs olarak mı, şirket olarak mı satış yapılacak? (Apple/Google gelirleri, KDV, gelir vergisi, e-fatura/e-arşiv yükümlülüğü)
- **VERBİS** kaydı gerekiyor mu? (Küçük veri sorumluları için muafiyet şartları)
- Verilerin **Google (yurt dışı) sunucularında** işlenmesi için KVKK md. 9 kapsamında açık rıza metni yeterli mi, ek önlem gerekir mi?
- Danışmanlık hizmetinin (insan uzman, tavsiye niteliği) **sorumluluk sınırı** ve kullanım koşulları metni.
- Saklama süresi için somut bir süre belirlemek gerekiyor mu? (Politikada şu an "gerekli olduğu sürece")
