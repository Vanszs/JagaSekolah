"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, Plus, Pencil, Trash2, Loader2, X } from "lucide-react";

const JENIS: { value: string; label: string }[] = [
  { value: "kunjungan_rumah", label: "Kunjungan rumah" },
  { value: "koordinasi_bk", label: "Koordinasi BK" },
  { value: "konseling", label: "Konseling" },
  { value: "usul_kip", label: "Usulan KIP/PIP" },
  { value: "lainnya", label: "Lainnya" },
];
const JENIS_LABEL = Object.fromEntries(JENIS.map((j) => [j.value, j.label]));

export interface IntervensiItem {
  id: string;
  tanggal: string; // ISO
  jenis: string;
  catatan: string;
  version: number;
  olehUserId: string;
  olehNama: string;
}

const fieldCls =
  "block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 transition-colors focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C]";

/**
 * CRUD intervensi pada halaman detail siswa (guru/bk/kepsek).
 * Memakai API: POST /api/intervensi, PATCH/DELETE /api/intervensi/[id]
 * (optimistic locking via version). Hanya pencatat (atau kepsek) yang
 * dapat mengedit/menghapus entri.
 */
export function IntervensiManager({
  siswaId,
  items,
  currentUserId,
  canEditAll,
}: {
  siswaId: string;
  items: IntervensiItem[];
  currentUserId: string;
  canEditAll: boolean;
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitNew(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/intervensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siswaId, jenis: String(fd.get("jenis")), catatan: String(fd.get("catatan")) }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error ?? "Gagal menyimpan.");
      setAdding(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit(e: React.FormEvent<HTMLFormElement>, item: IntervensiItem) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/intervensi/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jenis: String(fd.get("jenis")), catatan: String(fd.get("catatan")), baseVersion: item.version }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error ?? "Gagal memperbarui.");
      setEditId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: IntervensiItem) {
    if (!confirm("Hapus catatan intervensi ini?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/intervensi/${item.id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || json.ok === false) throw new Error(json.error ?? "Gagal menghapus.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[#0F172A]">
          <HeartHandshake className="h-4 w-4 text-slate-400" aria-hidden="true" />
          Riwayat &amp; tindak lanjut
        </h2>
        {!adding && (
          <button
            type="button"
            onClick={() => { setAdding(true); setEditId(null); setError(null); }}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#005D4C] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#004D40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Catat intervensi
          </button>
        )}
      </div>

      {error && <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {adding && (
        <form onSubmit={submitNew} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
          <div className="space-y-1.5">
            <label htmlFor="new-jenis" className="block text-sm font-medium text-slate-900">Jenis tindak lanjut</label>
            <select id="new-jenis" name="jenis" required defaultValue="" className={fieldCls}>
              <option value="" disabled>Pilih jenis…</option>
              {JENIS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="new-catatan" className="block text-sm font-medium text-slate-900">Catatan</label>
            <textarea id="new-catatan" name="catatan" required rows={3} maxLength={2000} className={fieldCls} placeholder="Uraikan tindak lanjut yang dilakukan…" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[#005D4C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#004D40] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
              Simpan
            </button>
            <button type="button" onClick={() => setAdding(false)} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">Batal</button>
          </div>
        </form>
      )}

      {items.length === 0 && !adding ? (
        <p className="mt-3 text-sm text-slate-500">Belum ada tindak lanjut tercatat.</p>
      ) : (
        <ol className="mt-4 space-y-4 border-l border-slate-200 pl-4">
          {items.map((it) => {
            const mine = it.olehUserId === currentUserId;
            const canEdit = mine || canEditAll;
            const editing = editId === it.id;
            return (
              <li key={it.id} className="relative">
                <span className="absolute -left-[1.30rem] top-1 h-2 w-2 rounded-full bg-[#005D4C] ring-4 ring-white" aria-hidden="true" />
                {editing ? (
                  <form onSubmit={(e) => submitEdit(e, it)} className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                    <div className="space-y-1.5">
                      <label htmlFor={`edit-jenis-${it.id}`} className="block text-sm font-medium text-slate-900">Jenis</label>
                      <select id={`edit-jenis-${it.id}`} name="jenis" aria-label="Jenis tindak lanjut" defaultValue={it.jenis} className={fieldCls}>
                        {JENIS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`edit-catatan-${it.id}`} className="block text-sm font-medium text-slate-900">Catatan</label>
                      <textarea id={`edit-catatan-${it.id}`} name="catatan" aria-label="Catatan intervensi" defaultValue={it.catatan} rows={3} maxLength={2000} required className={fieldCls} />
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-[#005D4C] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#004D40] disabled:opacity-60">
                        {busy && <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                        Perbarui
                      </button>
                      <button type="button" onClick={() => setEditId(null)} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
                        <X className="h-4 w-4" aria-hidden="true" />Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="group">
                    <p className="text-xs text-slate-400">
                      <time dateTime={it.tanggal}>{new Date(it.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</time>
                      {" · "}{it.olehNama}
                    </p>
                    <div className="mt-0.5 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{JENIS_LABEL[it.jenis] ?? it.jenis}</p>
                        {it.catatan && <p className="mt-0.5 text-sm text-slate-600">{it.catatan}</p>}
                      </div>
                      {canEdit && (
                        <div className="flex shrink-0 gap-1">
                          <button type="button" onClick={() => { setEditId(it.id); setAdding(false); setError(null); }} aria-label="Edit intervensi" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-[#005D4C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C]">
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button type="button" onClick={() => remove(it)} disabled={busy} aria-label="Hapus intervensi" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60">
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
