# JagaSekolah

Sistem Peringatan Dini Putus Sekolah untuk SD/SMP — LIDM Divisi ITDP.
Menandai siswa berisiko putus sekolah lebih awal dari data yang **sudah** dimiliki sekolah (Dapodik + absensi + nilai), lalu memberi **saran tindakan** wali kelas. Fokus: peduli & intervensi dini, **bukan menghukum**.

## Stack
- **Next.js (App Router) + TypeScript** — full-stack (UI + API)
- **Prisma + SQLite** (MVP) → PostgreSQL (opsional skala)
- **Auth.js** (RBAC: admin/guru) + bcrypt
- **Mesin scoring rule-based (TypeScript)** — transparan, deterministik
- **PWA (Serwist) + Dexie/IndexedDB** — offline-friendly
- **ML prediksi = FASE 2 opsional** (Python/FastAPI terpisah)

## Jalankan (dev)
```bash
cp .env.example .env        # isi AUTH_SECRET dll
npm install
npm run db:migrate          # buat skema
npm run db:seed             # data sintetis + skenario dropout
npm run dev
```

## Jalankan (demo, Docker)
```bash
docker compose up --build   # migrate + seed + start otomatis
# http://localhost:3000
```

## Test
```bash
npm run test                # Vitest (scoring + cleaning)
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
- Deploy Vercel butuh ganti SQLite → Postgres/Turso (SQLite tidak cocok serverless).

## Dokumen
- `PLAN.md` — rencana & parameter
- `ARCHITECTURE.md` — arsitektur & tech stack detail
