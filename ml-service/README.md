# JagaSekolah — ML Service (Fase 2, opsional)

Service prediksi putus sekolah berbasis **Python + FastAPI + scikit-learn**, dipanggil
oleh app Next.js via HTTP. **Opsional**: bila `ML_SERVICE_URL` tidak diset, app berjalan
penuh dengan rule-based saja. Bila service mati/lambat/error, app **otomatis fallback**
ke rule-based — ML tidak pernah merusak MVP.

> ⚠️ **Model dilatih pada data SINTETIS** (hubungan literatur ABC), bukan data siswa nyata.
> Sebelum produksi WAJIB dilatih ulang + dikalibrasi pada data retrospektif sekolah mitra
> (validasi + confusion matrix). Lihat `PLAN.md`.

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
