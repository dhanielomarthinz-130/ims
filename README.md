# WMS Smart Inventory Management System

Sistem Manajemen Inventory & Gudang Modern dengan alur **Inbound Staging via Handheld**, **Cetak Label QR Code Pallet**, **Putaway Scanner ke Rak Gudang**, **Database Produk 12 Kolom SAP**, **Upload/Download Template Excel**, serta **Otentikasi Multi-Divisi (RBAC)**.

---

## 🌟 Fitur Utama

1. **📱 Panel Operator (Handheld PDA / Mobile View)**:
   - **Inbound Staging**: Form cepat penerimaan barang, auto-generate License Plate (`LP-XXXXXX`), dan cetak label QR Code (Thermal Label 50x30mm & 100x75mm).
   - **Putaway ke Rak**: Scan QR Item $\rightarrow$ Sistem memberi saran lokasi rak $\rightarrow$ Scan QR Rak $\rightarrow$ Konfirmasi perpindahan stok realtime.
   - **Check Stock Gudang**: Scan barcode SKU/Rak untuk cek stok cepat dengan prioritas FEFO (First-Expired, First-Out).
2. **🖥️ Panel Admin (Desktop Dashboard)**:
   - **Dashboard KPI & Peta Visual Rak 2D**: Visualisasi keterisian rak Zona A, B, C, D, dan Staging Area.
   - **Check Stock Gudang Besar (12 Kolom SAP Schema)**: Tabel komprehensif `[SKU, Sku Name, Sap Code, Category, Qty Rack, Qty Sap, Qty On Hand, Qty On Order, Available Qty, Reserve Qty, Is Under Reserve, Status]` + Export CSV.
   - **Upload & Download Template Excel**: Upload file Excel produk dengan mode *Merge/Update* atau *Replace All*.
   - **Dokumen Inbound (GRN)**: Preview dan cetak Dokumen Penerimaan Barang A4 dengan tanda tangan.
   - **Master Data & Cetak QR Rak**: Kelola master SKU dan cetak lembaran stiker QR Code seluruh rak gudang.
   - **Manajemen User Divisi**: Khusus Super Admin untuk mengelola akun staf dan role divisi.
3. **☁️ Integrasi Supabase Cloud & Vercel Ready**:
   - Backend PostgreSQL gratis di Supabase dengan RLS dan skrip migrasi 1-klik `supabase_schema.sql`.
   - Siap dideploy ke Vercel tanpa perlu konfigurasi server tambahan.

---

## 👥 Kredensial Login & Role Divisi

| Nama Pengguna | Username | Password | Role / Divisi | Hak Akses Menu |
| :--- | :--- | :--- | :--- | :--- |
| 👑 **Daniel Imsula** | **`daniel`** *(atau Daniel Imsula)* | **`Dh@niel0`** | **Super Administrator** | **Akses Penuh Semua Menu** (Admin Panel, Handheld Panel, Inbound, Putaway, Check Stock 12 Kolom, Master Data, Manajemen User Divisi, Upload Excel) |
| 📥 **Budi Santoso** | `inbound.op` | `inbound123` | **Devisi Inbound (Staging)** | Form Inbound Staging, Cetak Label QR Pallet, Cek Stok |
| 🚜 **Rian Pratama** | `putaway.op` | `putaway123` | **Devisi Putaway (Rak)** | Putaway Scan (Item $\rightarrow$ Rak $\rightarrow$ Pindah Stok), Cek Stok |
| 🔍 **Siti Rahma** | `checker.ic` | `checker123` | **Devisi Inventory Control (IC)** | Check Stock Gudang Besar (12 Kolom), Rekonsiliasi SAP, Upload Excel & Export CSV |
| 👔 **Hendro Wijaya** | `supervisor` | `spv123` | **Supervisor Gudang** | Dashboard KPI, 2D Layout Gudang, Dokumen Inbound (GRN A4), Cek Stok |

---

## 🚀 Panduan Setup Database Supabase (Free Tier)

1. Buka [Supabase](https://supabase.com) dan buat project baru (gratis).
2. Di dashboard Supabase, buka menu **SQL Editor**.
3. Buka file **`supabase_schema.sql`** di repository ini, salin seluruh isinya, dan klik **Run**.
4. Buka menu **Project Settings $\rightarrow$ Data API**:
   - Salin **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - Salin **anon public API Key**.
5. Buka aplikasi WMS, klik tombol **☁️ Supabase Cloud** di header atas, masukkan URL & Key, lalu klik **Simpan Konfigurasi**.

---

## 🌐 Panduan Hosting di Vercel

1. Push project ini ke repositori **GitHub** Anda.
2. Buka [Vercel](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **Add New Project** $\rightarrow$ pilih repositori GitHub `inventory-wms-system`.
4. Di bagian Build & Output Settings, biarkan default (karena sudah terdapat file `vercel.json`).
5. *(Opsional)* Di bagian **Environment Variables**, tambahkan:
   - `SUPABASE_URL` = `<URL Supabase Anda>`
   - `SUPABASE_ANON_KEY` = `<Anon Key Supabase Anda>`
6. Klik **Deploy**! Aplikasi WMS Anda langsung online dan dapat diakses dari mana saja.

---

## 🐙 Cara Push ke GitHub dari Komputer

Jalankan perintah berikut di terminal:

```bash
git init
git add .
git commit -m "feat: initial commit WMS Smart Inventory with 12-column SAP schema, RBAC, and Supabase"
git branch -M main
git remote add origin https://github.com/<USERNAME_GITHUB_ANDA>/inventory-wms-system.git
git push -u origin main
```
