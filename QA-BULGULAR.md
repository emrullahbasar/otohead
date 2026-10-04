# OtoHead QA bulguları (canlı günlük)

Kısaltmalar: [T]=emülatörde çalıştırıp doğrulandı, [K]=kod okuyarak çıkarım (çalıştırılmadı), [iOS]=iOS'a özgü, yalnızca koddan

## Bulgular
(aşağıya eklenir)

### Cihaz/paket düzeyi
- [T] YÜKSEK (mağaza): Gizlilik politikası adresi (github.io/OtoHeadLegal) HTTP 404. Uygulamadaki "Gizlilik Politikasının Tamamını Oku" 404 sayfasına gider. Eski ad (OtoCepLegal) de 404.
- [T] ORTA (mağaza/Play politikası): Android manifestinde READ_MEDIA_IMAGES, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, READ_MEDIA_VISUAL_USER_SELECTED istenmiş. Uygulama sistem fotoğraf seçicisini kullanıyor, bu izinlere ihtiyaç yok (Google Play "Fotoğraf/Video izinleri" politikası + Data Safety beyanı gerektirir). requestMediaLibraryPermissionsAsync() çağrısı da gereksiz.
- [T] DÜŞÜK-ORTA: development derlemesinde SYSTEM_ALERT_WINDOW hâlâ isteniyor (app.config blockedPermissions'a rağmen; dev-client'tan geliyor olabilir). Production derlemesinde ayrıca doğrulanmalı.
- [T] iyi: allowBackup kapalı, targetSdk 36, minSdk 24.

### Ana sayfa / Gizlilik
- [T] ORTA (dil): textTransform:'uppercase' Türkçe'de "i"yi "İ" yapmıyor → "VERILERINIZ NEREDE?", "CIHAZ KIMLIĞINIZ", ayrıca formlarda "TARIH", "YAKIT LITRE FIYATI", "KASA TIPI", "VITES TIPI"... (noktasız I). Yaygın kusur, tüm etiketlerde.
- [T] iyi: Paylaş (Android paylaşım sayfası, Kopyala var), mailto yoksa bilgilendirme uyarısı çalışıyor, politika bağlantısı tarayıcıda açılıyor (ama 404).
- [T] DÜŞÜK: e-posta uygulaması yoksa çıkan uyarıda adres kopyalanamıyor.
- [T] DÜŞÜK (erişilebilirlik): "Gizlilik ve Veriler" bağlantısı dokunma alanı ~30dp (<48dp).
### Araç yönetimi
- [T] iyi: boş form ("Marka, model ve yıl zorunludur"), "Önce marka seçin", uzun ad kartta sarılıyor.
- [T] DÜŞÜK: takma ada uzunluk sınırı yok (125+ karakter kabul; detay başlığı 4 satıra taşıyor).
- [T] DÜŞÜK: kartta takma ad varsayılan olarak "Marka Model" olunca aynı metin iki kez görünüyor.
- [T] ORTA: Kilometre boşken Muayene→Kaydet: önce "Aracınız ticari araç mı?" sorulur, eksik-alan hatası ondan SONRA gelir.
- [T] YÜKSEK: Bu başarısız (kaydedilmemiş) girişte bile hatırlatma alarmları planlanıyor (dumpsys alarm: 2 alarm oluştu, kayıt yok = hayalet bildirim).
- [T] YÜKSEK: Kayıt silinince planlanmış hatırlatma alarmları SİLİNMİYOR (kayıt silindikten sonra 4 alarm duruyor) → silinmiş kayıt için 2028'de bildirim gelir.
- [K] DB: deleteCar fuel_records'ı silmiyor + alarmları iptal etmiyor.
- [T] YÜKSEK (veri hatası): Bakım formunda Kilometre/Sonraki km/Ücret alanı "85.000" yazılınca "85" oluyor (nokta ve sonrası sessizce atılıyor; parseInt). Ücrette "1250.75" → "1,250" (kuruş kayboluyor). Aynı biçimlendirici Danışmanlık bütçesinde yok ama bakımda hem giriş hem RecordDetailModal'da var.
- [T] ORTA (tutarsızlık): binlik ayracı formlarda virgül ("85,000" / "10,000 km", en-US) ama kartlarda nokta ("85.000 km", tr-TR); placeholder "örn. 500.000" nokta.
- [T] YÜKSEK: Bakım kaydını hiçbir şeyi değiştirmeden "Düzenle→Kaydet" yapmak hatırlatma alarmlarını katlıyor (6→8). Her düzenleme yeni kopya ekliyor; eskiler iptal edilmiyor → aynı hatırlatma birden çok kez gelir.
- [T] iyi: kayıt sonrası kart, "Sonraki: tarih / km", "Hedefe kalan", ücret biçimi doğru; "Son bilinen km" başlıkta.

### Yakıt takip (gerçek kodla mantık testi, fueltest.js)
- [T] YÜKSEK (yanlış sonuç): Full → Parça → Full dolumda (85.000km/40L, 85.300km/20L parça, 85.700km/30L) uygulama 4,29 lt/100km gösteriyor; doğrusu (20+30)/700 = 7,14 (%40 eksik). Ara parça dolumlar hesaba katılmıyor; toplam maliyet de yalnızca son dolumu içeriyor (1320 TL, doğrusu 2180). "Parça dolum" özelliğinin kendisi reklamı yapılıp hesabı bozuyor.
- [T] YÜKSEK: Geçmiş tarihli bir kayıt sonradan eklenirse (kayıtlar ekleme sırasına göre, tarihe göre değil sıralı) analiz "-1200 km yol, 0 lt/100km" gösteriyor; "Önceki km" otomatik doldurma da yanlış kayıttan geliyor.
- [T] ORTA: mesafe 0 ise "0 lt/100km, 0 ₺" gösteriliyor (uyarı yok).
- [T] YÜKSEK (kilitlenme): Bir filtre (1 Ay/6 Ay/1 Yıl) sonuç vermezse FuelHistoryView tüm filtre çubuğunu gizleyip yalnızca "Henüz yakıt kaydı bulunmuyor" yazıyor; kullanıcı filtreyi geri alamıyor (araç değiştirene kadar). Mantık testi: 3 ay önceki tek kayıtta 1 Ay filtresi 0 sonuç.
- [T] iyi: boş Kaydet → "Eksik Bilgi: Litre fiyatı, alınan yakıt ve güncel kilometre zorunludur".
- [T] YÜKSEK (gizlilik/veri): Araç silinince "aracı ve TÜM kayıtlarını sil" uyarısına rağmen fuel_records kalıyor (DB doğrulandı: araç 0, bakım 0, yakıt kaydı 1) ve 8 hatırlatma alarmı duruyor. Silinen aracın verisi kalıcı olarak cihazda kalır; aynı carId hiç kullanılmadığı için ulaşılamaz çöp.
- [T] DÜZELTME: ücret DB'ye 1250.75 olarak doğru yazılıyor; ama formda "1,250", kartta "1.250 ₺" (parseInt) görünüyor → kuruş gizleniyor, kullanıcı ne kaydettiğini göremiyor.
- [T] iyi: temiz kurulumda sunucuya hiç temas yok (client_config yalnızca clientId; secret/önbellek yok) → gizlilik metniyle uyumlu.
- [T] ORTA (çökme): Araç eklerken "Diğer"e özel marka olarak `constructor` (veya toString/valueOf/__proto__ vb.) yazılınca uygulama JS tarafında çöküp yeniden başlıyor (React kökü yeniden çalıştı; "Foo" ile kontrol deneyi sorunsuz). Sebep: carApi.fetchModels `cars[brand] ?? []` prototip zincirine bakıyor → dizi olmayan değer dönüyor → `[...models]` patlıyor. Kullanıcı girdisiyle tetiklenen çökme.

### Danışmanlık
- [T] iyi: Öneri formu doğrulamaları (bütçe boş/0, yıl boş, 4 hane, min>max, <1990, >yıl+1, seçim yok) doğru mesajlar veriyor; hata sayfanın başına kaydırılıyor; çoklu seçim ("Sedan, SUV") çalışıyor.
- [T] ORTA (UX): Seçim penceresi ilk açıldığında "Fark Etmez" hiç dokunulmamışken ✓ işaretli görünüyor; alan ise "Seçin" ve "Tamam"a basınca form "seçimi zorunludur" diyor (yanıltıcı; seçimin kabul edildiğini sanır).
- [T] YÜKSEK (UX): Çevrimdışıyken kullanıcı ham İngilizce "⚠️ Network request failed" görüyor (Türkçe, anlaşılır mesaj yok; aynı yol durum kontrolünde de).
- [K] ORTA: Bekleyen (BEKLİYOR) istek için iptal/vazgeç yolu yok; uzman hiç yanıtlamazsa kullanıcı yeni istek gönderemez ("Zaten bekleyen") ve isteğinin içeriğini de göremez.
- [K] DÜŞÜK: Öneri formunda "Kullanım amacı" için minimum uzunluk yok (1 karakter geçer); değerlendirme formunda 10 karakter şartı var (tutarsız). İlan numarası alanı rakam doğrulaması yapmıyor (yapıştırma ile harf girilebilir).
- [K] DÜŞÜK (gizlilik): Formda "isim/telefon yazmayın" uyarısı yok (yalnızca politika metninde var); serbest metin sunucuya gidiyor.
- [K] DÜŞÜK: durum sorgusunda gizli anahtar (secret) URL sorgusunda (GET); Google günlüklerinde görünebilir. EXPO_PUBLIC_APPS_SCRIPT_URL derlemede yoksa istek '' adresine gider (derleme zamanı kontrolü yok).

### Fiş tarayıcı
- [T] iyi: Kamera izni isteme → çekim → OCR → "Fiş Okunamadı" uyarısı akışı çökmeden çalışıyor (sanal kamera sahnesinde yazı yok, beklenen sonuç).
- [T] DÜŞÜK: Kamera izni reddedilince uyarı "Ayarlar > OtoHead > Kamera" diyor ama "Ayarları Aç" düğmesi yok (2 red sonrası Android tekrar sormaz; kullanıcı elle gitmek zorunda).
- [T] emülatör sınırı: Galeri seçici (PICK_IMAGES) bu emülatörde başlamıyor (result code -91) → galeri yolu çalıştırılamadı, gerçek cihazda test edilmeli. [K] Galeri yolunda READ_MEDIA_IMAGES izni isteniyor (gereksiz, Play politikası).
- [T] DÜŞÜK: Araç ekleme formunda "İptal" alanları temizlemiyor (marka "Foo" formu yeniden açınca hâlâ seçili).
- [T] DÜŞÜK: "Audi A3" (takma ad yokken) kartta iki kez.
- [T] YÜKSEK (görsel): Android durum çubuğu simgeleri (saat, Wi‑Fi, sinyal, pil) açık zeminde BEYAZ → neredeyse görünmüyor (dumpsys mAppearance=0, ekran görüntüsü doğruladı). Tüm ana ekranlarda. StatusBar stili koyu olmalı (expo-status-bar / androidStatusBar.barStyle).
- [T] YÜKSEK (erişilebilirlik/uyumluluk): Ana sayfa alt bilgisi ve "Gizlilik ve Veriler" bağlantısı border rengiyle (#E2E8F0) yazılmış: kontrast 1,16:1 → fiilen görünmez. Politika bağlantısının bulunabilirliği (mağaza gereği) zayıf.
- [T] ORTA: text.muted (#8A9AB0) 2,7–2,9:1 (WCAG AA 4,5 altında): form etiketleri, ipuçları, pasif sekme etiketleri (10px!), kart alt yazıları. Yakıt formu placeholder #aaa 2,19:1. Uyarı (turuncu) 3,2:1, yeşil tutar 3,3:1.
- [T] DÜŞÜK: Bakım formunda placeholder rengi çok koyu (#52525B, 7,3:1) → girilmiş metin gibi görünüyor, "dolu mu boş mu" ayırt etmek zor.

### Büyük yazı (font_scale 2.0, erişilebilirlik)
- [T] YÜKSEK: Alt sekme etiketleri kesiliyor/kırpılıyor ("Ana", "Yakıt", "Araç Yö", "Danışm") — sabit genişlik (72) ve yükseklik. Diğer ekranlar sarılarak uyum sağlıyor (iyi).
- [T] DÜŞÜK: Danışmanlık alt sekmeleri büyük yazıda kenara yapışıyor ("Kriterlere Göre" x=0'dan başlıyor).

### Hatırlatma/tarih mantığı (remtest.js, gerçek kodla) ve performans
- [T] iyi: 8 bakım türünün aralıkları (Muayene 2 yıl binek/1 yıl ticari, Sigorta/Kasko 1 yıl, Periyodik +10.000km/1 yıl, Lastik +40.000/2 yıl, Triger +60.000/4 yıl, Fren +30.000/2 yıl, Akü 3 yıl) doğru hesaplanıyor; geçmiş tarihli hatırlatmalar atlanıyor; kullanıcının girdiği tarih/km artık kullanılıyor.
- [T] DÜŞÜK: 29 Şubat başlangıcında yıl eklenince tarih 1 Mart'a kayıyor (29.02.2028 + 2 yıl = 01.03.2030; 28.02.2030 olmalı).
- [T] DÜŞÜK-ORTA: Geçersiz tarih metinleri JS'te taşarak "geçerli" sayılıyor (32.13.2026 → 01.02.2028; kullanıcı tarihi 99.99.9999 olduğu gibi saklanıp alarm kuruluyor). Seçiciyle üretilemez ama düzenleme/bozuk veriyle mümkün.
- [T] ORTA: "Sonraki bakım km" işlem km'sinden KÜÇÜK girilebiliyor (90.000 < 95.000): kayıt olduğu gibi saklanıyor, kart hemen "Hedef km'ye ulaşıldı" diyor, alarmlar ise başka değerle (+10.000) kuruluyor → tutarsız.
- [T] DÜŞÜK: Km/ücret alanlarında üst sınır yok (13 haneli km kabul; 9999999999999); negatif işaret klavyeden girilebilir.
- [T] iyi: ~330 yakıt kartı + 60 bakım kaydıyla ekran akıcı (gfxinfo: %1,4 atlayan kare; liste sanallaştırılmamış ama emülatörde sorun yok; düşük donanımda ayrıca denenmeli).

### Fiş ayrıştırıcı (parse2.js, gerçek kodla; kayıtlı 23 test geçiyor)
- [T] DÜŞÜK-ORTA: Markası tanınmayan fişlerde "İstasyon" alanına ilk satır yazılıyor; ilk satır tarihse "Tarıh 25.09.2026" gibi anlamsız bir değer (ayrıca "Tarıh" yanlış küçük/büyük harf dönüşümü) forma dolar.
- [T] DÜŞÜK: Birim fiyat basılı 42,53 iken toplam/litre'den hesaplanan "42.532" (3 ondalık) yazılıyor; basılı fiyat tutarlıysa onu kullanmak daha doğru.
- [T] DÜŞÜK: "LT 30,0" (tek ondalık) ve "TL/LT 40,00" biçiminde litre/fiyat okunamıyor (yalnızca toplam+tarih döner). İngilizce fişler desteklenmiyor (beklenen).
- [T] iyi: plaka/fiş no km sanılmıyor, KDV satırı toplam sayılmıyor, gelecek tarih ve geçersiz ay reddediliyor, iki tarihli (vade) fişte fiş tarihi seçiliyor.

### Android sistem davranışları
- [T] ORTA: Donanım "Geri" tuşu seçim pencerelerini (Marka/Model/Yıl/İşlem türü) kapatmıyor; yalnızca "İptal" çalışıyor (Modal'da onRequestClose yok). [K] aynısı bakım kaydı detay penceresi ve Danışmanlık seçim penceresinde de geçerli.
- [T] bilgi: Sistem karanlık modunda uygulama açık temada kalıyor (userInterfaceStyle: light, bilinçli); ancak durum çubuğu simgeleri beyaz zeminde tamamen kayboluyor (aynı durum çubuğu bulgusu).
- [K] KÖK NEDEN durum çubuğu: expo-status-bar paketi kurulu ama hiçbir yerde <StatusBar> kullanılmıyor (src'de/App.tsx'te hiç geçmiyor).
- [K] ÖLÜ KOD: src/components/KeyboardSafeView.tsx hiçbir yerde kullanılmıyor; src/screens/SuggestionsScreen/components/ResultCard.tsx boş (0 satır). package.json'da 7 paket temizlendi ama bu dosyalar kaldı.

### iOS (yalnızca koddan; çalıştırılamadı)
- [iOS][K] ORTA: Tüm sayısal alanlar (bakım km/ücret, danışmanlık bütçe/yıl, yakıt km) "numeric"/"number-pad"/"decimal-pad". iOS'ta bu klavyelerde Return/Bitti tuşu YOK: returnKeyType ve onSubmitEditing (bir sonraki alana geç) hiç çalışmaz, klavyeyi kapatmak için ekrana dokunmak gerekir; hiçbir ScrollView'da keyboardDismissMode/inputAccessoryView yok → klavye "Kaydet" düğmesini örter, kullanıcı kapatamayabilir. Android'de sorun yok (Gboard'da tamam tuşu var).
- [iOS][K] DÜŞÜK: DateTimePickerModal isDarkModeEnabled + sabit koyu kap (#1c1c1e) ile açık temalı uygulamada koyu takvim açar (bilinçli olabilir; tutarlılık).
- [iOS][K] DÜŞÜK-ORTA: Bildirim izni ilk açılışta bağlamsız isteniyor (App Review genellikle sorun etmez; reddedilirse hatırlatmalar sessizce çalışmaz, uygulama içinde bilgi yok).

### Koddan çıkan ek bulgular (çalıştırılmadı)
- [K] ORTA: "Vazgeç" (kayıt düzenleme) yazılan değişiklikleri sıfırlamıyor; yeniden "Düzenle" denince vazgeçilen metinler duruyor (RecordDetailModal, edit* state yalnızca openDetail'de sıfırlanır).
- [K] DÜŞÜK-ORTA: Düzenlemede "Muayene" kaydı her kaydedişte yine "Aracınız ticari araç mı?" soruyor.
- [K] DÜŞÜK: Ana Sayfa istatistikleri her odakta "loading=true" yapıyor → sekmeye her dönüşte iskelet kartlar yanıp sönüyor.
- [K] DÜŞÜK: Yakıt: araç değiştirirken loadRecordsForCar iptal edilmiyor; yavaş cihazda önceki aracın sonucu yenisinin üstüne yazabilir (yarış).
- [K] ORTA (ürün): allowBackup kapalı ve dışa aktarma yok → telefon değişince/uygulama silinince tüm araç, bakım, yakıt verisi kalıcı olarak gider (ücretli yedek özelliği planlı ama ücretsiz kullanıcı için uyarı yok).
- [K] ORTA (fiş): Bir kayıtta "Önceki km" alanı kullanıcı tarafından düzenlenebiliyor; "85.000" yazılırsa parseFloat → 85 (mevcut kayıt varsa "Hatalı kilometre" hatası, ilk kayıtta sessizce 85).
- [K] ORTA (sunucu, Apps Script): Uzman "HAZIR" durumunu öneri metni yazmadan işaretlerse kullanıcı boş cevap görür ve uygulama hemen "GÖRÜLDÜ" yapar; sonradan yazılan metin fark edilmez. (handleCheck HAZIR + boş recommendation kontrolü yok.)
- [K] DÜŞÜK (sunucu): Öneri sayfası HAZIR durumunda yeni istek engelliyor ("Zaten aktif bir öneriniz var") ama değerlendirme sayfası yalnızca BEKLİYOR'da engelliyor (tutarsız); markSeen ağ hatasıyla başarısız olursa kullanıcı yeni istek gönderemez.
- [K] DÜŞÜK (sunucu): onSheetEdit yalnızca tek satırlık, elle yapılan HAZIR düzenlemesinde bildirim gönderir (çoklu satır yapıştırma/otomatik doldurma gönderilmez); Expo push yanıtı (DeviceNotRegistered) işlenmiyor, geçersiz token temizlenmiyor.
- [K] DÜŞÜK (sunucu): Clients sayfasında her sorguda satır taraması (önbellek 1 sa); on binlerce kullanıcıda yavaşlar. Kontrol/durum uçlarında hız sınırı yok (yalnızca register).
- [K] Bildirim izni reddedilirse hatırlatmalar sessizce çalışmaz; uygulamada bunu söyleyen bir yer yok.
- [K] Danışmanlık/Yakıt/Bakım için Android tablet/katlanabilir (targetSdk 36 yönlendirme kilidini yok sayar) düzeni denenmedi.

### Test edilemeyenler
iOS çalışma zamanı (elimde iOS cihaz/simülatör yok), galeri fiş seçimi (emülatör fotoğraf seçicisi yok), gerçek kamerayla OCR, push bildirim teslimi (FCM V1 anahtarı EAS'te yok), açılış (splash) ekranı (dev-client'ta görünmüyor), TalkBack, Türkçe karakter girişi (adb sınırı), öneri formunun gerçek gönderimi (Sheets'e satır yazmamak için).
