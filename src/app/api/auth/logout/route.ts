import { apiHandler, rateLimit } from "@/lib/api";
import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { audit, clientIp } from "@/lib/audit";

/**
 * POST /api/auth/logout
 * Menaikkan tokenVersion user -> SEMUA sesi/JWT lama langsung tidak valid
 * (revocation), lalu signout sesi saat ini.
 */
export async function POST(req: Request) {
  return apiHandler(
    async () => {
      const ctx = await requireContext();
      await rateLimit(`logout:${ctx.userId}`);
      await Promise.all([
        prisma.user.update({
          where: { id: ctx.userId },
          data: { tokenVersion: { increment: 1 } },
        }),
        audit(ctx, "logout", `user:${ctx.userId}`, clientIp(req)),
      ]);
      try {
        await signOut({ redirect: false });
      } catch {
        // signOut di route handler bisa no-op; tokenVersion sudah cukup utk revoke
      }
      return { revoked: true };
    },
    { req, route: "POST /api/auth/logout" }
  );
}
