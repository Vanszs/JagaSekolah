"use client";

import "@aejkatappaja/phantom-ui";
import type { ReactNode } from "react";

/**
 * Pembungkus klien untuk <phantom-ui> (skeleton loader struktur-aware).
 * phantom-ui butuh API browser (mengukur DOM) sehingga SSR tidak bisa
 * render shimmer — server merender placeholder apa adanya, lalu hydrasi
 * klien men-aktifkan web component untuk overlay shimmer sesuai
 * attribute `loading` (CSS `ssr.css` menjaga teks tersembunyi selama SSR).
 *
 * Pakai: bungkus konten yang sedang dimuat dengan <Phantom loading={isLoading}>.
 * `count` mereplika template anak N kali (mode baris berulang).
 */
export default function Phantom({
  loading,
  count,
  className,
  children,
}: {
  loading: boolean;
  count?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <phantom-ui
      class={className}
      animation="shimmer"
      reveal={0.3}
      loading={loading || undefined}
      count={count}
    >
      {children}
    </phantom-ui>
  );
}
