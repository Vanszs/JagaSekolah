/**
 * Kernel murni (tanpa DB) untuk transformasi analitik admin. Dipisah dari
 * src/lib/analytics.ts agar bisa diuji unit dengan fixture array. Setiap fn
 * menerima bentuk hasil Prisma groupBy/findMany dan menghasilkan baris siap-tampil.
 */

export interface PlatformProvinsiK {
  provinsi: string;
  sekolah: number;
  siswa: number;
  pengguna: number;
}

/** Agregasi sekolah → per provinsi (sekolah/siswa/pengguna). Tie-break: nama provinsi. */
export function transformPlatformByProvinsi(
  rows: { provinsi: string; siswaCount: number; usersCount: number }[],
): PlatformProvinsiK[] {
  const map = new Map<string, PlatformProvinsiK>();
  for (const r of rows) {
    const e = map.get(r.provinsi) ?? { provinsi: r.provinsi, sekolah: 0, siswa: 0, pengguna: 0 };
    e.sekolah += 1;
    e.siswa += r.siswaCount;
    e.pengguna += r.usersCount;
    map.set(r.provinsi, e);
  }
  return Array.from(map.values()).sort((a, b) => b.siswa - a.siswa || a.provinsi.localeCompare(b.provinsi));
}

export interface RoleCountK {
  role: string;
  total: number;
  aktif: number;
}

/** Agregasi user groupBy(role,aktif) → total + aktif per role. */
export function transformUsersByRole(rows: { role: string; aktif: boolean; count: number }[]): RoleCountK[] {
  const map = new Map<string, RoleCountK>();
  for (const r of rows) {
    const e = map.get(r.role) ?? { role: r.role, total: 0, aktif: 0 };
    e.total += r.count;
    if (r.aktif) e.aktif += r.count;
    map.set(r.role, e);
  }
  return Array.from(map.values());
}

export interface ConsentSchoolK {
  id: string;
  nama: string;
  granted: number;
  pending: number;
  revoked: number;
  total: number;
  pctGranted: number;
}

/** Persentase consent granted; guard pembagian nol. */
export function computeConsentPct(granted: number, total: number): number {
  return total > 0 ? Math.round((granted / total) * 100) : 0;
}

/** Agregasi consent per sekolah; sekolah tanpa data → semua 0, pct 0. Urut pct ASC (terburuk dulu). */
export function transformConsentBySekolah(
  sekolah: { id: string; nama: string }[],
  rows: { sekolahId: string; consentStatus: "granted" | "pending" | "revoked"; count: number }[],
): ConsentSchoolK[] {
  const map = new Map<string, ConsentSchoolK>();
  for (const s of sekolah) map.set(s.id, { id: s.id, nama: s.nama, granted: 0, pending: 0, revoked: 0, total: 0, pctGranted: 0 });
  for (const r of rows) {
    const e = map.get(r.sekolahId);
    if (!e) continue; // orphan (sekolah terhapus) → diabaikan
    e[r.consentStatus] += r.count;
    e.total += r.count;
  }
  for (const e of map.values()) e.pctGranted = computeConsentPct(e.granted, e.total);
  return Array.from(map.values()).sort((a, b) => a.pctGranted - b.pctGranted);
}

/** Top-N aksi audit, urut DESC. take<=0 → []. */
export function transformAuditByAksi(rows: { aksi: string; count: number }[], take = 8): { aksi: string; count: number }[] {
  if (take <= 0) return [];
  return rows
    .map((r) => ({ aksi: r.aksi, count: r.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take);
}
