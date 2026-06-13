# JagaSekolah

Sistem Peringatan Dini Putus Sekolah untuk SD/SMP — LIDM Divisi ITDP.
Menandai siswa berisiko putus sekolah lebih awal dari data yang **sudah** dimiliki sekolah (Dapodik + absensi + nilai), lalu memberi **saran tindakan** wali kelas. Fokus: peduli & intervensi dini, **bukan menghukum**.

## Stack
- **Next.js (App Router) + TypeScript** — full-stack (UI + API)
- **Prisma + PostgreSQL** di belakang **PgBouncer** (transaction pooling)
- **Auth.js** (RBAC: admin/guru) + bcrypt
- **Mesin scoring rule-based (TypeScript)** — transparan, deterministik
- **PWA (Serwist) + Dexie/IndexedDB** — offline-friendly
- **ML prediksi = FASE 2 opsional** (Python/FastAPI terpisah)

## Database (PostgreSQL + PgBouncer)
Prisma terhubung ke DB lewat **dua URL**:
- `DATABASE_URL` → runtime via PgBouncer (transaction pooling), **wajib** `?pgbouncer=true`.
- `DIRECT_URL` → koneksi langsung ke Postgres untuk `prisma migrate`/seed (pooler transaction tak bisa migrasi).

Cara tercepat menyalakan DB lokal:
```bash
docker compose up -d postgres pgbouncer   # Postgres :5432, PgBouncer :6432
# Bila port 5432 host sudah terpakai: POSTGRES_HOST_PORT=55432 docker compose up -d postgres pgbouncer
```

## Jalankan (dev)
```bash
cp .env.example .env        # isi AUTH_SECRET, DATABASE_URL, DIRECT_URL
npm install
docker compose up -d postgres pgbouncer   # nyalakan DB
npm run db:migrate          # buat skema (pakai DIRECT_URL)
npm run db:seed             # data sintetis + skenario dropout
npm run dev
```

## Jalankan (demo, Docker)
```bash
docker compose up --build   # postgres + pgbouncer + app; migrate + seed + start otomatis
# http://localhost:3000
```

## Test
```bash
npm run test                # node:test via tsx (scoring, auth, cleaning, dst.) — TANPA DB
npm run typecheck
```

## Struktur
Lihat `ARCHITECTURE.md` §4. Ringkas:
- `src/lib/scoring/` — features, thresholds, rules, explain (rule-based)
- `src/lib/import/` — columnMap, cleaning, parse (importer Dapodik)
- `src/lib/offline/` — Dexie + sync queue (idempotency + optimistic lock)
- `prisma/schema.prisma` — model data
- `prisma/seed.ts` — data sintetis

## Catatan penting
- **JANGAN commit data siswa asli** — `.gitignore` sudah memblok `*.db` & `backups/`.
- Data demo = **sintetis** (Faker).
- Deploy serverless (Vercel): arahkan `DATABASE_URL` ke PgBouncer/Prisma Accelerate (pooled) dan `DIRECT_URL` ke primary Postgres untuk migrasi.

## Dokumen
- `PLAN.md` — rencana & parameter
- `ARCHITECTURE.md` — arsitektur & tech stack detail
