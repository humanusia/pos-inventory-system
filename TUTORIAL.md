# 🏪 Tutorial Lengkap — POS & Inventory System

> **Estimasi setup:** 15-20 menit  
> **Kesulitan:** Mudah — cukup copy-paste & klik-klik

---

## 📋 Daftar Isi

1. [Yang Harus Disiapin](#1-yang-harus-disiapin)
2. [Buat Project Supabase](#2-buat-project-supabase)
3. [Jalankan SQL Schema](#3-jalankan-sql-schema)
4. [Clone & Install Aplikasi](#4-clone--install-aplikasi)
5. [Konfigurasi .env](#5-konfigurasi-env)
6. [Buat User Pertama](#6-buat-user-pertama)
7. [Jalankan Aplikasi](#7-jalankan-aplikasi)
8. [Test Drive: Transaksi Pertama](#8-test-drive-transaksi-pertama)
9. [Tambah Produk & Stok](#9-tambah-produk--stok)
10. [Membership & Poin](#10-membership--poin)
11. [Fitur Lanjutan](#11-fitur-lanjutan)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Yang Harus Disiapin

### Software Wajib (install dulu kalo belum):

| Software | Download | Cek Versi |
|---|---|---|
| **Node.js** | [nodejs.org](https://nodejs.org) → pilih versi LTS | `node -v` (harus ≥ 18) |
| **Git** | [git-scm.com](https://git-scm.com) | `git --version` |
| **Browser** | Chrome / Edge / Firefox | — |

### Akun:

| Akun | Daftar di |
|---|---|
| **Supabase** (gratis) | [supabase.com](https://supabase.com) → Sign Up with GitHub |

---

## 2. Buat Project Supabase

### Step 2.1 — Login & New Project

1. Buka [app.supabase.com](https://app.supabase.com)
2. Klik tombol hijau **"New project"**
3. Pilih organization (default aja)

### Step 2.2 — Isi Form

| Field | Isi | Keterangan |
|---|---|---|
| Name | `pos-inventory` | Bebas, ini nama project |
| Database Password | **Bikin password kuat** | CATAT! Ini penting |
| Region | `Singapore (ap-southeast-1)` | Paling deket, paling cepat |
| Pricing Plan | **Free** | Udah cukup buat development |

4. Klik **"Create project"**
5. **Tunggu ±2 menit** sampai status jadi "Active" (ada progress bar di dashboard)

---

## 3. Jalankan SQL Schema

> ⚠️ **PENTING!** Ini langkah paling krusial. Kalo skip, aplikasi error.

### Step 3.1 — Buka SQL Editor

1. Di sidebar kiri dashboard Supabase, klik **"SQL Editor"** (ikon `</>`)
2. Klik tombol **"New query"** (pojok kanan atas)

### Step 3.2 — Copy-Paste Schema

1. Buka file `schema.sql` dari project ini:  
   [schema.sql →](https://raw.githubusercontent.com/humanusia/pos-inventory-system/main/schema.sql)
2. **CTRL+A** → **CTRL+C** (copy semua)
3. Paste ke SQL Editor Supabase

### Step 3.3 — Run!

1. Klik tombol **"Run"** (atau CTRL+Enter)
2. Tunggu sampai muncul notifikasi **"Success. No rows returned"** warna hijau
3. Kalo muncul merah: baca error-nya, biasanya ada syntax salah pas copy-paste

### Step 3.4 — Jalankan Membership Schema

1. Di SQL Editor, klik **"New query"** lagi
2. Buka file `membership.sql` dari project:  
   [membership.sql →](https://raw.githubusercontent.com/humanusia/pos-inventory-system/main/membership.sql)
3. Copy semua → paste → **Run**
4. Pastikan sukses (notifikasi hijau)

> ✅ **Verifikasi:** Di sidebar kiri, klik **"Table Editor"** — harusnya muncul 7 tabel:  
> `profiles`, `products`, `stock_movements`, `transactions`, `transaction_items`, `members`, `point_transactions`

---

## 4. Clone & Install Aplikasi

### Step 4.1 — Buka Terminal

- **Windows:** Buka PowerShell atau Command Prompt
- **Mac/Linux:** Buka Terminal

### Step 4.2 — Clone Repository

```bash
cd Desktop
git clone https://github.com/humanusia/pos-inventory-system.git
cd pos-inventory-system
```

### Step 4.3 — Install Dependencies

```bash
npm install
```

> Tunggu 1-3 menit. Harusnya muncul `added XXX packages` tanpa error merah.

---

## 5. Konfigurasi .env

### Step 5.1 — Dapatkan API Keys

1. Di dashboard Supabase, klik **"Settings"** (ikon ⚙️) → **"API"** di sidebar
2. Di section **"Project URL"**, copy nilai yang ada. Formatnya:
   ```
   https://xxxxxxxxxxxx.supabase.co
   ```
3. Di section **"Project API keys"**, copy **`anon public`** key. Formatnya:
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 5.2 — Buat File .env

Di folder project `pos-inventory-system`, copy file `.env.example` jadi `.env`:

**Windows:**
```cmd
copy .env.example .env
```

**Mac/Linux:**
```bash
cp .env.example .env
```

### Step 5.3 — Edit .env

Buka `.env` pake Notepad / VS Code, isi:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co    ← paste dari Step 5.1
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...                  ← paste dari Step 5.1
```

**Simpan file!**

---

## 6. Buat User Pertama

### Step 6.1 — Buat Auth User

1. Di dashboard Supabase, klik **"Authentication"** di sidebar kiri
2. Klik tab **"Users"**
3. Klik tombol **"Add user"** → pilih **"Create new user"**

Isi form:

| Field | Isi |
|---|---|
| Email | `admin@pos.local` |
| Password | `admin123456` (bebas, ingat-ingat!) |
| **Auto-confirm user?** | **CENTANG** (penting!) |

4. Klik **"Create user"**
5. Setelah dibuat, **klik icon copy** di kolom **UID** untuk copy user ID
   - Formatnya: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### Step 6.2 — Jadikan Admin

1. Buka **"SQL Editor"** di sidebar
2. Klik **"New query"**
3. Ketik (ganti `PASTE-UID-DISINI` dengan yang lo copy):

```sql
SELECT seed_admin('PASTE-UID-DISINI');
```

Contoh:
```sql
SELECT seed_admin('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```

4. Klik **"Run"** → Harusnya muncul notifikasi hijau

> ✅ Sekarang lo punya user ADMIN dengan PIN `0000`

---

## 7. Jalankan Aplikasi

### Step 7.1 — Start Dev Server

Di terminal (dalam folder project):

```bash
npm run dev
```

Output yang diharapkan:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 7.2 — Buka di Browser

Buka **http://localhost:3000**

Harusnya muncul **halaman login** dengan:
- Logo POS System
- Dua tab: "Email & Password" | "PIN Cepat"

---

## 8. Test Drive: Transaksi Pertama

### Step 8.1 — Login sebagai Admin

1. Di tab **"Email & Password"**:
   - Email: `admin@pos.local`
   - Password: `admin123456` (atau yang lo buat)
2. Klik **"Masuk"**
3. Harusnya masuk ke **Dashboard Admin** (ada card revenue, profit, transaksi)

### Step 8.2 — Tambah Produk

1. Di sidebar kiri, klik **"Inventaris Gudang"**
2. Klik tombol **"Tambah Produk"** (kanan atas)

Isi form:

| Field | Isi Contoh |
|---|---|
| SKU | `DRK-0001` |
| Nama | `Kopi Susu Gula Aren` |
| Kategori | `Minuman` |
| Harga Modal | `12000` |
| Harga Jual | `20000` |
| Stok Awal | `50` |
| Alert Min | `5` |

3. Klik **"Tambah Produk"**

> Ulangi buat beberapa produk lain biar POS-nya rame.

### Step 8.3 — Transaksi di POS

1. Di sidebar, klik **"Point of Sale"**
2. Di panel kiri: klik produk yang mau dibeli → masuk ke keranjang
3. Atur quantity pake tombol `+` / `-`
4. Klik **"Proses Pembayaran"**
5. Pilih metode: **Tunai** / **QRIS** / **Debit**
6. Untuk tunai: input uang diterima → muncul kembalian otomatis
7. Untuk QRIS: langsung klik konfirmasi (simulasi)
8. Klik **"Bayar"**

> ✅ Setelah berhasil: muncul receipt modal dengan nomor invoice.  
> Klik **"Cetak"** buat print struk, atau **"Selesai"** buat lanjut.

---

## 9. Tambah Produk & Stok

### Stok Masuk (Supplier Kirim Barang)

1. Buka **"Inventaris Gudang"**
2. Cari produk di tabel → klik ikon **⇅** (Mutasi Stok)
3. Di form:
   - **Produk:** (auto-selected)
   - **Tipe:** `Stok Masuk`
   - **Jumlah:** jumlah barang masuk
   - **Alasan:** `"Pengiriman supplier PT. ABC"`
4. Klik **"Simpan Mutasi"**

### Stok Keluar (Rusak / Kadaluarsa)

Sama kayak di atas, tapi pilih **"Stok Keluar"** dan alasan misal `"Barang rusak 3 pcs"`.

### Stok Opname (Koreksi)

Pilih **"Stok Opname"** — input jumlah absolute stok sebenarnya. Misal: "Stok opname bulanan Juli".

---

## 10. Membership & Poin

### Step 10.1 — Daftarin Member (Admin)

1. Di sidebar, klik **"Membership & Poin"**
2. Klik **"Tambah Member"**
3. Isi nama & nomor HP (opsional)
4. Klik **"Daftarkan"**

### Step 10.2 — Pakai Member di POS

1. Di halaman **Point of Sale**
2. Di panel kanan (cart), ada search bar **"Cari member (nama/HP)"**
3. Ketik nama member → klik hasilnya
4. Muncul badge **"🎁 Dapat X poin"** — preview poin yang bakal didapat
5. Lanjutkan transaksi seperti biasa
6. Poin **otomatis bertambah** setelah transaksi sukses!

### Step 10.3 — Tukar Poin (Admin)

1. Buka **"Membership & Poin"**
2. Klik **"Tukar"** di card member
3. Input jumlah poin yang ditukar
4. Klik **"Tukar"**

---

## 11. Fitur Lanjutan

### 🌙 Dark Mode
- Klik ikon **🌙** di header (pojok kanan atas)
- Tersimpan otomatis, survive refresh

### 📊 Export CSV
- Klik **"Export"** di header → pilih jenis laporan
- File `.csv` langsung terdownload — bisa dibuka di Excel

### 👥 Tambah Kasir

1. Login sebagai Admin → **"Manajemen Pengguna"**
2. Klik **"Tambah Pengguna"**
3. Isi:
   - Nama: `Budi Kasir`
   - Email: `budi@pos.local`
   - Password: minimal 6 karakter
   - PIN: 4 digit (misal `5678`)
   - Role: pilih **KASIR**
4. Klik **"Buat Pengguna"**

### 🔄 Shift Switch (Kasir)

Kasir bisa ganti akun tanpa logout:

1. Di halaman login, pilih tab **"PIN Cepat"**
2. Klik nama kasir
3. Masukkan 4-digit PIN (otomatis submit)

---

## 12. Troubleshooting

### ❌ "Halaman loading terus" setelah login

**Penyebab:** `.env` salah atau nggak ada.

**Solusi:**
1. Cek file `.env` ada di folder project
2. Pastikan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` bener
3. Restart dev server: `CTRL+C` → `npm run dev`

### ❌ "Invalid login credentials"

**Penyebab:** Email/password salah, atau user belum dibuat.

**Solusi:**
1. Ke Supabase → Authentication → Users
2. Pastikan user dengan email tsb ada
3. Kalo gaada, ulangi Step 6.1
4. Kalo ada tapi lupa password: klik user → **"Reset password"**

### ❌ "Gagal memproses transaksi" / RPC error

**Penyebab:** SQL schema belum dijalankan.

**Solusi:**
1. Ke Supabase → SQL Editor
2. Pastikan function `process_pos_transaction` ada. Cek dengan:
   ```sql
   SELECT routine_name FROM information_schema.routines;
   ```
3. Kalo nggak ada: ulangi Step 3 — jalankan `schema.sql` & `membership.sql`

### ❌ Produk ga muncul di POS

**Penyebab:** Produk `is_active = false` atau stok 0.

**Solusi:**
1. Ke Supabase → Table Editor → `products`
2. Edit produk yg bermasalah: set `is_active = true`
3. Pastikan `stock_quantity > 0`

### ❌ Realtime nggak update (stok ga berubah real-time)

**Penyebab:** Realtime publication belum include tabel.

**Solusi:**
1. Ke Supabase → Database → **"Publications"**
2. Klik `supabase_realtime`
3. Pastikan tabel-tabel berikut ada di list:  
   `products`, `transactions`, `transaction_items`, `stock_movements`, `profiles`, `members`, `point_transactions`
4. Kalo ada yang kurang, tambahin manual

### ❌ "npm run dev" error / port already in use

**Solusi:**
```bash
# Kill process di port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Atau
npx vite --port 3001
```

---

## ✅ Checklist Setup Sukses

- [ ] Project Supabase dibuat & status "Active"
- [ ] `schema.sql` dijalankan (notifikasi hijau)
- [ ] `membership.sql` dijalankan (notifikasi hijau)
- [ ] 7 tabel muncul di Table Editor
- [ ] `npm install` sukses
- [ ] `.env` terisi dengan benar
- [ ] User admin dibuat via Auth → Add User
- [ ] `SELECT seed_admin(...)` dijalankan
- [ ] `npm run dev` jalan tanpa error
- [ ] Bisa login di http://localhost:3000
- [ ] Bisa tambah produk
- [ ] Bisa transaksi di POS
- [ ] CI di GitHub ijo 🟢

---

**Butuh bantuan?** Buka issue di:  
https://github.com/humanusia/pos-inventory-system/issues

**Dibuat 2026-07-09 • Claude & humanusia**
