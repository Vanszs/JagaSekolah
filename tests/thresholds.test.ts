import { describe, it } from "node:test";
import { expect } from "./_expect";
import {
  DEFAULT_THRESHOLDS,
  configVersion,
  type Thresholds,
} from "@/lib/scoring/thresholds";

describe("DEFAULT_THRESHOLDS", () => {
  it("has attendance thresholds in sane ranges", () => {
    expect(DEFAULT_THRESHOLDS.pctAbsenWaspada).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLDS.pctAbsenWaspada).toBeLessThanOrEqual(50);
    expect(DEFAULT_THRESHOLDS.pctAbsenKritis).toBeGreaterThan(
      DEFAULT_THRESHOLDS.pctAbsenWaspada
    );
    expect(DEFAULT_THRESHOLDS.pctAbsenKritis).toBeLessThanOrEqual(100);
    expect(DEFAULT_THRESHOLDS.alpaBeruntunFlag).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLDS.telatKronisPerBulan).toBeGreaterThan(0);
  });

  it("has course thresholds > 0", () => {
    expect(DEFAULT_THRESHOLDS.nilaiTurunFlag).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLDS.mapelDiBawahKkmFlag).toBeGreaterThan(0);
  });

  it("skorKuning < skorMerah and both in 0-100", () => {
    expect(DEFAULT_THRESHOLDS.skorKuning).toBeGreaterThan(0);
    expect(DEFAULT_THRESHOLDS.skorMerah).toBeGreaterThan(
      DEFAULT_THRESHOLDS.skorKuning
    );
    expect(DEFAULT_THRESHOLDS.skorMerah).toBeLessThanOrEqual(100);
  });

  it("bobot has expected keys", () => {
    const keys = Object.keys(DEFAULT_THRESHOLDS.bobot);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain("pctAbsenKritis");
    expect(keys).toContain("pctAbsenWaspada");
    expect(keys).toContain("alpaBeruntun");
    expect(keys).toContain("nilaiTurun");
    expect(keys).toContain("faktorEkonomi");
  });

  it("all bobot values are positive numbers", () => {
    for (const [, v] of Object.entries(DEFAULT_THRESHOLDS.bobot)) {
      expect(v).toBeGreaterThan(0);
    }
  });

  it("specific threshold values match documented defaults", () => {
    expect(DEFAULT_THRESHOLDS.pctAbsenWaspada).toBe(10);
    expect(DEFAULT_THRESHOLDS.pctAbsenKritis).toBe(20);
    expect(DEFAULT_THRESHOLDS.alpaBeruntunFlag).toBe(3);
    expect(DEFAULT_THRESHOLDS.telatKronisPerBulan).toBe(6);
    expect(DEFAULT_THRESHOLDS.nilaiTurunFlag).toBe(10);
    expect(DEFAULT_THRESHOLDS.mapelDiBawahKkmFlag).toBe(3);
    expect(DEFAULT_THRESHOLDS.skorKuning).toBe(30);
    expect(DEFAULT_THRESHOLDS.skorMerah).toBe(60);
  });
});

describe("configVersion", () => {
  it("returns a 12-char hex string for default thresholds", () => {
    const v = configVersion();
    expect(v).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is deterministic — same input yields same hash", () => {
    const a = configVersion(DEFAULT_THRESHOLDS);
    const b = configVersion(DEFAULT_THRESHOLDS);
    expect(a).toBe(b);
  });

  it("changes when a threshold value changes", () => {
    const original = configVersion(DEFAULT_THRESHOLDS);
    const modified: Thresholds = {
      ...DEFAULT_THRESHOLDS,
      skorMerah: 70,
    };
    const changed = configVersion(modified);
    expect(changed).not.toBe(original);
  });

  it("changes when bobot values change", () => {
    const original = configVersion(DEFAULT_THRESHOLDS);
    const modified: Thresholds = {
      ...DEFAULT_THRESHOLDS,
      bobot: { ...DEFAULT_THRESHOLDS.bobot, nilaiTurun: 99 },
    };
    const changed = configVersion(modified);
    expect(changed).not.toBe(original);
  });

  it("explicit DEFAULT_THRESHOLDS arg equals no-arg call", () => {
    expect(configVersion(DEFAULT_THRESHOLDS)).toBe(configVersion());
  });
});
