"""Kontrak skema service ML JagaSekolah.

Cermin dari `src/lib/ml/types.ts` (sisi TypeScript). Bila skema fitur berubah,
naikkan FEATURE_VERSION di KEDUA sisi agar versi tak cocok bisa ditolak.
"""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from dataset import FEATURE_ORDER, FEATURE_VERSION  # sumber kebenaran kontrak fitur

__all__ = [
    "FEATURE_ORDER",
    "FEATURE_VERSION",
    "Features",
    "PredictRequest",
    "PredictResponse",
    "HealthResponse",
]


class Features(BaseModel):
    """Fitur ABC + konteks (datar, numerik)."""

    pctAbsen: float = Field(ge=0, le=100)
    alpaBeruntun: float = Field(ge=0)
    trenAbsensiMemburuk: float = Field(ge=0, le=1)
    telatKronis: float = Field(ge=0, le=1)
    catatanDisiplin: float = Field(ge=0)
    partisipasiRendah: float = Field(ge=0, le=1)
    pctTugasTidakKumpul: float = Field(ge=0, le=100)
    nilaiTurun: float = Field(ge=0)
    mapelDiBawahKkm: float = Field(ge=0)
    pernahTinggalKelas: float = Field(ge=0, le=1)
    nilaiIntiRendah: float = Field(ge=0, le=1)
    faktorEkonomi: float = Field(ge=0, le=1)
    jarakJauh: float = Field(ge=0, le=1)
    keluargaRentan: float = Field(ge=0, le=1)

    def to_vector(self) -> list[float]:
        return [getattr(self, name) for name in FEATURE_ORDER]


class PredictRequest(BaseModel):
    featureVersion: str
    features: Features

    @field_validator("featureVersion")
    @classmethod
    def _check_version(cls, v: str) -> str:
        if v != FEATURE_VERSION:
            raise ValueError(
                f"featureVersion {v} tidak cocok dengan service ({FEATURE_VERSION})"
            )
        return v


class PredictResponse(BaseModel):
    probabilitas: float = Field(ge=0, le=1)
    modelVersion: str
    kategori: str | None = None


class HealthResponse(BaseModel):
    status: str = "ok"
    modelVersion: str
    featureVersion: str = FEATURE_VERSION
