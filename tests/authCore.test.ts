import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  authorizeCredentials,
  signInGuard,
  enrichJwt,
  buildSessionUser,
  CredsSchema,
  type AuthUser,
  type AuthPorts,
  type JwtToken,
} from "@/lib/authCore";

// ── Fixtures ──────────────────────────────────────────────────────────
const baseUser: AuthUser = {
  id: "u1",
  nama: "Wali VIII-A",
  email: "guru@demo.test",
  role: "guru",
  sekolahId: "sek1",
  wilayahId: null,
  kelasId: "kel1",
  tokenVersion: 0,
  aktif: true,
  passwordHash: "HASH",
};

/** Build ports with a single known user (by email & id) + controllable compare. */
function ports(over: {
  user?: AuthUser | null;
  byId?: Pick<AuthUser, "tokenVersion" | "aktif"> | null;
  compare?: boolean;
} = {}): AuthPorts {
  const user = over.user === undefined ? baseUser : over.user;
  return {
    findUserByEmail: async (email) => (user && user.email === email ? user : null),
    findUserById: async (id) =>
      over.byId !== undefined ? over.byId : user && user.id === id ? { tokenVersion: user.tokenVersion, aktif: user.aktif } : null,
    comparePassword: async () => over.compare ?? true,
  };
}

// ── CredsSchema ───────────────────────────────────────────────────────
describe("CredsSchema", () => {
  it("normalizes email: trim + lowercase", () => {
    const r = CredsSchema.safeParse({ email: "  GuRu@Demo.TEST ", password: "x" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("guru@demo.test");
  });
  it("rejects invalid email", () => {
    expect(CredsSchema.safeParse({ email: "notanemail", password: "x" }).success).toBe(false);
  });
  it("rejects empty password", () => {
    expect(CredsSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
  it("rejects missing fields", () => {
    expect(CredsSchema.safeParse({}).success).toBe(false);
  });
});

// ── authorizeCredentials ──────────────────────────────────────────────
describe("authorizeCredentials", () => {
  it("valid email + password -> authorized user with tenant scope", async () => {
    const u = await authorizeCredentials({ email: "guru@demo.test", password: "ok" }, ports({ compare: true }));
    expect(u).not.toBeNull();
    expect(u!.id).toBe("u1");
    expect(u!.role).toBe("guru");
    expect(u!.sekolahId).toBe("sek1");
    expect(u!.kelasId).toBe("kel1");
    expect(u!.tokenVersion).toBe(0);
  });

  it("maps nama -> name", async () => {
    const u = await authorizeCredentials({ email: "guru@demo.test", password: "ok" }, ports());
    expect(u!.name).toBe("Wali VIII-A");
  });

  it("normalizes email before lookup (uppercase/space)", async () => {
    const u = await authorizeCredentials({ email: " GURU@DEMO.TEST ", password: "ok" }, ports());
    expect(u).not.toBeNull();
    expect(u!.email).toBe("guru@demo.test");
  });

  it("wrong password -> null", async () => {
    const u = await authorizeCredentials({ email: "guru@demo.test", password: "bad" }, ports({ compare: false }));
    expect(u).toBeNull();
  });

  it("unknown email -> null", async () => {
    const u = await authorizeCredentials({ email: "ghost@demo.test", password: "ok" }, ports({ compare: true }));
    expect(u).toBeNull();
  });

  it("inactive user -> null (even with correct password)", async () => {
    const u = await authorizeCredentials(
      { email: "guru@demo.test", password: "ok" },
      ports({ user: { ...baseUser, aktif: false }, compare: true }),
    );
    expect(u).toBeNull();
  });

  it("invalid input shape -> null (no throw)", async () => {
    expect(await authorizeCredentials({ email: "x", password: "" }, ports())).toBeNull();
    expect(await authorizeCredentials(null, ports())).toBeNull();
    expect(await authorizeCredentials({}, ports())).toBeNull();
  });

  it("null tenant fields stay null", async () => {
    const u = await authorizeCredentials(
      { email: "super@demo.test", password: "ok" },
      ports({ user: { ...baseUser, email: "super@demo.test", role: "superadmin", sekolahId: null, kelasId: null, wilayahId: null } }),
    );
    expect(u!.sekolahId).toBeNull();
    expect(u!.kelasId).toBeNull();
    expect(u!.wilayahId).toBeNull();
  });
});

// ── signInGuard (OAuth) ───────────────────────────────────────────────
describe("signInGuard", () => {
  it("credentials provider always allowed", async () => {
    expect(await signInGuard({ provider: "credentials", email: "x@y.com" }, ports())).toBe(true);
  });

  it("undefined provider treated as non-google -> allowed", async () => {
    expect(await signInGuard({ provider: undefined, email: "x@y.com" }, ports())).toBe(true);
  });

  it("google + provisioned active user -> allowed", async () => {
    expect(await signInGuard({ provider: "google", email: "guru@demo.test" }, ports())).toBe(true);
  });

  it("google + unprovisioned email -> redirect AccessDenied", async () => {
    const r = await signInGuard({ provider: "google", email: "stranger@gmail.com" }, ports());
    expect(r).toBe("/login?error=AccessDenied");
  });

  it("google + inactive user -> redirect AccessDenied", async () => {
    const r = await signInGuard(
      { provider: "google", email: "guru@demo.test" },
      ports({ user: { ...baseUser, aktif: false } }),
    );
    expect(r).toBe("/login?error=AccessDenied");
  });

  it("google + no email -> false", async () => {
    expect(await signInGuard({ provider: "google", email: null }, ports())).toBe(false);
    expect(await signInGuard({ provider: "google", email: undefined }, ports())).toBe(false);
  });

  it("google email matched case-insensitively", async () => {
    expect(await signInGuard({ provider: "google", email: "GURU@DEMO.TEST" }, ports())).toBe(true);
  });
});

// ── enrichJwt ─────────────────────────────────────────────────────────
describe("enrichJwt", () => {
  it("no user -> token unchanged", async () => {
    const t: JwtToken = { foo: "bar" };
    const out = await enrichJwt(t, undefined, ports());
    expect(out).toEqual({ foo: "bar" });
  });

  it("credentials user (has role) -> token filled from user, no DB lookup", async () => {
    const out = await enrichJwt(
      {},
      { id: "u1", role: "guru", sekolahId: "sek1", wilayahId: null, kelasId: "kel1", tokenVersion: 3 },
      // ports.findUserByEmail would throw if called — ensure it is NOT used here
      { findUserByEmail: async () => { throw new Error("must not lookup"); } },
    );
    expect(out.uid).toBe("u1");
    expect(out.role).toBe("guru");
    expect(out.sekolahId).toBe("sek1");
    expect(out.kelasId).toBe("kel1");
    expect(out.tokenVersion).toBe(3);
  });

  it("oauth user (no role) -> enriched from DB by email", async () => {
    const out = await enrichJwt({}, { email: "guru@demo.test" }, ports());
    expect(out.uid).toBe("u1");
    expect(out.role).toBe("guru");
    expect(out.sekolahId).toBe("sek1");
    expect(out.tokenVersion).toBe(0);
  });

  it("oauth user email lowercased for lookup", async () => {
    const out = await enrichJwt({}, { email: "GURU@DEMO.TEST" }, ports());
    expect(out.uid).toBe("u1");
  });

  it("oauth user with unknown email -> token left without uid", async () => {
    const out = await enrichJwt({}, { email: "ghost@demo.test" }, ports());
    expect(out.uid).toBe(undefined);
  });
});

// ── buildSessionUser (revocation) ─────────────────────────────────────
describe("buildSessionUser", () => {
  it("token without uid -> null (no change)", async () => {
    expect(await buildSessionUser({}, ports())).toBeNull();
  });

  it("active user + matching tokenVersion -> identity hydrated", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "guru", sekolahId: "sek1", kelasId: "kel1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 0, aktif: true } }),
    );
    expect(s).toEqual({ id: "u1", role: "guru", sekolahId: "sek1", wilayahId: null, kelasId: "kel1" });
  });

  it("tokenVersion mismatch (revoked) -> identity blanked", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "guru", sekolahId: "sek1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 5, aktif: true } }),
    );
    expect(s).toEqual({ id: "", role: "guru", sekolahId: null, wilayahId: null, kelasId: null });
  });

  it("inactive user -> identity blanked", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "kepsek", sekolahId: "sek1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 0, aktif: false } }),
    );
    expect(s!.id).toBe("");
    expect(s!.sekolahId).toBeNull();
  });

  it("user not found -> identity blanked", async () => {
    const s = await buildSessionUser(
      { uid: "ghost", role: "guru", tokenVersion: 0 },
      ports({ byId: null }),
    );
    expect(s!.id).toBe("");
  });

  it("missing token.role defaults to guru when valid", async () => {
    const s = await buildSessionUser(
      { uid: "u1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 0, aktif: true } }),
    );
    expect(s!.role).toBe("guru");
  });
});
