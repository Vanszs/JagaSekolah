"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, Loader2 } from "lucide-react";
import type { ConsentStatus } from "@prisma/client";

const STATUS_META: Record<ConsentStatus, { label: string; cls: string; dot: string }> = {
  granted: { label: "Disetujui", cls: "text-emerald-700 bg-emerald-50 ring-emerald-600/20", dot: "bg-emerald-500" },
  pending: { label: "Menunggu", cls: "text-amber-700 bg-amber-50 ring-amber-600/20", dot: "bg-amber-500" },
  revoked: { label: "Dicabut", cls: "text-red-700 bg-red-50 ring-red-600/20", dot: "bg-red-500" },
};

const fieldCls =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 transition-colors focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C]";

/** Pencatatan persetujuan ortu/wali (UU PDP) pada detail siswa. POST /api/consent. */
export function ConsentManager({ siswaId, status }: { siswaId: string; status: ConsentStatus }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = STATUS_META[status];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siswaId,
          status: String(fd.get("status")),
          oleh: String(fd.get("oleh")),
          hubungan: String(fd.get("hubungan")),
          metode: String(fd.get("metode")),
          catatan: String(fd.get("catatan") || ""),
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error ?? "Gagal menyimpan persetujuan.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <FileCheck2 className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Persetujuan orang tua (UU PDP)
        </h2>
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
          {meta.label}
        </span>
      </div>

      {status === "pending" && (
        <p className="mt-2 text-sm text-amber-700">
          Data siswa ini belum diproses untuk penilaian risiko hingga persetujuan dicatat.
        </p>
      )}

      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {open ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="c-status" className="block text-sm font-medium text-slate-900">Tindakan</label>
              <select id="c-status" name="status" required defaultValue="granted" className={fieldCls}>
                <option value="granted">Catat persetujuan</option>
                <option value="revoked">Cabut persetujuan</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-oleh" className="block text-sm font-medium text-slate-900">Nama pemberi</label>
              <input id="c-oleh" name="oleh" type="text" required maxLength={120} className={fieldCls} placeholder="Nama ortu/wali" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-hubungan" className="block text-sm font-medium text-slate-900">Hubungan</label>
              <select id="c-hubungan" name="hubungan" required defaultValue="ibu" className={fieldCls}>
                <option value="ayah">Ayah</option>
                <option value="ibu">Ibu</option>
                <option value="wali">Wali</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="c-metode" className="block text-sm font-medium text-slate-900">Metode</label>
              <select id="c-metode" name="metode" required defaultValue="tatap_muka" className={fieldCls}>
                <option value="tatap_muka">Tatap muka</option>
                <option value="digital">Digital</option>
                <option value="surat">Surat</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="c-catatan" className="block text-sm font-medium text-slate-900">Catatan (opsional)</label>
            <textarea id="c-catatan" name="catatan" rows={2} maxLength={500} className={fieldCls} />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[#005D4C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#004D40] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              Simpan
            </button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Batal</button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => { setOpen(true); setError(null); }}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C]"
        >
          Catat / perbarui persetujuan
        </button>
      )}
    </section>
  );
}
