import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      sekolahId: string | null;
      wilayahId: string | null;
      kelasId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: Role;
    sekolahId?: string | null;
    wilayahId?: string | null;
    kelasId?: string | null;
    tokenVersion?: number;
  }
}
