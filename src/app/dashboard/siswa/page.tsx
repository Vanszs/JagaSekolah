import Link from "next/link";
import { ArrowRight, Users, Lock } from "lucide-react";
import type { KategoriRisiko, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireDashboardContext } from "@/lib/session";
import { siswaScope, AuthError } from "@/lib/rbac";
import { PageHeader, RiskDot, EmptyState } from "@/components/dashboard/ui";
import { Pagination } from "@/components/dashboard/Pagination";
import { RecomputeButton } from "@/components/dashboard/RecomputeButton";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;
const FILTERS: { key: "" | KategoriRisiko; label: string }[] = [
  { key: "", label: "Semua" },
  { key: "merah", label: "Risiko Tinggi" },
  { key: "kuning", label: "Waspada" },
  { key: "hijau", label: "Aman" },
];

// Bobot urutan kategori (merah>kuning>hijau) — statik, modul-scope.
const RANK: Record<string, number> = { merah: 3, kuning: 2, hijau: 1 };

export default async function SiswaListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; page?: string }>;
}) {
  // ctx & searchParams independen -> jalankan paralel.
  const [ctx, sp] = await Promise.all([
    requireDashboardContext("/dashboard/siswa"),
    searchParams,
  ]);
  const { q = "", kategori = "", page: pageStr = "1" } = sp;
  const page = Math.max(1, Number.parseInt(pageStr, 10) || 1);

  // Dinas tidak boleh data per-siswa — tampilkan notice ramah (bukan crash).
  let where: Record<string, unknown>;
  try {
    where = siswaScope(ctx);
  } catch (e) {
    if (e instanceof AuthError && e.code === 403) {
      return (
        <>
          <PageHeader title="Daftar Siswa" />
          <EmptyState
            icon={<Lock className="h-6 w-6" aria-hidden="true" />}
            title="Akses data per-siswa dibatasi"
            desc="Sebagai Dinas Pendidikan, Anda hanya dapat melihat statistik agregat anonim. Buka menu Agregat Wilayah."
          />
          <Link
            href="/dashboard/agregat"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#005D4C] hover:underline underline-offset-2"
          >
            Ke Agregat Wilayah
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </>
      );
    }
    throw e;
  }

  const search = q.trim();
  const siswaWhere: Prisma.SiswaWhereInput = {
    ...(where as Prisma.SiswaWhereInput),
    ...(search
      ? { OR: [{ nama: { contains: search } }, { nisn: { contains: search } }] }
      : {}),
    ...(kategori
      ? { risiko: { some: { isLatest: true, kategori: kategori as KategoriRisiko } } }
      : {}),
  };

  const [siswa, total] = await Promise.all([
    prisma.siswa.findMany({
      where: siswaWhere,
      select: {
        id: true,
        nama: true,
        nisn: true,
        kelas: { select: { nama: true } },
        risiko: { where: { isLatest: true }, select: { kategori: true, skor: true }, take: 1 },
      },
      orderBy: [{ nama: "asc" }, { id: "asc" }],
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.siswa.count({ where: siswaWhere }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // urutkan: berisiko tinggi dulu (merah>kuning>hijau>none), lalu skor desc
  const rows = siswa
    .map((s) => ({ ...s, r: s.risiko[0] ?? null }))
    .sort((a, b) => {
      const ra = a.r ? RANK[a.r.kategori] ?? 0 : 0;
      const rb = b.r ? RANK[b.r.kategori] ?? 0 : 0;
      if (rb !== ra) return rb - ra;
      return (b.r?.skor ?? 0) - (a.r?.skor ?? 0);
    });

  function filterHref(key: string) {
    const p = new URLSearchParams();
    if (search) p.set("q", search);
    if (key) p.set("kategori", key);
    const qs = p.toString();
    return `/dashboard/siswa${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      <PageHeader
        title="Daftar Siswa"
        desc="Setiap siswa disertai label dan skor risiko. Klik untuk melihat alasan dan riwayat."
        action={<RecomputeButton />}
      />

      {/* Toolbar: search + filter */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form action="/dashboard/siswa" method="get" className="relative max-w-xs flex-1">
          {kategori && <input type="hidden" name="kategori" value={kategori} />}
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Cari nama atau NISN…"
            aria-label="Cari siswa"
            className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#005D4C] focus:outline-none focus:ring-1 focus:ring-[#005D4C]"
          />
        </form>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = (kategori || "") === f.key;
            return (
              <Link
                key={f.label}
                href={filterHref(f.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? "bg-[#005D4C] text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Users className="h-6 w-6" aria-hidden="true" />}
          title="Tidak ada siswa"
          desc={search || kategori ? "Tidak ada hasil untuk filter ini. Coba ubah pencarian." : "Belum ada data siswa di lingkup Anda."}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Nama</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Kelas</th>
                  <th scope="col" className="px-4 py-3 text-left font-medium">Risiko</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Skor</th>
                  <th scope="col" className="px-4 py-3" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((s) => (
                  <tr key={s.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3.5">
                      <Link href={`/dashboard/siswa/${s.id}`} className="font-semibold text-slate-900 hover:text-[#005D4C]">
                        <span className="block max-w-xs truncate" title={s.nama}>{s.nama}</span>
                      </Link>
                      <span className="ml-2 text-xs tabular-nums text-slate-400">{s.nisn}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600"><span className="block max-w-[8rem] truncate" title={s.kelas.nama}>{s.kelas.nama}</span></td>
                    <td className="px-4 py-3.5">
                      {s.r ? <RiskDot kategori={s.r.kategori} /> : <span className="text-xs text-slate-400">Belum dihitung</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums text-slate-700">
                      {s.r ? Math.round(s.r.skor) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link
                        href={`/dashboard/siswa/${s.id}`}
                        className="inline-flex items-center text-slate-300 group-hover:text-[#005D4C]"
                        aria-label={`Lihat detail ${s.nama}`}
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/dashboard/siswa"
        searchParams={{ q: search || undefined, kategori: kategori || undefined }}
      />
    </>
  );
}
