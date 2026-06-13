# JagaSekolah — Tech Stack & Arsitektur (Next.js, Lengkap)

> Turunan dari `PLAN.md`. Stack utama: **Next.js full-stack**. Sudah memuat perbaikan dari review 2 reviewer + senior SWE (skor 7.0/10).
> **Keputusan kunci:** Mesin inti = **rule-based (TypeScript, deterministik, transparan)**. **ML prediksi = FASE 2 (opsional)**, sebagai service Python terpisah. Untuk lomba, yang wajib jalan & didemokan = rule-based.

---

## 0. Ringkasan Keputusan (Hasil Review + Migrasi Next.js)

| Topik | Keputusan final |
|---|---|
| Framework | **Next.js (App Router)** full-stack — frontend + backend (Route Handlers / Server Actions) jadi satu. |
| Backend terpisah? | **Tidak untuk MVP.** Logika & scoring rule-based jalan di Next.js (TypeScript). |
| ML prediksi | **Fase 2 (opsional)** — service **Python (FastAPI) terpisah** dipanggil via HTTP; MVP tanpa ML. |
| DB + ORM | **PostgreSQL + Prisma**, di belakang **PgBouncer** (transaction pooling). `DATABASE_URL` via pooler (`?pgbouncer=true`), `DIRECT_URL` langsung untuk migrasi/seed. |
| Mesin prediksi | **Rule-based dulu (TypeScript).** ML hanya nilai tambah. |
| Offline/PWA | **Serwist** (next-pwa successor) + **Dexie/IndexedDB** + sync queue. |
| Sync konflik | **Optimistic locking (version) + idempotency key + last-write-wins fallback** (perbaikan review). |
| Auth | **Auth.js (NextAuth v5)** credentials + JWT/session, bcrypt. |
| Data sintetis | **`seed.ts` (Prisma seed + Faker)** sejak minggu 1. |

---

## 1. Prinsip Desain (Non-Negotiable)

1. **Local/offline-first** — sekolah daerah sinyal lemah; berguna offline, sync saat online.
2. **Data minimal & sudah ada** — pakai ekspor Dapodik + absensi/nilai guru.
3. **Transparan & dapat dijelaskan** — tiap label risiko punya alasan eksplisit (no black box).
4. **Privacy by design** — RBAC + data minimal + audit + backup terenkripsi.
5. **Demo-able** — demo deterministik, jalan lokal tanpa internet.

---

## 2. Tech Stack (Next.js)

### 2.1 Inti (Frontend + Backend = Next.js)
| Item | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 14/15 (App Router) + TypeScript** | Full-stack 1 repo; Server Actions + Route Handlers untuk API |
| Rendering | **Server Components + Client Components** | Dashboard cepat, data sensitif diproses di server |
| API | **Route Handlers (`app/api/*`) + Server Actions** | Tidak perlu backend terpisah untuk MVP |
| Auth | **Auth.js (NextAuth v5)** + bcrypt | Integrasi mulus dengan Next.js, RBAC via session/JWT |
| Validasi | **Zod** | Validasi end-to-end (form + API + import) |
| ORM | **Prisma** | Type-safe, migrasi mudah, SQLite↔Postgres |

### 2.2 UI / Client
| Item | Pilihan |
|---|---|
| Styling | **Tailwind CSS + shadcn/ui** |
| Data fetching/cache | **TanStack Query** (client) + Server Components (server) |
| Form | **React Hook Form + Zod** |
| Chart | **Recharts** (tren absensi/nilai) |
| Local DB offline | **Dexie.js (IndexedDB)** + sync queue |
| PWA / Service worker | **Serwist** (`@serwist/next`) — offline cache + versioning |

### 2.3 Database
| Tahap | Pilihan |
|---|---|
| MVP/demo/1 sekolah | **SQLite + Prisma** |
| Skala/multi-sekolah | **PostgreSQL** (opsional) — Prisma cukup ganti datasource |

### 2.4 Mesin Scoring
| Lapis | Teknologi | Status |
|---|---|---|
| **L1 Rule-based** | **TypeScript** (`lib/scoring/rules.ts`) | **WAJIB / MVP** |
| Penjelasan | `lib/scoring/explain.ts` (alasan + saran) | WAJIB |
| Ambang | `lib/scoring/thresholds.ts` (configurable + `config_version`) | WAJIB |
| **L2 ML (prediksi)** | **Python FastAPI service terpisah** (scikit-learn + joblib) | **FASE 2 (opsional)** |

> Kenapa rule-based di TS? Agar MVP tetap **satu codebase Next.js**, deterministik, mudah diuji (Vitest), tanpa menambah runtime Python. ML baru memerlukan Python — itupun dipisah sebagai microservice yang dipanggil via HTTP, dan opsional.

### 2.5 Importer & Data Processing
| Item | Pilihan |
|---|---|
| Parser | **SheetJS (xlsx)** / **PapaParse (CSV)** di Route Handler |
| Validasi | **Zod schema** per baris + laporan baris invalid |
| Cleaning | `lib/import/cleaning.ts` (reject + laporan error) |
| **Column mapping** | `lib/import/columnMap.ts` — dict alias kolom Dapodik (tahan perubahan format) ✅ perbaikan review |

### 2.6 DevOps / Tooling
| Item | Pilihan | Prioritas |
|---|---|---|
| Container | **Docker + docker-compose** | Tinggi (demo) |
| Test | **Vitest** (unit scoring/util) + **Playwright** (E2E ringan) | Tinggi |
| Lint/format | **ESLint + Prettier** | Sedang |
| Seed data | **`prisma/seed.ts` + Faker** | Tinggi (minggu 1) |
| Backup | **`scripts/backup.ts` + enkripsi (node:crypto / AES-GCM)** | Sedang ✅ perbaikan review |
| CI | GitHub Actions | Rendah (bonus) |
| ML service (fase 2) | Python + FastAPI + scikit-learn, Docker terpisah | Opsional |

### 2.7 Sengaja Dihindari
Microservices (kecuali ML opsional), k8s, message queue, deep learning scoring, mobile native, CRDT, RBAC multi-peran kompleks.

---

## 3. Arsitektur Sistem (High-Level)

```
┌───────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP (1 repo, full-stack)             │
│                                                                 │
│  CLIENT (Browser / PWA)                                         │
│  React (Client Components) + Tailwind + shadcn/ui               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │Dashboard │ │Detail    │ │Import    │ │Log       │          │
│  │WaliKelas │ │Siswa     │ │Data CSV  │ │Intervensi│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  TanStack Query │ Dexie (IndexedDB) │ Serwist SW (offline)     │
│        │                                                        │
│        │  Server Actions / fetch                               │
│  ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─    │
│        ▼   SERVER (Next.js runtime, Node)                       │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐   │
│  │ Route Handlers│  │ Server Actions│  │ Auth.js (RBAC)   │   │
│  │ app/api/*     │  │ (mutations)   │  │ + middleware     │   │
│  └──────┬────────┘  └──────┬────────┘  └──────────────────┘   │
│         │                  │                                    │
│   ┌─────▼──────┐   ┌───────▼────────┐   ┌──────────────────┐   │
│   │ Importer + │   │ Scoring Engine │   │ Sync Handler     │   │
│   │ Cleaning   │   │ rules.ts (L1)✅ │   │ (idempotency +   │   │
│   │ +columnMap │   │ explain.ts ✅   │   │  optimistic lock)│   │
│   └────────────┘   │ thresholds.ts ✅│   └──────────────────┘   │
│                    └───────┬────────┘                          │
│                            │ Prisma                            │
└────────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────▼─────────┐        ┌──────────────────┐
                   │   DATABASE       │        │ 🔶 ML SERVICE     │
                   │ SQLite (Prisma)  │        │ (Python/FastAPI)  │
                   └──────────────────┘        │ sklearn + joblib  │
                                               │ FASE 2 / opsional │
                                               └──────────────────┘
   Next.js ── HTTP ──> ML service (hanya jika fase 2 aktif)
```

---

## 4. Struktur Folder (Next.js)

```
jagasekolah/
├── prisma/
│   ├── schema.prisma          # model DB
│   ├── migrations/
│   └── seed.ts                # data sintetis (Faker) + skenario dropout
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── dashboard/         # Server Component (list risiko)
│   │   ├── siswa/[id]/        # detail + tren + alasan
│   │   ├── import/            # upload CSV/Excel
│   │   ├── intervensi/
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── import/route.ts
│   │       ├── risiko/route.ts
│   │       ├── sync/route.ts          # idempotency + optimistic lock
│   │       └── health/route.ts        # ✅ healthcheck
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── auth.ts            # Auth.js config + RBAC helper
│   │   ├── scoring/
│   │   │   ├── features.ts    # hitung ABC + konteks
│   │   │   ├── rules.ts       # ✅ L1 rule-based
│   │   │   ├── thresholds.ts  # ✅ ambang + config_version (hash)
│   │   │   └── explain.ts     # ✅ alasan + saran tindakan
│   │   ├── import/
│   │   │   ├── parse.ts       # SheetJS/PapaParse
│   │   │   ├── columnMap.ts   # ✅ alias kolom Dapodik
│   │   │   └── cleaning.ts    # validasi + reject baris
│   │   ├── offline/
│   │   │   ├── dexie.ts       # schema IndexedDB
│   │   │   └── syncQueue.ts   # antrian + retry + idempotency key
│   │   └── audit.ts           # log akses data sensitif
│   ├── components/            # UI (shadcn)
│   └── middleware.ts          # proteksi route + RBAC + rate-limit
├── ml-service/                # 🔶 FASE 2 (opsional, Python)
│   ├── train.py               # latih -> model.pkl (joblib)
│   ├── app.py                 # FastAPI: POST /predict
│   └── Dockerfile
├── scripts/
│   └── backup.ts              # ✅ export JSON terenkripsi (AES-GCM)
├── tests/                     # Vitest (scoring) + Playwright (E2E)
├── docker-compose.yml
├── Dockerfile
└── package.json
```

---

## 5. Mesin Scoring — Detail

### 5.1 Pipeline
```
import -> cleaning.ts (buang/laporkan baris invalid)
       -> features.ts (parameter ABC + konteks per siswa)
       -> rules.ts    (L1: Hijau/Kuning/Merah + alasan)  ✅ MVP, TypeScript
       -> [ML service /predict] (L2 probabilitas, fase 2) 🔶
       -> explain.ts  (gabung alasan + saran tindakan)
       -> simpan Risiko (+ config_version)  ✅
       -> dashboard (Server Component)
```

### 5.2 Lapis 1 — Rule-based (WAJIB, TypeScript)
- Aturan eksplisit, contoh:
  - `alpaBeruntun >= 3` && `nilaiTurun` → **MERAH**
  - `pctAbsen > 10` || `mapelDiBawahKkm >= 3` → **KUNING**
  - else → **HIJAU**
- Output: kategori + **daftar alasan** + **saran tindakan**.
- Ambang dari `thresholds.ts`; setiap hasil disimpan dengan **`config_version`** (hash thresholds) ✅ agar kalibrasi retrospektif valid.

### 5.3 Kalibrasi Ambang (WAJIB)
- Jalankan rules pada data siswa yang **sudah** dropout → **confusion matrix** → sesuaikan ambang agar recall tinggi.

### 5.4 Lapis 2 — ML Prediksi (FASE 2, opsional) 🔶
- Service **Python FastAPI terpisah**: `train.py` (scikit-learn LogReg/DecisionTree → `model.pkl` via joblib), `app.py` expose `POST /predict`.
- Next.js memanggil via HTTP **hanya jika fase 2 aktif**; kalau service mati → fallback ke rule-based (tidak merusak MVP).
- Penjelasan: feature importance/koefisien (SHAP ditunda).

---

## 6. Skema Data (Prisma / ERD)

```
User      (id, nama, role[admin|guru], kelasId?, passwordHash)
Sekolah   (id, npsn, nama)
Kelas     (id, sekolahId, nama, waliKelasId)
Siswa     (id, nisn, nama, kelasId, jenisKelamin,
           statusEkonomi, penerimaKip, jarakKm, statusKeluarga, statusOrtu)
Absensi   (id, siswaId, tanggal, status[hadir|izin|sakit|alpa|telat])
Nilai     (id, siswaId, mapel, periode, nilai, kkm)
Risiko    (id, siswaId, tanggalHitung, kategori[hijau|kuning|merah],
           skor, alasanJson, sumber[rule|ml], configVersion, updatedAt)  ✅
Intervensi(id, siswaId, tanggal, jenis, catatan, olehUserId,
           version, deletedAt?)   ✅ optimistic locking + soft-delete
AuditLog  (id, userId, aksi, target, timestamp)
SyncLog   (id, idempotencyKey, status, createdAt)  ✅ dedupe sync
```
Relasi: Sekolah 1—N Kelas 1—N Siswa 1—N {Absensi, Nilai, Risiko, Intervensi}.

---

## 7. Offline & Sync (Detail, dengan perbaikan review)

1. Buka app → data kelas di-cache ke **IndexedDB (Dexie)** via Serwist.
2. Catat intervensi **offline** → masuk **sync queue** (tiap item punya **idempotency key** UUID).
3. Online → `POST /api/sync` kirim batch.
4. **Idempotency:** server cek `SyncLog.idempotencyKey` → dedupe, retry aman. ✅
5. **Optimistic locking:** client kirim `version`; jika mismatch → server tolak → UI tampilkan **konflik (pilih versi A/B)**, bukan timpa diam-diam. ✅
6. Fallback last-write-wins by `updatedAt` hanya untuk data non-kritis.
7. Indikator "X item menunggu sync" + status online/offline.
8. Serwist **cache-versioning** (hindari UI basi saat demo).

---

## 8. Keamanan & Privasi

| Aspek | Implementasi |
|---|---|
| Auth | Auth.js (credentials) + bcrypt; session/JWT |
| Otorisasi | `middleware.ts` RBAC: guru→kelasnya, admin→full, kepsek→agregat anonim |
| Rate limit | middleware rate-limit pada `/api/auth` ✅ |
| Data sensitif | akses terbatas + `auditLog` siapa lihat apa |
| Backup | `backup.ts` **terenkripsi AES-GCM** ✅ |
| CORS | dikonfigurasi (jika ML service beda origin) ✅ |
| Demo | data sintetis (`seed.ts`), JANGAN data asli siswa |

---

## 9. Strategi Demo Final (anti gagal)

- `docker compose up` (Next.js + SQLite) → jalan lokal tanpa internet.
- `prisma db seed` → data sintetis + set "siswa yang sudah dropout semester lalu".
- Alur: import → cleaning → skor → **alasan** → **saran tindakan** → catat intervensi → dashboard kepsek.
- Tampilkan **confusion matrix** retrospektif = bukti dampak.

---

## 10. Pemetaan ke Kriteria ITDP

| Kriteria (bobot) | Dukungan arsitektur |
|---|---|
| Orisinalitas (30) | Rule-based transparan + konteks Dapodik lokal; ML fase 2 = nilai tambah |
| Fungsionalitas (30) | Satu codebase Next.js, teruji (Vitest/Playwright), demo deterministik (Docker) |
| Dampak (10–20) | Validasi retrospektif + confusion matrix = bukti prediktif terukur |
| Karakter (20) | Output saran intervensi (peduli), bukan vonis |
| Presentasi (20) | Demo offline mulus + visual tren & alasan |

---

## 11. Roadmap Eksekusi (12 minggu, ML di akhir/opsional)

| Minggu | Target |
|---|---|
| 1–2 | Setup Next.js + Prisma schema + `seed.ts` + Docker + Auth.js + CRUD Siswa/Kelas |
| 3–4 | Import (SheetJS) + `columnMap` + `cleaning` + `rules.ts` (L1) + Vitest |
| 5–6 | Dashboard (Server Component) + detail siswa (Recharts) + **validasi retrospektif + kalibrasi ambang** |
| 7–8 | PWA (Serwist) offline + Dexie + `/api/sync` (idempotency + optimistic lock) + log intervensi |
| 9–10 | Uji sekolah mitra + data dampak + UX guru non-tech + rate-limit/health/backup terenkripsi |
| 11 | 🔶 (opsional) ML service Python; jika tidak → perkuat demo & dokumentasi |
| 12 | Finalisasi, HKI, skrip presentasi 7 menit, rehearsal demo |

---

## 12. Risiko Teknis & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Scope creep ML | ML = fase 2 service terpisah; gate: rule-based 100% jalan dulu |
| Import Dapodik format beda | `columnMap` alias + `cleaning` reject+laporan ✅ |
| Sync conflict/dobel | idempotency key + optimistic locking ✅ |
| PWA cache basi (Serwist) | cache-versioning + force-update |
| Data sekolah telat | `seed.ts` data sintetis plan B |
| PII anak bocor (backup) | backup terenkripsi AES-GCM ✅ |
| Skala SQLite | cukup demo 1 sekolah; Postgres via Prisma jika perlu |
| Scoring tidak incremental | hitung ulang hanya siswa yg datanya berubah (flag dirty) |

---

## 13. Keputusan Terbuka (perlu konfirmasi)

1. Next.js **App Router** (saran) — fix?
2. Jenjang awal: **SMP** (saran) atau SD?
3. ML fase 2 dikejar, atau cukup rule-based + narasi "ML sebagai pengembangan"?
4. Deploy demo: lokal Docker saja (saran) atau juga Vercel (catatan: SQLite tidak cocok di Vercel serverless → kalau Vercel, perlu Postgres/Turso)?
