/**
 * Data retention purge (UU PDP Pasal 16: simpan hanya selama diperlukan).
 * Jalankan terjadwal (cron): `tsx scripts/retention.ts`
 *
 * Kebijakan default (override via env):
 * - Siswa nonaktif (lulus/pindah) > RETENTION_SISWA_HARI -> hapus (cascade absensi/nilai/risiko/intervensi).
 * - Audit log > RETENTION_AUDIT_HARI -> hapus (tetap simpan cukup lama untuk akuntabilitas).
 * - SyncLog > RETENTION_SYNC_HARI -> hapus (idempotency key tak perlu selamanya).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const HARI = 24 * 60 * 60 * 1000;
const RET_SISWA = Number(process.env.RETENTION_SISWA_HARI ?? 365 * 2); // 2 tahun
const RET_AUDIT = Number(process.env.RETENTION_AUDIT_HARI ?? 365 * 5); // 5 tahun
const RET_SYNC = Number(process.env.RETENTION_SYNC_HARI ?? 90); // 90 hari

async function main() {
  const now = Date.now();
  const batasSiswa = new Date(now - RET_SISWA * HARI);
  const batasAudit = new Date(now - RET_AUDIT * HARI);
  const batasSync = new Date(now - RET_SYNC * HARI);

  const siswa = await prisma.siswa.deleteMany({
    where: { nonaktifSejak: { not: null, lt: batasSiswa } },
  });
  const audit = await prisma.auditLog.deleteMany({ where: { timestamp: { lt: batasAudit } } });
  const sync = await prisma.syncLog.deleteMany({ where: { createdAt: { lt: batasSync } } });

  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      msg: "retention_purge",
      siswaDihapus: siswa.count,
      auditDihapus: audit.count,
      syncDihapus: sync.count,
    })
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
