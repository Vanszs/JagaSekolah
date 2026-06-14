# JagaSekolah — ML Service (Fase 2, opsional)

Service prediksi putus sekolah berbasis **Python + FastAPI + scikit-learn**, dipanggil
oleh app Next.js via HTTP. **Opsional**: bila `ML_SERVICE_URL` tidak diset, app berjalan
penuh dengan rule-based saja. Bila service mati/lambat/error, app **otomatis fallback**
ke rule-based — ML tidak pernah merusak MVP.

> ⚠️ **Model dilatih pada data SINTETIS** (lihat "Dataset" di bawah), bukan data siswa nyata.
> Sebelum produksi WAJIB dilatih ulang + dikalibrasi pada data retrospektif sekolah mitra
> (validasi + confusion matrix). Lihat `PLAN.md`.

## Dataset (`dataset.py`)

Dibangun **berbasis arketipe**, bukan sampling acak independen — agar fitur **berkorelasi
realistis** (sinyal risiko mengelompok; konteks ekonomi/jarak/keluarga sebagai *amplifier*,
bukan penyebab tunggal). 9 arketipe berbobot populasi:

| Arketipe | Porsi | Ciri |
|---|---|---|
| stabil_aman | 30% | hadir baik, nilai cukup |
| ekonomi_tekun | 12% | rentan ekonomi/jarak TAPI tekun (konteks ≠ risiko otomatis) |
| early_absence | 12% | tren absensi mulai memburuk (peringatan dini) |
| disengage_akademik | 10% | nilai jatuh + tugas tak terkumpul |
| krisis_absensi | 10% | absen kronis (prediktor terkuat) |
| multifaktor | 8% | ABC+D bertumpuk (risiko tertinggi) |
| tiga_T | 8% | akses sulit, absen musiman (panen) |
| perilaku | 6% | disiplin/partisipasi bermasalah |
| eks_tinggal_kelas_membaik | 4% | riwayat tinggal kelas, kini membaik |

Label dropout = fungsi **laten berbobot literatur ABC** (Attendance terkuat → Course →
Behavior → konteks + interaksi), + batasan koherensi antar-fitur. Prevalensi disetel
**~15%** (dropout = kejadian minoritas).

**Metrik held-out (test 25%, data sintetis — indikatif, bukan klaim produksi):**
ROC-AUC ≈ 0.97 · PR-AUC ≈ 0.88 · **Recall ≈ 0.92** (sengaja diprioritaskan: jangan
lewatkan anak berisiko) · Precision ≈ 0.69. Bobot fitur teratas: pctAbsen, alpaBeruntun,
trenAbsensiMemburuk — sejalan literatur.

## Model

`train.py` melatih **Logistic Regression** (Pipeline: `StandardScaler` +
`class_weight="balanced"`) — dipilih karena **transparan/explainable** (sesuai prinsip
JagaSekolah), bukan kotak hitam. Versi: `synthetic-0.2.0`.

## Kontrak

`POST /predict`
```json
{ "featureVersion": "1.0.0", "features": { "pctAbsen": 42.0, "alpaBeruntun": 3, ... } }
```
→
```json
{ "probabilitas": 0.73, "modelVersion": "synthetic-0.1.0", "kategori": "merah" }
```
- `probabilitas` ∈ [0,1] (peluang putus sekolah). Sisi klien (`src/lib/ml/`) memvalidasi
  ketat dengan Zod; respons tak valid → diperlakukan gagal → fallback rule.
- `featureVersion` tak cocok → `422` (skema fitur berbeda).

`GET /health` → `{ "status": "ok", "modelVersion": "...", "featureVersion": "1.0.0" }`

Skema fitur didefinisikan di `schema.py` (cermin `src/lib/ml/types.ts`). Bila berubah,
naikkan `FEATURE_VERSION` di KEDUA sisi.

## Cara menjalankan (lokal)

```bash
cd ml-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python train.py                       # buat model.joblib
uvicorn app:app --host 0.0.0.0 --port 8000
```

Lalu di `.env` app Next.js:
```
ML_SERVICE_URL="http://localhost:8000"
```
dan jalankan ulang `POST /api/risiko/recompute` (recompute akan mem-blend skor).

## Docker / compose

```bash
docker compose --profile ml up --build ml-service
```
(Model dilatih saat build image → container self-contained.)

## Integrasi & ketahanan (sisi app)

| Aspek | Default | Env override |
|---|---|---|
| Aktif? | hanya bila `ML_SERVICE_URL` diset | `ML_SERVICE_URL` |
| Timeout per request | 800 ms (AbortController) | `ML_TIMEOUT_MS` |
| Retry transient (timeout/network) | 1× backoff | `ML_MAX_RETRIES`, `ML_RETRY_BACKOFF_MS` |
| Circuit breaker | buka setelah 3 gagal, cooldown 30 dtk | `ML_BREAKER_THRESHOLD`, `ML_BREAKER_COOLDOWN_MS` |
| Konkurensi recompute | 8 paralel | (konstanta route) |

**Blend = escalate-only**: ML hanya boleh MENAIKKAN skor/kategori, tak pernah menurunkan
(child-safety). Hasil ML selalu disertai alasan transparan ("Model memprediksi …%") dan
jejak `ml` di `alasanJson` untuk audit. `Risiko.sumber` = `ml` hanya bila ML benar-benar
menaikkan hasil, selain itu `rule`.
