# JagaSekolah — Plan Pengembangan (LIDM Divisi ITDP)

> Sistem Peringatan Dini Putus Sekolah untuk SD/SMP, berbasis data yang **sudah** dimiliki sekolah (Dapodik + absensi + nilai guru).
> Tujuan: menandai siswa berisiko putus sekolah lebih awal + memberi saran tindakan wali kelas, **bukan menghukum**.
> Stack: **Next.js full-stack** (lihat `ARCHITECTURE.md`).

---

## 0. Status & Disclaimer

- **Orisinalitas (terverifikasi via web search):** EWS dropout sudah ada di luar negeri — hampir semua untuk konteks high-income / online course / universitas. Untuk **SD/SMP daerah Indonesia berbasis Dapodik + faktor lokal**, belum ada produk. Posisi: *novel untuk konteks Indonesia*, bukan world-first.
- **Dasar ilmiah parameter:** kerangka **ABC (Attendance, Behavior, Course performance)** — prediktor dropout terkuat (riset US Dept. of Education, MDRC, Johns Hopkins/Baltimore). Diadaptasi + faktor konteks lokal Indonesia.
- **Angka ambang** = contoh dari literatur, WAJIB dikalibrasi dengan data 1 sekolah mitra.

---

## 1. Ringkasan Produk

| Aspek | Keterangan |
|---|---|
| Nama | JagaSekolah |
| Divisi LIDM | ITDP (Inovasi Teknologi Digital Pendidikan) |
| Pengguna | Wali kelas, Guru BK, Kepala Sekolah |
| Jenjang | SD & SMP (fokus awal SMP) |
| Bentuk | **Next.js web app (PWA, offline-friendly)** |
| Inti nilai | Deteksi dini + saran intervensi, transparan (bukan kotak hitam) |
| Prinsip data | Hanya pakai data yang guru SUDAH punya |

---

## 2. Masalah & Justifikasi

- Putus sekolah masih jadi masalah, terutama transisi SMP→SMA & daerah 3T.
- Wali kelas sering terlambat sadar siswa berisiko — baru tahu setelah berhenti.
- Sinyalnya sudah ada (absensi bolong, nilai turun) tapi tercecer & tak dianalisis.
- Belum ada alat yang menyatukan sinyal jadi peringatan dini + langkah konkret.

---

## 3. Parameter Prediksi (4 Kelompok)

### A — ATTENDANCE (bobot tertinggi)
| Field | Definisi | Ambang contoh |
|---|---|---|
| `pctAbsen` | % ketidakhadiran 30 hari terakhir | >10% waspada; >20% kritis |
| `alpaBeruntun` | Hari alpa berturut-turut | >=3 flag |
| `trenAbsensi` | Arah perubahan antar periode | naik 2 periode |
| `polaHari` | Bolos terpola (hari tertentu) | terdeteksi pola |
| `telatKronis` | Frekuensi terlambat | >X/bulan |

### B — BEHAVIOR
| Field | Definisi |
|---|---|
| `catatanDisiplin` | Jumlah pelanggaran tercatat |
| `partisipasi` | Skor keterlibatan kelas (1–3) |
| `tugasTidakKumpul` | % tugas tidak dikumpulkan |

### C — COURSE PERFORMANCE
| Field | Definisi | Ambang |
|---|---|---|
| `nilaiTurun` | Penurunan rata-rata antar periode | turun >=X poin |
| `mapelDiBawahKkm` | Jumlah mapel < KKM | >=3 flag |
| `pernahTinggalKelas` | Riwayat tidak naik | ya = risiko |
| `nilaiIntiRendah` | Matematika & Bahasa rendah | prediktor klasik |

### D — KONTEKS LOKAL
| Field | Sumber |
|---|---|
| `statusEkonomi` / `penerimaKip` | Dapodik |
| `jarakKm` | Dapodik/input |
| `statusKeluarga` | Dapodik |
| `statusOrtu` (yatim/piatu) | Dapodik |

---

## 4. Model Skoring (Hybrid)

- **L1 Rule-based (WAJIB, TypeScript):** transparan, deterministik, fallback. Output: kategori (Hijau/Kuning/Merah) + alasan + saran tindakan. Disimpan dengan `configVersion` (hash ambang).
- **L2 ML (FASE 2, opsional):** service Python/FastAPI terpisah (scikit-learn). Dipanggil via HTTP; fallback ke rule-based bila mati.
- **Kalibrasi:** validasi retrospektif (confusion matrix vs data dropout historis).

---

## 5. Fitur (MVP → Lengkap)

### MVP (wajib demo)
- [ ] Import data (CSV/Excel) + column mapping + cleaning
- [ ] Mesin scoring rule-based (ABC + konteks)
- [ ] Dashboard wali kelas: daftar siswa + label + alasan
- [ ] Detail siswa: tren absensi/nilai + saran tindakan
- [ ] Log intervensi (optimistic locking + soft-delete)
- [ ] Auth + RBAC (admin/guru)

### Lanjut
- [ ] PWA offline + sync (idempotency)
- [ ] Dashboard agregat kepsek (anonim)
- [ ] Validasi retrospektif + kalibrasi ambang
- [ ] ML fase 2 (opsional)
- [ ] Backup terenkripsi

---

## 6. Pengujian & Bukti Dampak

- **Retrospektif:** data siswa yang sudah dropout → cek apakah ditandai MERAH lebih awal (confusion matrix).
- **Prospektif:** 1–2 sekolah mitra, 1 semester → ukur deteksi vs realita, jumlah intervensi, persepsi guru.

---

## 7. Pemetaan Kriteria ITDP

| Kriteria (bobot) | Jawaban |
|---|---|
| Orisinalitas (30) | EWS SD/SMP RI berbasis Dapodik+lokal belum ada. HKI. |
| Desain/Fungsionalitas (30) | Next.js teruji, demo deterministik (Docker). |
| Dampak (10–20) | Validasi retrospektif terukur. |
| Karakter (20) | Fokus intervensi/peduli, bukan menghukum. |
| Presentasi (20) | Demo offline mulus + visual. |

---

## 8. Timeline (≈3 bulan) — ringkas

1–2 setup+seed+CRUD+auth · 3–4 import+rules+test · 5–6 dashboard+retrospektif · 7–8 PWA+sync · 9–10 uji sekolah+UX · 11 ML opsional · 12 finalisasi+HKI+demo. (Detail di `ARCHITECTURE.md` §11.)

---

## 9. Risiko & Mitigasi (ringkas)

Data kotor→cleaning+columnMap · sync konflik→idempotency+optimistic lock · data telat→seed sintetis · PII bocor→backup terenkripsi · scope ML→fase 2. (Detail di `ARCHITECTURE.md` §12.)

---

## 10. Dokumen Terkait

- `ARCHITECTURE.md` — tech stack & desain detail (Next.js).
- `prisma/schema.prisma` — model data.
- `src/lib/scoring/` — mesin rule-based.
