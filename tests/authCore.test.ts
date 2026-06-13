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
  it("credentials provider always allowed (no verification needed)", async () => {
    expect(await signInGuard({ provider: "credentials", email: "x@y.com" }, ports())).toBe(true);
  });

  it("undefined provider treated as non-google -> allowed", async () => {
    expect(await signInGuard({ provider: undefined, email: "x@y.com" }, ports())).toBe(true);
  });

  it("google + verified + provisioned active user -> allowed", async () => {
    expect(
      await signInGuard({ provider: "google", email: "guru@demo.test", emailVerified: true }, ports()),
    ).toBe(true);
  });

  it("google + verified + unprovisioned email -> AccessDenied (NO auto-register)", async () => {
    const r = await signInGuard(
      { provider: "google", email: "stranger@gmail.com", emailVerified: true },
      ports(),
    );
    expect(r).toBe("/login?error=AccessDenied");
  });

  it("google + verified + inactive user -> AccessDenied", async () => {
    const r = await signInGuard(
      { provider: "google", email: "guru@demo.test", emailVerified: true },
      ports({ user: { ...baseUser, aktif: false } }),
    );
    expect(r).toBe("/login?error=AccessDenied");
  });

  it("google + UNVERIFIED email -> EmailNotVerified (even if provisioned)", async () => {
    const r = await signInGuard(
      { provider: "google", email: "guru@demo.test", emailVerified: false },
      ports(),
    );
    expect(r).toBe("/login?error=EmailNotVerified");
  });

  it("google + missing emailVerified flag -> EmailNotVerified (fail closed)", async () => {
    const r = await signInGuard({ provider: "google", email: "guru@demo.test" }, ports());
    expect(r).toBe("/login?error=EmailNotVerified");
  });

  it("google + verified-but-DB-lookup happens AFTER verification check", async () => {
    // unverified must short-circuit before touching the DB
    const { ports: p, calls } = spyPorts();
    await signInGuard({ provider: "google", email: "guru@demo.test", emailVerified: false }, p);
    expect(calls.findUserByEmail).toHaveLength(0);
  });

  it("google + no email -> false", async () => {
    expect(await signInGuard({ provider: "google", email: null, emailVerified: true }, ports())).toBe(false);
    expect(await signInGuard({ provider: "google", email: undefined, emailVerified: true }, ports())).toBe(false);
  });

  it("google email matched case-insensitively", async () => {
    expect(
      await signInGuard({ provider: "google", email: "GURU@DEMO.TEST", emailVerified: true }, ports()),
    ).toBe(true);
  });

  it("LOGIN-ONLY: google sukses tidak membuat user (port hanya read findUserByEmail)", async () => {
    // AuthPorts tak punya create; guard hanya membaca. Membuktikan tak ada registrasi.
    const { ports: p, calls } = spyPorts();
    await signInGuard({ provider: "google", email: "guru@demo.test", emailVerified: true }, p);
    expect(calls.findUserByEmail).toEqual(["guru@demo.test"]);
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

// ══════════════════════════════════════════════════════════════════════
// ROBUSTNESS — security invariants on port usage + edge values.
// Membuktikan port TIDAK dipanggil saat tak seharusnya (cegah timing-oracle
// & DB-hit sia-sia), dan nilai tepi tetap aman.
// ══════════════════════════════════════════════════════════════════════

interface Calls {
  findUserByEmail: string[];
  findUserById: string[];
  comparePassword: Array<[string, string]>;
}

/** Ports yang menghitung & merekam tiap pemanggilan untuk assert invariant. */
function spyPorts(over: {
  user?: AuthUser | null;
  byId?: Pick<AuthUser, "tokenVersion" | "aktif"> | null;
  compare?: boolean;
} = {}): { ports: AuthPorts; calls: Calls } {
  const user = over.user === undefined ? baseUser : over.user;
  const calls: Calls = { findUserByEmail: [], findUserById: [], comparePassword: [] };
  const ports: AuthPorts = {
    findUserByEmail: async (email) => {
      calls.findUserByEmail.push(email);
      return user && user.email === email ? user : null;
    },
    findUserById: async (id) => {
      calls.findUserById.push(id);
      return over.byId !== undefined
        ? over.byId
        : user && user.id === id
          ? { tokenVersion: user.tokenVersion, aktif: user.aktif }
          : null;
    },
    comparePassword: async (plain, hash) => {
      calls.comparePassword.push([plain, hash]);
      return over.compare ?? true;
    },
  };
  return { ports, calls };
}

describe("authorizeCredentials — security invariants", () => {
  it("does NOT compare password when email is unknown (avoid oracle / wasted hash)", async () => {
    const { ports, calls } = spyPorts({ compare: true });
    const u = await authorizeCredentials({ email: "ghost@demo.test", password: "ok" }, ports);
    expect(u).toBeNull();
    expect(calls.findUserByEmail).toEqual(["ghost@demo.test"]);
    expect(calls.comparePassword).toHaveLength(0);
  });

  it("does NOT compare password for an inactive user", async () => {
    const { ports, calls } = spyPorts({ user: { ...baseUser, aktif: false }, compare: true });
    const u = await authorizeCredentials({ email: "guru@demo.test", password: "ok" }, ports);
    expect(u).toBeNull();
    expect(calls.comparePassword).toHaveLength(0);
  });

  it("does NOT touch any port when input shape is invalid", async () => {
    const { ports, calls } = spyPorts();
    expect(await authorizeCredentials({ email: "bad", password: "" }, ports)).toBeNull();
    expect(await authorizeCredentials(null, ports)).toBeNull();
    expect(calls.findUserByEmail).toHaveLength(0);
    expect(calls.comparePassword).toHaveLength(0);
  });

  it("compares the NORMALIZED email's stored hash, exactly once", async () => {
    const { ports, calls } = spyPorts({ compare: true });
    await authorizeCredentials({ email: "  GURU@DEMO.TEST ", password: "secret" }, ports);
    expect(calls.findUserByEmail).toEqual(["guru@demo.test"]);
    expect(calls.comparePassword).toHaveLength(1);
    expect(calls.comparePassword[0]).toEqual(["secret", "HASH"]);
  });

  it("never leaks passwordHash into the authorized result", async () => {
    const u = await authorizeCredentials({ email: "guru@demo.test", password: "ok" }, ports());
    expect(u).not.toBeNull();
    expect(Object.keys(u as object)).not.toContain("passwordHash");
    expect(Object.keys(u as object)).not.toContain("aktif");
  });

  it("a single-space password is a valid shape and IS compared (min length 1)", async () => {
    const { ports, calls } = spyPorts({ compare: false });
    const u = await authorizeCredentials({ email: "guru@demo.test", password: " " }, ports);
    expect(u).toBeNull(); // compare=false -> rejected, but it WAS attempted
    expect(calls.comparePassword).toHaveLength(1);
    expect(calls.comparePassword[0]![0]).toBe(" ");
  });
});

describe("signInGuard — security invariants", () => {
  it("never hits the user lookup for the credentials provider", async () => {
    const { ports, calls } = spyPorts();
    expect(await signInGuard({ provider: "credentials", email: "guru@demo.test" }, ports)).toBe(true);
    expect(calls.findUserByEmail).toHaveLength(0);
  });

  it("looks up exactly once (lowercased) for google", async () => {
    const { ports, calls } = spyPorts();
    await signInGuard({ provider: "google", email: "GURU@DEMO.TEST", emailVerified: true }, ports);
    expect(calls.findUserByEmail).toEqual(["guru@demo.test"]);
  });

  it("does NOT look up when google email is missing", async () => {
    const { ports, calls } = spyPorts();
    expect(await signInGuard({ provider: "google", email: null, emailVerified: true }, ports)).toBe(false);
    expect(calls.findUserByEmail).toHaveLength(0);
  });

  it("unprovisioned google user never resolves to true", async () => {
    const r = await signInGuard(
      { provider: "google", email: "stranger@gmail.com", emailVerified: true },
      ports(),
    );
    expect(r).not.toBe(true);
    expect(r).toBe("/login?error=AccessDenied");
  });
});

describe("enrichJwt — security invariants", () => {
  it("credentials user (has role) -> never performs a DB lookup", async () => {
    const { ports, calls } = spyPorts();
    await enrichJwt(
      {},
      { id: "u1", role: "guru", sekolahId: "sek1", wilayahId: null, kelasId: "kel1", tokenVersion: 2 },
      ports,
    );
    expect(calls.findUserByEmail).toHaveLength(0);
  });

  it("no user -> never performs a DB lookup and returns same token reference values", async () => {
    const { ports, calls } = spyPorts();
    const out = await enrichJwt({ uid: "old", role: "kepsek" }, undefined, ports);
    expect(calls.findUserByEmail).toHaveLength(0);
    expect(out.uid).toBe("old");
    expect(out.role).toBe("kepsek");
  });

  it("oauth path looks up exactly once with lowercased email", async () => {
    const { ports, calls } = spyPorts();
    await enrichJwt({}, { email: "GuRu@Demo.test" }, ports);
    expect(calls.findUserByEmail).toEqual(["guru@demo.test"]);
  });

  it("oauth unknown email -> token carries no role/tenant (no partial identity)", async () => {
    const out = await enrichJwt({}, { email: "ghost@demo.test" }, ports());
    expect(out.uid).toBe(undefined);
    expect(out.role).toBe(undefined);
    expect(out.sekolahId).toBe(undefined);
  });

  it("credentials tokenVersion 0 is preserved (not dropped as falsy)", async () => {
    const out = await enrichJwt(
      {},
      { id: "u1", role: "guru", sekolahId: "sek1", wilayahId: null, kelasId: "kel1", tokenVersion: 0 },
      ports(),
    );
    expect(out.tokenVersion).toBe(0);
  });
});

describe("buildSessionUser — security invariants", () => {
  it("token without uid -> never hits findUserById", async () => {
    const { ports, calls } = spyPorts();
    expect(await buildSessionUser({}, ports)).toBeNull();
    expect(calls.findUserById).toHaveLength(0);
  });

  it("validates against the token's uid exactly once", async () => {
    const { ports, calls } = spyPorts({ byId: { tokenVersion: 0, aktif: true } });
    await buildSessionUser({ uid: "u1", role: "guru", tokenVersion: 0 }, ports);
    expect(calls.findUserById).toEqual(["u1"]);
  });

  it("tokenVersion 0 vs DB 0 is a MATCH (not treated as missing)", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "guru", sekolahId: "sek1", kelasId: "kel1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 0, aktif: true } }),
    );
    expect(s!.id).toBe("u1");
  });

  it("token tokenVersion undefined vs DB 0 -> mismatch -> identity blanked", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "guru", sekolahId: "sek1", tokenVersion: undefined },
      ports({ byId: { tokenVersion: 0, aktif: true } }),
    );
    expect(s!.id).toBe("");
    expect(s!.sekolahId).toBeNull();
  });

  it("revoked identity is FULLY blanked — no tenant field survives", async () => {
    const s = await buildSessionUser(
      { uid: "u1", role: "kepsek", sekolahId: "sek1", wilayahId: "wil1", kelasId: "kel1", tokenVersion: 0 },
      ports({ byId: { tokenVersion: 9, aktif: true } }),
    );
    expect(s).toEqual({ id: "", role: "guru", sekolahId: null, wilayahId: null, kelasId: null });
  });

  it("active + matching version never blanks a legitimate session", async () => {
    const s = await buildSessionUser(
      { uid: "u9", role: "bk", sekolahId: "sekX", wilayahId: null, kelasId: null, tokenVersion: 3 },
      ports({ byId: { tokenVersion: 3, aktif: true } }),
    );
    expect(s).toEqual({ id: "u9", role: "bk", sekolahId: "sekX", wilayahId: null, kelasId: null });
  });
});
