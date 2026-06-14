# AGENT HANDOFF — JagaSekolah


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

## 1.5 🎨 PLAN REDESIGN (Pencil `designs/dashboard-v2.pen`) — SUMBER KEBENARAN UI

> Sesi 6 (TERBARU): seluruh halaman dashboard di-mock-up ulang di Pencil sebagai
> **sumber kebenaran desain** sebelum diterapkan ke FE. Tujuan: tiap halaman tiap role
> **padu (identik modern/rapi)** + **penuh tanpa gap kosong** di viewport 1440×900.

### Gold standard (PATOKAN — semua halaman wajib mengikuti)
**Dashboard Kepala Sekolah** (`F86t5`) = referensi emas. Anatomi WAJIB tiap halaman:
1. **Sidebar** `w-220, bg-#F8FAFC`, `border-r #E2E8F0` → Brand (shield-check teal + "JagaSekolah")
   + `NavGroup` (label "MENU"/grup, nav item `padding:[8,10] rounded-8`, aktif `fill #F0FDFA`+icon teal,
   inaktif icon `#94A3B8`+teks `#475569`) + **Toggle Expand** (flex-spacer + `TogBtn 28×28` `chevrons-left`)
   + **Footer absolute** `x:0,y:820` (avatar teal 28 + nama 12px + role 11px `#94A3B8`).
2. **Topbar** `h-56, bg-white, border-b`, `justifyContent:space_between` → Breadcrumb kiri
   (`bc1 #94A3B8` + chevron-right + `bc2 #0F172A w-500`) + TR kanan (Search pill + Bell + Avatar).
   **Search pill** WAJIB: icon search + teks "Cari siswa…" + **`⌘K` kbd badge** (`bg-white border rounded-4`).
3. **Body** `fill_container, padding:[22,24], gap:20, bg-#F8FAFC`:
   - **PageHeader** (title 18 w-700 + desc 13 `#64748B`) ATAU **Greeting banner** (guru/bk: `bg-#F0FDFA border-#99F6E4`).
   - **KPI Row** 4 kartu (`border-only rounded-8`), tiap kartu: label 12 + value 26 w-700 `tabular-nums`
     + **delta badge inversi-makna** (Risiko↑=merah `#FEF2F2/#B91C1C`, Kehadiran↑=hijau `#F0FDF4`) + "vs …".
   - **Chart Row** tinggi TETAP (dashboard 290, analitik 256): **stacked pill-bar** (merah `[16,16,0,0]` /
     kuning / hijau `[0,0,16,16]`, 12 bulan) + **donut** (`innerRadius 0.6`, center total, legend val+%) —
     atau bar/hbar untuk analitik.
   - **Tabel** `height:fill_container` → mengisi sisa ruang ⇒ **NOL gap kosong**.

> Kunci anti-gap: Body `fill_container` + Chart Row tinggi tetap + **elemen terakhir
> (tabel/hbar) `height:fill_container`**. JANGAN panel tunggal `fill_container` (meregang → gap).

### Status halaman Pencil (17 selesai — semua padu & full)
| Role | Halaman | Node ID | Status |
|------|---------|---------|--------|
| Kepsek | Dashboard | `F86t5` | ✅ gold standard (existing) |
| Kepsek | Collapsed Sidebar | `i7UzVP` | ✅ existing |
| Kepsek | Daftar Siswa | `Yf1fx` | ✅ verified clean |
| Kepsek | Detail Siswa | `IR7GL` | ✅ verified clean |
| Guru | Dashboard | `c3hv8a` | ✅ rebuilt (greeting+KPI+chart+tabel) |
| BK | Dashboard | `RXWwx` | ✅ rebuilt |
| Dinas | Dashboard | `E5Zs9O` | ✅ rebuilt |
| Dinas | Perbandingan Sekolah | `htrlb` | ✅ built |
| Dinas | Laporan | `EK2dr` | ✅ built |
| Superadmin | Dashboard | `QK1Sh` | ✅ rebuilt (sidebar 2-grup ANALITIK/PLATFORM) |
| Superadmin | Admin Pengguna | `l2aSZN` | ✅ rebuilt |
| Superadmin | Admin Audit Log | `y0PK5e` | ✅ rebuilt |
| Shared | Akademik | `iV414` | ✅ built |
| Shared | Kehadiran | `YwuXS` | ✅ built |
| Shared | Intervensi | `A2Gchs` | ✅ built |
| Shared | Analisis Risiko | `p2mz4` | ✅ built (lama `wJgId` dihapus) |
| Lib | 🧩 Component Library | `mZa3b` | ✅ 26 reusable + Panel/Table card |

### Konsistensi yang sudah diseragamkan sesi ini
- **Search bar**: semua halaman baru kini punya teks "Cari siswa…" + `⌘K` kbd badge (sebelumnya "Cari…" tanpa badge → terlihat pendek).
- **Toggle Expand button** ditambahkan ke 18 NavGroup (sebelumnya hanya Kepsek punya).
- Semua card `rounded-lg`, `space-y/gap` konsisten, KPI delta inversi-makna benar.

### ⚠️ SISA Pencil (belum di-mock-up)
Admin Tenant, Admin Sinkronisasi, Admin Keamanan, Demografi, Putus Sekolah, Consent,
Kelas, Kelola Users, Kelola Kelas, drill-down (Wilayah/Kabupaten/Sekolah/Kelas roster).
Semua TINGGAL pakai builder yang sama (`sb`/`tb`/`kpiRow`/`stackBar`/`donutPanel`/`tableHead`/`hbarPanel`/`pill`).

### ➡️ LANGKAH IMPLEMENTASI KE FE (Telah Selesai)
Pencil = blueprint; FE React/TSX telah disinkronkan ke desain v2 ini.
1. `DashboardShell` (sidebar + topbar) telah disesuaikan dgn gold standard: Toggle Expand, Search `⌘K`, Footer absolute.
2. Tiap halaman analitik telah menerapkan Chart Row tinggi tetap + tabel/panel terakhir `flex-1` (anti-gap).
3. Stacked area, horizontal bar, dll telah memakai warna & style brand v2.
4. Lolos Pre-Delivery Slop Audit (§6) + react-doctor 100/100.

### Gotcha Pencil `batch_design` (untuk sesi berikutnya)
- Helper function (sb/tb/kpiRow/…) HARUS di-include ulang tiap `batch_design` (scope tidak persist).
- `cornerRadius` array `[tl,tr,br,bl]` (BUKAN objek `{topLeft}`). `alignItems` hanya start/center/end (no stretch/baseline).
- Anonymous array literal `.forEach` gagal → extract ke named var dulu.
- Tak bisa `Update("varName")` — pakai node ID hasil return. Finalize `placeholder:false` di batch terpisah.
- **Export PNG sering blank/pudar pada node yang BARU di-finalize** (glitch tool, bukan masalah desain).
  Verifikasi struktur via `snapshot_layout` (cek bounds + `problemsOnly:true`); export ulang 1–2× biasanya muncul.

---

## 1.6 🛡️ PLAN ROBUSTNESS UI/UX (Pencil → FE) — roadmap berfase

> Tujuan: desain tidak cuma "bagus saat data ideal", tapi **tahan banting** di semua
> kondisi nyata (kosong/loading/error/overflow), semua viewport, dan semua alat bantu (a11y).
> Patokan: `dashboards.md §10` (semua state) + `components.md` + `slop-code-patterns.md` (a11y).

### FASE A — Lengkapi cakupan halaman Pencil (sisa 13)
Pakai builder yang sama; satu role-set per batch. Urutan prioritas (paling sering dipakai dulu):
1. **Superadmin**: Admin Tenant, Admin Sinkronisasi, Admin Keamanan, Demografi, Putus Sekolah.
2. **Kepsek/BK**: Kelas, Kelola Users, Kelola Kelas, Consent.
3. **Drill-down** (PII, superadmin/kepsek): Wilayah, Kabupaten, Sekolah, Kelas roster.
Tiap halaman WAJIB lolos `snapshot_layout problemsOnly:true` = "No layout problems".

### FASE B — State lengkap tiap surface (anti-"happy-path-only")
Untuk SETIAP halaman, mock-up varian state (frame terpisah di Pencil, beri suffix nama):
- **Empty** — ikon + judul + deskripsi + 1 CTA (mis. "Belum ada data siswa · Impor dari Dapodik").
  Komponen sudah ada: `empty-state E7CrF`. Chart kosong → render axis + "Belum ada kejadian periode ini".
- **Loading** — skeleton MIRROR bentuk (KPI 4 kotak abu, chart blok, tabel baris) — bukan spinner.
  Komponen: `ChartSkeleton` (ui.tsx). Gate `motion-reduce:animate-none`.
- **Error** — `role="alert"` ikon merah + "Gagal memuat" + tombol "Coba lagi" (outlined, non-agresif).
- **Zero-but-present** — KPI = 0 tetap tampil (jangan sembunyikan); guard bagi-nol (`total>0?…:0`).
- **Overflow/edge** — nama siswa 40 char (truncate + tooltip), angka 6 digit (`tabular-nums`, jangan wrap),
  tabel 50+ baris (sticky header + pagination), badge teks panjang.

### FASE C — Responsif (3 breakpoint, mock-up varian width)
Sidebar collapse sudah ada (`i7UzVP`). Tambah varian utama per breakpoint:
| Viewport | Sidebar | KPI grid | Chart Row | Tabel |
|----------|---------|----------|-----------|-------|
| ≥1280 desktop | full w-220 | 4-up | bar 2fr + donut 1fr | full |
| 768–1024 tablet | rail w-60 (icon) | 2×2 | stack vertikal | scroll-x |
| <768 mobile | off-canvas drawer | 1-kolom | stack, donut di bawah | card-list / scroll-x |
Aturan: `dvh` bukan `vh`; mobile CTA full-width thumb-zone; chart `min-w` + `overflow-x-auto`.

### FASE D — Aksesibilitas (WAJIB, bukan opsional — lihat slop-code-patterns A11Y1–23)
- Semua interaktif `<button>`/`<a>` + `focus-visible:ring-2 ring-teal-600` (bukan `<div onClick>`).
- Chart `role="img"` + `aria-label` insight (bukan "a chart"); sediakan sr-only `<table>` alternatif.
- Kontras AA: body ≥`#334155`, jangan `text-gray-400` pada putih. Badge risiko: warna + LABEL TEKS (bukan warna saja).
- `prefers-reduced-motion` gate tiap animasi spasial. `tabular-nums` semua angka. `<html lang="id">`.
- Tabel data = `<table>`+`<th scope>`+`aria-sort`. Form = label + error(`aria-invalid`+`aria-describedby`).
- Modal/drawer = `<dialog>` (focus-trap + Esc bawaan). Toast = `aria-live`.

### FASE E — Sinkronisasi Pencil → FE (implementasi nyata)
Urutan agar perubahan terukur & tak meledak:
1. **DashboardShell dulu** (dampak global): sidebar (Toggle Expand, footer absolute),
   topbar (breadcrumb + Search `⌘K`). Verifikasi 1 halaman, baru lanjut.
2. **Komponen chart**: pastikan stacked pill-bar (radius 16) + donut center-total dipakai konsisten
   (sudah ada `CategoryStackedBars`/`RiskDonutChart` — samakan ke mock-up).
3. **Per halaman**: terapkan grid anti-gap (Body flex-col + Chart Row tinggi tetap + panel akhir `flex-1`).
4. **Tiap commit**: tsc clean · test (≥483) · **react-doctor 100/100** · Pre-Delivery Slop Audit (§6).
5. Crosscheck visual (export Pencil vs screenshot FE) sebelum tandai selesai.

### Definition of Done (per halaman — robust)
- [ ] `snapshot_layout problemsOnly:true` → kosong (no clip/overflow/gap).
- [ ] 4 state ada (empty/loading/error/zero) — minimal di FE, ideal juga di Pencil.
- [ ] Responsif 3 breakpoint tidak putus / tak ada scroll horizontal tak sengaja di mobile.
- [ ] A11y: keyboard-reachable, focus terlihat, chart aria-label, kontras AA, reduced-motion.
- [ ] Padu dengan gold standard (sidebar/topbar/KPI/chart/tabel identik gaya).
- [ ] react-doctor 100/100 + tsc + test hijau.

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

**Sesi 3 (terbaru) — dashboard maksimal per role:**
| Commit | Isi |
|--------|-----|
| `feat: Recharts 3.x + superadmin analytics + grouped nav` | upgrade Recharts 2.15.4→3.8.1; 5 komponen chart baru (StackedArea/HorizontalBar/Histogram/HeatmapTable/MultiLine) + SortableTable; +22 fungsi analytics (akademik/demografi/dropout + risk/attendance/intervention per-provinsi); nav bergrup per role; superadmin pages Analisis Risiko/Demografi/Putus Sekolah + shared Akademik/Kehadiran/Intervensi. |
| `feat: sync page + dinas perbandingan & laporan` | /admin/sync (recompute+SyncLog+import); dinas /perbandingan (ranking) + /laporan (CSV export, no PII). |
| `feat: kepsek pages + roster RBAC fix` | /kelas, /kelola/users (reuse CreateUserForm), /kelola/kelas; roster RBAC kepsek own-school. |
| `feat: intervention CRUD UI + consent` | IntervensiManager + ConsentManager di /siswa/[id]; /consent page bk/kepsek. |

**Verified sesi 3:** tsc clean · 340 test · build OK (19 hal) · react-doctor 100/100 ·
browser superadmin Analisis Risiko (KPI+histogram+faktor real data, 0 console error).

**Sesi 4 (TERBARU) — dinas berjenjang, Indonesia lengkap, breadcrumb, chart indah:**
| Commit | Isi |
|--------|-----|
| `81985b9` | **maximize admin pages** — tenant/users/audit/security: charts + KPI kaya + SortableTable (analytics: platformByProvinsi/schoolRiskRows/auditActivityTrend/auditByAksi/usersByRole/consentBySekolah). |
| `aa8af9b`+`ebd8995` | **unit tests** RBAC + analytics kernels + nav dead-link guard + scoring lapangan Indonesia (340→436). Ekstrak kernel murni: `authorizeResolvedSiswa`, `analyticsKernels.ts`, `analyticsBuckets.ts`. |
| `6410b27`+`d9534ce` | **data wilayah Indonesia NYATA `src/lib/seed/regions.ts`** — kini **38 provinsi LENGKAP** (Aceh→Papua Barat Daya, incl 4 pemekaran Papua 2022), 77 kabupaten/sekolah (30 3T), NPSN 8-digit sistematis unik. Seed buat semua wilayah; demo anchor SMP N 1 Surabaya + Wamena. |
| `ecfa5de` | **breadcrumb global** `TopBreadcrumb` di atas main content (DashboardShell) + **dinas elevated** (mirror analitik superadmin, tanpa root). |
| `d86ca1b` | **DINAS 3 TINGKAT** pusat/provinsi/kabupaten — migration `User.provinsi`; `dinasLevel(ctx)`; siswaScope/analyticsScope per-jenjang; `assertDinasWilayah`; seed 3 akun dinas. |
| `84098fe` | **fix gap dinas-level** (audit POV 6 sub-agent): P0 kebocoran drill provinsi (dinas-kabupaten bisa lihat provinsi lain), 3 halaman analitik superadmin-only→izinkan dinas scoped, Perbandingan/Laporan pakai `riskBySekolahScoped`/`dinasSekolahWhere`, create-user dukung tingkat dinas. |
| `4205aec`+`07fe11c` | **chart modern clean** (gradient area, smooth curve, hover-dot, custom tooltip card, donut rounded, dashed grid) + **FIX BUG batang kosong** (hidden numeric axis → `domain={[0,"dataMax"]}`). |
| `117a463` | **steering** `references/charts.md` (riset 10 sub-agent) + registrasi SKILL.md. |

**Verified sesi 4:** tsc clean · **463 test / 0 fail** · build OK (19 hal) · react-doctor 100/100 ·
browser dinas/superadmin terkonfirmasi (breadcrumb, chart batang render, scope wilayah).

**Sesi 5 (TERBARU) — lapis ML prediksi yang ROBUST (Fase 2, opsional):**
| Area | Isi |
|------|-----|
| `src/lib/ml/types.ts` | Kontrak: `MlFeaturePayload` (14 fitur datar, `FEATURE_VERSION=1.0.0`), `MlPredictionSchema` (Zod: `probabilitas` finite 0..1), `MlClientResult` (union never-throws), `BlendedRisiko`+`MlInfo`. |
| `src/lib/ml/client.ts` | Klien HTTP robust: `CircuitBreaker` 3-state, `predictRemote` NEVER-THROWS (disabled→circuit_open→attempt+retry-transient-only), AbortController timeout, Zod-validate. Semua dep di-inject. Knob via env (`ML_TIMEOUT_MS/MAX_RETRIES/BACKOFF/BREAKER_*`). |
| `src/lib/ml/predict.ts` | Orkestrator: `featuresToPayload` (pure), `blendRiskWithMl` (pure, **escalate-only** — ML hanya menaikkan, tak pernah menurunkan; child-safety), `mlAlasanItem` (alasan transparan bobot-0), `predictAndBlend` (async never-throws, predict injectable). |
| `recompute/route.ts` | Opt-in `ML_SERVICE_URL`: OFF → jalur rule murni identik; ON → blend per siswa via `mapWithConcurrency(8)`, embed `ml` info + alasan transparan di `alasanJson`, `sumber` ikut blend. Return `{dihitung,sumber}`. |
| `ml-service/` | Python FastAPI: `dataset.py` (generator ARKETIPE berkorelasi — 9 arketipe realistis + label laten berbobot literatur ABC, prevalensi ~15%, batasan koherensi antar-fitur), `schema.py` (Pydantic, cermin TS), `train.py` (LogReg+StandardScaler+balanced, split 25% test, lapor ROC-AUC≈0.97/PR-AUC≈0.88/Recall≈0.92 → `model.joblib` versi synthetic-0.2.0), `app.py` (`/health`+`/predict`, auto-train bila model absen), Dockerfile (train saat build + healthcheck), requirements pinned, README. compose `--profile ml` port 8000. |
| tests | `mlClient.test.ts` (8) + `mlPredict.test.ts` (12) = +20 → **483 test**. Breaker/timeout/retry/Zod-reject/fallback/escalate-only/sumber, semua via port disuntik (tanpa network). |

**Sesi 6 (TERBARU) — Sinkronisasi Dashboard ke Pencil v2 Blueprint:**
- **DashboardShell**: Implementasi status sidebar `collapsed` di local storage, visual toggle button dengan transition width, search pill dengan kbd `⌘K` badge, notifikasi Bell.
- **TopBreadcrumb**: Navigasi global berbasis pathname dengan penyesuaian label role.
- **Dinas / Kepsek / Guru / BK Dashboard**: Grid layout 1440x900 anti-gap dengan tinggi grafik/kartu tetap, panel card `rounded-lg`, table container `flex-1` / `height:fill_container`, serta integrasi visual design v2.
- **react-doctor & Tests**: Menjaga skor react-doctor tetap 100/100, 483 unit test lulus.

**Verified sesi 5:** tsc clean · **483 test / 0 fail** · build OK · react-doctor 100/100 ·
Python `py_compile` OK. doctor.config: 2 `async-await-in-loop` ML (retry sekuensial +
worker-pool berbatas) didokumentasikan sebagai disengaja.

---

## 3. STATUS SAAT INI

- **Working tree CLEAN.** tsc bersih · **483 test / 0 fail** · build OK · react-doctor 100/100.
- **Sidebar final per role**: superadmin 12 (3-grup ANALITIK/PLATFORM/KEAMANAN),
  **dinas 10** (analitik mirror superadmin + Telusur Siswa + Perbandingan + Laporan, TANPA root),
  kepsek 8 (2-grup SEKOLAH/KELOLA), guru 5, bk 6. Semua route punya halaman nyata (no dead link).
- **Breadcrumb global** `TopBreadcrumb` di atas main content tiap halaman dashboard
  (path-derived, label per-role); halaman drill-down (wilayah/kabupaten/sekolah/kelas/siswa)
  pakai breadcrumb kaya-nama sendiri (TopBreadcrumb diam di rute itu agar tak ganda).
- **DINAS 3 TINGKAT** (lihat §4 RBAC): pusat (nasional) / provinsi / kabupaten — bisa
  telusur sampai identitas siswa DALAM cakupannya; root (admin/*) tetap superadmin-only.
- **Data wilayah = 38 provinsi Indonesia ASLI** lengkap (77 sekolah, 30 3T) di
  `src/lib/seed/regions.ts`. Demo: 2 sekolah berdata (Surabaya urban + Wamena 3T).
- **Chart sudah modern-clean** (gradient, smooth, custom tooltip, anti-slop). Standar lengkap
  di `.kiro/steering/component-reference-design/references/charts.md`.

### ⚠️ PRIVACY (keputusan owner, sadar)
Dinas (semua tingkat) KINI BISA melihat identitas siswa DALAM cakupannya (aturan lama
"dinas agregat-anonim" sengaja dilonggarkan atas permintaan owner). Lintas-wilayah/provinsi
+ root tetap diblok. Implikasi UU PDP dipegang owner produk.

### ⚠️ SISA / belum dikerjakan
1. **DEFERRED (butuh endpoint PATCH baru, bukan dead-link)**: tenant create/edit form
   (POST /api/admin/sekolah ada, belum ada UI form+GET-edit), user aktif/nonaktif+revoke
   (perlu PATCH /api/admin/users/[id] dgn aktif/tokenVersion — belum ada), import upload UI
   (POST /api/import ada, baru pointer).
2. **NEEDS-DATA (JANGAN bangun)**: funnel/outcome/success-rate intervensi, jadwal konseling,
   rujukan, geo-heatmap (tak ada lat/lng), alert-threshold, announcement, last-login.
3. `agregatScope` lama masih 1-level (dipakai route orphan `/dashboard/agregat` + api non-nav);
   role dashboards & drill pakai `analyticsScope`/`dinasSekolahWhere` yang sudah 3-level.
4. **Belum `git push`** — banyak commit menumpuk lintas sesi di `master` lokal.

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
- **RBAC helpers** (`src/lib/rbac.ts`): `siswaScope` (dinas KINI 3-level, bukan 403 — lihat
  bawah), `agregatScope` (legacy 1-level, orphan route saja), `resolveSiswa`/`authorizeResolvedSiswa`
  (IDOR-safe kernel murni; dinas per-jenjang), `requireRole`, `assertSameSekolah`,
  **`assertDinasWilayah(ctx,{wilayahId,provinsi})`** (cegah dinas lintas wilayah/provinsi),
  **`creatableRoles`/`canCreateUser`/`canManageUsers`** (superadmin→semua, kepsek→guru/bk).
- **DINAS BERJENJANG** (`dinasLevel(ctx)`): `wilayahId` terisi → **kabupaten**; `provinsi`
  terisi (wilayahId null) → **provinsi**; keduanya null → **pusat** (nasional). Field di User:
  `wilayahId`, `provinsi` (migration `dinas_provinsi_level`). siswaScope/analyticsScope:
  pusat `{}` · provinsi `{sekolah:{wilayah:{provinsi}}}` · kabupaten `{sekolah:{wilayahId}}`.
  `analyticsScope` (`src/lib/dashboardScope.ts`) sudah 3-level; pakai INI bukan agregatScope.
  Perbandingan/Laporan pakai `dinasSekolahWhere(ctx)` + `riskBySekolahScoped(where)`.
  Akun demo: dinaspusat@/dinasprov@/dinas@demo.test (pwd dinas123).
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
- **Recharts 3.8.1** (upgraded sesi 4; `theme.ts`→`theme.tsx` krn berisi JSX ChartTooltip).
  Client di `src/components/charts/recharts/`: RiskTrendLine,
  RiskDonutChart, FactorBars, CategoryStackedBars, Bars(CategoryBars), SingleAreaChart,
  theme.ts (warna brand+risiko, usePrefersReducedMotion via useSyncExternalStore, tooltipStyle).
  SEMUA `'use client'` + role=img+aria-label + animasi gated reduced-motion. (Server-SVG lama dihapus.)
- **`src/lib/analytics.ts`** (scope-aware, REAL): getKpis(+MoM), monthlyRiskTrend(12bln),
  riskFactorBreakdown (agregat alasanJson.kode), riskDonut, riskByKelas, attendanceSummary,
  priorityStudents, platformScale, riskByProvinsi/Kabupaten/Sekolah/KelasInSekolah (drill),
  interventionByJenis/Trend.
- **JANGAN buat** funnel/outcome/success-rate intervensi atau geo-heatmap — tak ada datanya.
  NationalOverview tampilkan placeholder jujur.

### Dashboard maksimal (sesi 3) — komponen & halaman baru
- **Recharts 3.8.1** (upgrade). GOTCHA: Tooltip `formatter` v3 = `(v)=>` dgn `v: ValueType|undefined`
  → pakai `Number(v)`, JANGAN `(v:number)`.
- **Komponen chart baru** (`src/components/charts/recharts/`): `StackedAreaChart`
  {data,series:[{key,name,color}]}, `HorizontalBarChart` {data:[{label,value,color?}],seriesName,unit?,barColor?},
  `Histogram` {data:[{bin,count}],xLabel?}, `HeatmapTable` {columns,rows:[{label,values[]}],mode:'intensity'|'delta'},
  `MultiLineChart` {data,series} + `LINE_PALETTE`.
- **`SortableTable`** (`src/components/dashboard/SortableTable.tsx`): generik `<T>`, kolom
  {key,header,sortValue?,cell?,align?,numeric?}, aria-sort, `hrefFor` → kolom-1 jadi Link drill-down.
  Banyak wrapper tabel pakai ini: ProvinceRiskTable, AcademicProvinceTable, AttendanceProvinceTable,
  CoverageProvinceTable, SchoolCompareTable, KelasRiskTable, SchoolUsersTable, KelolaKelasTable,
  ConsentStudentsTable, SyncLogTable.
- **`src/lib/dashboardScope.ts`**: `analyticsScope(ctx)` — scope lintas-peran utk halaman
  shared (dinas DIIZINKAN tapi agregat via `{sekolah:{wilayahId}}`, beda dgn siswaScope yg 403-kan dinas);
  `isAggregateRole(role)` (superadmin|dinas → tampilkan tabel per-provinsi).
- **+22 fungsi analytics** (`src/lib/analytics.ts`, semua REAL scope-aware): lihat blok analytics —
  risk (scoreDistribution/sourceBreakdown/deltaByProvinsi/factorTrendMonthly), kehadiran
  (trendMonthly/statusDist/dailyAlpa/byProvinsi/chronicByProvinsi), intervensi
  (coverageByProvinsi/trendByJenis/topIntervenors), akademik dari model **Nilai**
  (gradeByMapel/belowKkmByMapel/gradeTrendByPeriode/academicByProvinsi), demografi
  (riskByGender/riskByKip/distanceDistribution — HANYA field non-terenkripsi), dropout
  (byProvinsi/trend/total). Kernel bucket murni di `analyticsBuckets.ts` (di-test).
- **Halaman baru**: superadmin /analisis-risiko /demografi /putus-sekolah /admin/sync;
  SHARED (scope-aware, semua role) /akademik /kehadiran /intervensi; dinas /perbandingan /laporan;
  kepsek /kelas /kelola/users /kelola/kelas; bk /consent. Halaman superadmin-only pakai
  `redirect("/dashboard")` bila role salah.
- **CRUD UI di /siswa/[id]**: `IntervensiManager` (POST/PATCH/DELETE /api/intervensi,
  optimistic-lock `baseVersion`, edit milik sendiri atau kepsek/superadmin via `canEditAll`),
  `ConsentManager` (POST /api/consent granted/revoked). Detail fetch +version+olehUserId+consentStatus.
- **RBAC fix**: `/dashboard/sekolah/[id]/kelas/[kelasId]` kini `requireRole(superadmin,kepsek)`
  + `assertSameSekolah` (kepsek boleh roster sekolahnya).
- **ui.tsx** ekspor `Panel` + `ChartSkeleton` (dipakai semua halaman analitik baru).

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
- Saat ini **463 test / 0 fail**. File test: authCore, api, rules, rules-scenarios,
  features, buildInput, explain, thresholds, columnMap, parse, nav, rateLimit, rbac,
  cleaning, envelope, applySync, analyticsBuckets, rbacScenarios (scope/IDOR/
  creatableRoles per 5 role + dinas 3-level), analyticsKernels (agregasi+div-by-zero guard),
  navIntegrity (dead-link guard vs page.tsx on disk), scoringField (skenario lapangan
  3T/musiman/bencana Indonesia), seedRegions (38 provinsi nyata), dinasLevel (3 jenjang).
  (crypto.test.ts DIHAPUS.)
- **Kernel murni testable** (tanpa DB): `src/lib/resolveSiswa.ts` → `authorizeResolvedSiswa`;
  `src/lib/analyticsKernels.ts` → transformPlatformByProvinsi/UsersByRole/ConsentBySekolah/
  AuditByAksi + computeConsentPct (analytics.ts memanggilnya). Pola: ekstrak transform
  dari panggilan prisma → uji dgn fixture array.
- **Data wilayah NYATA**: `src/lib/seed/regions.ts` (SEED_REGIONS) — 15 provinsi real
  (Aceh→Papua Pegunungan), 24 kabupaten (14 3T), NPSN 8-digit sintetis. Seed membuat
  semua wilayah; demo accounts anchored ke SMP N 1 Surabaya (urban) + SMP N 1 Wamena (3T).

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

npm test                            # 340 pass (node:test, tanpa DB)
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
