/** Label manusiawi untuk kode aksi audit (dipakai NationalDashboard + Audit Log). */
const AKSI_LABEL: Record<string, string> = {
  view_agregat: "Melihat agregat wilayah",
  view_siswa: "Membuka detail siswa",
  view_tenant: "Melihat daftar tenant",
  view_users: "Melihat daftar pengguna",
  view_audit: "Membuka audit log",
  view_security: "Membuka security center",
  user_create: "Membuat akun pengguna",
  sekolah_create: "Mendaftarkan sekolah",
  recompute: "Menghitung ulang skor risiko",
  consent_update: "Memperbarui persetujuan PDP",
  import: "Mengimpor data",
};

/** Ubah kode aksi (mis. "view_siswa") jadi label ramah; fallback: ganti _ -> spasi. */
export function aksiLabel(aksi: string): string {
  return AKSI_LABEL[aksi] ?? aksi.replace(/_/g, " ");
}
