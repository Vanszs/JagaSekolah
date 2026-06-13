<div align="center">

# 🏫 JagaSekolah

### Sistem Peringatan Dini Putus Sekolah untuk SD/SMP

**Menandai siswa berisiko putus sekolah lebih awal dari data yang _sudah_ dimiliki sekolah — lalu memberi saran tindakan, bukan menghukum.**

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PgBouncer-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey)](#-lisensi)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-kontribusi)

[Demo Cepat](#-mulai-cepat-docker) · [Cara Kerja](#-cara-kerja-scoring) · [Arsitektur](#-arsitektur) · [Dokumentasi](#-dokumentasi)

</div>

---

## 📌 Tentang Proyek

**JagaSekolah** adalah aplikasi web (PWA, _offline-friendly_) untuk **deteksi dini risiko putus sekolah** pada jenjang SD & SMP — dikembangkan untuk **LIDM Divisi ITDP** (Inovasi Teknologi Digital Pendidikan).

Wali kelas sering terlambat menyadari siswa berisiko: baru tahu setelah anak berhenti. Padahal sinyalnya sudah ada — absensi bolong, nilai turun, faktor ekonomi — namun tercecer dan tak pernah dianalisis bersama. JagaSekolah **menyatukan sinyal itu** menjadi peringatan dini + langkah konkret bagi guru.

> **Prinsip inti:** peduli & intervensi dini, **bukan menghukum**. Setiap label risiko **selalu disertai alasan eksplisit** — bukan kotak hitam.

### Mengapa ini berbeda

- 🔍 **Transparan** — mesin _rule-based_ deterministik; setiap skor punya alasan + saran tindakan yang bisa dijelaskan ke orang tua.
- 📶 **Offline-first** — dirancang untuk sekolah daerah dengan sinyal lemah (PWA + IndexedDB + sync queue).
- 🗂️ **Pakai data yang sudah ada** — impor langsung ekspor Dapodik + absensi + nilai guru, tanpa input ulang.
- 🔐 **Privacy by design** — RBAC, audit log, backup terenkripsi, data demo 100% sintetis.

---

## 📑 Daftar Isi

- [Fitur](#-fitur)
- [Tech Stack](#-tech-stack)
- [Mulai Cepat (Docker)](#-mulai-cepat-docker)
- [Pengembangan Lokal](#-pengembangan-lokal)
- [Konfigurasi Database](#-konfigurasi-database)
- [Cara Kerja Scoring](#-cara-kerja-scoring)
- [Arsitektur](#-arsitektur)
- [Struktur Proyek](#-struktur-proyek)
- [Pengujian](#-pengujian)
- [Deploy](#-deploy)
- [Keamanan & Privasi](#-keamanan--privasi)
- [Roadmap](#-roadmap)
- [Dokumentasi](#-dokumentasi)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## ✨ Fitur

| Kategori | Kemampuan |
|---|---|
| **Impor Data** | Unggah CSV/Excel + _column mapping_ alias Dapodik + _cleaning_ baris invalid dengan laporan |
| **Mesin Scoring** | Rule-based (ABC + konteks lokal) → kategori Hijau/Kuning/Merah + alasan + saran tindakan |
| **Dashboard** | Daftar siswa per kelas, dashboard agregat kepala sekolah & superadmin (drill-down nasional) |
| **Analitik** | Kehadiran, akademik, demografi, analisis risiko, intervensi, tren putus sekolah (Recharts) |
| **Detail Siswa** | Tren absensi & nilai, faktor risiko, riwayat intervensi |
| **Log Intervensi** | Pencatatan tindakan dengan _optimistic locking_ + _soft-delete_ |
| **Offline & Sync** | PWA + Dexie/IndexedDB + antrian sync (idempotency key + optimistic lock) |
| **Auth & RBAC** | Auth.js (NextAuth v5) + bcrypt; peran admin/guru/kepala sekolah |
| **Audit & Backup** | Audit log akses data sensitif + backup terenkripsi AES-GCM |

---

## 🧰 Tech Stack

**Inti**
- [Next.js 15](https://nextjs.org/) (App Router) + [TypeScript](https://www.typescriptlang.org/) — full-stack (UI + API)
- [Prisma 6](https://www.prisma.io/) + [PostgreSQL](https://www.postgresql.org/) di belakang **PgBouncer** (transaction pooling)
- [Auth.js / NextAuth v5](https://authjs.dev/) + bcrypt — RBAC
- [Zod](https://zod.dev/) — validasi end-to-end

**UI / Client**
- [Tailwind CSS](https://tailwindcss.com/) · [Recharts](https://recharts.org/) · [Motion](https://motion.dev/) · [Lucide](https://lucide.dev/)
- PWA via [Serwist](https://serwist.pages.dev/) · offline store [Dexie/IndexedDB](https://dexie.org/)

**Data & Engine**
- Mesin scoring _rule-based_ (TypeScript, deterministik & transparan)
- Importer Dapodik: [SheetJS](https://sheetjs.com/) (xlsx) + [PapaParse](https://www.papaparse.com/) (CSV)
- Peta nasional: [d3-geo](https://github.com/d3/d3-geo)

**Tooling**
- Docker + docker-compose · `node:test` via [tsx](https://github.com/privatenumber/tsx) · ESLint
- Data sintetis via [Faker](https://fakerjs.dev/)

> **ML prediksi = FASE 2 (opsional)** — direncanakan sebagai service Python/FastAPI terpisah, dipanggil via HTTP, dengan _fallback_ otomatis ke rule-based. MVP tidak bergantung pada ML.

---

## 🚀 Mulai Cepat (Docker)

Cara tercepat melihat aplikasi berjalan — migrate + seed + start otomatis:

```bash
git clone https://github.com/Vanszs/JagaSekolah.git
cd JagaSekolah
cp .env.example .env          # isi AUTH_SECRET, DATABASE_URL, DIRECT_URL
docker compose up --build     # postgres + pgbouncer + app
```

Buka **http://localhost:3000** — data demo sintetis (termasuk skenario dropout) sudah ter-seed.

---

## 🛠️ Pengembangan Lokal

**Prasyarat:** Node.js ≥ 20, Docker, npm.

```bash
cp .env.example .env                       # isi AUTH_SECRET, DATABASE_URL, DIRECT_URL
npm install
docker compose up -d postgres pgbouncer    # Postgres :5432, PgBouncer :6432
npm run db:migrate                         # buat skema (pakai DIRECT_URL)
npm run db:seed                            # data sintetis + skenario dropout
npm run dev                                # http://localhost:3000
```

> Bila port 5432 host sudah terpakai:
> ```bash
> POSTGRES_HOST_PORT=55432 docker compose up -d postgres pgbouncer
> ```

### Skrip npm

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Jalankan server pengembangan |
| `npm run build` / `npm start` | Build & jalankan produksi |
| `npm run lint` | ESLint |
| `npm run typecheck` | Pengecekan tipe (`tsc --noEmit`) |
| `npm run test` | Unit test (`node:test` via tsx) — **tanpa DB** |
| `npm run db:migrate` | Migrasi Prisma (pakai `DIRECT_URL`) |
| `npm run db:seed` | Seed data sintetis |
| `npm run db:studio` | Prisma Studio |
| `npm run backup` | Export backup terenkripsi (AES-GCM) |
| `npm run retention` | Jalankan kebijakan retensi data |

---

## 🗄️ Konfigurasi Database

Prisma terhubung lewat **dua URL** karena PgBouncer (transaction pooling) tidak bisa menjalankan migrasi:

| Variabel | Untuk | Catatan |
|---|---|---|
| `DATABASE_URL` | Runtime aplikasi via PgBouncer | **Wajib** sufiks `?pgbouncer=true` |
| `DIRECT_URL` | `prisma migrate` & seed | Koneksi langsung ke Postgres |

```env
DATABASE_URL="postgresql://user:pass@localhost:6432/jagasekolah?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@localhost:5432/jagasekolah"
AUTH_SECRET="ganti-dengan-string-acak-panjang"
```

---

## 🧮 Cara Kerja Scoring

Mesin inti **rule-based** dan deterministik, didasarkan pada kerangka **ABC** (Attendance, Behavior, Course performance) — prediktor dropout terkuat dalam literatur (US Dept. of Education, MDRC, Johns Hopkins) — diadaptasi dengan **faktor konteks lokal Indonesia**.

```
import → cleaning → features (ABC + konteks) → rules (L1) → explain → simpan Risiko → dashboard
```

**Empat kelompok parameter:**

| Kelompok | Contoh sinyal |
|---|---|
| **A — Attendance** (bobot tertinggi) | `pctAbsen`, `alpaBeruntun`, `trenAbsensi`, `telatKronis` |
| **B — Behavior** | `catatanDisiplin`, `partisipasi`, `tugasTidakKumpul` |
| **C — Course Performance** | `nilaiTurun`, `mapelDiBawahKkm`, `pernahTinggalKelas`, `nilaiIntiRendah` |
| **D — Konteks Lokal** | `statusEkonomi`/`penerimaKip`, `jarakKm`, `statusKeluarga`, `statusOrtu` |

**Output:** kategori `Hijau` / `Kuning` / `Merah` + daftar **alasan** + **saran tindakan**, disimpan dengan `configVersion` (hash ambang) agar kalibrasi retrospektif tetap valid.

> ⚠️ **Angka ambang** = contoh dari literatur dan **wajib dikalibrasi** dengan data satu sekolah mitra (validasi retrospektif + _confusion matrix_).

---

## 🏗️ Arsitektur

```
┌──────────────────────────── NEXT.JS APP (1 repo, full-stack) ────────────────────────────┐
│  CLIENT (Browser / PWA)                                                                   │
│  React + Tailwind · TanStack Query · Dexie (IndexedDB) · Serwist SW (offline)             │
│      │  Server Actions / fetch                                                            │
│  ────┼──────────────────────────────────────────────────────────────────────────────────│
│      ▼  SERVER (Next.js runtime, Node)                                                    │
│  Route Handlers (app/api/*) · Server Actions · Auth.js (RBAC) + middleware                │
│      │                                                                                    │
│  Importer + Cleaning · Scoring Engine (rules/explain/thresholds) · Sync Handler           │
│      │  Prisma                                                                            │
└──────┼────────────────────────────────────────────────────────────────────────────────--┘
       ▼
  PostgreSQL  ◄── PgBouncer (pooling)            🔶 ML Service (Python/FastAPI) — FASE 2/opsional
```

Detail lengkap: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 📁 Struktur Proyek

```
JagaSekolah/
├── prisma/
│   ├── schema.prisma          # model data (ERD)
│   ├── migrations/
│   └── seed.ts                # data sintetis (Faker) + skenario dropout
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/         # analitik (akademik, kehadiran, demografi, risiko, intervensi, putus-sekolah)
│   │   ├── siswa/[id]/        # detail + tren + alasan
│   │   ├── import/            # upload CSV/Excel
│   │   └── api/               # auth, import, risiko, sync, health
│   ├── components/
│   │   ├── charts/recharts/   # chart kustom
│   │   └── dashboard/         # tabel & UI dashboard
│   ├── lib/
│   │   ├── scoring/           # features · rules · thresholds · explain
│   │   ├── import/            # parse · columnMap · cleaning
│   │   ├── offline/           # dexie · syncQueue
│   │   ├── analytics*.ts      # agregasi & bucket analitik
│   │   └── audit.ts
│   └── middleware.ts          # proteksi route + RBAC + rate-limit
├── scripts/                   # backup, retention, geo/icons tooling
├── tests/                     # node:test (scoring, auth, import, sync, dst.)
├── docker-compose.yml · Dockerfile
└── README.md · PLAN.md · ARCHITECTURE.md · DEPLOY.md · AGENT_HANDOFF.md
```

---

## 🧪 Pengujian

Unit test berjalan **tanpa database** (deterministik, cepat):

```bash
npm run test        # scoring, rules, explain, thresholds, import, cleaning, sync, auth, rbac, dst.
npm run typecheck
```

Cakupan termasuk: aturan scoring & skenario dropout, perhitungan _features_, _column mapping_ Dapodik, _cleaning_, idempotency sync, RBAC, dan rate-limit.

---

## 🚢 Deploy

- **Lokal / demo:** `docker compose up --build` (lihat [Mulai Cepat](#-mulai-cepat-docker)).
- **Serverless (Vercel):** arahkan `DATABASE_URL` ke pooler (PgBouncer / Prisma Accelerate) dan `DIRECT_URL` ke primary Postgres untuk migrasi.

Panduan lengkap: [`DEPLOY.md`](./DEPLOY.md).

---

## 🔐 Keamanan & Privasi

- **JANGAN commit data siswa asli.** `.gitignore` memblok `*.db` & `backups/`.
- Data demo **100% sintetis** (Faker).
- RBAC: guru → kelasnya, admin → penuh, kepala sekolah → agregat anonim.
- Audit log akses data sensitif · backup terenkripsi **AES-GCM** · rate-limit pada `/api/auth`.

---

## 🗺️ Roadmap

- [x] Mesin scoring rule-based + penjelasan
- [x] Impor Dapodik (CSV/Excel) + column mapping + cleaning
- [x] Dashboard role-tailored + analitik chart-rich + drill-down superadmin
- [x] Auth + RBAC + audit + backup terenkripsi
- [ ] PWA offline + sync (idempotency + optimistic lock) — penyempurnaan
- [ ] Validasi retrospektif + kalibrasi ambang dengan sekolah mitra
- [ ] 🔶 ML prediksi (FASE 2, opsional — Python/FastAPI)

---

## 📚 Dokumentasi

| Dokumen | Isi |
|---|---|
| [`PLAN.md`](./PLAN.md) | Rencana produk, parameter prediksi, timeline |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Tech stack & desain detail, ERD, pipeline |
| [`DEPLOY.md`](./DEPLOY.md) | Panduan deploy (Docker & serverless) |
| [`AGENT_HANDOFF.md`](./AGENT_HANDOFF.md) | Catatan progres antar sesi pengembangan |

---

## 🤝 Kontribusi

Kontribusi dipersilakan. Alur singkat:

1. Fork & buat branch fitur: `git checkout -b feat/nama-fitur`
2. Pastikan lulus: `npm run test && npm run typecheck && npm run lint`
3. Commit dengan pesan deskriptif (gaya _conventional commits_) lalu buka Pull Request.

Jangan pernah menyertakan data siswa asli dalam contoh, test, atau seed.

---

## 📄 Lisensi

Proprietary — dikembangkan untuk LIDM Divisi ITDP. Hak cipta dipegang oleh tim pengembang JagaSekolah. Hubungi pemilik repositori untuk izin penggunaan.

<div align="center">

**JagaSekolah** — _peduli & intervensi dini, bukan menghukum._

</div>
