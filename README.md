# 🏪 POS & Inventory System

Point of Sale + Real-Time Warehouse Inventory dengan Role-Based Access Control.  
Dibangun dengan **React + TypeScript + Tailwind CSS** di frontend, **Supabase** di backend.

---

## 📋 Daftar Isi

1. [Prasyarat](#-prasyarat)
2. [Setup Supabase (Backend)](#1-setup-supabase-backend)
3. [Setup Aplikasi (Frontend)](#2-setup-aplikasi-frontend)
4. [Membuat User Pertama](#3-membuat-user-pertama)
5. [Login & Penggunaan](#4-login--penggunaan)
6. [Struktur Role & Hak Akses](#-struktur-role--hak-akses)
7. [Fitur Tambahan](#-fitur-tambahan)

---

## 🔧 Prasyarat

Yang harus udah terinstall di PC:

| Tool | Versi | Download |
|---|---|---|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| **npm** | ≥ 9.x | (bawaan Node.js) |
| **Git** | ≥ 2.x | [git-scm.com](https://git-scm.com) |
| **Browser** | Chrome/Firefox/Edge terbaru | — |

> **Akun Supabase** (gratis): daftar di [supabase.com](https://supabase.com)

---

## 1. Setup Supabase (Backend)

### Step 1.1 — Buat Project Supabase

1. Buka [app.supabase.com](https://app.supabase.com) → Login
2. Klik **"New project"**
3. Isi:
   - **Name:** `pos-inventory` (bebas)
   - **Database Password:** buat password kuat (catat!)
   - **Region:** pilih yang paling dekat (Singapore recommended)
   - **Pricing Plan:** Free tier udah cukup
4. Klik **"Create project"** — tunggu ±2 menit

### Step 1.2 — Jalankan SQL Schema

1. Di dashboard Supabase, klik menu **SQL Editor** (ikon `</>` di sidebar kiri)
2. Klik **"New query"**
3. Buka file `schema.sql` dari project ini (ada di root folder)
4. Copy **seluruh isi** `schema.sql`
5. Paste ke SQL Editor di Supabase
6. Klik tombol **"Run"** (atau Ctrl+Enter)

> **⚠️ Penting:** Pastikan tidak ada error. Kalau sukses, akan muncul notifikasi hijau.

### Step 1.3 — Catat API Credentials

1. Di sidebar Supabase, klik **Settings** (ikon ⚙️) → **API**
2. Catat dua nilai ini:
   - **Project URL:** `https://xxxxxxxxxxxx.supabase.co`
   - **anon public key:** `eyJhbGciOi...` (string panjang)

---

## 2. Setup Aplikasi (Frontend)

### Step 2.1 — Clone & Install

Buka terminal (Command Prompt / PowerShell / Git Bash):

```bash
# Clone repo
git clone https://github.com/humanusia/pos-inventory-system.git
cd pos-inventory-system

# Install dependencies
npm install
```

### Step 2.2 — Konfigurasi Environment

```bash
# Copy file .env.example jadi .env
copy .env.example .env      # Windows CMD
# atau
cp .env.example .env         # Git Bash / WSL
```

Buka file `.env` dengan notepad/editor:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...   ← paste dari Step 1.3
```

### Step 2.3 — Jalankan Aplikasi

```bash
npm run dev
```

Buka browser ke **http://localhost:3000**

> Seharusnya muncul halaman login POS System.

---

## 3. Membuat User Pertama

Karena belum ada user, kita buat manual lewat Supabase:

### Step 3.1 — Buat Auth User

1. Di dashboard Supabase, buka **Authentication** → **Users**
2. Klik **"Add user"** → **"Create new user"**
3. Isi:
   - **Email:** `admin@pos.local`
   - **Password:** `admin123` (atau password kamu)
   - **Require email confirmation?** **HILANGKAN centang**
4. Klik **"Create user"**
5. **Copy User UID** yang muncul (format UUID: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### Step 3.2 — Jadikan Admin

Buka **SQL Editor** di Supabase, jalankan:

```sql
SELECT seed_admin('paste-user-uid-disini');
```

Contoh:

```sql
SELECT seed_admin('abc12345-6789-4def-0123-456789abcdef');
```

> Ini akan membuat profile ADMIN dengan PIN `0000`

---

## 4. Login & Penggunaan

### Login sebagai Admin

1. Buka **http://localhost:3000**
2. Pastikan tab **"Email & Password"** aktif
3. Masukkan:
   - **Email:** `admin@pos.local`
   - **Password:** password yang kamu buat di Step 3.1
4. Klik **"Masuk"** → akan redirect ke Dashboard Admin

### Membuat User Lain (Kasir / Logistik)

1. Login sebagai Admin
2. Klik **"Manajemen Pengguna"** di sidebar
3. Klik **"Tambah Pengguna"**
4. Isi form:
   - **Nama:** nama lengkap
   - **Email:** email unik
   - **Password:** min. 6 karakter
   - **PIN:** 4 digit angka (buat quick login)
   - **Role:** pilih `KASIR` atau `LOGISTIK`
5. Klik **"Buat Pengguna"**

### PIN Quick Login

1. Di halaman login, pilih tab **"PIN Cepat"**
2. Klik user yang muncul
3. Masukkan 4-digit PIN (otomatis submit setelah 4 digit)

### Shift Switching (Kasir)

Dari halaman PIN, kasir bisa berganti akun tanpa logout — cukup pilih user lain dan masukkan PIN-nya.

---

## 🔐 Struktur Role & Hak Akses

### 👤 KASIR
| Bisa | Tidak Bisa |
|---|---|
| POS Transaction screen | Buat/edit produk |
| Lihat katalog produk & stok | Mutasi stok manual |
| Riwayat transaksi (shift sendiri) | Dashboard admin / laporan profit |
| Export transaksi CSV | Manajemen pengguna |

### 📦 LOGISTIK / GUDANG
| Bisa | Tidak Bisa |
|---|---|
| Dashboard inventaris | POS Transaction screen |
| Tambah/edit produk | Lihat revenue / profit |
| Mutasi stok (IN/OUT/ADJUSTMENT) | Manajemen kasir |
| Low stock alerts | |
| Export inventaris & mutasi CSV | |

### 🛡️ ADMIN
| Bisa Semua |
|---|
| Dashboard eksekutif + analytics |
| POS + Inventory + Mutasi stok |
| Manajemen pengguna (CRUD) |
| Export semua laporan CSV |
| Semua riwayat transaksi |

---

## ✨ Fitur Tambahan

### 🌙 Dark Mode
- Toggle di header (ikon ☀️/🌙)
- Auto-detect preferensi sistem
- Tersimpan di localStorage

### 📊 Export CSV
- Klik **"Export"** di header → pilih jenis laporan
- File CSV langsung di-download, bisa dibuka di Excel

### 🖨️ Print Receipt
- Setelah transaksi sukses → klik **"Cetak"** di modal
- Buka window baru → auto-print → auto-close
- Format thermal 80mm atau kertas A4

---

## 🛠️ Troubleshooting

| Masalah | Solusi |
|---|---|
| **"Invalid login credentials"** | Cek email & password — atau pastikan user udah dibuat di Auth → Users |
| **Halaman loading terus** | Cek `.env` — URL & anon key harus benar dari Supabase Settings → API |
| **"Gagal memproses" saat transaksi** | Pastikan SQL schema udah di-run (terutama function `process_pos_transaction`) |
| **Produk tidak muncul di POS** | Pastikan produk `is_active = true` dan stok > 0 |
| **Tidak bisa akses halaman** | Cek role user — redirect otomatis ke halaman sesuai role |
| **Realtime tidak update** | Di Supabase → Database → Replication, pastikan tabel ada di publication |

---

## 📁 Struktur Project

```
pos-inventory-system/
├── schema.sql                    # 🗄️ Database schema + RLS + RPC
├── src/
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Router + route guards
│   ├── index.css                 # Tailwind + dark mode + animations
│   ├── types/index.ts            # 30+ TypeScript interfaces
│   ├── lib/supabase.ts           # Supabase client singleton
│   ├── context/
│   │   ├── AuthContext.tsx        # Auth + RBAC + route guards
│   │   └── ThemeContext.tsx       # Dark/Light mode
│   ├── hooks/
│   │   ├── useProducts.ts        # CRUD + realtime subscriptions
│   │   ├── useTransactions.ts    # Atomic POS sale + daily summary
│   │   ├── useStockMovements.ts  # Audit trail + RPC
│   │   └── useUsers.ts           # User management
│   ├── utils/
│   │   ├── helpers.ts            # Formatters, validators
│   │   ├── export.ts             # CSV export reports
│   │   └── receiptPrinter.ts     # Thermal receipt printing
│   ├── components/layout/
│   │   ├── DashboardLayout.tsx    # Shell: sidebar + header + main
│   │   ├── Sidebar.tsx           # Role-aware navigation
│   │   └── Header.tsx            # Clock, export menu, theme toggle
│   └── pages/
│       ├── LoginPage.tsx         # Email/password + PIN pad
│       ├── NotFound.tsx          # 404
│       ├── pos/
│       │   ├── POSTerminal.tsx   # POS product grid + cart + payment
│       │   └── TransactionHistory.tsx
│       ├── inventory/
│       │   ├── InventoryDashboard.tsx  # Stock management
│       │   ├── ProductForm.tsx         # Add/edit product
│       │   └── StockMovement.tsx       # IN/OUT/ADJUSTMENT
│       └── admin/
│           ├── Dashboard.tsx     # Executive analytics
│           └── UserManagement.tsx # User CRUD
```

---

## 📦 Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + Vite |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL) |
| Auth | Supabase Auth + Row Level Security |
| Realtime | Supabase Realtime Subscriptions |
| Charts | Recharts |
| Routing | React Router 6 |
| Validation | Zod |
| Toast | React Hot Toast |
| Dates | date-fns |

---

**Dibuat dengan ❤️ oleh Claude & humanusia • 2026**
