import { prisma } from "@/lib/db";
import type { TenantContext } from "@/lib/rbac";

/** Catat akses/aksi terhadap data sensitif (append-only). UU PDP. */
export async function audit(
  ctx: TenantContext,
  aksi: string,
  target: string,
  ip?: string | null
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: ctx.userId,
        sekolahId: ctx.sekolahId,
        aksi,
        target,
        ip: ip ?? null,
      },
    });
  } catch (e) {
    // audit gagal tidak boleh menggagalkan request, tapi harus terlihat di log
    console.error("[audit] gagal mencatat", e);
  }
}

/** Ambil IP dari request (header proxy). */
export function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  );
}
