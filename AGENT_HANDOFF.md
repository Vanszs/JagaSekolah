# AGENT HANDOFF — JagaSekolah

> Catatan progres untuk AI agent berikutnya. Dibuat 2026-06-13.
> Baca ini dulu sebelum bekerja. Konteks proyek lengkap ada di `PLAN.md`,
> `ARCHITECTURE.md`, `DEPLOY.md`. Ringkasan produk di `README.md`.

> ## 🚨 ATURAN #1 (baca dulu, tidak bisa ditawar)
> Sebelum menyentuh UI apa pun (buat/ubah/review), kamu WAJIB membaca & mematuhi dua skill:
> 1. `.kiro/steering/Anti-AI-SLop/SKILL.md` — filter anti-slop (apa yang DILARANG)
> 2. `.kiro/steering/component-reference-design/SKILL.md` — pustaka pola (apa yang DIBANGUN)
>
> Detail lengkap + larangan + checklist ada di **§6** dokumen ini. Setiap output UI yang
> melanggar = DITOLAK dan harus di-regenerate. Ini standar wajib proyek, bukan preferensi.

---

## 1. Ringkasan proyek (1 menit)

**JagaSekolah** — Sistem Peringatan Dini Putus Sekolah SD/SMP (lomba LIDM ITDP).
Next.js App Router + TypeScript, Prisma + SQLite (dev), Auth.js v5 (NextAuth),
Tailwind. Mesin scoring **rule-based** (transparan, bukan kotak hitam): kerangka
**ABC** (Attendance, Behavior, Course) + konteks lokal Indonesia. RBAC 5 role.

**Prinsip non-negotiable:** transparan (tiap label punya alasan), privacy-by-design
(RBAC + enkripsi PII + audit), demo-able offline, hanya pakai data yang sekolah
sudah punya.

---

## 2. Yang DIKERJAKAN di sesi ini (kronologis)

Semua commit ada di branch `master` (lokal, **belum di-push** — user belum minta push).

| Commit | Isi |
|--------|-----|
| `6e7703b` | redesign 4 section landing (FaktorRisiko, DashboardPreview, Dampak, FAQ) — hapus AI-slop tells |
| `cac2e2a` | fix konektor CaraKerja (per-step segment, valid HTML, no overshoot) |
| `bbee308` | redesign Hero jadi full-bleed (Option 1+2: artwork edge-to-edge + typography overlap) |
| `d1939a3` | ganti artwork hero ke `public/images/hero-bg-2.png` (panorama open-sky-left) |
| `fff7d17` | login page modern split-screen + Google OAuth |
| `dcb6a8b` | fix react-doctor warnings (FAQ role=region→section, Navbar useSyncExternalStore) |
| `1b270fe` | seed: password per-role dari env (SEED_PASSWORD_*) |
| `08fe2a3` | seed: email per-role dari env (SEED_EMAIL_*) |
| `7f1ed02` | fix dashboard: requireDashboardContext() redirect (bukan throw 401) + error.tsx |
| `b142398` | **fix login bug**: pindah ke Server Action (client signIn v5 tak persist cookie) + logger quiet + email normalize |
| `5f1f847` | unit test 43→274 + fix bug `configVersion` (bobot ke-strip) |
| `(uncommitted)` | **authCore extract + 30 auth test + phantom-ui skeleton** — BELUM di-commit |

---

## 3. STATUS SAAT INI (yang belum selesai / belum commit)

### 3a. Auth unit tests — SELESAI, perlu commit
- Ekstrak callback Auth.js jadi fungsi murni dependency-injected:
  **`src/lib/authCore.ts`** — `authorizeCredentials`, `signInGuard`, `enrichJwt`,
  `buildSessionUser`, `CredsSchema` (semua pakai "ports" agar bisa diuji tanpa DB/bcrypt).
- **`src/lib/auth.ts`** sekarang membungkus authCore dgn port Prisma+bcrypt nyata
  (perilaku identik dgn sebelumnya).
- **`tests/authCore.test.ts`** — 30 test: normalisasi email, password salah/kosong,
  user nonaktif, Google guard (provisioned/unprovisioned/inactive/no-email),
  jwt enrich (credentials vs OAuth), session revocation (tokenVersion mismatch/inactive/not-found).
- Suite penuh: **304 test, 0 fail**. `tsc` bersih.

### 3b. phantom-ui skeleton — SELESAI, perlu commit + verifikasi visual
- Install `@aejkatappaja/phantom-ui@1.2.0` (pinned exact; MIT; **diverifikasi aman** —
  653★, no postinstall hook). CATATAN: npm `phantom-ui` (tanpa scope) ADALAH paket
  BERBEDA & mencurigakan — JANGAN pakai itu. Yang benar `@aejkatappaja/phantom-ui`.
- `src/phantom-ui.d.ts` — deklarasi JSX `<phantom-ui>`.
- `src/components/Phantom.tsx` — wrapper klien (lazy-import web component, render
  `<phantom-ui loading>`). Skeleton struktur-aware: markup nyata = template skeleton.
- `src/app/layout.tsx` — import `@aejkatappaja/phantom-ui/ssr.css` (anti flash).
- Route-segment loading UI (Next streaming): `src/app/dashboard/loading.tsx`,
  `src/app/dashboard/siswa/loading.tsx`, `src/app/dashboard/siswa/[id]/loading.tsx`.
- `tsc` bersih, dev server jalan tanpa error. **Verifikasi visual skeleton di browser
  belum tuntas** (data seed termuat sangat cepat → skeleton hanya flash; throttle
  network untuk melihatnya, atau cek route lambat).

### ⚠️ YANG MASIH HARUS DILAKUKAN
1. **Commit** perubahan 3a + 3b (auth + phantom-ui). Saran pesan: lihat pola commit di atas.
2. (Opsional, diminta user "terutama auth") tambah skeleton phantom-ui ke **pending
   state form login** — saat ini login pakai `useFormStatus` spinner; bisa diperkaya.
3. Verifikasi visual skeleton phantom-ui (throttle network di /dashboard).
4. **Production build belum dijalankan** — `npm run build` untuk pastikan web-component
   (Lit) tidak bentrok dgn RSC/SSR boundary. Lakukan sebelum anggap selesai.

---

## 4. PETA ARSITEKTUR yang RELEVAN (biar tak salah asumsi)

### Auth (Auth.js v5 / NextAuth)
- **Strategy JWT, `maxAge: 15 menit`** (SANGAT pendek). Saat testing manual, sesi sering
  lapse di sela langkah → terlihat "redirect ke /login". Itu BUKAN bug; re-login.
- **Login memakai Server Action** (`src/app/login/actions.ts`), BUKAN client `signIn`.
  Alasan: client `signIn` dari `next-auth/react` TIDAK persist cookie credentials di v5-beta
  (chunk 404 / quirk redirect:false). Jangan balik ke client signIn.
- **Middleware (`src/middleware.ts`) TIDAK gate `/dashboard`** — Edge runtime + Prisma
  di session callback tidak andal. Gate dilakukan oleh **layout server** via `auth()`+`redirect`.
  Middleware tetap melindungi `/api/*`.
- **RBAC scope helpers** (`src/lib/rbac.ts`): `siswaScope` (dinas→403), `agregatScope`
  (hanya dinas/superadmin), `resolveSiswa` (IDOR-safe), `requireRole`, `assertSameSekolah`.
- **`requireDashboardContext()`** (`src/lib/session.ts`) → redirect /login saat 401
  (dipakai semua page dashboard). `requireContext()` (lempar 401) tetap untuk API routes.
- Role: `superadmin | dinas | kepsek | guru | bk`.
- Google OAuth: aktif hanya bila `AUTH_GOOGLE_ID`+`AUTH_GOOGLE_SECRET` di env. Akun
  TIDAK dibuat otomatis — hanya email User aktif yang sudah di-provisioning boleh masuk
  (guard di `signInGuard`).

### Dashboard (RBAC-aware, sudah jadi)
- `src/app/dashboard/layout.tsx` (auth gate + shell), `page.tsx` (overview role-aware),
  `siswa/page.tsx` (list), `siswa/[id]/page.tsx` (detail transparan), `agregat/page.tsx`
  (dinas/superadmin), `error.tsx`.
- `src/components/dashboard/DashboardShell.tsx` (sidebar/drawer/topbar/logout),
  `ui.tsx` (RiskBadge/RiskDot/StatTile/PageHeader/EmptyState).
- `src/lib/nav.ts` — `NAV_ITEMS`, `navForRole`, `canAccess`, `roleLabel`.

### Scoring (rule-based)
- `src/lib/scoring/`: `features.ts`, `buildInput.ts`, `rules.ts`, `explain.ts`,
  `thresholds.ts`, `types.ts`.
- `Risiko.alasanJson` = JSON `{ alasan: string[], saran: string[] }`.
- `configVersion()` di `thresholds.ts` — HABIS DIPERBAIKI: dulu pakai
  `JSON.stringify(t, Object.keys(t).sort())` (arg array = ALLOWLIST properti, bukan
  pengurut) → key bersarang `bobot.*` ter-strip → ubah bobot tak ubah hash. Sekarang
  pakai `stableStringify` deep. Jangan regресi ini.

### DB / seed
- `prisma/seed.ts` — data sintetis Faker, deterministik. Email & password tiap role
  dari env `SEED_EMAIL_*` / `SEED_PASSWORD_*` (fallback `<role>@demo.test` / `password123`).
- `.env` (gitignored) saat ini: super=`superadmin@demo.test`/`superadmin123`,
  dinas/kepsek/bk/guru = `<role>@demo.test` / `<role>123`, guru2=`guru2@demo.test`/`guru123`.
- Re-seed: `npx tsx prisma/seed.ts` atau `npm run db:seed`.

---

## 5. TESTING

- Runner: **`node:test` via `tsx`** (BUKAN vitest/jest — sengaja, demi skor supply-chain).
  Jalankan: `npm test` (= `tsx --test tests/*.test.ts`).
- Matcher: shim custom **`tests/_expect.ts`**. Matcher TERSEDIA HANYA: `toBe, toEqual,
  toBeNull, toBeGreaterThan, toBeGreaterThanOrEqual, toBeLessThanOrEqual, toHaveLength,
  toContain, toMatch, toThrow` (+ `.not`). JANGAN pakai matcher lain.
- Import modul via alias `@/` (→ `src/`).
- **TANPA Prisma/DB/network di unit test** — pakai pure function + dependency injection
  (lihat pola `tests/authCore.test.ts` ports, `tests/applySync.test.ts` SyncPort).
- Saat ini **304 test / 0 fail**. File test: authCore, api, rules, rules-scenarios,
  features, buildInput, explain, thresholds, columnMap, parse, nav, rateLimit, rbac,
  cleaning, crypto, envelope, applySync.

---

## 6. ⛔ WAJIB: TANAMKAN SKILL ANTI-AI-SLOP + COMPONENT-REFERENCE-DESIGN

> Ini BUKAN saran. Proyek ini punya dua skill steering yang HARUS kamu baca dan
> patuhi SEBELUM menyentuh UI apa pun (membuat, mengubah, atau me-review).
> Jika kamu skip ini, output-mu akan ditolak. Perlakukan keduanya sebagai filter
> wajib, bukan referensi opsional.

### 6.0 LANGKAH WAJIB SEBELUM MENULIS UI
1. **Baca `.kiro/steering/Anti-AI-SLop/SKILL.md`** (negative prompt — apa yang DILARANG).
2. **Baca `.kiro/steering/component-reference-design/SKILL.md`** (positive library — apa yang DIBANGUN).
3. Buka file referensi yang relevan dengan komponen yang kamu kerjakan (peta di bawah).
4. Untuk SETIAP komponen: buat keputusan sadar di 5 axis (color, type, layout, copy, motion).
5. Sebelum selesai: jalankan **Pre-Delivery Slop Audit** (ada di Anti-AI-Slop SKILL.md).

> Dua skill ini berpasangan: **Anti-AI-Slop = filter (hindari), Component Reference = palette (bangun).**

### 6.1 File referensi (PETA — buka sesuai yang dikerjakan)
| Kerjakan… | Buka |
|-----------|------|
| Apa yang dilarang (semua komponen) | `.kiro/steering/Anti-AI-SLop/references/slop-uiux-patterns.md` |
| Slop di level KODE (React/TSX/a11y) | `.kiro/steering/Anti-AI-SLop/references/slop-code-patterns.md` |
| Layout / page skeleton / grid | `.kiro/steering/component-reference-design/references/layouts.md` (16 fondasi + Part 2: skeleton website modern 2025–2026) |
| Card / button / form / nav / data display | `.kiro/steering/component-reference-design/references/components.md` |
| Type scale / font pairing / fluid clamp | `.kiro/steering/component-reference-design/references/typography.md` |
| Modal / drawer / toast / motion | `.kiro/steering/component-reference-design/references/animation.md` |
| Pilih design system / token | `.kiro/steering/component-reference-design/references/design-systems.md` |

### 6.2 ⛔ INSTANT-DEATH SIGNATURE — 3+ ini bersamaan = WAJIB regenerate
```
purple/indigo gradient + Inter di mana-mana + centered hero + dual CTA simetris
+ 3-card feature grid + rounded-2xl di semua elemen + pill gradient button
+ "Trusted by 5,000+ teams" + copy "Supercharge/Unlock/Seamless"
+ gradient/aurora blobs + glassmorphism + emoji icon + left-border card
```

### 6.3 LARANGAN KERAS (per komponen — tidak boleh muncul)
- **Color:** `indigo/violet/purple` sebagai aksen, gradient `from-purple-* to-pink/blue/cyan`,
  neon glow `shadow-[0_0_40px]`, dark-mode "slate-900 + indigo", body text `text-gray-400` (gagal kontras).
- **Type:** Inter/Geist untuk display+body, gradient `bg-clip-text` headline,
  `text-5xl font-extrabold tracking-tighter`, eyebrow `tracking-widest uppercase` di tiap section,
  Playfair+Inter "tasteslop".
- **Cards:** 3-col grid identik (icon-in-rounded-square+title+blurb), `rounded-2xl shadow-lg border` seragam,
  `hover:scale-105`, glassmorphism, **`border-l-4` left accent** (tell #1), emoji icon, fake-avatar testimonial.
- **Layout:** semua centered `max-w-7xl`, `py-20` seragam, `grid-cols-3` tiap section,
  alternating image-left/right tak berujung, anatomi section identik berulang.
- **Hero:** centered + dual symmetric CTA, eyebrow pill `✨ Now with AI`, aurora blob,
  perspective-tilt mockup + glow, fake logo strip, `h-screen` cuma teks.
- **Motion:** universal fade-in-up (AOS), `hover:scale-105`, infinite floating blob, marquee,
  animated gradient bg, **tanpa `prefers-reduced-motion`** (ini a11y FAILURE), transisi 500ms+.
- **Copy:** "Supercharge/Unlock/Revolutionize/Seamless/for modern teams", CTA "Get Started"/"Learn More",
  testimonial palsu, metrik karangan, em-dash berlebihan, Lorem ipsum tertinggal.
- **Buttons/Forms/Nav/Footer:** gradient primary + ghost pair, emoji-in-button, `rounded-full` di mana-mana,
  form tanpa state error/success, navbar glassmorphic mengambang, footer 4-kolom link mati.

### 6.4 WAJIB DIPAKAI (positive defaults — sudah jadi standar proyek ini)
- Warna brand **`#005D4C`** (teal hijau, bukan ungu) + slate netral. 60-30-10.
- Radius **scale**: input/badge `rounded-md`, card `rounded-lg`, modal `rounded-xl`, `rounded-full` hanya pill/avatar.
- Hover = `hover:shadow-md` / `hover:border-…` / `hover:-translate-y-0.5` (BUKAN scale-105).
- `transition-colors`/`transition-shadow` (BUKAN `transition-all`); hover 100–150ms, masuk 200–300ms.
- `prefers-reduced-motion` WAJIB pada tiap animasi spasial.
- Semantic HTML (`<button>`/`<a>`/`<nav>`/`<table>`/`<dialog>`), `focus-visible:ring`, label terhubung,
  error = border+ikon+teks+`aria-invalid`+`aria-describedby`.
- `tabular-nums` untuk semua angka. Font display non-Inter. `dvh` bukan `vh`. Body `max-w-prose`.
- Anti-monoton: variasikan lebar container, padding section, struktur grid; 1 elemen dominan/section;
  ≥2 momen asimetris/halaman; jangan ulang anatomi section beruntun.

### 6.5 BUKTI bahwa standar ini SUDAH diterapkan (jadikan contoh, jangan regресi)
- Hero full-bleed (`src/components/landing/Hero.tsx`), FaktorRisiko (huruf A/B/C sebagai sistem,
  bukan rainbow rail), DashboardPreview (dot+label, bukan pill berwarna), Dampak (hierarki heading>angka),
  FAQ (`bg-slate-50` + section semantik), login split-screen, dashboard (RiskBadge ring-inset, StatTile dot).
- Saat kamu menyentuh UI baru, samakan kualitasnya dengan ini. Jika ragu: buka file referensi,
  jangan tebak.

### 6.6 GESTALT CHECK terakhir (tanya ke diri sendiri sebelum selesai)
- Kalau logo ditukar kompetitor, ada yang sadar? Kalau tidak → masih slop, perbaiki.
- Muncul Instant-Death Signature (3+ tell)? → regenerate.
- Lolos mata desainer senior dalam 2 detik? Kalau tidak → perbaiki.

---

## 7. CARA VERIFIKASI CEPAT

```bash
npm test                      # 304 pass
npx tsc --noEmit -p tsconfig.json   # bersih
npm run dev                   # dev server (sudah jalan di :3000 saat sesi ini)
npm run build                 # BELUM dites sesi ini — WAJIB sebelum rilis
```
Login demo (dev): buka `/login` → `guru@demo.test` / `guru123` (atau role lain di §4).
Catatan: jika diarahkan balik ke /login, sesi 15-menit lapse — login ulang.

---

## 8. KEPUTUSAN SADAR (jangan "perbaiki" tanpa baca)

- Sisa warning react-doctor di `prisma/seed.ts` (sequential await, await-in-loop) +
  `sharp` "unused" SENGAJA dibiarkan: seed butuh urutan FK/NISN deterministik;
  `sharp` dipakai `next/image` di produksi (false positive).
- `maxAge` sesi 15 menit memang pendek (keamanan data anak). Jangan naikkan tanpa diskusi.
- Gambar hero lama (`public/images/hero-bg.jpg/.webp`) tak terpakai lagi — boleh dihapus
  jika user setuju (belum dilakukan).
