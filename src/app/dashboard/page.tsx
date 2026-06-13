import Link from "next/link";
import { ArrowRight, Users, BarChart3 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireContext } from "@/lib/session";
import { siswaScope, agregatScope } from "@/lib/rbac";
import type { KategoriRisiko } from "@prisma/client";
import { PageHeader, StatTile, RiskDot, EmptyState } from "@/components/dashboard/ui";

export const dynamic = "force-dynamic";

const KATEGORI: KategoriRisiko[] = ["merah", "kuning", "hijau"];

export default async function OverviewPage() {
  const ctx = await requireContext();

  // ── Dinas: ringkasan agregat anonim (tanpa data per-siswa) ──
  if (ctx.role === "dinas") {
    const scope = agregatScope(ctx);
    const sekolah = await prisma.sekolah.findMany({
      where: scope.wilayahId ? { wilayahId: scope.wilayahId } : {},
      select: { id: true },
    });
    const grouped = await prisma.risiko.groupBy({
      by: ["kategori"],
      where: { sekolahId: { in: sekolah.map((s) => s.id) }, isLatest: true },
      _count: true,
    });
    const count = (k: KategoriRisiko) => grouped.find((g) => g.kategori === k)?._count ?? 0;

    return (
      <>
        <PageHeader
          title="Ringkasan Wilayah"
          desc="Statistik risiko anonim seluruh sekolah di wilayah Anda. Data per-siswa tetap di tangan sekolah."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Sekolah terpantau" value={sekolah.length} accent="brand" />
          <StatTile label="Risiko tinggi" value={count("merah")} accent="merah" />
          <StatTile label="Waspada" value={count("kuning")} accent="kuning" />
          <StatTile label="Aman" value={count("hijau")} accent="hijau" />
        </div>
        <Link
          href="/dashboard/agregat"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#005D4C] hover:underline underline-offset-2"
        >
          Lihat rincian per sekolah
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </>
    );
  }

  // ── Guru / Kepsek / BK / Superadmin: KPI + siswa berisiko tertinggi ──
  const where = siswaScope(ctx); // superadmin {}, kepsek/bk {sekolahId}, guru {sekolahId,kelasId}

  const [totalSiswa, grouped, topRisiko] = await Promise.all([
    prisma.siswa.count({ where }),
    prisma.risiko.groupBy({
      by: ["kategori"],
      where: { isLatest: true, siswa: where },
      _count: true,
    }),
    prisma.risiko.findMany({
      where: { isLatest: true, kategori: { in: ["merah", "kuning"] }, siswa: where },
      orderBy: { skor: "desc" },
      take: 6,
      select: {
        skor: true,
        kategori: true,
        siswa: { select: { id: true, nama: true, kelas: { select: { nama: true } } } },
      },
    }),
  ]);
  const count = (k: KategoriRisiko) => grouped.find((g) => g.kategori === k)?._count ?? 0;

  return (
    <>
      <PageHeader
        title="Ringkasan"
        desc="Pantauan risiko putus sekolah untuk siswa di lingkup Anda — diurutkan dari yang paling membutuhkan perhatian."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total siswa" value={totalSiswa} accent="brand" />
        {KATEGORI.map((k) => (
          <StatTile
            key={k}
            label={k === "merah" ? "Risiko tinggi" : k === "kuning" ? "Waspada" : "Aman"}
            value={count(k)}
            accent={k}
          />
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-[#0F172A]">Perlu perhatian</h2>
          <Link
            href="/dashboard/siswa"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#005D4C] hover:underline underline-offset-2"
          >
            Semua siswa
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {topRisiko.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" aria-hidden="true" />}
            title="Belum ada siswa berisiko"
            desc="Semua siswa berstatus aman, atau data risiko belum dihitung."
          />
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {topRisiko.map((r) => (
              <li key={r.siswa.id}>
                <Link
                  href={`/dashboard/siswa/${r.siswa.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{r.siswa.nama}</p>
                    <p className="text-xs text-slate-400">{r.siswa.kelas.nama}</p>
                  </div>
                  <RiskDot kategori={r.kategori} />
                  <span className="w-10 text-right text-sm font-semibold tabular-nums text-slate-700">
                    {Math.round(r.skor)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {ctx.role === "superadmin" && (
        <Link
          href="/dashboard/agregat"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#005D4C] hover:underline underline-offset-2"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          Lihat agregat seluruh wilayah
        </Link>
      )}
    </>
  );
}
