"use client";

import { useEffect, useState } from "react";

/**
 * Pembungkus klien untuk <phantom-ui> (skeleton loader struktur-aware).
 * phantom-ui butuh API browser (mengukur DOM), jadi web component-nya
 * di-import dinamis saat mount. Konten anak ditulis sebagai markup NYATA —
 * itulah template skeleton-nya (teks transparan saat loading).
 *
 * Pakai: bungkus konten yang sedang dimuat dengan <Phantom loading={isLoading}>.
 * Saat lib belum termuat, fallback render konten apa adanya (tanpa shimmer).
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
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    import("@aejkatappaja/phantom-ui").then(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Sebelum web component terdaftar, jangan tampilkan shimmer (hindari flash);
  // setelah ready, biarkan <phantom-ui> mengukur & menutupi dengan skeleton.
  const showSkeleton = loading && ready;

  return (
    <phantom-ui
      class={className}
      animation="shimmer"
      reveal={0.3}
      {...(showSkeleton ? { loading: true } : {})}
      {...(count ? { count } : {})}
    >
      {children}
    </phantom-ui>
  );
}
