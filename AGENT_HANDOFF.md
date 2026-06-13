# AGENT HANDOFF — JagaSekolah

> Catatan progres untuk AI agent berikutnya. Diperbarui 2026-06-13 (sesi 2).
> Baca ini dulu sebelum bekerja. Konteks proyek lengkap ada di `PLAN.md`,
> `ARCHITECTURE.md`, `DEPLOY.md`. Ringkasan produk di `README.md`.

> ## 🚨 ATURAN #1 (baca dulu, tidak bisa ditawar)
> Sebelum menyentuh UI apa pun (buat/ubah/review), kamu WAJIB membaca & mematuhi dua skill:
> 1. `.kiro/steering/Anti-AI-SLop/SKILL.md` — filter anti-slop (apa yang DILARANG)
> 2. `.kiro/steering/component-reference-design/SKILL.md` — pustaka pola (apa yang DIBANGUN)
>
> Detail lengkap + larangan + checklist ada di **§6** dokumen ini. Setiap output UI yang
> melanggar = DITOLAK dan harus di-regenerate. Ini standar wajib proyek, bukan preferensi.

> ## 🟢 ATURAN #2 — react-doctor HARUS 100/100
> Setiap kali menyentuh komponen React/TSX, jalankan `npx react-doctor@latest` dan
> jaga skor tetap **100/100**. Perbaikan harus GENUINE (bukan suppress/no-op). Untuk
> false-positive yang terdokumentasi, pakai `doctor.config.json` (lihat §9), JANGAN
> inline-disable asal.

---

## 1. Ringkasan proyek (1 menit)

**JagaSekolah** — Sistem Peringatan Dini Putus Sekolah SD/SMP (lomba LIDM ITDP).
Next.js 15 App Router + TypeScript, **Prisma + PostgreSQL di belakang PgBouncer**
(transaction pooling), Auth.js v5 (NextAuth), Tailwind v3, **Recharts** (charts).
Mesin scoring **rule-based** (transparan, bukan kotak hitam): kerangka **ABC**
(Attendance, Behavior, Course) + konteks lokal Indonesia. RBAC 5 role.

**Prinsip non-negotiable:** transparan (tiap label punya alasan), privacy-by-design
(RBAC + enkripsi PII + audit, **dinas TIDAK pernah lihat identitas siswa**),
demo-able offline, hanya pakai data yang sekolah sudah punya, **TIDAK mengarang
metrik** (kalau tak ada datanya → tunda + tampilkan placeholder jujur).

---

## 2. Yang DIKERJAKAN (kronologis)

Semua di branch `master` (lokal, **belum di-push** — push bila user minta).

**Sesi 1** (`5f1f847` ke bawah): redesign landing, login server-action, seed env,
unit test 43→274, fix `configVersion`, authCore extract + phantom-ui skeleton.

**Sesi 2 (terbaru) — 5 commit besar:**
| Commit | Isi |
|--------|-----|
| `b4943e6` | **DB: SQLite → PostgreSQL + PgBouncer** (transaction pooling). schema `provider=postgresql`+`directUrl`; docker-compose postgres:16 + edoburu/pgbouncer; migration Postgres + partial-unique isLatest index; drop orphan `Kelas.waliKelasId`; docs. |
| `40a02c4` | **fix auth+ui**: font next/font (fix Times New Roman); **middleware Edge-safe (`authEdge`) — fix JWTSessionError redirect-loop tiap pindah halaman**; OAuth login-only + `email_verified`; login action redirect already-authed; +authCore robustness tests. |
| `24938aa` | **fix(audit)**: P0 empty-alasan (parseAlasan), api/siswa pagination filter di DB, de-dup AKSI_LABEL/date helpers + RISK_CONFIG, scoring threshold (rm magic 50) + real `absensiPerPeriode`, rbac `creatableRoles`, rateLimit+apiHandler ctx, hapus dead `crypto.ts`, Navbar scroll-spy. |
| `0fa4b41` | **feat(dashboard)**: Recharts charts + dashboard per-role (NationalOverview aggregate-only, Dinas anonim, Kepsek, Guru/BK); breadcrumb drill-down Nasional→Provinsi→Kabupaten→Sekolah→Kelas→Siswa; superadmin pages tenant/users(+baru)/audit/security; analytics layer; seed snapshot historis 12 bulan; doctor.config. |
| `1669267` | chore: gitignore screenshot/playwright artifacts. |

---

## 3. STATUS SAAT INI

- **Working tree CLEAN.** `tsc` bersih · **332 test / 0 fail** · `npm run build` sukses ·
  **react-doctor 100/100**.
- DB Postgres+PgBouncer berjalan via Docker, sudah di-migrate + seed (data sintetis:
  1 provinsi, 1 kabupaten, 2 sekolah, 85 siswa, 12 bulan snapshot risiko historis).
- Dashboard tiap role sudah chart-rich & tepat peran (superadmin agregat nasional,
  dinas regional anonim, kepsek sekolah, guru/bk fokus aksi). Drill-down superadmin OK.

### ⚠️ SISA / belum dikerjakan (hasil audit gap sidebar, sesi 2)
Audit 5-POV (lihat ringkasan) menemukan **gap UI** (bukan data — API/data sudah ada):
1. **P0 — Intervensi CRUD tanpa UI**: `POST/PATCH/DELETE /api/intervensi` LENGKAP
   (auth, zod, optimistic lock, audit) tapi **tak ada form/tombol**. Guru & BK TIDAK
   bisa mencatat tindak lanjut dari web. → bangun form di `/dashboard/siswa/[id]`.
2. **P0 — Kepsek**: RBAC mengizinkan kepsek membuat akun guru/BK tapi TAK ada menu
   sidebar (form `/dashboard/admin/users/baru` hanya via URL); roster kelas
   (`/dashboard/sekolah/[id]/kelas/[kelasId]`) superadmin-only → kepsek tak bisa
   klik ke kelasnya. → tambah menu "Kelola Pengguna" + longgarkan RBAC roster utk kepsek.
3. **P0 — Dinas** (cuma 2 menu): butuh Peringkat/Perbandingan Sekolah + Laporan/Ekspor.
4. **P0 — Superadmin**: trigger Hitung-Ulang Risiko (`/api/risiko/recompute` ada, no UI)
   + Status Sinkronisasi (SyncLog ada, no UI).
5. **NEEDS-DATA (JANGAN bangun tanpa skema)**: funnel/outcome/success-rate intervensi
   (Intervensi tak punya tahap/hasil), jadwal konseling, rujukan, geo-heatmap
   (Wilayah/Sekolah tak punya lat/lng), alert-threshold config, announcement.
6. **Belum `git push`**.

---

## 4. PETA ARSITEKTUR yang RELEVAN (biar tak salah asumsi)

### Auth (Auth.js v5 / NextAuth) — split Edge/Node
- **Strategy JWT, `maxAge: 15 menit`** (SANGAT pendek, sengaja utk keamanan data anak).
  Saat testing manual sesi sering lapse di sela langkah → re-login. JANGAN naikkan tanpa diskusi.
- **Login = Server Action** (`src/app/login/actions.ts`), BUKAN client `signIn` (v5-beta
  client tak persist cookie). Action redirect kalau pemanggil sudah login.
- **⚠️ KOREKSI PENTING (bug fix sesi 2): SPLIT auth instance.**
  - `src/lib/auth.ts` = instance PENUH (Prisma+bcrypt, session callback cek `tokenVersion`).
    Dipakai layout/page/route-handler (Node runtime).
  - `src/lib/authEdge.ts` = instance Edge-safe (token-only, **TANPA Prisma**). HANYA dipakai
    `src/middleware.ts`. Dulu middleware pakai `auth` penuh → Prisma jalan di Edge →
    `PrismaClientValidationError` → `JWTSessionError` → sesi terbaca null → **redirect
    /login tiap pindah halaman**. JANGAN pakai `auth` (penuh) di middleware lagi.
- Gate `/dashboard` ada di **layout server** (`requireDashboardContext`) + middleware
  (authEdge) sebagai lapis tambahan. API self-gate via `requireContext()`.
- **RBAC helpers** (`src/lib/rbac.ts`): `siswaScope` (dinas→403), `agregatScope`
  (dinas/superadmin), `resolveSiswa` (IDOR-safe; superadmin lolos), `requireRole`,
  `assertSameSekolah`, **`creatableRoles`/`canCreateUser`/`canManageUsers`** (sumber
  tunggal: superadmin→semua, kepsek→guru/bk, lainnya→none; tak ada yg bisa buat superadmin).
- `requireDashboardContext()` (`src/lib/session.ts`) → redirect /login saat 401
  (redirect DI LUAR try/catch — kalau di dalam akan tertelan). `requireContext()` lempar 401 utk API.
- Role: `superadmin | dinas | kepsek | guru | bk`.
- **Google OAuth = LOGIN-ONLY**: aktif hanya bila `AUTH_GOOGLE_ID`+`AUTH_GOOGLE_SECRET`.
  Tak ada auto-register; `signInGuard` butuh `email_verified===true` DAN email sudah jadi
  User aktif di DB. (Tak terkonfig di .env lokal → tombol Google tersembunyi.)

### Dashboard (per-role, chart-rich) — sesi 2
- `src/app/dashboard/page.tsx` mem-branch per role ke komponen khusus:
  - **superadmin** -> `NationalOverview` (AGREGAT NASIONAL saja, TANPA PII siswa) + `PlatformHealth`.
  - **dinas** -> `DinasDashboard` (regional ANONIM, scope `{sekolah:{wilayahId}}`).
  - **kepsek** -> `SchoolDashboard` (scope `{sekolahId}`, boleh lihat siswa).
  - **guru/bk** -> `GuruBKDashboard` (fokus aksi + grafik kecil sesuai peran).
- Komponen di `src/components/dashboard/`: NationalOverview, DinasDashboard, SchoolDashboard,
  GuruBKDashboard, PlatformHealth, RegionTable, Breadcrumbs, DashboardShell, ui.tsx.
- **Drill-down superadmin** (breadcrumb Nasional>Provinsi>Kabupaten>Sekolah>Kelas>Siswa):
  `/dashboard/wilayah/[provinsi]`, `/dashboard/kabupaten/[wilayahId]`, `/dashboard/sekolah/[id]`,
  `/dashboard/sekolah/[id]/kelas/[kelasId]` (roster = superadmin-only krn tampil PII).
- Superadmin platform pages: `/dashboard/admin/{tenant,users,users/baru,audit,security}`.
- `src/lib/nav.ts` — NAV_ITEMS, navForRole (label per-role via labelByRole), canAccess
  (visibilitas nav, BUKAN gerbang otorisasi), roleLabel.

### Charts & analytics — sesi 2
- **Recharts 2.15.4** (pinned). Client di `src/components/charts/recharts/`: RiskTrendLine,
  RiskDonutChart, FactorBars, CategoryStackedBars, Bars(CategoryBars), SingleAreaChart,
  theme.ts (warna brand+risiko, usePrefersReducedMotion via useSyncExternalStore, tooltipStyle).
  SEMUA `'use client'` + role=img+aria-label + animasi gated reduced-motion. (Server-SVG lama dihapus.)
- **`src/lib/analytics.ts`** (scope-aware, REAL): getKpis(+MoM), monthlyRiskTrend(12bln),
  riskFactorBreakdown (agregat alasanJson.kode), riskDonut, riskByKelas, attendanceSummary,
  priorityStudents, platformScale, riskByProvinsi/Kabupaten/Sekolah/KelasInSekolah (drill),
  interventionByJenis/Trend.
- **JANGAN buat** funnel/outcome/success-rate intervensi atau geo-heatmap — tak ada datanya.
  NationalOverview tampilkan placeholder jujur.

### Scoring (rule-based)
- `src/lib/scoring/`: features, buildInput, rules, explain, thresholds, types.
- **`Risiko.alasanJson` = `{ alasan: AlasanItem[], saran: string[] }`**, `AlasanItem={kode,pesan,bobot}`.
  Untuk teks alasan PAKAI `src/lib/parseAlasan.ts` (ekstrak `.pesan`). Bug P0 sesi 2: dulu
  di-filter `typeof string` -> panel "alasan" selalu kosong. Jangan regresi.
- `buildInput.ts` hitung `absensiPerPeriode` (tren kehadiran) dari absensi nyata.
  Fitur disiplin/partisipasi/tugas/tinggal-kelas masih di-nol-kan (belum ada data) — terdokumentasi.
- `configVersion()` pakai `stableStringify` deep. Jangan regresi ke `JSON.stringify(t, keys)`.

### DB / seed — PostgreSQL + PgBouncer (sesi 2)
- Prisma dua URL: `DATABASE_URL` via PgBouncer (port 6432, WAJIB `?pgbouncer=true`),
  `DIRECT_URL` langsung ke Postgres (utk migrate/seed; transaction-pool tak bisa migrasi).
- Lokal: `docker compose up -d postgres pgbouncer`. **Port host 5432 sudah dipakai Postgres
  lain di mesin ini** -> `.env` lokal DIRECT_URL port **55432** (`POSTGRES_HOST_PORT=55432`).
  PgBouncer host 6432 -> container 5432.
- Migrasi: `20260613114501_init_postgres` (+ partial-unique index isLatest ditambah manual),
  `20260613140159_drop_kelas_walikelasid`.
- `prisma/seed.ts` — sintetis Faker deterministik + **11 snapshot risiko historis** (isLatest=false)
  -> tren 12 bulan & delta MoM jadi DATA NYATA. Email/password role dari env SEED_*.
- Re-seed: `npm run db:seed` (kalau shell punya `DATABASE_URL=file:...` basi, override eksplisit).

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
- Saat ini **332 test / 0 fail**. File test: authCore, api, rules, rules-scenarios,
  features, buildInput, explain, thresholds, columnMap, parse, nav, rateLimit, rbac,
  cleaning, envelope, applySync. (crypto.test.ts DIHAPUS — modul `crypto.ts` mati,
  diganti `envelope.ts`+`siswaPII.ts`.)

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
- Hero full-bleed (`src/components/landing/Hero.tsx`), FaktorRisiko, DashboardPreview,
  Dampak, FAQ, login split-screen.
- Dashboard per-role (sesi 2): NationalOverview/DinasDashboard/SchoolDashboard/GuruBKDashboard,
  chart Recharts bermerk teal (`src/components/charts/recharts/*`), RegionTable drill-down,
  Breadcrumbs. RiskBadge ring-inset, StatTile dot. SEMUA lolos react-doctor 100/100.
- Saat kamu menyentuh UI baru, samakan kualitasnya dengan ini. Jika ragu: buka file referensi,
  jangan tebak.

### 6.6 GESTALT CHECK terakhir (tanya ke diri sendiri sebelum selesai)
- Kalau logo ditukar kompetitor, ada yang sadar? Kalau tidak → masih slop, perbaiki.
- Muncul Instant-Death Signature (3+ tell)? → regenerate.
- Lolos mata desainer senior dalam 2 detik? Kalau tidak → perbaiki.

---

## 7. CARA VERIFIKASI CEPAT

```bash
# DB lokal (sekali): port 5432 host bentrok -> override
POSTGRES_HOST_PORT=55432 docker compose up -d postgres pgbouncer
npm run db:migrate && npm run db:seed

npm test                            # 332 pass (node:test, tanpa DB)
npx tsc --noEmit -p tsconfig.json   # bersih
npx react-doctor@latest             # WAJIB 100/100
npm run build                       # butuh DATABASE_URL Postgres
npm run dev                         # :3000
```
Login demo: `superadmin@demo.test`/`superadmin123`, atau `dinas|kepsek|guru|bk@demo.test`
/ `<role>123`. Sesi 15-menit lapse → login ulang.

**⚠️ GOTCHA DEV-SERVER (penting saat verifikasi via browser/Playwright):**
1. Shell punya `DATABASE_URL=file:./dev.db` BASI yang menimpa `.env` → dev/seed gagal
   (Prisma butuh `postgresql://`). Jalankan dengan env bersih:
   `env -u DATABASE_URL -u DIRECT_URL setsid bash -c '... npm run dev ...' </dev/null & disown`.
2. `pkill -f "next dev"` di shell tool ikut membunuh proses tool itu sendiri (process group).
3. `npm run build` menimpa `.next` → dev server lama 404 chunk. Restart dev setelah build.
4. Playwright: klik submit form RSC sering tak memicu server action → login via
   `form.requestSubmit()` lewat `browser_evaluate`.

---

## 8. KEPUTUSAN SADAR (jangan "perbaiki" tanpa baca)

- **Funnel/outcome/success-rate intervensi & geo-heatmap SENGAJA tidak dibangun**:
  `Intervensi` cuma punya `jenis` (tak ada tahap/hasil), Wilayah/Sekolah tak punya lat/lng.
  Membangunnya = mengarang data. Tunda sampai skema ditambah. Placeholder jujur sudah ada.
- **`maxAge` sesi 15 menit** memang pendek (keamanan data anak). Jangan naikkan tanpa diskusi.
- **Middleware WAJIB `authEdge`** (bukan `auth` penuh) — kalau diubah balik, redirect-loop
  tiap pindah halaman kembali (Prisma di Edge). Lihat §4.
- **`Siswa.sudahDropout` & `nonaktifSejak` DIPERTAHANKAN** walau belum dipakai UI
  (intent retensi/compliance). `Kelas.waliKelasId` dihapus (orphan; wali via `User.kelasId`).
- `prisma/seed.ts` sequential/await-in-loop SENGAJA (urutan FK + counter NISN deterministik) —
  di-ignore di doctor.config.

## 9. react-doctor config (`doctor.config.json`)

Hanya berisi **false-positive terdokumentasi** (bukan sembunyikan masalah nyata):
- `prisma/**`: `async-parallel` + `async-await-in-loop` (skrip seed FK-ordered, non-React).
- `src/app/api/auth/logout/route.ts` + `intervensi/[id]/route.ts`: `async-parallel`
  (`rateLimit(\`...${ctx.userId}\`)` memakai hasil `await requireContext()` — analyzer tak
  lihat dependensi via template string; auth memang harus dulu).
- `src/components/charts/recharts/**`: `prefer-tag-over-role` (role=img benar utk chart) +
  `prefer-dynamic-import` (chart = konten utama halaman, eager wajar).
- `deslop/unused-dependency`: `sharp` (dipakai `next/image` produksi, false positive).

2 error "Unauthenticated server action" di `login/actions.ts` adalah FALSE POSITIVE
terdokumentasi (login MEMANG endpoint anonim) — react-doctor sendiri menganjurkan tak
menggerbang login. Skor tetap 100 karena sudah ditangani.
