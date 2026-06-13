# Deploy — Standar Produksi Nasional

> Backend ini dibangun **Postgres-ready** namun verifikasi lokal memakai SQLite.
> Item bertanda ⚙️ butuh INFRASTRUKTUR nyata (tidak bisa diuji di lingkungan dev tanpa server).

## 1. Database (PostgreSQL) ⚙️
- Ganti `prisma/schema.prisma` datasource `provider = "postgresql"` + set `DATABASE_PROVIDER=postgresql`.
- `DATABASE_URL` sertakan pooling: `?connection_limit=20&pool_timeout=20`.
- Pakai **PgBouncer** / Prisma Accelerate untuk koneksi pooling skala nasional.
- Jalankan `prisma migrate deploy`.
- **Partial unique index** (lihat migration `*_partial_unique_isLatest`) menjamin 1 risiko `isLatest` per siswa — di Postgres ini hard-constraint.

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
- [ ] Server Postgres + PgBouncer + backup terjadwal ⚙️
- [ ] Redis untuk rate-limit terdistribusi ⚙️
- [ ] KMS untuk master key ⚙️
- [ ] Penetration test + audit keamanan independen
- [ ] DPIA (Data Protection Impact Assessment) & dasar hukum pemrosesan
- [ ] SLA, monitoring, incident response playbook
