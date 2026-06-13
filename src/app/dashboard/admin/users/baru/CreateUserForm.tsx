"use client";

import { useRouter } from "next/navigation";
import { useReducer } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Role } from "@prisma/client";

interface Props {
  actorRole: Role;
  roles: { value: Role; label: string }[];
  sekolah: { id: string; nama: string }[];
  wilayah: { id: string; label: string }[];
  kelas: { id: string; nama: string; sekolahId: string }[];
  lockedSekolahId: string | null;
}

// State form digabung dalam satu reducer (satu update logis = satu render).
interface FormState {
  role: Role | "";
  sekolahId: string;
  submitting: boolean;
  error: string | null;
  success: string | null;
}
type FormAction =
  | { type: "setRole"; role: Role | "" }
  | { type: "setSekolah"; sekolahId: string }
  | { type: "submitStart" }
  | { type: "submitError"; error: string }
  | { type: "submitSuccess"; success: string; resetSekolah: boolean }
  | { type: "submitDone" };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "setRole":
      return { ...state, role: action.role };
    case "setSekolah":
      return { ...state, sekolahId: action.sekolahId };
    case "submitStart":
      return { ...state, submitting: true, error: null, success: null };
    case "submitError":
      return { ...state, submitting: false, error: action.error };
    case "submitSuccess":
      return {
        ...state,
        submitting: false,
        success: action.success,
        role: "",
        sekolahId: action.resetSekolah ? "" : state.sekolahId,
      };
    case "submitDone":
      return { ...state, submitting: false };
    default:
      return state;
  }
}

export default function CreateUserForm({ actorRole, roles, sekolah, wilayah, kelas, lockedSekolahId }: Props) {
  const router = useRouter();
  const [state, dispatch] = useReducer(formReducer, {
    role: "",
    sekolahId: lockedSekolahId ?? "",
    submitting: false,
    error: null,
    success: null,
  });
  const { role, sekolahId, submitting, error, success } = state;

  // Field tenant yang dibutuhkan bergantung peran (cermin aturan API).
  const needSekolah = role === "kepsek" || role === "guru" || role === "bk";
  const needWilayah = role === "dinas";
  const needKelas = role === "guru";

  const kelasOptions = kelas.filter((k) => !sekolahId || k.sekolahId === sekolahId);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload: Record<string, string> = {
      nama: String(fd.get("nama") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      password: String(fd.get("password") || ""),
      role: String(role),
    };
    if (needSekolah) payload.sekolahId = lockedSekolahId ?? sekolahId;
    if (needWilayah) payload.wilayahId = String(fd.get("wilayahId") || "");
    if (needKelas) payload.kelasId = String(fd.get("kelasId") || "");

    dispatch({ type: "submitStart" });
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { ok: boolean; error?: string; data?: { nama: string } };
      if (!res.ok || !json.ok) {
        dispatch({ type: "submitError", error: json.error ?? "Gagal membuat pengguna." });
        return;
      }
      dispatch({
        type: "submitSuccess",
        success: `Akun "${json.data?.nama ?? payload.nama}" berhasil dibuat.`,
        resetSekolah: !lockedSekolahId,
      });
      form.reset();
      router.refresh();
    } catch {
      dispatch({ type: "submitError", error: "Terjadi kesalahan jaringan. Coba lagi." });
    }
  }

  const fieldCls =
    "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 transition-colors focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C] disabled:bg-slate-50";

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
      {success && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="nama" className="block text-sm font-medium text-slate-900">Nama lengkap</label>
        <input id="nama" name="nama" type="text" required maxLength={120} className={fieldCls} placeholder="mis. Budi Santoso" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-900">Email</label>
          <input id="email" name="email" type="email" required autoComplete="off" className={fieldCls} placeholder="nama@sekolah.sch.id" />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-slate-900">Kata sandi awal</label>
          <input id="password" name="password" type="text" required minLength={8} maxLength={100} className={fieldCls} placeholder="min. 8 karakter" />
          <p className="text-xs text-slate-400">Pengguna sebaiknya menggantinya setelah login pertama.</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="role" className="block text-sm font-medium text-slate-900">Peran</label>
        <select
          id="role"
          name="role"
          required
          value={role}
          onChange={(e) => dispatch({ type: "setRole", role: e.target.value as Role })}
          className={fieldCls}
        >
          <option value="" disabled>Pilih peran…</option>
          {roles.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Sekolah — untuk kepsek/guru/bk (superadmin memilih; kepsek terkunci) */}
      {needSekolah && (
        <div className="space-y-1.5">
          <label htmlFor="sekolahId" className="block text-sm font-medium text-slate-900">Sekolah</label>
          {lockedSekolahId ? (
            <input
              id="sekolahId"
              type="text"
              readOnly
              aria-label="Sekolah"
              value={sekolah.find((s) => s.id === lockedSekolahId)?.nama ?? "Sekolah Anda"}
              className={fieldCls}
            />
          ) : (
            <select
              id="sekolahId"
              name="sekolahId"
              required
              value={sekolahId}
              onChange={(e) => dispatch({ type: "setSekolah", sekolahId: e.target.value })}
              className={fieldCls}
            >
              <option value="" disabled>Pilih sekolah…</option>
              {sekolah.map((s) => (
                <option key={s.id} value={s.id}>{s.nama}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Kelas — wajib untuk guru (wali kelas) */}
      {needKelas && (
        <div className="space-y-1.5">
          <label htmlFor="kelasId" className="block text-sm font-medium text-slate-900">Kelas (wali)</label>
          <select id="kelasId" name="kelasId" required className={fieldCls} disabled={!sekolahId}>
            <option value="" disabled>{sekolahId ? "Pilih kelas…" : "Pilih sekolah dulu"}</option>
            {kelasOptions.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
      )}

      {/* Wilayah — wajib untuk dinas */}
      {needWilayah && (
        <div className="space-y-1.5">
          <label htmlFor="wilayahId" className="block text-sm font-medium text-slate-900">Wilayah</label>
          <select id="wilayahId" name="wilayahId" required className={fieldCls}>
            <option value="" disabled>Pilih wilayah…</option>
            {wilayah.map((w) => (
              <option key={w.id} value={w.id}>{w.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !role}
          className="inline-flex items-center gap-2 rounded-md bg-[#005D4C] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#004D40] focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {submitting ? "Menyimpan…" : "Buat akun"}
        </button>
        <span className="text-xs text-slate-400">Aktor: {actorRole}</span>
      </div>
    </form>
  );
}
