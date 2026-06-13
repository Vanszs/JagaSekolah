import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string; // tanpa href = halaman aktif
}

/** Breadcrumb drill-down: Nasional > Provinsi > Kabupaten > Sekolah > Kelas > Siswa. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-1">
              {c.href && !last ? (
                <Link href={c.href} className="text-slate-500 transition-colors hover:text-[#005D4C]">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? "font-medium text-slate-900" : "text-slate-500"} aria-current={last ? "page" : undefined}>
                  {c.label}
                </span>
              )}
              {!last && <ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
