"""Latih model prediksi putus sekolah (FASE 2, opsional).

Data latih dibangun oleh `dataset.py` — berbasis ARKETIPE realistis dengan struktur
KORELASI antar-fitur + label dari fungsi laten berbobot literatur ABC (bukan sampling
acak independen). Lihat docstring `dataset.py`.

Algoritma: Logistic Regression (transparan/explainable) di dalam Pipeline scikit-learn
dengan StandardScaler + class_weight="balanced" (dropout = kelas minoritas).

⚠️ Tetap data SINTETIS. Sebelum produksi WAJIB dilatih ulang + dikalibrasi pada data
   retrospektif sekolah mitra (validasi + confusion matrix). Lihat PLAN.md.

Output: model.joblib (Pipeline + metadata versi). Jalankan: python train.py
"""
from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

from dataset import make_dataset, FEATURE_ORDER, FEATURE_VERSION

MODEL_VERSION = "synthetic-0.2.0"  # 0.2.0: dataset arketipe berkorelasi
MODEL_PATH = "model.joblib"
DECISION_THRESHOLD = 0.5


def _evaluate(pipe: Pipeline, X: np.ndarray, y: np.ndarray) -> None:
    proba = pipe.predict_proba(X)[:, 1]
    pred = (proba >= DECISION_THRESHOLD).astype(int)
    auc = roc_auc_score(y, proba)
    ap = average_precision_score(y, proba)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    print("  Held-out (test):")
    print(f"    ROC-AUC          : {auc:.3f}")
    print(f"    PR-AUC (avg prec): {ap:.3f}")
    print(f"    Recall (dropout) : {recall:.3f}  ← prioritas: jangan lewatkan anak berisiko")
    print(f"    Precision        : {precision:.3f}")
    print(f"    Confusion [tn fp / fn tp]: [{tn} {fp} / {fn} {tp}]")


def main() -> None:
    X, y, names = make_dataset(n=12000, seed=42)
    print(f"Dataset: {X.shape[0]} baris × {X.shape[1]} fitur | prevalensi dropout {y.mean():.3f}")

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )
    pipe.fit(X_tr, y_tr)
    _evaluate(pipe, X_te, y_te)

    # Bobot fitur (untuk transparansi — arah & kekuatan sinyal di ruang terstandarisasi).
    coefs = pipe.named_steps["clf"].coef_[0]
    ranked = sorted(zip(names, coefs), key=lambda kv: abs(kv[1]), reverse=True)
    print("  Bobot fitur (|log-odds| terbesar):")
    for nm, w in ranked[:6]:
        print(f"    {nm:24s} {w:+.3f}")

    joblib.dump(
        {
            "pipeline": pipe,
            "modelVersion": MODEL_VERSION,
            "featureVersion": FEATURE_VERSION,
            "featureOrder": list(FEATURE_ORDER),
        },
        MODEL_PATH,
    )
    print(f"Tersimpan {MODEL_PATH} | versi {MODEL_VERSION}")


if __name__ == "__main__":
    main()
