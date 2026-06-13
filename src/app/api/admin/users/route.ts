import { apiHandler, safeJson, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { requireRole, AuthError, canCreateUser, type TenantContext } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { audit, clientIp } from "@/lib/audit";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const CreateBody = z.object({
  nama: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["dinas", "kepsek", "guru", "bk"]),
  sekolahId: z.string().optional(),
  wilayahId: z.string().optional(),
  provinsi: z.string().optional(),
  /** Tingkat dinas (hanya relevan saat role=dinas). */
  dinasLevel: z.enum(["pusat", "provinsi", "kabupaten"]).optional(),
  kelasId: z.string().optional(),
});

// Aturan siapa boleh membuat role apa — delegasi ke sumber kebenaran di rbac.ts.
function assertCanCreate(ctx: TenantContext, role: Role) {
  if (!canCreateUser(ctx.role, role)) {
    throw new AuthError(403, `Role ${ctx.role} tidak boleh membuat ${role}.`);
  }
}

/** GET /api/admin/users — superadmin: semua; kepsek: user sekolahnya. */
export async function GET(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "superadmin", "kepsek");
      const where =
        ctx.role === "superadmin" ? {} : { sekolahId: ctx.sekolahId ?? "__none__" };
      const data = await prisma.user.findMany({
        where,
        select: {
          id: true, nama: true, email: true, role: true,
          sekolahId: true, wilayahId: true, kelasId: true, aktif: true,
        },
        orderBy: { nama: "asc" },
      });
      return { data };
    },
    { req, route: "GET /api/admin/users" }
  );
}

/** POST /api/admin/users — buat akun sesuai aturan role. */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      requireRole(ctx, "superadmin", "kepsek");
      await rateLimit(`admin:${ctx.userId}`);
      const body = CreateBody.parse(await safeJson(req));
      assertCanCreate(ctx, body.role);

      // Tentukan tenant target sesuai role pembuat & role target.
      let sekolahId = body.sekolahId ?? null;
      let wilayahId = body.wilayahId ?? null;
      let provinsi = body.provinsi ?? null;
      const kelasId = body.kelasId ?? null;

      if (ctx.role === "kepsek") {
        // kepsek hanya boleh menempatkan user di sekolahnya
        sekolahId = ctx.sekolahId;
        wilayahId = null;
        provinsi = null;
      }

      // Validasi kelengkapan tenant per role
      if ((body.role === "guru" || body.role === "bk" || body.role === "kepsek") && !sekolahId)
        throw new AuthError(403, "sekolahId wajib untuk role ini.");
      if (body.role === "dinas") {
        // Dinas berjenjang: pusat (kosong), provinsi (provinsi), kabupaten (wilayahId).
        const level = body.dinasLevel ?? (wilayahId ? "kabupaten" : provinsi ? "provinsi" : "pusat");
        if (level === "kabupaten") {
          if (!wilayahId) throw new AuthError(403, "wilayahId wajib untuk dinas kabupaten.");
          provinsi = null;
        } else if (level === "provinsi") {
          if (!provinsi) throw new AuthError(403, "provinsi wajib untuk dinas provinsi.");
          wilayahId = null;
        } else {
          // pusat: keduanya null
          wilayahId = null;
          provinsi = null;
        }
      }
      if (body.role === "guru" && !kelasId)
        throw new AuthError(403, "kelasId wajib untuk guru (wali kelas).");

      // Validasi referensi & kepemilikan
      if (sekolahId) {
        const s = await prisma.sekolah.findUnique({ where: { id: sekolahId }, select: { id: true } });
        if (!s) throw new AuthError(403, "Sekolah tidak ditemukan.");
      }
      if (wilayahId) {
        const w = await prisma.wilayah.findUnique({ where: { id: wilayahId }, select: { id: true } });
        if (!w) throw new AuthError(403, "Wilayah tidak ditemukan.");
      }
      if (kelasId) {
        const k = await prisma.kelas.findUnique({ where: { id: kelasId }, select: { sekolahId: true } });
        if (!k || k.sekolahId !== sekolahId) throw new AuthError(403, "Kelas tidak sesuai sekolah.");
      }

      const dup = await prisma.user.findUnique({ where: { email: body.email } });
      if (dup) throw new AuthError(409, "Email sudah terdaftar.");

      const passwordHash = await bcrypt.hash(body.password, 10);
      const user = await prisma.user.create({
        data: {
          nama: body.nama,
          email: body.email,
          passwordHash,
          role: body.role,
          sekolahId,
          wilayahId,
          provinsi,
          kelasId,
        },
        select: { id: true, nama: true, email: true, role: true },
      });
      await audit(ctx, "user_create", `user:${user.id}:role:${user.role}`, clientIp(req));
      return user;
    },
    { req, route: "POST /api/admin/users" }
  );
}
