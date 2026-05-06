# PulseGrid 🌐

**Ekosistem Pintar Berasaskan Data Masa Nyata**

> Visi: Membina ekosistem pintar berasaskan data masa nyata  
> Misi: Memberi kuasa kepada komuniti dan perniagaan untuk membuat keputusan pantas berasaskan data

---

## 🚀 Features

- **Kad Mencatat Waktu (WFB)** — Punch card digital dengan format Am 493-C
- **Log Perjalanan** — Rekod perjalanan dengan auto-kira jarak & kos
- **Data Penguatkuasa** — Rekod kes rampasan haiwan lengkap
- **Super Admin Dashboard** — Kawalan penuh sistem
- **Bilingual** — Bahasa Melayu + English
- **Anime UI** — Glassmorphism + neon effects
- **Supabase Realtime** — Data sentiasa terkini

---

## 🔐 Super Admin Access

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin` |

Email super admin: `ttv4u5@gmail.com`

---

## 🛠️ Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase
Run `supabase/schema.sql` in your Supabase SQL editor.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📦 Tech Stack

- **Next.js 14** — React framework
- **Tailwind CSS** — Utility-first CSS
- **Framer Motion** — Animations
- **Supabase** — Backend + Auth + Storage + Realtime
- **TypeScript** — Type safety

---

## 🗄️ Database Schema

- `profiles` — User profiles linked to auth.users
- `punch_cards` — Time card entries
- `travel_logs` — Travel log entries
- `enforcement_data` — Enforcement case records
- `announcements` — System announcements

---

## 🌐 Deployment

Auto-deploys to GitHub Pages via GitHub Actions on push to `main`.

URL: https://ttv4u5.github.io/firpc/

---

## 📋 Export Formats

- CSV
- Excel (XLSX)
- Print (PDF via browser)
