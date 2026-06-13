import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { AuthError, type TenantContext } from "@/lib/rbac";

/** Ambil konteks tenant dari session, atau lempar 401. */
export async function requireContext(): Promise<TenantContext> {
  const session: Session | null = await auth();
  if (!session?.user?.id) throw new AuthError(401, "Tidak terautentikasi atau sesi dicabut.");
  return {
    userId: session.user.id,
    role: session.user.role,
    sekolahId: session.user.sekolahId,
    wilayahId: session.user.wilayahId,
    kelasId: session.user.kelasId,
  };
}
