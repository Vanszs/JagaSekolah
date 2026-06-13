"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

/** Tombol memicu hitung ulang risiko nasional (POST /api/risiko/recompute). */
export function RecomputeButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function run() {
    setState("loading");
    setMsg("");
    try {
      const res = await fetch("/api/risiko/recompute", { method: "POST" });
      const json = (await res.json()) as { dihitung?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Gagal menghitung ulang.");
      setState("done");
      setMsg(`${(json.dihitung ?? 0).toLocaleString("id-ID")} siswa dihitung ulang.`);
      router.refresh();
    } catch (e) {
      setState("error");
      setMsg(e instanceof Error ? e.message : "Terjadi kesalahan.");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={run}
        disabled={state === "loading"}
        className="inline-flex w-fit items-center gap-2 rounded-md bg-[#005D4C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#004D40] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005D4C] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" />
        {state === "loading" ? "Menghitung…" : "Hitung Ulang Risiko"}
      </button>
      <p role="status" aria-live="polite" className={`text-sm ${state === "error" ? "text-red-600" : "text-slate-500"}`}>
        {msg}
      </p>
    </div>
  );
}
