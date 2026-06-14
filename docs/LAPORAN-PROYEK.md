# JagaSekolah — Laporan Teknis & Proposal Sistem

### Sistem Peringatan Dini Putus Sekolah untuk SD/SMP

**Dokumen ini adalah laporan teknis lengkap (proposal/paper) yang menjelaskan seluruh fitur,
arsitektur, model data, mesin penilaian risiko, lapis machine learning, keamanan, dan
pengujian aplikasi JagaSekolah.** Ditujukan sebagai rujukan menyeluruh — tidak ada bagian
yang ditinggalkan.

> Dikembangkan untuk **LIDM — Divisi ITDP** (Inovasi Teknologi Digital Pendidikan).
> Versi dokumen mengikuti kondisi kode terkini (483 unit test lulus, build OK).

---

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Masalah](#2-latar-belakang--masalah)
3. [Prinsip Desain (Non-Negotiable)](#3-prinsip-desain-non-negotiable)
4. [Tech Stack](#4-tech-stack)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Model Data (ERD)](#6-model-data-erd)
7. [Mesin Penilaian Risiko (Rule-Based)](#7-mesin-penilaian-risiko-rule-based)
8. [Lapis Machine Learning (Fase 2, Opsional)](#8-lapis-machine-learning-fase-2-opsional)
9. [Otentikasi & Sesi](#9-otentikasi--sesi)
10. [RBAC — 5 Peran & Multi-Tenant](#10-rbac--5-peran--multi-tenant)
11. [Impor Data (Dapodik/CSV/Excel)](#11-impor-data-dapodikcsvexcel)
12. [Dashboard per Peran](#12-dashboard-per-peran)
13. [Analitik & Visualisasi](#13-analitik--visualisasi)
14. [Keamanan & Privasi (UU PDP)](#14-keamanan--privasi-uu-pdp)
15. [Offline / Sync (PWA)](#15-offline--sync-pwa)
16. [API Reference](#16-api-reference)
17. [Pengujian](#17-pengujian)
18. [Deployment](#18-deployment)
19. [Struktur Proyek](#19-struktur-proyek)
20. [Standar UI/UX (Anti-AI-Slop)](#20-standar-uiux-anti-ai-slop)
21. [Roadmap & Batasan Sadar](#21-roadmap--batasan-sadar)

---

## 1. Ringkasan Eksekutif

**JagaSekolah** adalah aplikasi web (PWA, *offline-friendly*) untuk **deteksi dini risiko
putus sekolah** pada jenjang SD & SMP. Sistem menyatukan sinyal yang sudah dimiliki sekolah
— absensi, nilai, faktor ekonomi — menjadi **peringatan dini berkategori** (Hijau/Kuning/Merah)
disertai **alasan eksplisit** dan **saran tindakan**, sehingga wali kelas dapat berintervensi
sebelum anak benar-benar berhenti sekolah.

Pembeda utama:

- **Transparan** — mesin penilaian inti bersifat *rule-based* deterministik; setiap skor
  selalu disertai daftar alasan yang dapat dijelaskan ke orang tua. Bukan kotak hitam.
- **Berlapis** — mesin rule-based selalu jalan; lapis Machine Learning (opsional, Fase 2)
  hanya menambah kewaspadaan dan otomatis *fallback* ke rule bila tak tersedia.
- **Privacy-by-design** — RBAC 5 peran, enkripsi PII (envelope AES-256-GCM), audit log,
  consent orang tua (UU PDP data anak), backup terenkripsi.
- **Realistis untuk Indonesia** — data wilayah 38 provinsi lengkap, penanda daerah 3T,
  hanya memakai data yang sekolah sudah punya.

---

## 2. Latar Belakang & Masalah

Wali kelas sering terlambat menyadari siswa berisiko — baru tahu setelah anak berhenti.
Padahal sinyalnya sudah ada (absensi bolong, nilai turun, faktor ekonomi) namun tercecer
dan tak pernah dianalisis bersama. JagaSekolah **menyatukan sinyal** itu menjadi peringatan
dini + langkah konkret.

**Prinsip inti:** *peduli & intervensi dini, bukan menghukum.* Setiap label risiko selalu
disertai alasan agar bisa dipertanggungjawabkan.

Kerangka prediktor yang dipakai adalah **ABC** (Attendance, Behavior, Course performance) —
prediktor dropout terkuat dalam literatur (US Dept. of Education, MDRC, Johns Hopkins) —
diadaptasi dengan **faktor konteks lokal Indonesia (D)**: ekonomi/KIP, jarak ke sekolah,
struktur keluarga.

---

## 3. Prinsip Desain (Non-Negotiable)

| Prinsip | Implementasi konkret |
|---|---|
| **Transparan** | Tiap `Risiko` menyimpan `alasanJson` (daftar alasan + saran) dan `configVersion`. |
| **Privacy-by-design** | PII terenkripsi, RBAC ketat, consent wajib sebelum scoring, audit log. |
| **Tidak mengarang metrik** | Fitur tanpa sumber data di-nol-kan & didokumentasikan; tidak ada placeholder fiktif. |
| **Rule-based dulu** | ML hanya nilai tambah; sistem 100% berfungsi tanpa ML. |
| **Hanya data yang sudah ada** | Impor langsung ekspor Dapodik + absensi + nilai guru. |
| **Offline-first** | Dirancang untuk sekolah daerah bersinyal lemah (PWA + sync queue). |

---

## 4. Tech Stack

### Inti
- **Next.js 15** (App Router) + **React 19** + **TypeScript 5.7** — full-stack (UI + API dalam satu repo).
- **Prisma 6** + **PostgreSQL** di belakang **PgBouncer** (transaction pooling).
- **Auth.js / NextAuth v5 (beta)** + **bcryptjs** — otentikasi & RBAC.
- **Zod 3.24** — validasi end-to-end.

### UI / Client
- **Tailwind CSS 3.4** · **Recharts 3.8.1** (chart) · **Motion 12** (animasi) · **Lucide React** (ikon).
- **@aejkatappaja/phantom-ui 1.2** (komponen UI tambahan).
- Peta nasional: **d3-geo 3** (+ `@types/d3-geo`).
- **sharp** — optimasi gambar (dipakai `next/image`).

### Data & Engine
- Mesin penilaian *rule-based* (TypeScript, deterministik & transparan).
- Importer: **xlsx (SheetJS)** + **papaparse** (CSV).
- Lapis ML (opsional): **Python + FastAPI + scikit-learn** (service terpisah).

### Tooling
- **Docker + docker-compose** · pengujian via **`node:test`** dijalankan oleh **tsx** (bukan vitest/jest — keputusan supply-chain).
- **ESLint 9** + `eslint-config-next` · **Faker** (data sintetis) · **react-doctor** (quality gate 100/100).

### Skrip npm
| Skrip | Fungsi |
|---|---|
| `dev` / `build` / `start` | Next.js dev / build / produksi |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `test` / `test:watch` | `tsx --test tests/*.test.ts` |
| `db:generate` / `db:migrate` / `db:push` / `db:seed` / `db:studio` | Prisma |
| `backup` | Export backup terenkripsi (`scripts/backup.ts`) |
| `retention` | Kebijakan retensi data (`scripts/retention.ts`) |

---

## 5. Arsitektur Sistem

```
┌──────────────────────── NEXT.JS APP (1 repo, full-stack) ────────────────────────┐
│  CLIENT (Browser / PWA)                                                           │
│  React 19 + Tailwind · Recharts · Motion · (offline store + sync queue)           │
│      │  Server Actions / fetch                                                    │
│  ────┼────────────────────────────────────────────────────────────────────────  │
│      ▼  SERVER (Next.js runtime, Node)                                            │
│  Route Handlers (app/api/*) · Server Actions · Auth.js (RBAC) + middleware (Edge) │
│      │                                                                            │
│  Importer + Cleaning · Scoring Engine (rules/explain/thresholds) · Sync Handler   │
│  ML Orchestrator (opsional) ── HTTP ──▶ 🔶 ML Service (Python/FastAPI)             │
│      │  Prisma                                                                    │
└──────┼────────────────────────────────────────────────────────────────────────--┘
       ▼
  PostgreSQL  ◀── PgBouncer (transaction pooling)
```

**Karakteristik kunci:**
- **Satu codebase** Next.js untuk UI + API (Server Components + Route Handlers + Server Actions).
- **Split auth Edge/Node**: `middleware.ts` memakai instance Edge-safe (tanpa Prisma); layout/route memakai instance penuh.
- **Dua URL database**: `DATABASE_URL` (runtime via PgBouncer, `?pgbouncer=true`) dan `DIRECT_URL` (migrasi/seed langsung ke Postgres).
- **ML sebagai microservice opsional** — dipanggil via HTTP, fault-tolerant (lihat §8).

---

## 6. Model Data (ERD)

Database PostgreSQL, dikelola Prisma. **13 model + 5 enum.**

### Enum
| Enum | Nilai |
|---|---|
| `Role` | `superadmin`, `dinas`, `kepsek`, `guru`, `bk` |
| `AbsensiStatus` | `hadir`, `izin`, `sakit`, `alpa`, `telat` |
| `KategoriRisiko` | `hijau`, `kuning`, `merah` |
| `SumberRisiko` | `rule`, `ml` |
| `ConsentStatus` | `pending`, `granted`, `revoked` |

### Model & relasi inti

| Model | Peran | Field penting |
|---|---|---|
| **Wilayah** | provinsi+kabupaten | `provinsi`, `kabupaten` (unik berpasangan) → punya `Sekolah[]`, `User[]` |
| **Sekolah** | satuan pendidikan | `npsn` (unik), `nama`, `wilayahId` → punya `Kelas[]`, `User[]`, `Siswa[]` |
| **User** | akun + tenant scoping | `email` (unik), `passwordHash`, `role`, `sekolahId?`, `wilayahId?`, `provinsi?`, `kelasId?`, `tokenVersion`, `aktif` |
| **Kelas** | rombongan belajar | `nama` (unik per sekolah), relasi `wali` (`User[]` — bisa lebih dari satu wali kelas), `siswa[]` |
| **Siswa** | subjek utama | `nisn` (unik), `nama`, `jenisKelamin?`, **PII terenkripsi** (`statusEkonomiEnc`, `statusKeluargaEnc`, `statusOrtuEnc`), `penerimaKip`, `jarakKm?`, `dekId?`, `sudahDropout`, `consentStatus`, `nonaktifSejak?` |
| **Consent** | audit persetujuan ortu | `status`, `oleh`, `hubungan`, `metode`, `dibuatOleh` |
| **EncryptionKey** | envelope encryption | `wrappedKey`, `masterKeyId`, `aktif` (rotasi tanpa re-encrypt seluruh DB) |
| **Absensi** | kehadiran harian | `tanggal`, `status` (AbsensiStatus) |
| **Nilai** | akademik | `mapel`, `periode`, `nilai`, `kkm` (default 70) |
| **Risiko** | hasil scoring | `kategori`, `skor`, `alasanJson`, `sumber`, `configVersion`, `isLatest` (snapshot terkini tunggal per siswa) |
| **Intervensi** | tindak lanjut | `jenis`, `catatan`, `olehUserId`, `version` (optimistic lock), `deletedAt` (soft-delete) |
| **SyncLog** | idempotensi sync | `idempotencyKey` (unik), `status`, `detailJson` |
| **AuditLog** | jejak akses sensitif | `userId`, `aksi`, `target`, `ip`, `timestamp` |

**Catatan desain:**
- **`Risiko.isLatest`** — hanya 1 record `isLatest=true` per siswa, memastikan agregasi tidak menghitung ganda. Snapshot historis (`isLatest=false`) memberi tren 12 bulan.
- **`Siswa.consentStatus`** — hanya siswa `granted` yang diproses scoring (kepatuhan UU PDP).
- **Soft-delete + optimistic lock** pada `Intervensi` untuk audit + cegah konflik edit.

---

## 7. Mesin Penilaian Risiko (Rule-Based)

Modul: `src/lib/scoring/` (`features.ts`, `buildInput.ts`, `rules.ts`, `explain.ts`, `thresholds.ts`, `types.ts`).

### Alur
```
import → cleaning → buildSiswaInput → computeFeatures (ABC+D) → scoreSiswa (rules)
       → explain (alasan + saran) → simpan Risiko (kategori/skor/alasanJson/configVersion)
```

### Empat kelompok parameter (ABC + D)

| Kelompok | Sinyal yang dihitung |
|---|---|
| **A — Attendance** (bobot tertinggi) | `pctAbsen`, `alpaBeruntun`, `trenAbsensiMemburuk`, `telatKronis` |
| **B — Behavior** | `catatanDisiplin`, `partisipasiRendah`, `pctTugasTidakKumpul` |
| **C — Course** | `nilaiTurun`, `mapelDiBawahKkm`, `pernahTinggalKelas`, `nilaiIntiRendah` |
| **D — Konteks Lokal** | `faktorEkonomi` (KIP/ekonomi), `jarakJauh`, `keluargaRentan` |

### Ambang default (`DEFAULT_THRESHOLDS`) — dapat dikalibrasi

| Parameter | Nilai default |
|---|---|
| `pctAbsenWaspada` / `pctAbsenKritis` | 10% / 20% |
| `alpaBeruntunFlag` | 3 hari |
| `telatKronisPerBulan` | 6 |
| `nilaiTurunFlag` | 10 poin |
| `mapelDiBawahKkmFlag` | 3 mapel |
| `pctTugasTidakKumpulFlag` | 50% |
| `skorKuning` / `skorMerah` | ≥30 / ≥60 |

### Bobot sinyal (menjumlah ke skor 0–100)

| Sinyal | Bobot | | Sinyal | Bobot |
|---|---|---|---|---|
| pctAbsenKritis | 30 | | nilaiTurun | 15 |
| alpaBeruntun | 20 | | mapelDiBawahKkm | 15 |
| pctAbsenWaspada | 15 | | pernahTinggalKelas | 12 |
| trenAbsensiMemburuk | 10 | | nilaiIntiRendah | 10 |
| telatKronis | 5 | | faktorEkonomi | 8 |
| catatanDisiplin | 8 | | jarakJauh | 5 |
| partisipasiRendah | 7 | | keluargaRentan | 7 |
| tugasTidakKumpul | 8 | | | |

**Output `scoreSiswa()`** → `{ siswaId, kategori, skor (0–100), alasan[], saran[], configVersion }`.
Skor = jumlah bobot sinyal aktif (dibatasi ≤100); kategori dari ambang skor.

### `configVersion` — kalibrasi retrospektif yang valid
`configVersion()` = `sha256(stableStringify(thresholds)).slice(0,12)`. Memakai serialisasi
deterministik dengan key terurut **rekursif** (termasuk `bobot.*`), sehingga perubahan
ambang/bobot apa pun mengubah hash. Setiap `Risiko` menyimpan versi ini agar skor lama tetap
dapat ditafsirkan saat ambang diubah.

### Catatan kejujuran data
Fitur Behavior (`catatanDisiplin`, `partisipasi`, `pctTugasTidakKumpul`) dan
`pernahTinggalKelas` saat ini **di-nol-kan di `buildInput.ts`** karena belum ada sumber datanya
di DB — agar tidak memicu skor palsu. Diaktifkan begitu pipeline data tersedia. `absensiPerPeriode`
(untuk tren) **dihitung nyata** dari data absensi bulanan.

---

## 8. Lapis Machine Learning (Fase 2, Opsional)

Lapis ML bersifat **opt-in & fault-tolerant**: bila `ML_SERVICE_URL` tidak diset, aplikasi
berjalan penuh dengan rule-based saja.

### 8.1 Sisi TypeScript — `src/lib/ml/`

| File | Isi |
|---|---|
| `types.ts` | Kontrak fitur `MlFeaturePayload` (14 fitur datar, `FEATURE_VERSION=1.0.0`); skema **Zod** `MlPredictionSchema` (`probabilitas` finite 0..1, ditolak bila NaN/di luar rentang); `MlClientResult` (union *never-throws*); `BlendedRisiko` + `MlInfo`. |
| `client.ts` | Klien HTTP **robust**: `CircuitBreaker` 3-state, `predictRemote()` **NEVER-THROWS**, `AbortController` timeout, retry hanya untuk error transient, validasi Zod. Semua dependency disuntik (testable). |
| `predict.ts` | Orkestrator: `featuresToPayload` (pure), `blendRiskWithMl` (pure, **escalate-only**), `mlAlasanItem` (alasan transparan), `predictAndBlend` (async never-throws). |

**Prinsip blend:**
- **Escalate-only** — ML hanya boleh *menaikkan* skor/kategori, **tidak pernah menurunkan**
  (child-safety: lebih baik over-flag daripada melewatkan anak berisiko).
- **Transparan** — setiap skor yang dipengaruhi ML menyertakan alasan eksplisit ("Model
  memprediksi peluang putus sekolah X%") + jejak `ml` di `alasanJson`.
- **Degradasi anggun** — ML mati/lambat/respons tak valid → otomatis fallback ke rule.
  `Risiko.sumber` = `ml` hanya bila ML benar-benar menaikkan hasil, selain itu `rule`.

**Knob ketahanan (env):**

| Variabel | Default | Fungsi |
|---|---|---|
| `ML_SERVICE_URL` | (kosong) | Aktifkan ML bila diisi |
| `ML_TIMEOUT_MS` | 800 | Batalkan request lebih lama dari ini |
| `ML_MAX_RETRIES` | 1 | Retry hanya error transient (timeout/network) |
| `ML_RETRY_BACKOFF_MS` | 120 | Jeda antar retry (×percobaan) |
| `ML_BREAKER_THRESHOLD` | 3 | Buka sirkuit setelah N gagal berturut |
| `ML_BREAKER_COOLDOWN_MS` | 30000 | Durasi sirkuit terbuka sebelum coba lagi |

Integrasi pada `POST /api/risiko/recompute`: bila ML aktif, blend per siswa via konkurensi
terbatas (8 paralel) agar tidak membanjiri service.

### 8.2 Service Python — `ml-service/`

| File | Isi |
|---|---|
| `dataset.py` | Generator dataset **berbasis arketipe** (9 arketipe berbobot populasi) dengan **struktur korelasi** antar-fitur + batasan koherensi; label dari **fungsi laten berbobot literatur ABC**; prevalensi dropout ~15% (kejadian minoritas). |
| `train.py` | Latih **Logistic Regression** (Pipeline `StandardScaler` + `class_weight="balanced"`), split 25% held-out, lapor metrik jujur. Output `model.joblib` (versi `synthetic-0.2.0`). |
| `schema.py` | Skema Pydantic (cermin kontrak TS); `PredictRequest/Response`, `HealthResponse`. |
| `app.py` | FastAPI: `GET /health`, `POST /predict`. Auto-train bila model absen. |
| `Dockerfile` | Latih model saat build (image self-contained) + healthcheck. |
| `requirements.txt` | Versi terpin (fastapi, uvicorn, scikit-learn, numpy, joblib, pydantic). |

**9 arketipe dataset:** `stabil_aman` (30%), `ekonomi_tekun` (12%), `early_absence` (12%),
`disengage_akademik` (10%), `krisis_absensi` (10%), `multifaktor` (8%), `tiga_T` (8%),
`perilaku` (6%), `eks_tinggal_kelas_membaik` (4%).

**Algoritma: Logistic Regression** — dipilih karena **transparan/explainable** (sejalan
prinsip proyek), output probabilitas terkalibrasi, ringan. Metrik held-out (data sintetis,
indikatif): ROC-AUC ≈ 0.97, PR-AUC ≈ 0.88, **Recall ≈ 0.92** (sengaja diprioritaskan),
Precision ≈ 0.69.

> ⚠️ Model dilatih pada **data SINTETIS** (bukan siswa nyata). Sebelum produksi WAJIB dilatih
> ulang + dikalibrasi pada data retrospektif sekolah mitra (validasi + confusion matrix).

---

## 9. Otentikasi & Sesi

- **Strategy JWT**, `maxAge: 15 menit` (sengaja pendek, demi keamanan data anak).
- **Login = Server Action** (`src/app/login/actions.ts`), bukan client `signIn` (beta v5 tidak persist cookie via client).
- **Split instance Edge/Node:**
  - `src/lib/auth.ts` — instance penuh (Prisma + bcrypt, session callback cek `tokenVersion`). Untuk layout/page/route-handler (Node).
  - `src/lib/authEdge.ts` — instance Edge-safe (token-only, tanpa Prisma). Hanya untuk `middleware.ts`.
- **Gerbang berlapis:** layout server (`requireDashboardContext`) + middleware (authEdge) + API self-gate (`requireContext`).
- **Revokasi sesi** via `User.tokenVersion`: token dengan versi berbeda dianggap invalid.
- **Google OAuth = login-only** (aktif hanya bila `AUTH_GOOGLE_ID/SECRET` diset; butuh `email_verified` + user aktif di DB; tidak ada auto-register).
- Password di-hash dengan **bcryptjs**.

---

## 10. RBAC — 5 Peran & Multi-Tenant

Helper: `src/lib/rbac.ts`. `TenantContext` = `{ userId, role, sekolahId, wilayahId, kelasId, provinsi }`.

### Peran & cakupan data (`siswaScope`)

| Peran | Cakupan |
|---|---|
| **superadmin** | Tanpa filter (akses penuh hingga identitas siswa) + halaman root platform. |
| **dinas** | **Berjenjang** (lihat bawah). |
| **kepsek** | Dibatasi `sekolahId`-nya. |
| **bk** | Dibatasi `sekolahId`-nya. |
| **guru** | Dibatasi `kelasId`-nya (di dalam sekolahnya). |

### Dinas berjenjang (`dinasLevel`)
Diturunkan dari field User:
- `wilayahId` terisi → **kabupaten** (`{sekolah:{wilayahId}}`).
- `provinsi` terisi, `wilayahId` null → **provinsi** (`{sekolah:{wilayah:{provinsi}}}`).
- keduanya null → **pusat** / nasional (`{}` — seperti superadmin, tapi tanpa akses root).

### Guard utama
| Fungsi | Tujuan |
|---|---|
| `requireRole(ctx, ...roles)` | Lempar 403 bila role tak diizinkan. |
| `siswaScope(ctx)` | Filter Prisma per tenant (sumber kebenaran isolasi data). |
| `assertSameSekolah(ctx, sekolahId)` | Cegah IDOR lintas sekolah. |
| `assertDinasWilayah(ctx, target)` | Cegah dinas mengakses lintas wilayah/provinsi (drill-down). |
| `creatableRoles` / `canCreateUser` / `canManageUsers` | Siapa boleh membuat akun apa. |

### Aturan pembuatan akun (`CREATABLE_BY`)
- **superadmin** → dapat membuat `dinas`, `kepsek`, `guru`, `bk` (lintas tenant).
- **kepsek** → hanya `guru` & `bk` di dalam sekolahnya.
- **dinas / guru / bk** → tidak boleh membuat akun. Tidak ada peran yang bisa membuat superadmin.

> **Catatan privasi (keputusan owner):** dinas (semua tingkat) saat ini DAPAT melihat
> identitas siswa di dalam cakupannya (pelonggaran sadar dari aturan "agregat-anonim" lama).
> Lintas wilayah/provinsi + akses root tetap diblokir.

---

## 11. Impor Data (Dapodik/CSV/Excel)

Modul: `src/lib/import/` (`parse.ts`, `columnMap.ts`, `cleaning.ts`).

- **Format:** Excel (`.xlsx/.xls`) via **SheetJS**, CSV via **PapaParse**.
- **Column mapping** — memetakan alias kolom Dapodik ke field internal (`nisn`, `nama`, `kelas`, dst.).
- **Cleaning** — membuang/menandai baris invalid dengan laporan (baris terlewat + alasan).
- Endpoint: `POST /api/import`.

---

## 12. Dashboard per Peran

`src/app/dashboard/page.tsx` mem-branch per role ke komponen khusus
(`src/components/dashboard/`):

| Peran | Komponen | Isi |
|---|---|---|
| **superadmin** | `NationalOverview` + `PlatformHealth` | Agregat nasional (tanpa PII di overview) + kesehatan platform. |
| **dinas** | `DinasDashboard` | Regional sesuai tingkat (pusat/provinsi/kabupaten). |
| **kepsek** | `SchoolDashboard` | Lingkup sekolahnya (boleh lihat siswa). |
| **guru / bk** | `GuruBKDashboard` | Fokus aksi + grafik kecil sesuai peran. |

**Drill-down** (breadcrumb Nasional → Provinsi → Kabupaten → Sekolah → Kelas → Siswa):
`/dashboard/wilayah/[provinsi]`, `/dashboard/kabupaten/[wilayahId]`, `/dashboard/sekolah/[id]`,
`/dashboard/sekolah/[id]/kelas/[kelasId]`, `/dashboard/siswa/[id]`.

**Navigasi** (`src/lib/nav.ts`): item nav per-role dengan label kontekstual (`labelByRole`).
Contoh: menu "Siswa" tampil sebagai *"Siswa Saya"* (guru), *"Siswa Prioritas"* (bk),
*"Telusur Siswa"* (dinas).

**Halaman analitik bersama (scope-aware):** `/akademik`, `/kehadiran`, `/intervensi`.
**Halaman superadmin:** `/analisis-risiko`, `/demografi`, `/putus-sekolah`,
`/admin/{tenant,users,users/baru,audit,security,sync}`.
**Halaman dinas:** `/perbandingan`, `/laporan`. **Halaman kepsek:** `/kelas`, `/kelola/{users,kelas}`. **Halaman bk:** `/consent`.

Segmen rute utama memiliki `loading.tsx` (skeleton); satu `dashboard/error.tsx` di akar mencakup seluruh sub-rute via *error boundary bubbling* Next.js.

---

## 13. Analitik & Visualisasi

### Lapis analitik — `src/lib/analytics.ts` (**44 fungsi**, semua scope-aware & data nyata)

Dikelompokkan:
- **KPI & tren:** `getKpis` (+MoM), `monthlyRiskTrend`, `riskFactorBreakdown`, `riskDonut`, `riskByKelas`, `priorityStudents`, `platformScale`.
- **Risiko (drill + distribusi):** `riskByProvinsi`, `riskByKabupaten`, `riskBySekolah`, `riskBySekolahScoped`, `riskByKelasInSekolah`, `riskScoreDistribution`, `riskSourceBreakdown`, `riskDeltaByProvinsi`, `factorTrendMonthly`, `schoolRiskRows`.
- **Kehadiran:** `attendanceSummary`, `attendanceTrendMonthly`, `attendanceStatusDist`, `dailyAlpaTrend`, `attendanceByProvinsi`, `chronicAbsenteeByProvinsi`.
- **Akademik (model Nilai):** `gradeByMapel`, `belowKkmByMapel`, `gradeTrendByPeriode`, `academicByProvinsi`.
- **Demografi:** `riskByGender`, `riskByKip`, `distanceDistribution` (hanya field non-terenkripsi).
- **Intervensi:** `interventionByJenis`, `interventionTrend`, `interventionTrendByJenis`, `interventionCoverageByProvinsi`, `topIntervenors`.
- **Putus sekolah:** `dropoutByProvinsi`, `dropoutTrend`, `dropoutTotal`.
- **Platform & audit:** `platformByProvinsi`, `usersByRole`, `consentBySekolah`, `auditActivityTrend`, `auditByAksi`.

Kernel murni (tanpa DB, di-test): `analyticsBuckets.ts`, `analyticsKernels.ts`.
Scope lintas-peran: `dashboardScope.ts` (`analyticsScope`, `isAggregateRole`); `dinasSekolahWhere` berada di `analytics.ts`.

### Komponen chart — `src/components/charts/recharts/`
`RiskTrendLine`, `RiskDonutChart`, `FactorBars`, `Bars` (CategoryBars), `CategoryStackedBars`,
`SingleAreaChart`, `StackedAreaChart`, `HorizontalBarChart`, `Histogram`, `MultiLineChart`,
`HeatmapTable`, plus `theme.tsx` (token warna + tooltip + `usePrefersReducedMotion`).

Standar visual: warna brand teal `#005D4C` (bukan ungu), warna risiko semantik
(merah/amber/emerald), gridline dashed halus, gradient area, `tabular-nums`,
`role="img"` + `aria-label`, animasi gated `prefers-reduced-motion`. Tabel sortable generik
`SortableTable`. Standar lengkap di `.kiro/steering/component-reference-design/references/charts.md`.

---

## 14. Keamanan & Privasi (UU PDP)

| Aspek | Implementasi |
|---|---|
| **Enkripsi PII** | *Envelope encryption* — `aes-256-gcm`. Master key dari env `PII_MASTER_KEY` (atau fallback `PII_ENCRYPTION_KEY`): bila berupa 64-hex dipakai langsung, bila passphrase diturunkan via `scryptSync`. Data key (DEK) acak 32-byte per-record, dibungkus master key (`EncryptionKey.wrappedKey` + `masterKeyId`). Mendukung **rotasi** tanpa re-encrypt seluruh DB. Modul: `src/lib/envelope.ts`, `src/lib/keyStore.ts`, `src/lib/siswaPII.ts`. |
| **Field terenkripsi** | `Siswa.statusEkonomiEnc`, `statusKeluargaEnc`, `statusOrtuEnc`. |
| **Consent (UU PDP data anak)** | Hanya `Siswa.consentStatus = granted` yang diproses scoring; model `Consent` mencatat audit trail (oleh/hubungan/metode). |
| **RBAC** | Isolasi tenant ketat (lihat §10), IDOR-safe (`resolveSiswa`/`authorizeResolvedSiswa`). |
| **Audit log** | `AuditLog` mencatat aksi sensitif (userId, aksi, target, ip, timestamp). Helper `src/lib/audit.ts`, label `auditLabels.ts`. |
| **Rate limit** | `src/lib/rateLimit.ts` — *fixed-window counter* in-memory, default `RATE_LIMIT_MAX=30` / `RATE_LIMIT_WINDOW_MS=60000`. (Mode multi-instance Redis **belum** diimplementasi — `REDIS_URL` akan ditolak eksplisit.) |
| **Backup terenkripsi** | `scripts/backup.ts` (AES-GCM). |
| **Retensi data** | `scripts/retention.ts` — purge berdasarkan `nonaktifSejak` + kebijakan retensi (siswa/audit/sync). |
| **Data demo** | 100% sintetis (Faker); NPSN sistematis non-asli. |

---

## 15. Offline / Sync (PWA)

- Dirancang **offline-first** untuk sekolah bersinyal lemah.
- **Sync queue** dengan **idempotency key** + **optimistic locking** (`Intervensi.version`) + fallback last-write-wins untuk data non-kritis.
- Model `SyncLog` (`idempotencyKey` unik, `status`, `detailJson`) menjaga idempotensi.
- Endpoint `POST /api/sync`; logika murni `src/lib/offline/applySync.ts` (di-test via port).

> Catatan: penyempurnaan PWA (service worker + IndexedDB) tercatat sebagai item roadmap.

---

## 16. API Reference

Semua route di `src/app/api/`. Pola umum: `apiHandler` + `requireContext()` (gate auth) +
`rateLimit()` + RBAC scope. **16 route handler:**

| Route | Method | Fungsi |
|---|---|---|
| `/api/auth/[...nextauth]` | — | Handler NextAuth. |
| `/api/auth/logout` | POST | Logout (naikkan tokenVersion). |
| `/api/health` | GET | Health check aplikasi. |
| `/api/siswa` | — | Daftar siswa (paginasi, filter di DB, scoped). |
| `/api/siswa/[id]` | — | Detail siswa (IDOR-safe `resolveSiswa`). |
| `/api/absensi` | — | Data kehadiran. |
| `/api/nilai` | — | Data akademik. |
| `/api/risiko/recompute` | POST | Hitung ulang risiko tenant (consent-gated, chunked, opsional ML). |
| `/api/intervensi` | POST | Buat intervensi. |
| `/api/intervensi/[id]` | PATCH/DELETE | Edit/soft-delete (optimistic lock). |
| `/api/consent` | POST | Catat persetujuan (granted/revoked). |
| `/api/import` | POST | Impor CSV/Excel. |
| `/api/sync` | POST | Sinkronisasi offline (idempoten). |
| `/api/dashboard/agregat` | — | Data agregat dashboard. |
| `/api/admin/users` | POST | Buat user (RBAC `canCreateUser`). |
| `/api/admin/sekolah` | POST | Buat sekolah/tenant. |

---

## 17. Pengujian

- **Runner:** `node:test` via **tsx** (`npm test` = `tsx --test tests/*.test.ts`). Bukan vitest/jest (keputusan supply-chain).
- **Matcher:** shim kustom `tests/_expect.ts` — hanya `toBe, toEqual, toBeNull, toBeGreaterThan, toBeGreaterThanOrEqual, toBeLessThanOrEqual, toHaveLength, toContain, toMatch, toThrow` (+ `.not`).
- **Tanpa DB/network** — pure function + dependency injection (port pattern).
- **Status: 483 test / 0 gagal** di **25 file test**:

`analyticsBuckets`, `analyticsKernels`, `api`, `applySync`, `authCore`, `buildInput`,
`cleaning`, `columnMap`, `dinasLevel`, `envelope`, `explain`, `features`, `mlClient`,
`mlPredict`, `navIntegrity`, `nav`, `parse`, `rateLimit`, `rbacScenarios`, `rbac`,
`rules-scenarios`, `rules`, `scoringField`, `seedRegions`, `thresholds`.

Cakupan: aturan scoring + skenario dropout lapangan Indonesia, perhitungan fitur,
column-mapping Dapodik, cleaning, idempotensi sync, RBAC (5 peran + dinas 3 tingkat + IDOR),
analitik (agregasi + guard divide-by-zero), klien ML (circuit breaker/timeout/retry/Zod/fallback),
blend ML (escalate-only), guard nav dead-link, enkripsi envelope, data wilayah nyata.

**Quality gate tambahan:** `npx tsc --noEmit` (bersih) + `npx react-doctor@latest` (**100/100**).

---

## 18. Deployment

### Lokal / demo (Docker)
```bash
cp .env.example .env          # isi AUTH_SECRET, DATABASE_URL, DIRECT_URL
docker compose up --build     # postgres + pgbouncer + app
# (port host 5432 bentrok? → POSTGRES_HOST_PORT=55432 docker compose up -d postgres pgbouncer)
```

### Pengembangan lokal
```bash
docker compose up -d postgres pgbouncer    # Postgres :5432, PgBouncer :6432
npm run db:migrate                         # via DIRECT_URL
npm run db:seed                            # data sintetis + skenario dropout
npm run dev                                # http://localhost:3000
```

### Dua URL database
| Variabel | Untuk | Catatan |
|---|---|---|
| `DATABASE_URL` | Runtime via PgBouncer | wajib sufiks `?pgbouncer=true` |
| `DIRECT_URL` | `prisma migrate` & seed | koneksi langsung ke Postgres |

### Migrasi Prisma
`20260613114501_init_postgres`, `20260613140159_drop_kelas_walikelasid`,
`20260613190455_dinas_provinsi_level`.

### ML service (opsional)
```bash
docker compose --profile ml up --build ml-service   # port 8000
# lalu set ML_SERVICE_URL di env app
```

### Serverless (Vercel)
Arahkan `DATABASE_URL` ke pooler (PgBouncer/Prisma Accelerate) dan `DIRECT_URL` ke primary
Postgres untuk migrasi.

---

## 19. Struktur Proyek

```
JagaSekolah/
├── prisma/
│   ├── schema.prisma          # 13 model + 5 enum (ERD)
│   ├── migrations/            # 3 migrasi
│   └── seed.ts                # data sintetis (Faker) + snapshot historis
├── src/
│   ├── app/
│   │   ├── page.tsx           # landing
│   │   ├── login/             # login (server action)
│   │   ├── dashboard/         # 26 halaman per-role + drill-down + loading/error
│   │   └── api/               # 16 route handler
│   ├── components/
│   │   ├── charts/recharts/   # 11 komponen chart + theme.tsx
│   │   ├── dashboard/         # 29 komponen dashboard/tabel
│   │   └── landing/           # 16 file landing (15 komponen + 1 data/util)
│   ├── lib/
│   │   ├── scoring/           # mesin rule-based (features/rules/explain/thresholds)
│   │   ├── ml/                # lapis ML (types/client/predict)
│   │   ├── import/            # parse/columnMap/cleaning
│   │   ├── offline/           # applySync
│   │   ├── seed/              # regions.ts (38 provinsi)
│   │   ├── analytics*.ts      # 44 fungsi + kernel
│   │   ├── rbac.ts · auth*.ts · session.ts · envelope.ts · audit.ts · rateLimit.ts · nav.ts
│   │   └── ...
│   └── middleware.ts          # proteksi route (Edge-safe)
├── ml-service/                # Python FastAPI (dataset/train/schema/app + Docker)
├── scripts/                   # backup, retention, geo/icon tooling
├── tests/                     # 25 file (483 test)
├── docker-compose.yml · Dockerfile
└── README.md · PLAN.md · ARCHITECTURE.md · DEPLOY.md · AGENT_HANDOFF.md · docs/
```

---

## 20. Standar UI/UX (Anti-AI-Slop)

Proyek menerapkan dua *steering skill* wajib (di `.kiro/steering/`):
- **Anti-AI-Slop** — filter negatif (apa yang dilarang): tanpa gradient ungu/indigo, tanpa
  Inter di mana-mana, tanpa 3-card grid generik, tanpa glassmorphism asal, tanpa `hover:scale-105`, dll.
- **Component Reference Design** — pustaka positif (apa yang dibangun): layout, tipografi,
  komponen, animasi, chart, design-system index.

Standar wajib: warna brand `#005D4C`; radius berskala; `transition-colors` (bukan `transition-all`);
`prefers-reduced-motion` di tiap animasi spasial; semantic HTML + `focus-visible`; `tabular-nums`;
`react-doctor` 100/100. Bukti penerapan: landing (`Hero`, `FaktorRisiko`, dll.), dashboard per-role,
chart bermerk teal.

---

## 21. Roadmap & Batasan Sadar

### Sudah selesai
- ✅ Mesin scoring rule-based + penjelasan transparan
- ✅ Impor Dapodik (CSV/Excel) + column mapping + cleaning
- ✅ Dashboard role-tailored + analitik chart-rich + drill-down + dinas 3 tingkat
- ✅ Auth + RBAC + audit + enkripsi PII + consent + backup terenkripsi
- ✅ Lapis ML Fase 2 (opt-in, fault-tolerant) + dataset realistis berbasis arketipe

### Roadmap
- ⏳ Penyempurnaan PWA offline + sync (service worker + IndexedDB)
- ⏳ Validasi retrospektif + kalibrasi ambang dengan sekolah mitra
- ⏳ Latih ulang model ML pada data nyata + confusion matrix

### Batasan sadar (sengaja TIDAK dibangun — agar tidak mengarang data)
- **Funnel/outcome/success-rate intervensi** — model `Intervensi` hanya punya `jenis`, tak ada tahap/hasil.
- **Geo-heatmap risiko** — `Wilayah`/`Sekolah` belum punya koordinat lat/lng.
- **Rate-limit multi-instance (Redis)** — belum diimplementasi (mode single-instance saja).
- **Sinyal Behavior** (disiplin/partisipasi/tugas) & `pernahTinggalKelas` — di-nol-kan sampai ada sumber data.

> Item NEEDS-DATA di atas akan dibangun begitu skema/pipeline datanya tersedia; sampai saat itu
> ditampilkan placeholder jujur, bukan angka fiktif.

---

*Dokumen ini dihasilkan dari survei kode langsung dan diverifikasi terhadap sumber. Untuk
detail implementasi terbaru lihat `AGENT_HANDOFF.md`, `ARCHITECTURE.md`, dan `PLAN.md`.*
