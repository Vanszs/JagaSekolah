import { describe, it } from "node:test";
import { expect } from "./_expect";
import { parseCsv, parseExcel, type ParseResult } from "@/lib/import/parse";

describe("parseCsv", () => {
  it("parses valid CSV with required headers -> rows with mapped fields", () => {
    const csv = "NISN,Nama Siswa,Kelas\n001,Budi,7A\n002,Siti,8B\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.totalRows).toBe(2);
    expect(result.missing).toHaveLength(0);
    expect(result.rows[0]).toEqual({ nisn: "001", nama: "Budi", kelas: "7A" });
    expect(result.rows[1]).toEqual({ nisn: "002", nama: "Siti", kelas: "8B" });
  });

  it("detects missing required headers", () => {
    const csv = "Nama Siswa,Jenis Kelamin\nBudi,L\n";
    const result = parseCsv(csv);
    expect(result.missing).toContain("nisn");
    expect(result.missing).toContain("kelas");
    expect(result.rows).toHaveLength(1);
  });

  it("returns empty rows and all missing for empty input", () => {
    const result = parseCsv("");
    expect(result.rows).toHaveLength(0);
    expect(result.totalRows).toBe(0);
    expect(result.missing).toContain("nisn");
    expect(result.missing).toContain("nama");
    expect(result.missing).toContain("kelas");
  });

  it("skips empty/blank rows", () => {
    const csv = "NISN,Nama,Kelas\n001,Budi,7A\n,,\n002,Siti,8B\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
  });

  it("handles quoted fields with commas inside", () => {
    const csv = 'NISN,Nama,Kelas\n001,"Budi, S",7A\n';
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({ nisn: "001", nama: "Budi, S", kelas: "7A" });
  });

  it("handles trailing newline gracefully", () => {
    const csv = "NISN,Nama,Kelas\n001,Budi,7A\n\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
  });

  it("handles BOM prefix in CSV", () => {
    const bom = "\uFEFF";
    const csv = `${bom}NISN,Nama,Kelas\n001,Budi,7A\n`;
    const result = parseCsv(csv);
    // PapaParse strips BOM; header should still map
    expect(result.rows).toHaveLength(1);
    expect(result.missing).toHaveLength(0);
    expect(result.rows[0]).toEqual({ nisn: "001", nama: "Budi", kelas: "7A" });
  });

  it("maps alias headers (case-insensitive, multi-space normalization)", () => {
    const csv = "No Induk,  Nama Lengkap  ,Rombel\n001,Budi,7A\n";
    const result = parseCsv(csv);
    expect(result.missing).toHaveLength(0);
    expect(result.rows[0]).toEqual({ nisn: "001", nama: "Budi", kelas: "7A" });
  });

  it("maps optional fields when present", () => {
    const csv = "NISN,Nama,Kelas,Jenis Kelamin,Jarak Km\n001,Budi,7A,L,3.5\n";
    const result = parseCsv(csv);
    expect(result.rows[0]).toEqual({
      nisn: "001",
      nama: "Budi",
      kelas: "7A",
      jenisKelamin: "L",
      jarakKm: "3.5",
    });
  });

  it("header-only CSV (no data rows) returns empty rows", () => {
    const csv = "NISN,Nama,Kelas\n";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.totalRows).toBe(0);
    expect(result.missing).toHaveLength(0);
  });

  it("single data row without trailing newline", () => {
    const csv = "NISN,Nama,Kelas\n001,Budi,7A";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
  });

  it("unmapped columns are ignored", () => {
    const csv = "NISN,Nama,Kelas,ExtraCol\n001,Budi,7A,ignored\n";
    const result = parseCsv(csv);
    const keys = Object.keys(result.rows[0]!);
    expect(keys).not.toContain("ExtraCol");
    expect(keys).not.toContain("extracol");
  });
});

describe("parseExcel", () => {
  it("parses minimal xlsx buffer", () => {
    // Build a minimal xlsx in-memory using XLSX (same lib used by parse.ts)
    const XLSX = require("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([
      ["NISN", "Nama", "Kelas"],
      ["001", "Budi", "7A"],
      ["002", "Siti", "8B"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf: ArrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const result = parseExcel(buf);
    expect(result.rows).toHaveLength(2);
    expect(result.totalRows).toBe(2);
    expect(result.missing).toHaveLength(0);
    expect(result.rows[0]).toEqual({ nisn: "001", nama: "Budi", kelas: "7A" });
  });

  it("returns empty for workbook with no sheets data", () => {
    const XLSX = require("xlsx");
    const ws = XLSX.utils.aoa_to_sheet([]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf: ArrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    const result = parseExcel(buf);
    expect(result.rows).toHaveLength(0);
    expect(result.totalRows).toBe(0);
  });
});
