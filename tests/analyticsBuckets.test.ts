import { test } from "node:test";
import { expect } from "./_expect";
import {
  scoreBinIndex,
  SCORE_BIN_LABELS,
  distanceBinIndex,
  DISTANCE_LABELS,
} from "@/lib/analyticsBuckets";

test("scoreBinIndex: batas bawah & atas masuk bucket benar", () => {
  expect(scoreBinIndex(0)).toBe(0);
  expect(scoreBinIndex(9.9)).toBe(0);
  expect(scoreBinIndex(10)).toBe(1);
  expect(scoreBinIndex(55)).toBe(5);
  expect(scoreBinIndex(99)).toBe(9);
  expect(scoreBinIndex(100)).toBe(9); // clamp
  expect(scoreBinIndex(150)).toBe(9); // clamp atas
});

test("scoreBinIndex: nilai negatif di-clamp ke 0", () => {
  expect(scoreBinIndex(-5)).toBe(0);
});

test("SCORE_BIN_LABELS: 10 bucket, label benar", () => {
  expect(SCORE_BIN_LABELS).toHaveLength(10);
  expect(SCORE_BIN_LABELS[0]).toBe("0–10");
  expect(SCORE_BIN_LABELS[9]).toBe("90–100");
});

test("distanceBinIndex: tiap rentang jarak", () => {
  expect(distanceBinIndex(0)).toBe(0); // <1
  expect(distanceBinIndex(0.5)).toBe(0);
  expect(distanceBinIndex(1)).toBe(1); // 1–3
  expect(distanceBinIndex(2.9)).toBe(1);
  expect(distanceBinIndex(3)).toBe(2); // 3–5
  expect(distanceBinIndex(5)).toBe(3); // 5–10
  expect(distanceBinIndex(9.9)).toBe(3);
  expect(distanceBinIndex(10)).toBe(4); // >10
  expect(distanceBinIndex(50)).toBe(4);
});

test("DISTANCE_LABELS: 5 bucket", () => {
  expect(DISTANCE_LABELS).toHaveLength(5);
  expect(DISTANCE_LABELS[0]).toBe("<1 km");
  expect(DISTANCE_LABELS[4]).toBe(">10 km");
});
