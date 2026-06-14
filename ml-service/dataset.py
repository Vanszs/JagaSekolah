"""Generator dataset latih yang MASUK AKAL untuk prediksi putus sekolah.

Mengapa bukan sampling acak independen?
  Data nyata punya STRUKTUR KORELASI: sinyal risiko mengelompok (absen naik →
  nilai turun → tugas tak terkumpul bersamaan), dan konteks (ekonomi/jarak/keluarga)
  berperan sebagai AMPLIFIER, bukan penyebab tunggal. Sampling tiap fitur secara
  independen menghasilkan kombinasi mustahil (mis. 0% absen tapi alpa 10 hari beruntun).

Pendekatan:
  1. Bangkitkan siswa dari 9 ARKETIPE realistis (porsi populasi berbobot). Tiap
     arketipe menentukan DISTRIBUSI BERSAMA fitur yang koheren.
  2. Terapkan batasan koherensi (mis. nilai inti rendah ⇒ minimal 1 mapel < KKM;
     alpa beruntun tak melebihi yang masuk akal terhadap %absen).
  3. Tentukan label putus-sekolah dari FUNGSI LATEN berbobot literatur ABC
     (Attendance terkuat → Course → Behavior → Context sebagai amplifier + interaksi),
     bukan dari label arketipe langsung — agar model belajar dari fitur, bukan ID arketipe.

⚠️ Tetap data SINTETIS (bukan siswa nyata). Wajib dilatih ulang + dikalibrasi pada data
   retrospektif sekolah mitra sebelum produksi (lihat PLAN.md).

Sumber kerangka: ABC dropout predictors (US Dept. of Education / MDRC / Johns Hopkins),
diadaptasi konteks Indonesia (KIP/PIP, 3T, musim panen, struktur keluarga).
"""
from __future__ import annotations

import numpy as np

# Sumber kebenaran kontrak fitur (schema.py mengimpor dari sini agar training tidak
# perlu pydantic). Urutan kolom HARUS konsisten antara generator, train, & service.
FEATURE_VERSION = "1.0.0"
FEATURE_ORDER: list[str] = [
    "pctAbsen",
    "alpaBeruntun",
    "trenAbsensiMemburuk",
    "telatKronis",
    "catatanDisiplin",
    "partisipasiRendah",
    "pctTugasTidakKumpul",
    "nilaiTurun",
    "mapelDiBawahKkm",
    "pernahTinggalKelas",
    "nilaiIntiRendah",
    "faktorEkonomi",
    "jarakJauh",
    "keluargaRentan",
]

# Porsi populasi tiap arketipe (jumlah = 1.0).
ARCHETYPES: dict[str, float] = {
    "stabil_aman": 0.30,            # mayoritas: hadir baik, nilai cukup
    "ekonomi_tekun": 0.12,          # rentan ekonomi/jarak TAPI tekun → bukti konteks≠risiko tunggal
    "early_absence": 0.12,          # peringatan dini: tren absensi mulai memburuk
    "disengage_akademik": 0.10,     # nilai jatuh + tugas tak kumpul, absen belum parah
    "krisis_absensi": 0.10,         # absen kronis (prediktor terkuat)
    "multifaktor": 0.08,            # ABC+D bertumpuk (risiko tertinggi)
    "tiga_T": 0.08,                 # akses sulit, absen musiman (panen)
    "perilaku": 0.06,               # disiplin/partisipasi bermasalah
    "eks_tinggal_kelas_membaik": 0.04,  # pernah tinggal kelas, kini membaik
}


def _clip(a: np.ndarray, lo: float, hi: float) -> np.ndarray:
    return np.clip(a, lo, hi)


def _sample(name: str, n: int, rng: np.random.Generator) -> dict[str, np.ndarray]:
    """Distribusi bersama fitur per arketipe. Semua kolom panjang n."""
    B = lambda p: rng.binomial(1, p, n).astype(float)  # noqa: E731 (Bernoulli ringkas)

    if name == "stabil_aman":
        pctAbsen = _clip(rng.gamma(2.0, 2.2, n), 0, 100)            # rata-rata ~4%
        return dict(
            pctAbsen=pctAbsen,
            alpaBeruntun=_clip(rng.poisson(0.3, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.05),
            telatKronis=B(0.06),
            catatanDisiplin=_clip(rng.poisson(0.1, n), 0, 10).astype(float),
            partisipasiRendah=B(0.06),
            pctTugasTidakKumpul=_clip(rng.gamma(1.5, 5, n), 0, 100),
            nilaiTurun=_clip(rng.gamma(1.2, 2.5, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(0.4, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.02),
            nilaiIntiRendah=B(0.05),
            faktorEkonomi=B(0.25),
            jarakJauh=B(0.15),
            keluargaRentan=B(0.08),
        )

    if name == "ekonomi_tekun":
        return dict(
            pctAbsen=_clip(rng.gamma(2.5, 3.0, n), 0, 100),         # ~7%, masih baik
            alpaBeruntun=_clip(rng.poisson(0.6, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.12),
            telatKronis=B(0.18),                                    # transport jauh
            catatanDisiplin=_clip(rng.poisson(0.15, n), 0, 10).astype(float),
            partisipasiRendah=B(0.12),
            pctTugasTidakKumpul=_clip(rng.gamma(1.6, 7, n), 0, 100),
            nilaiTurun=_clip(rng.gamma(1.4, 3.5, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(0.9, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.05),
            nilaiIntiRendah=B(0.18),
            faktorEkonomi=np.ones(n),                               # selalu rentan ekonomi
            jarakJauh=B(0.60),
            keluargaRentan=B(0.25),
        )

    if name == "early_absence":
        pctAbsen = _clip(rng.normal(18, 6, n), 2, 100)
        return dict(
            pctAbsen=pctAbsen,
            alpaBeruntun=_clip(rng.poisson(2.5, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.85),                            # ciri utama: tren memburuk
            telatKronis=B(0.35),
            catatanDisiplin=_clip(rng.poisson(0.5, n), 0, 10).astype(float),
            partisipasiRendah=B(0.40),
            pctTugasTidakKumpul=_clip(rng.normal(35, 15, n), 0, 100),
            nilaiTurun=_clip(rng.normal(10, 6, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(1.8, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.06),
            nilaiIntiRendah=B(0.30),
            faktorEkonomi=B(0.40),
            jarakJauh=B(0.30),
            keluargaRentan=B(0.18),
        )

    if name == "disengage_akademik":
        return dict(
            pctAbsen=_clip(rng.normal(12, 5, n), 0, 100),           # absen belum parah
            alpaBeruntun=_clip(rng.poisson(1.2, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.35),
            telatKronis=B(0.25),
            catatanDisiplin=_clip(rng.poisson(0.8, n), 0, 10).astype(float),
            partisipasiRendah=B(0.70),
            pctTugasTidakKumpul=_clip(rng.normal(68, 16, n), 0, 100),
            nilaiTurun=_clip(rng.normal(22, 8, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(4.0, n), 1, 12).astype(float),
            pernahTinggalKelas=B(0.12),
            nilaiIntiRendah=B(0.80),
            faktorEkonomi=B(0.35),
            jarakJauh=B(0.25),
            keluargaRentan=B(0.20),
        )

    if name == "krisis_absensi":
        pctAbsen = _clip(rng.normal(48, 12, n), 20, 100)
        return dict(
            pctAbsen=pctAbsen,
            alpaBeruntun=_clip(rng.poisson(7, n), 2, 30).astype(float),
            trenAbsensiMemburuk=B(0.80),
            telatKronis=B(0.50),
            catatanDisiplin=_clip(rng.poisson(1.0, n), 0, 10).astype(float),
            partisipasiRendah=B(0.55),
            pctTugasTidakKumpul=_clip(rng.normal(70, 18, n), 0, 100),
            nilaiTurun=_clip(rng.normal(18, 9, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(3.2, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.15),
            nilaiIntiRendah=B(0.55),
            faktorEkonomi=B(0.50),
            jarakJauh=B(0.35),
            keluargaRentan=B(0.30),
        )

    if name == "multifaktor":
        pctAbsen = _clip(rng.normal(45, 14, n), 15, 100)
        return dict(
            pctAbsen=pctAbsen,
            alpaBeruntun=_clip(rng.poisson(8, n), 2, 30).astype(float),
            trenAbsensiMemburuk=B(0.85),
            telatKronis=B(0.55),
            catatanDisiplin=_clip(rng.poisson(2.0, n), 0, 10).astype(float),
            partisipasiRendah=B(0.80),
            pctTugasTidakKumpul=_clip(rng.normal(78, 16, n), 0, 100),
            nilaiTurun=_clip(rng.normal(26, 9, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(5.0, n), 2, 12).astype(float),
            pernahTinggalKelas=B(0.50),
            nilaiIntiRendah=B(0.85),
            faktorEkonomi=B(0.80),
            jarakJauh=B(0.50),
            keluargaRentan=B(0.60),
        )

    if name == "tiga_T":
        # Absen musiman (panen): bimodal — sebagian rendah, sebagian melonjak.
        musim = B(0.45)
        pctAbsen = _clip(np.where(musim == 1, rng.normal(35, 10, n), rng.normal(12, 6, n)), 0, 100)
        return dict(
            pctAbsen=pctAbsen,
            alpaBeruntun=_clip(rng.poisson(3.5, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.50),
            telatKronis=B(0.45),                                    # jarak ekstrem
            catatanDisiplin=_clip(rng.poisson(0.4, n), 0, 10).astype(float),
            partisipasiRendah=B(0.45),
            pctTugasTidakKumpul=_clip(rng.normal(45, 18, n), 0, 100),
            nilaiTurun=_clip(rng.normal(14, 8, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(2.5, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.18),
            nilaiIntiRendah=B(0.45),
            faktorEkonomi=B(0.80),
            jarakJauh=np.ones(n),                                   # selalu jauh (3T)
            keluargaRentan=B(0.30),
        )

    if name == "perilaku":
        return dict(
            pctAbsen=_clip(rng.normal(15, 7, n), 0, 100),
            alpaBeruntun=_clip(rng.poisson(1.5, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.30),
            telatKronis=B(0.50),
            catatanDisiplin=_clip(rng.poisson(3.2, n), 1, 10).astype(float),  # ciri utama
            partisipasiRendah=B(0.80),
            pctTugasTidakKumpul=_clip(rng.normal(55, 18, n), 0, 100),
            nilaiTurun=_clip(rng.normal(12, 7, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(2.0, n), 0, 12).astype(float),
            pernahTinggalKelas=B(0.10),
            nilaiIntiRendah=B(0.35),
            faktorEkonomi=B(0.30),
            jarakJauh=B(0.20),
            keluargaRentan=B(0.25),
        )

    if name == "eks_tinggal_kelas_membaik":
        return dict(
            pctAbsen=_clip(rng.gamma(2.2, 2.5, n), 0, 100),         # kini hadir baik
            alpaBeruntun=_clip(rng.poisson(0.5, n), 0, 30).astype(float),
            trenAbsensiMemburuk=B(0.10),
            telatKronis=B(0.12),
            catatanDisiplin=_clip(rng.poisson(0.3, n), 0, 10).astype(float),
            partisipasiRendah=B(0.20),
            pctTugasTidakKumpul=_clip(rng.gamma(1.6, 9, n), 0, 100),
            nilaiTurun=_clip(rng.gamma(1.3, 3, n), 0, 60),
            mapelDiBawahKkm=_clip(rng.poisson(1.2, n), 0, 12).astype(float),
            pernahTinggalKelas=np.ones(n),                          # riwayat tinggal kelas
            nilaiIntiRendah=B(0.25),
            faktorEkonomi=B(0.40),
            jarakJauh=B(0.25),
            keluargaRentan=B(0.20),
        )

    raise ValueError(f"arketipe tak dikenal: {name}")


def _enforce_coherence(cols: dict[str, np.ndarray], rng: np.random.Generator) -> None:
    """Batasan logis antar-fitur (in-place)."""
    n = len(cols["pctAbsen"])
    # Nilai inti rendah ⇒ minimal 1 mapel di bawah KKM.
    inti = cols["nilaiIntiRendah"] == 1
    cols["mapelDiBawahKkm"] = np.where(
        inti & (cols["mapelDiBawahKkm"] < 1), 1.0, cols["mapelDiBawahKkm"]
    )
    # Alpa beruntun tak boleh melebihi yang masuk akal terhadap %absen
    # (≈ batas hari alpa dalam periode ~24 hari sekolah).
    cap = np.ceil(cols["pctAbsen"] / 100.0 * 24.0) + 1
    cols["alpaBeruntun"] = np.minimum(cols["alpaBeruntun"], cap)
    # Tren memburuk lebih wajar bila %absen sudah tak nol; bila absen ~0, redam.
    near_zero = cols["pctAbsen"] < 2
    flip = near_zero & (cols["trenAbsensiMemburuk"] == 1) & (rng.uniform(0, 1, n) < 0.8)
    cols["trenAbsensiMemburuk"] = np.where(flip, 0.0, cols["trenAbsensiMemburuk"])


# Koefisien log-odds berbobot literatur (Attendance > Course > Behavior > Context).
_COEF = {
    "pctAbsen": 0.050,
    "alpaBeruntun": 0.300,
    "trenAbsensiMemburuk": 0.650,
    "telatKronis": 0.200,
    "catatanDisiplin": 0.300,
    "partisipasiRendah": 0.400,
    "pctTugasTidakKumpul": 0.012,
    "nilaiTurun": 0.025,
    "mapelDiBawahKkm": 0.250,
    "pernahTinggalKelas": 0.850,
    "nilaiIntiRendah": 0.450,
    "faktorEkonomi": 0.300,
    "jarakJauh": 0.300,
    "keluargaRentan": 0.550,
}
_INTERCEPT = -8.4  # disetel agar prevalensi dropout realistis (~15%, kejadian minoritas)


def _label(cols: dict[str, np.ndarray], rng: np.random.Generator) -> np.ndarray:
    n = len(cols["pctAbsen"])
    logit = np.full(n, _INTERCEPT)
    for k, c in _COEF.items():
        logit = logit + c * cols[k]
    # Interaksi: tren memburuk × %absen yang sudah tinggi (efek bertumpuk).
    logit = logit + 0.012 * cols["pctAbsen"] * cols["trenAbsensiMemburuk"]
    # Konteks ekonomi mengamplifikasi saat kehadiran mulai goyah.
    logit = logit + 0.05 * cols["faktorEkonomi"] * (cols["pctAbsen"] > 20)
    logit = logit + rng.normal(0, 0.55, n)  # noise individual
    prob = 1.0 / (1.0 + np.exp(-logit))
    return (rng.uniform(0, 1, n) < prob).astype(int)


def make_dataset(
    n: int = 12000, seed: int = 42
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Bangkitkan (X, y, feature_names). X kolom mengikuti schema.FEATURE_ORDER."""
    rng = np.random.default_rng(seed)
    names = list(ARCHETYPES.keys())
    weights = np.array([ARCHETYPES[k] for k in names])
    counts = np.floor(weights / weights.sum() * n).astype(int)
    counts[-1] += n - counts.sum()  # pastikan total = n

    parts: list[dict[str, np.ndarray]] = []
    for name, c in zip(names, counts):
        if c <= 0:
            continue
        cols = _sample(name, int(c), rng)
        _enforce_coherence(cols, rng)
        parts.append(cols)

    merged = {k: np.concatenate([p[k] for p in parts]) for k in FEATURE_ORDER}
    y = _label(merged, rng)

    # Acak urutan baris (agar arketipe tak berurutan).
    order = rng.permutation(len(y))
    X = np.column_stack([merged[k][order] for k in FEATURE_ORDER])
    return X, y[order], list(FEATURE_ORDER)


if __name__ == "__main__":
    X, y, names = make_dataset()
    print(f"dataset: {X.shape[0]} baris × {X.shape[1]} fitur | prevalensi dropout {y.mean():.3f}")
    print("contoh statistik fitur (mean):")
    for i, nm in enumerate(names):
        print(f"  {nm:24s} {X[:, i].mean():8.2f}")
