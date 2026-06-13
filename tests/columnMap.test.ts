import { describe, it } from "node:test";
import { expect } from "./_expect";
import { mapHeaders } from "@/lib/import/columnMap";

describe("mapHeaders — NISN aliases", () => {
  it("maps 'nisn' directly", () => {
    const { map } = mapHeaders(["nisn", "nama", "kelas"]);
    expect(map[0]).toBe("nisn");
  });

  it("maps 'nis'", () => {
    const { map } = mapHeaders(["nis", "nama", "kelas"]);
    expect(map[0]).toBe("nisn");
  });

  it("maps 'nomor induk'", () => {
    const { map } = mapHeaders(["nomor induk", "nama", "kelas"]);
    expect(map[0]).toBe("nisn");
  });
});

describe("mapHeaders — nama aliases", () => {
  it("maps 'nama lengkap'", () => {
    const { map } = mapHeaders(["nisn", "nama lengkap", "kelas"]);
    expect(map[1]).toBe("nama");
  });

  it("maps 'nama peserta didik'", () => {
    const { map } = mapHeaders(["nisn", "nama peserta didik", "kelas"]);
    expect(map[1]).toBe("nama");
  });
});

describe("mapHeaders — kelas aliases", () => {
  it("maps 'rombongan belajar'", () => {
    const { map } = mapHeaders(["nisn", "nama", "rombongan belajar"]);
    expect(map[2]).toBe("kelas");
  });

  it("maps 'rombel'", () => {
    const { map } = mapHeaders(["nisn", "nama", "rombel"]);
    expect(map[2]).toBe("kelas");
  });
});

describe("mapHeaders — jenisKelamin aliases", () => {
  it("maps 'jenis kelamin'", () => {
    const { map } = mapHeaders(["jenis kelamin"]);
    expect(map[0]).toBe("jenisKelamin");
  });

  it("maps 'jk'", () => {
    const { map } = mapHeaders(["jk"]);
    expect(map[0]).toBe("jenisKelamin");
  });

  it("maps 'l/p'", () => {
    const { map } = mapHeaders(["l/p"]);
    expect(map[0]).toBe("jenisKelamin");
  });
});

describe("mapHeaders — statusEkonomi aliases", () => {
  it("maps 'status ekonomi'", () => {
    const { map } = mapHeaders(["status ekonomi"]);
    expect(map[0]).toBe("statusEkonomi");
  });

  it("maps 'ekonomi'", () => {
    const { map } = mapHeaders(["ekonomi"]);
    expect(map[0]).toBe("statusEkonomi");
  });
});

describe("mapHeaders — penerimaKip aliases", () => {
  it("maps 'kip'", () => {
    const { map } = mapHeaders(["kip"]);
    expect(map[0]).toBe("penerimaKip");
  });

  it("maps 'penerima kip'", () => {
    const { map } = mapHeaders(["penerima kip"]);
    expect(map[0]).toBe("penerimaKip");
  });

  it("maps 'penerima pip'", () => {
    const { map } = mapHeaders(["penerima pip"]);
    expect(map[0]).toBe("penerimaKip");
  });
});

describe("mapHeaders — jarakKm aliases", () => {
  it("maps 'jarak'", () => {
    const { map } = mapHeaders(["jarak"]);
    expect(map[0]).toBe("jarakKm");
  });

  it("maps 'jarak km'", () => {
    const { map } = mapHeaders(["jarak km"]);
    expect(map[0]).toBe("jarakKm");
  });

  it("maps 'jarak ke sekolah'", () => {
    const { map } = mapHeaders(["jarak ke sekolah"]);
    expect(map[0]).toBe("jarakKm");
  });
});

describe("mapHeaders — statusKeluarga aliases", () => {
  it("maps 'status keluarga'", () => {
    const { map } = mapHeaders(["status keluarga"]);
    expect(map[0]).toBe("statusKeluarga");
  });

  it("maps 'status orang tua'", () => {
    const { map } = mapHeaders(["status orang tua"]);
    expect(map[0]).toBe("statusKeluarga");
  });
});

describe("mapHeaders — case-insensitivity", () => {
  it("handles UPPERCASE headers", () => {
    const { map, missing } = mapHeaders(["NISN", "NAMA", "KELAS"]);
    expect(map[0]).toBe("nisn");
    expect(map[1]).toBe("nama");
    expect(map[2]).toBe("kelas");
    expect(missing).toHaveLength(0);
  });

  it("handles MiXeD CaSe", () => {
    const { map } = mapHeaders(["Nama Siswa", "No Induk", "Rombel"]);
    expect(map[0]).toBe("nama");
    expect(map[1]).toBe("nisn");
    expect(map[2]).toBe("kelas");
  });
});

describe("mapHeaders — whitespace normalization", () => {
  it("trims leading/trailing spaces", () => {
    const { map } = mapHeaders(["  nisn  ", "  nama  ", "  kelas  "]);
    expect(map[0]).toBe("nisn");
    expect(map[1]).toBe("nama");
    expect(map[2]).toBe("kelas");
  });

  it("collapses multiple internal spaces", () => {
    const { map } = mapHeaders(["nama   siswa", "no   induk", "rombongan   belajar"]);
    expect(map[0]).toBe("nama");
    expect(map[1]).toBe("nisn");
    expect(map[2]).toBe("kelas");
  });

  it("handles tabs and newlines as spaces", () => {
    const { map } = mapHeaders(["nama\tsiswa", "no\ninduk", "kelas"]);
    expect(map[0]).toBe("nama");
    expect(map[1]).toBe("nisn");
    expect(map[2]).toBe("kelas");
  });
});

describe("mapHeaders — unknown columns", () => {
  it("ignores unrecognized columns", () => {
    const { map } = mapHeaders(["nisn", "alamat", "nama", "hobi", "kelas"]);
    expect(map[0]).toBe("nisn");
    expect(map[2]).toBe("nama");
    expect(map[4]).toBe("kelas");
    // indices 1,3 should not exist
    expect(Object.keys(map)).toHaveLength(3);
  });

  it("all unknown columns → empty map", () => {
    const { map, missing } = mapHeaders(["foo", "bar", "baz"]);
    expect(Object.keys(map)).toHaveLength(0);
    expect(missing).toContain("nisn");
    expect(missing).toContain("nama");
    expect(missing).toContain("kelas");
  });
});

describe("mapHeaders — duplicate columns", () => {
  it("maps both duplicate indices (last wins in set, both in map)", () => {
    const { map } = mapHeaders(["nisn", "nisn", "nama", "kelas"]);
    // Both index 0 and 1 map to nisn
    expect(map[0]).toBe("nisn");
    expect(map[1]).toBe("nisn");
    // missing should still be empty since nisn is found
    const { missing } = mapHeaders(["nisn", "nisn", "nama", "kelas"]);
    expect(missing).toHaveLength(0);
  });

  it("maps different aliases of same field", () => {
    const { map } = mapHeaders(["no induk", "nis", "nama", "kelas"]);
    expect(map[0]).toBe("nisn");
    expect(map[1]).toBe("nisn");
  });
});

describe("mapHeaders — empty header row", () => {
  it("returns empty map and reports all required missing", () => {
    const { map, missing } = mapHeaders([]);
    expect(Object.keys(map)).toHaveLength(0);
    expect(missing).toHaveLength(3);
    expect(missing).toContain("nisn");
    expect(missing).toContain("nama");
    expect(missing).toContain("kelas");
  });

  it("handles array of empty strings", () => {
    const { map, missing } = mapHeaders(["", "  ", "\t"]);
    expect(Object.keys(map)).toHaveLength(0);
    expect(missing).toHaveLength(3);
  });
});

describe("mapHeaders — partial maps", () => {
  it("only nisn present → missing nama and kelas", () => {
    const { map, missing } = mapHeaders(["nisn"]);
    expect(map[0]).toBe("nisn");
    expect(missing).toHaveLength(2);
    expect(missing).toContain("nama");
    expect(missing).toContain("kelas");
  });

  it("only nama present → missing nisn and kelas", () => {
    const { missing } = mapHeaders(["nama"]);
    expect(missing).toHaveLength(2);
    expect(missing).toContain("nisn");
    expect(missing).toContain("kelas");
  });

  it("optional fields only → all 3 required missing", () => {
    const { map, missing } = mapHeaders(["jk", "kip", "jarak"]);
    expect(Object.keys(map)).toHaveLength(3);
    expect(map[0]).toBe("jenisKelamin");
    expect(map[1]).toBe("penerimaKip");
    expect(map[2]).toBe("jarakKm");
    expect(missing).toHaveLength(3);
  });
});

describe("mapHeaders — index correctness", () => {
  it("preserves original column index positions", () => {
    const { map } = mapHeaders(["foo", "bar", "nisn", "baz", "nama", "xx", "kelas"]);
    expect(map[2]).toBe("nisn");
    expect(map[4]).toBe("nama");
    expect(map[6]).toBe("kelas");
  });

  it("maps all 8 internal fields from a full Dapodik export", () => {
    const headers = [
      "NISN", "Nama Peserta Didik", "Rombongan Belajar",
      "Jenis Kelamin", "Status Ekonomi", "Penerima KIP",
      "Jarak Ke Sekolah", "Status Orang Tua",
    ];
    const { map, missing } = mapHeaders(headers);
    expect(Object.keys(map)).toHaveLength(8);
    expect(map[0]).toBe("nisn");
    expect(map[1]).toBe("nama");
    expect(map[2]).toBe("kelas");
    expect(map[3]).toBe("jenisKelamin");
    expect(map[4]).toBe("statusEkonomi");
    expect(map[5]).toBe("penerimaKip");
    expect(map[6]).toBe("jarakKm");
    expect(map[7]).toBe("statusKeluarga");
    expect(missing).toHaveLength(0);
  });
});

describe("mapHeaders — missing only reports required fields", () => {
  it("never reports optional fields as missing", () => {
    const { missing } = mapHeaders(["nisn", "nama", "kelas"]);
    expect(missing).toHaveLength(0);
    // optional fields not present, but not reported missing
    expect(missing).not.toContain("jenisKelamin");
    expect(missing).not.toContain("statusEkonomi");
    expect(missing).not.toContain("penerimaKip");
    expect(missing).not.toContain("jarakKm");
    expect(missing).not.toContain("statusKeluarga");
  });
});
