"use client";

import { Reveal } from "./Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
}

/** Heading section konsisten — Accessible & Ethical (Lexend, kontras tinggi). */
export function SectionHeading({ eyebrow, title, desc, align = "center", tone = "light" }: Props) {
  const isDark = tone === "dark";
  return (
    <Reveal
      className={`${align === "center" ? "mx-auto text-center max-w-3xl" : "max-w-2xl text-left"} mb-14`}
    >
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wide mb-4 ${
            isDark ? "text-emerald-300" : "text-[#005D4C]"
          } ${align === "center" ? "justify-center" : ""}`}
        >
          <span className={`h-px w-6 ${isDark ? "bg-emerald-300/60" : "bg-[#005D4C]/40"}`} aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2
        className={`font-display font-bold text-[2rem] sm:text-[2.5rem] leading-[1.15] tracking-tight ${
          isDark ? "text-white" : "text-[#0F172A]"
        }`}
      >
        {title}
      </h2>
      {desc && (
        <p
          className={`mt-4 text-base sm:text-lg leading-relaxed ${
            isDark ? "text-teal-50/90" : "text-slate-600"
          }`}
        >
          {desc}
        </p>
      )}
    </Reveal>
  );
}
