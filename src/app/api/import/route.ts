import { apiHandler, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, AuthError } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { parseCsv, parseExcel } from "@/lib/import/parse";
import { cleanRows } from "@/lib/import/cleaning";
import { encodePII } from "@/lib/siswaPII";
import { audit, clientIp } from "@/lib/audit";
import { chunk } from "@/lib/concurrency";

const BATCH = 500;

/**
 * POST /api/import (multipart: file, sekolahId?)
 * Hanya kepsek/superadmin. Siswa baru consentStatus=pending (belum boleh di-scoring).
 * Chunked transaction; PII dienkripsi (envelope) sebelum simpan.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "kepsek", "superadmin");
      await rateLimit(`import:${ctx.userId}`);

      const form = await req.formData();
      const file = form.get("file");
      const sekolahId = (form.get("sekolahId") as string) || ctx.sekolahId;
      if (!(file instanceof File)) throw new AuthError(403, "File tidak ada.");
      if (!sekolahId) throw new AuthError(403, "sekolahId wajib.");
      if (ctx.role !== "superadmin" && sekolahId !== ctx.sekolahId)
        throw new AuthError(403, "Tidak boleh impor ke sekolah lain.");

      const name = file.name.toLowerCase();
      const parsed = name.endsWith(".csv")
        ? parseCsv(await file.text())
        : parseExcel(await file.arrayBuffer());

      if (parsed.missing.length > 0)
        throw new AuthError(403, `Kolom wajib hilang: ${parsed.missing.join(", ")}`);

      const cleaned = cleanRows(parsed.rows);

      // Upsert kelas unik (1x per nama)
      const namaKelasUnik = [...new Set(cleaned.valid.map((r) => r.kelas))];
      const kelasMap = new Map<string, string>();
      const kelasRows = await Promise.all(
        namaKelasUnik.map((nama) =>
          prisma.kelas.upsert({
            where: { sekolahId_nama: { sekolahId, nama } },
            update: {},
            create: { sekolahId, nama },
            select: { id: true, nama: true },
          })
        )
      );
      for (const k of kelasRows) kelasMap.set(k.nama, k.id);

      // Siapkan payload siswa (enkripsi PII async, paralel)
      const payloads = await Promise.all(
        cleaned.valid.map(async (r) => {
          const pii = await encodePII({
            statusEkonomi: r.statusEkonomi,
            statusKeluarga: r.statusKeluarga,
          });
          return {
            nisn: r.nisn,
            nama: r.nama,
            sekolahId,
            kelasId: kelasMap.get(r.kelas)!,
            jenisKelamin: r.jenisKelamin || null,
            penerimaKip: r.penerimaKip ?? false,
            jarakKm: r.jarakKm ?? null,
            ...pii,
          };
        })
      );

      // Chunked upsert dalam transaksi
      let tersimpan = 0;
      for (const part of chunk(payloads, BATCH)) {
        await prisma.$transaction(
          part.map((p) =>
            prisma.siswa.upsert({
              where: { nisn: p.nisn },
              update: {
                nama: p.nama,
                kelasId: p.kelasId,
                sekolahId: p.sekolahId,
                penerimaKip: p.penerimaKip,
                jarakKm: p.jarakKm,
                statusEkonomiEnc: p.statusEkonomiEnc,
                statusKeluargaEnc: p.statusKeluargaEnc,
                statusOrtuEnc: p.statusOrtuEnc,
                dekId: p.dekId,
              },
              create: p, // consentStatus default = pending
            })
          )
        );
        tersimpan += part.length;
      }

      await audit(ctx, "import", `sekolah:${sekolahId}:${tersimpan}`, clientIp(req));
      return {
        totalBaris: parsed.totalRows,
        tersimpan,
        ditolak: cleaned.errors.length,
        duplikat: cleaned.duplikatNisn.length,
        catatan: "Siswa baru berstatus consent=pending; perlu persetujuan ortu sebelum scoring.",
        errors: cleaned.errors.slice(0, 50),
      };
    },
    { req, route: "POST /api/import" }
  );
}
