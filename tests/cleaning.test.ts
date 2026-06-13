import { describe, it } from "node:test";
import { expect } from "./_expect";
import { cleanRows } from "@/lib/import/cleaning";
import { mapHeaders } from "@/lib/import/columnMap";

describe("cleanRows", () => {
  it("menerima baris valid", () => {
    const res = cleanRows([{ nisn: "1234567890", nama: "Andi", kelas: "VIII-A" }]);
    expect(res.valid).toHaveLength(1);
    expect(res.errors).toHaveLength(0);
  });

  it("menolak NISN invalid tanpa menggagalkan baris lain", () => {
    const res = cleanRows([
      { nisn: "abc", nama: "Andi", kelas: "VIII-A" },
      { nisn: "1234567890", nama: "Budi", kelas: "VIII-A" },
    ]);
    expect(res.valid).toHaveLength(1);
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0]!.row).toBe(2);
  });

  it("mendeteksi NISN duplikat", () => {
    const res = cleanRows([
      { nisn: "1234567890", nama: "Andi", kelas: "VIII-A" },
      { nisn: "1234567890", nama: "Andi2", kelas: "VIII-A" },
    ]);
    expect(res.valid).toHaveLength(1);
    expect(res.duplikatNisn).toContain("1234567890");
  });

  it("menormalkan penerimaKip dari string 'Ya'", () => {
    const res = cleanRows([
      { nisn: "1234567890", nama: "Andi", kelas: "VIII-A", penerimaKip: "Ya" },
    ]);
    expect(res.valid[0]!.penerimaKip).toBe(true);
  });
});

describe("mapHeaders", () => {
  it("memetakan alias kolom Dapodik", () => {
    const { map, missing } = mapHeaders(["No Induk", "Nama Siswa", "Rombel", "JK"]);
    expect(Object.values(map)).toContain("nisn");
    expect(Object.values(map)).toContain("nama");
    expect(Object.values(map)).toContain("kelas");
    expect(missing).toHaveLength(0);
  });

  it("melaporkan kolom wajib yang hilang", () => {
    const { missing } = mapHeaders(["Nama", "Alamat"]);
    expect(missing).toContain("nisn");
    expect(missing).toContain("kelas");
  });
});
