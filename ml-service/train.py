"""Latih model prediksi putus sekolah (FASE 2, opsional).

PENTING — soal data:
  Model ini dilatih pada data SINTETIS yang dibangkitkan dari hubungan literatur
  ABC (Attendance/Behavior/Course) — BUKAN data siswa nyata. Tujuannya menyediakan
  artefak model yang berfungsi untuk demo & integrasi. Sebelum produksi, model WAJIB
  dilatih ulang + dikalibrasi pada data retrospektif satu sekolah mitra (validasi +
  confusion matrix), seperti dicatat di PLAN.md.

Output: model.joblib (Pipeline: StandardScaler + LogisticRegression).
Jalankan: python train.py
"""
from __future__ import annotations

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

from schema import FEATURE_ORDER, FEATURE_VERSION

MODEL_VERSION = "synthetic-0.1.0"
MODEL_PATH = "model.joblib"
RNG = np.random.default_rng(42)


def _synthesize(n: int = 6000) -> tuple[np.ndarray, np.ndarray]:
    """Bangkitkan fitur + label dropout dengan bobot risiko ala literatur ABC.

    Attendance diberi bobot tertinggi (prediktor dropout terkuat), diikuti Course,
    Behavior, lalu konteks. Label = Bernoulli(sigmoid(skor laten + noise)).
    """
    pctAbsen = RNG.uniform(0, 60, n)
    alpaBeruntun = RNG.poisson(1.2, n).astype(float)
    trenAbsensiMemburuk = RNG.binomial(1, 0.25, n).astype(float)
    telatKronis = RNG.binomial(1, 0.2, n).astype(float)
    catatanDisiplin = RNG.poisson(0.6, n).astype(float)
    partisipasiRendah = RNG.binomial(1, 0.3, n).astype(float)
    pctTugasTidakKumpul = RNG.uniform(0, 80, n)
    nilaiTurun = RNG.uniform(0, 30, n)
    mapelDiBawahKkm = RNG.integers(0, 6, n).astype(float)
    pernahTinggalKelas = RNG.binomial(1, 0.12, n).astype(float)
    nilaiIntiRendah = RNG.binomial(1, 0.35, n).astype(float)
    faktorEkonomi = RNG.binomial(1, 0.4, n).astype(float)
    jarakJauh = RNG.binomial(1, 0.3, n).astype(float)
    keluargaRentan = RNG.binomial(1, 0.18, n).astype(float)

    columns = {
        "pctAbsen": pctAbsen,
        "alpaBeruntun": alpaBeruntun,
        "trenAbsensiMemburuk": trenAbsensiMemburuk,
        "telatKronis": telatKronis,
        "catatanDisiplin": catatanDisiplin,
        "partisipasiRendah": partisipasiRendah,
        "pctTugasTidakKumpul": pctTugasTidakKumpul,
        "nilaiTurun": nilaiTurun,
        "mapelDiBawahKkm": mapelDiBawahKkm,
        "pernahTinggalKelas": pernahTinggalKelas,
        "nilaiIntiRendah": nilaiIntiRendah,
        "faktorEkonomi": faktorEkonomi,
        "jarakJauh": jarakJauh,
        "keluargaRentan": keluargaRentan,
    }
    X = np.column_stack([columns[name] for name in FEATURE_ORDER])

    laten = (
        0.06 * pctAbsen
        + 0.5 * alpaBeruntun
        + 0.8 * trenAbsensiMemburuk
        + 0.4 * telatKronis
        + 0.4 * catatanDisiplin
        + 0.5 * partisipasiRendah
        + 0.02 * pctTugasTidakKumpul
        + 0.04 * nilaiTurun
        + 0.3 * mapelDiBawahKkm
        + 1.0 * pernahTinggalKelas
        + 0.6 * nilaiIntiRendah
        + 0.5 * faktorEkonomi
        + 0.4 * jarakJauh
        + 0.5 * keluargaRentan
        - 4.5  # bias: dropout adalah kejadian minoritas
    )
    prob = 1.0 / (1.0 + np.exp(-laten + RNG.normal(0, 0.5, n)))
    y = (RNG.uniform(0, 1, n) < prob).astype(int)
    return X, y


def main() -> None:
    X, y = _synthesize()
    pipe = Pipeline(
        [
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ]
    )
    pipe.fit(X, y)
    acc = pipe.score(X, y)
    joblib.dump(
        {"pipeline": pipe, "modelVersion": MODEL_VERSION, "featureVersion": FEATURE_VERSION},
        MODEL_PATH,
    )
    print(f"Tersimpan {MODEL_PATH} | versi {MODEL_VERSION} | akurasi(train) {acc:.3f} | dropout-rate {y.mean():.3f}")


if __name__ == "__main__":
    main()
