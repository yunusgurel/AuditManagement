# Denetim Yönetim Sistemi (Audit Management System)

Kurumsal denetim süreçlerini yönetmek için tasarlanmış kapsamlı bir web uygulaması.

## Özellikler

### Kimlik Doğrulama
- **Admin ve Takım Üyesi Rolleri**: Rol tabanlı erişim kontrolü
- **Demo Hesabı**: İlk kullanıcılar demo verilerle hızlı başlayabilir
- **Supabase Auth**: Güvenli kimlik doğrulama

### Kullanıcı Yönetimi
- Admin tarafından kullanıcı ekleme ve silme
- Profil yönetimi
- Rol atama (admin/takım üyesi)

### Müşteri Yönetimi
- Müşteri bilgileri kaydetme (ad, iletişim, telefon, adres)
- Müşteri listesini görüntüleme
- Admin tarafından müşteri ekleme/düzenleme/silme

### Görev Yönetimi
- Görev oluşturma ve atama
- Takım üyelerine atama
- Durum takibi (bekleme, devam ediyor, tamamlandı)
- Son tarih belirleme

### Denetim Süreci
- Denetim başlatma
- Form şablonları seçme
- Denetim ilerleyişi takibi
- Durum yönetimi (taslak, devam ediyor, tamamlandı)

### Form Şablonları
- Denetim şablonları oluşturma
- Şablon türü belirleme (Mali, Uyum, İç, Kalite)
- Admin tarafından yönetim

### Belge Yönetimi
- Klasör yapısı (Toplantı Notları, Çalışma Kağıtları, Sözleşmeler, Kanıtlar)
- Müşteri başına klasör organizasyonu
- Dosya yükleme desteği

### Kontrol Listeleri
- Denetim kontrol listeleri oluşturma
- Madde madde kontrol etme
- İlerleme takibi
- Tamamlama yüzdesi gösterimi

### Pano
- Gerçek zamanlı istatistikler
- Müşteri sayısı
- Görev ve denetim istatistikleri
- Takım üyesi sayısı


### İlk Giriş Adımları

1. **"Demo Verileriyle Başla"** butonuna tıklayın
2. Sistem otomatik olarak demo hesabı ve örnek verileri oluşturacaktır
3. Demo hesabıyla giriş yapabilirsiniz

## Teknik Yığın

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Durum Yönetimi**: React Context API
- **Veritabanı**: Supabase PostgreSQL
- **Kimlik Doğrulama**: Supabase Auth
- **UI Bileşenleri**: Lucide React (İkonlar)
- **Build Tool**: Vite

## Kurulum ve Çalıştırma

### Gereksinimler
- Node.js 16+
- npm veya yarn

### Kurulum

```bash
npm install
```

### Geliştirme Sunucusu

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacaktır.

### Üretim Derlemesi

```bash
npm run build
```

## Veritabanı Yapısı

### Ana Tablolar

1. **profiles** - Kullanıcı profilleri
2. **clients** - Denetim müşterileri
3. **tasks** - Denetim görevleri
4. **audits** - Denetim süreçleri
5. **form_templates** - Denetim şablonları
6. **folders** - Belge klasörleri
7. **documents** - Yüklenen belgeler
8. **checklists** - Denetim kontrol listeleri
9. **checklist_items** - Kontrol listesi öğeleri
10. **activity_logs** - Aktivite günlüğü

### Güvenlik

- Row Level Security (RLS) etkinleştirilmiş
- Rol tabanlı erişim kontrolü
- Kimlik doğrulama gerektiren politikalar

## Sayfa Yapısı

### Admin Görünümü

- **Dashboard**: Genel istatistikler ve hızlı eylemler
- **User Management**: Kullanıcı yönetimi
- **Client Management**: Müşteri yönetimi
- **Form Templates**: Şablon yönetimi
- **Tasks**: Görev yönetimi
- **Audits**: Denetim yönetimi
- **Checklists**: Kontrol listeleri
- **Documents**: Belge yönetimi
- **Profile**: Profil ayarları

### Takım Üyesi Görünümü

- **Dashboard**: İstatistikler
- **Tasks**: Atanan görevler
- **Audits**: Atanan denetimler
- **Checklists**: Kontrol listeleri
- **Documents**: Belgeler
- **Profile**: Profil ayarları

