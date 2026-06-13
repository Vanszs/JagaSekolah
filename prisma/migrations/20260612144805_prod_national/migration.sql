-- CreateTable
CREATE TABLE "Wilayah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provinsi" TEXT NOT NULL,
    "kabupaten" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Sekolah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "npsn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "wilayahId" TEXT NOT NULL,
    CONSTRAINT "Sekolah_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "Wilayah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'guru',
    "sekolahId" TEXT,
    "wilayahId" TEXT,
    "kelasId" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_sekolahId_fkey" FOREIGN KEY ("sekolahId") REFERENCES "Sekolah" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_wilayahId_fkey" FOREIGN KEY ("wilayahId") REFERENCES "Wilayah" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sekolahId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "waliKelasId" TEXT,
    CONSTRAINT "Kelas_sekolahId_fkey" FOREIGN KEY ("sekolahId") REFERENCES "Sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nisn" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "sekolahId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "jenisKelamin" TEXT,
    "statusEkonomiEnc" TEXT,
    "penerimaKip" BOOLEAN NOT NULL DEFAULT false,
    "jarakKm" REAL,
    "statusKeluargaEnc" TEXT,
    "statusOrtuEnc" TEXT,
    "dekId" TEXT,
    "sudahDropout" BOOLEAN NOT NULL DEFAULT false,
    "consentStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "nonaktifSejak" DATETIME,
    CONSTRAINT "Siswa_sekolahId_fkey" FOREIGN KEY ("sekolahId") REFERENCES "Sekolah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Siswa_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "oleh" TEXT NOT NULL,
    "hubungan" TEXT NOT NULL,
    "metode" TEXT NOT NULL,
    "catatan" TEXT,
    "dibuatOleh" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Consent_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EncryptionKey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wrappedKey" TEXT NOT NULL,
    "masterKeyId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "Absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "mapel" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "nilai" REAL NOT NULL,
    "kkm" REAL NOT NULL DEFAULT 70,
    CONSTRAINT "Nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Risiko" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "sekolahId" TEXT NOT NULL,
    "tanggalHitung" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kategori" TEXT NOT NULL,
    "skor" REAL NOT NULL,
    "alasanJson" TEXT NOT NULL,
    "sumber" TEXT NOT NULL DEFAULT 'rule',
    "configVersion" TEXT NOT NULL,
    "isLatest" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Risiko_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Intervensi" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siswaId" TEXT NOT NULL,
    "sekolahId" TEXT NOT NULL,
    "tanggal" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jenis" TEXT NOT NULL,
    "catatan" TEXT NOT NULL,
    "olehUserId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "deletedAt" DATETIME,
    CONSTRAINT "Intervensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Intervensi_olehUserId_fkey" FOREIGN KEY ("olehUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idempotencyKey" TEXT NOT NULL,
    "sekolahId" TEXT,
    "status" TEXT NOT NULL,
    "detailJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sekolahId" TEXT,
    "aksi" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "ip" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Wilayah_provinsi_kabupaten_key" ON "Wilayah"("provinsi", "kabupaten");

-- CreateIndex
CREATE UNIQUE INDEX "Sekolah_npsn_key" ON "Sekolah"("npsn");

-- CreateIndex
CREATE INDEX "Sekolah_wilayahId_idx" ON "Sekolah"("wilayahId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_sekolahId_idx" ON "User"("sekolahId");

-- CreateIndex
CREATE INDEX "User_wilayahId_idx" ON "User"("wilayahId");

-- CreateIndex
CREATE INDEX "Kelas_sekolahId_idx" ON "Kelas"("sekolahId");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_sekolahId_nama_key" ON "Kelas"("sekolahId", "nama");

-- CreateIndex
CREATE UNIQUE INDEX "Siswa_nisn_key" ON "Siswa"("nisn");

-- CreateIndex
CREATE INDEX "Siswa_sekolahId_idx" ON "Siswa"("sekolahId");

-- CreateIndex
CREATE INDEX "Siswa_kelasId_idx" ON "Siswa"("kelasId");

-- CreateIndex
CREATE INDEX "Siswa_sekolahId_kelasId_idx" ON "Siswa"("sekolahId", "kelasId");

-- CreateIndex
CREATE INDEX "Siswa_consentStatus_idx" ON "Siswa"("consentStatus");

-- CreateIndex
CREATE INDEX "Consent_siswaId_createdAt_idx" ON "Consent"("siswaId", "createdAt");

-- CreateIndex
CREATE INDEX "EncryptionKey_aktif_idx" ON "EncryptionKey"("aktif");

-- CreateIndex
CREATE INDEX "Absensi_siswaId_tanggal_idx" ON "Absensi"("siswaId", "tanggal");

-- CreateIndex
CREATE INDEX "Absensi_siswaId_status_idx" ON "Absensi"("siswaId", "status");

-- CreateIndex
CREATE INDEX "Nilai_siswaId_periode_idx" ON "Nilai"("siswaId", "periode");

-- CreateIndex
CREATE INDEX "Risiko_siswaId_tanggalHitung_idx" ON "Risiko"("siswaId", "tanggalHitung");

-- CreateIndex
CREATE INDEX "Risiko_sekolahId_kategori_isLatest_idx" ON "Risiko"("sekolahId", "kategori", "isLatest");

-- CreateIndex
CREATE INDEX "Risiko_siswaId_isLatest_idx" ON "Risiko"("siswaId", "isLatest");

-- CreateIndex
CREATE INDEX "Intervensi_siswaId_idx" ON "Intervensi"("siswaId");

-- CreateIndex
CREATE INDEX "Intervensi_sekolahId_idx" ON "Intervensi"("sekolahId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncLog_idempotencyKey_key" ON "SyncLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_sekolahId_timestamp_idx" ON "AuditLog"("sekolahId", "timestamp");

-- Partial unique index: jamin tepat 1 risiko isLatest per (siswaId,kategori)
CREATE UNIQUE INDEX "Risiko_siswa_kategori_latest_unique" ON "Risiko" ("siswaId", "kategori") WHERE "isLatest" = true;
