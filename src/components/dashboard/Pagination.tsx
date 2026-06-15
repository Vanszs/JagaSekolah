import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const EMPTY_PARAMS: Record<string, string | undefined> = {};

/**
 * Paginasi berbasis search-param (`?page=N`). Server-component murni.
 * Render Prev / halaman / Next. Styling: tombol rounded-md + focus ring teal.
 */
export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = EMPTY_PARAMS,
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v != null && v !== "" && k !== "page") p.set(k, v);
    }
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const pages: (number | "…")[] = [];
  const add = (n: number | "…") => {
    if (n === "…" && pages[pages.length - 1] === "…") return;
    pages.push(n);
  };
  const window = 1;
  add(1);
  for (let n = page - window; n <= page + window; n++) {
    if (n > 1 && n < totalPages) add(n);
  }
  if (totalPages > 1) add(totalPages);

  const linkBase =
    "inline-flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C]";

  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500 tabular-nums">
        Halaman {page} dari {totalPages}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link href={buildHref(page - 1)} className={`${linkBase} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`} aria-label="Halaman sebelumnya">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true" className={`${linkBase} cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300`}>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </li>
        {pages.map((n, i) =>
          n === "…" ? (
            <li key={`e${i}`} aria-hidden="true" className="px-1 text-xs text-slate-400">…</li>
          ) : (
            <li key={n}>
              {n === page ? (
                <span aria-current="page" className={`${linkBase} border-[#005D4C] bg-[#005D4C] text-white`}>
                  {n}
                </span>
              ) : (
                <Link href={buildHref(n)} className={`${linkBase} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`}>
                  {n}
                </Link>
              )}
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link href={buildHref(page + 1)} className={`${linkBase} border-slate-200 bg-white text-slate-600 hover:bg-slate-50`} aria-label="Halaman berikutnya">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <span aria-disabled="true" className={`${linkBase} cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300`}>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
