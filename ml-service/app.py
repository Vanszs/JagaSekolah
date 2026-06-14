"""Service ML JagaSekolah — FastAPI (FASE 2, opsional).

Endpoint:
  GET  /health   → status + versi model/fitur
  POST /predict  → {probabilitas, modelVersion, kategori?}

Robustness sisi service:
  - Skema divalidasi Pydantic (mismatch featureVersion → 422).
  - Model dimuat sekali saat start; bila absen → auto-train (demo-friendly).
  - Endpoint sengaja ringan & cepat agar timeout 800ms sisi klien cukup.

Jalankan lokal:
  pip install -r requirements.txt
  python train.py                  # buat model.joblib (sekali)
  uvicorn app:app --host 0.0.0.0 --port 8000
"""
from __future__ import annotations

import os

import joblib
import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schema import (
    FEATURE_VERSION,
    HealthResponse,
    PredictRequest,
    PredictResponse,
)

MODEL_PATH = os.environ.get("ML_MODEL_PATH", "model.joblib")

app = FastAPI(title="JagaSekolah ML Service", version="1.0.0")

# CORS hanya bila origin di-set (default: tertutup; service ini biasanya internal).
_origins = os.environ.get("ML_CORS_ORIGINS", "").split(",")
_origins = [o.strip() for o in _origins if o.strip()]
if _origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_methods=["POST", "GET"],
        allow_headers=["content-type"],
    )

_state: dict[str, object] = {"pipeline": None, "modelVersion": "uninitialized"}


def _load_or_train() -> None:
    """Muat model dari disk; bila tak ada, latih sekali (memudahkan demo)."""
    if os.path.exists(MODEL_PATH):
        bundle = joblib.load(MODEL_PATH)
        _state["pipeline"] = bundle["pipeline"]
        _state["modelVersion"] = bundle["modelVersion"]
        return
    # Auto-train fallback (data sintetis) agar service tetap berfungsi out-of-the-box.
    import train

    train.main()
    bundle = joblib.load(MODEL_PATH)
    _state["pipeline"] = bundle["pipeline"]
    _state["modelVersion"] = bundle["modelVersion"]


@app.on_event("startup")
def _startup() -> None:
    _load_or_train()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        modelVersion=str(_state["modelVersion"]),
        featureVersion=FEATURE_VERSION,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest) -> PredictResponse:
    pipeline = _state["pipeline"]
    vec = np.array([req.features.to_vector()], dtype=float)
    # predict_proba kolom-1 = peluang kelas positif (dropout).
    prob = float(pipeline.predict_proba(vec)[0][1])  # type: ignore[attr-defined]
    prob = max(0.0, min(1.0, prob))  # jaga ∈ [0,1] (kontrak klien)
    kategori = "merah" if prob >= 0.6 else "kuning" if prob >= 0.3 else "hijau"
    return PredictResponse(
        probabilitas=prob,
        modelVersion=str(_state["modelVersion"]),
        kategori=kategori,
    )
