# Ptero Store & Cloud Hosting Web Application

Website Toko Jual Panel Pterodactyl & Cloud Hosting dengan Sistem Saldo Otomatis, Multi-Payment Gateway (Pakasir & Flowix), Auto Credentials Generator, Live Chat Support, Running Broadcast, dan Panel Admin Lengkap.

---

## 🚀 Fitur Unggulan Terbaru (v2.0.2)
1. **Multi-Payment Gateway Otomatis**:
   - **Pakasir Payment Gateway** (QRIS & Virtual Account BNI / BRI).
   - **Flowix Payment Gateway** (QRIS & Virtual Account BCA / Mandiri).
   - **Metode Transfer Manual** (QRIS All Payment, DANA, GoPay, Bank BCA).
2. **Standard EMVCo QRIS Generator**:
   - Render QRIS tajam, presisi, dan resolusi tinggi (bebas error scan dari semua E-Wallet & M-Banking).
3. **Pterodactyl Dynamic Port Binding**:
   - Otomatis menyesuaikan port alokasi panel Pterodactyl (`SERVER_PORT` / `PORT` / `WEB_PORT`) dan host `0.0.0.0`.
4. **Auto Account & Server Generator**:
   - Akun dan kredensial login Pterodactyl di-generate instan setelah pembelian server.
5. **Panel Admin Lengkap**:
   - Konfirmasi & Approve/Reject Topup.
   - Manajemen paket panel (tambah/edit/hapus harga & spesifikasi).
   - Manajemen kode voucher & diskon promo.
   - Live Chat Support & Running Text Broadcast.
   - Konfigurasi API Key Gateway & Domain Panel.

---

## 📦 Cara Install & Menjalankan di Pterodactyl Panel

1. **Upload File**:
   - Upload file `ptero-shop-web.zip` ke File Manager panel Pterodactyl Anda, lalu **Unarchive / Extract**.

2. **Konfigurasi Environment (`.env`)**:
   - Rename file `.env.example` menjadi `.env` (atau buat file `.env` baru).
   - Isi konfigurasi:
     ```env
     PORT=3000
     ADMIN_USERNAME=admin
     ADMIN_PASSWORD=admin123
     PTERO_DOMAIN=https://panel.domainanda.com
     
     # Payment Gateway Pakasir (https://app.pakasir.com)
     PAKASIR_PROJECT=pterostore
     PAKASIR_API_KEY=your_pakasir_api_key_here

     # Payment Gateway Flowix (https://flowix.web.id)
     FLOWIX_API_KEY=sk-d2e1f23c-817d343e328c-a8fe474da8a3
     FLOWIX_MERCHANT_ID=MID-TAT2676
     FLOWIX_WEBHOOK_SECRET=whsec_bbe2272d8fe61101125903d59f7061c
     ```

3. **Install Dependencies**:
   - Di tab **Console** Pterodactyl, jalankan perintah:
     ```bash
     npm install
     ```

4. **Jalankan Server**:
   - Klik tombol **Start** pada panel Pterodactyl (atau ketik `npm start` di Console).
   - Buka browser Google Chrome dan akses alamat:
     ```
     http://IP_SERVER:PORT_ALLOCATION
     ```
     *(Contoh: `http://103.187.147.20:25565`)*

---

## 🔐 Akun Default Admin:
- **Username**: `admin`
- **Password**: `admin123`
