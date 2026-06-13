# Deploy — Standar Produksi Nasional

> Backend ini berjalan di **PostgreSQL di belakang PgBouncer** (transaction pooling)
> baik di dev maupun produksi. Item bertanda ⚙️ butuh INFRASTRUKTUR terkelola
> (managed PgBouncer/KMS/Redis) untuk skala nasional.

## 1. Database (PostgreSQL + PgBouncer)
- Datasource `prisma/schema.prisma` sudah `provider = "postgresql"` + `directUrl`.
- **Dua URL wajib:**
  - `DATABASE_URL` → via PgBouncer (transaction pooling), **wajib** `?pgbouncer=true`
    agar Prisma menonaktifkan prepared statements (tak kompatibel transaction mode).
  - `DIRECT_URL` → koneksi langsung ke Postgres untuk `prisma migrate deploy` & seed.
- Tuning pool produksi di `DATABASE_URL`: `&connection_limit=20&pool_timeout=20`.
- Managed pooler ⚙️: PgBouncer terkelola / Prisma Accelerate / Supavisor.
- Jalankan `prisma migrate deploy` (lewat `DIRECT_URL`).
- **Partial unique index** (migration `*_init_postgres`) menjamin 1 risiko `isLatest`
  per `(siswaId,kategori)` — hard-constraint di level DB.

> Dev lokal cepat: `docker compose up -d postgres pgbouncer` (Postgres :5432, PgBouncer :6432).
> Bila host 5432 sudah terpakai: `POSTGRES_HOST_PORT=55432 docker compose up -d postgres pgbouncer`
> dan set `DIRECT_URL` ke port itu.

## 2. Concurrency
- `withSerialLock` (in-process mutex) melindungi recompute di single-instance.
- Multi-instance ⚙️: aktif otomatis via `pg_advisory_xact_lock` ketika `DATABASE_PROVIDER=postgresql` (lihat `concurrency.ts`).

## 3. Enkripsi PII (Envelope)
- Set `PII_MASTER_KEY` (32-byte hex). Master key membungkus Data Encryption Key (DEK) per-record.
- **Rotasi master key**: buat MK baru, re-wrap DEK (DEK & PII tidak perlu di-re-encrypt). DEK lama tetap bisa dibuka selama MK lama tersedia.
- Simpan MK di **KMS / Secrets Manager** ⚙️ (jangan di file .env produksi).

## 4. Rate limit ⚙️
- Default in-memory (single-instance). Multi-instance: set `REDIS_URL` + implementasi `RedisLimiter` (placeholder ada di `rateLimit.ts`, butuh `ioredis`).

## 5. Compliance UU PDP
- **Consent**: siswa baru `consentStatus=pending` → TIDAK di-scoring sampai ortu memberi `granted` via `POST /api/consent`.
- **Retention**: jadwalkan `tsx scripts/retention.ts` (cron harian) untuk purge data kedaluwarsa.
- **Audit**: semua akses PII tercatat di `AuditLog` (+IP). Pertimbangkan sink eksternal append-only ⚙️.

## 6. Observability ⚙️
- Log sudah JSON terstruktur (`log.ts`) + `x-request-id`. Arahkan stdout ke agregator (Loki/CloudWatch/Datadog).
- `/api/health` untuk liveness/readiness probe (k8s/load balancer).

## 7. Yang MASIH perlu sebelum go-live nasional
- [ ] Managed PgBouncer/pooler + backup terjadwal ⚙️ (wiring Postgres+PgBouncer sudah default)
- [ ] Redis untuk rate-limit terdistribusi ⚙️
- [ ] KMS untuk master key ⚙️
- [ ] Penetration test + audit keamanan independen
- [ ] DPIA (Data Protection Impact Assessment) & dasar hukum pemrosesan
- [ ] SLA, monitoring, incident response playbook
