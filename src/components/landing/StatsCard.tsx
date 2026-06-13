"use client";

import { m, useReducedMotion } from "motion/react";
import { School, Users, MapPin } from "lucide-react";

const stats = [
  {
    id: "sekolah",
    icon: <School className="w-5 h-5 text-[#005D4C]" />,
    circleColor: "bg-teal-50 border border-teal-100/80",
    value: "12.826",
    label: "Sekolah Terpantau",
    subtext: "Data terintegrasi dari seluruh provinsi.",
    lineColor: "bg-[#005D4C]",
  },
  {
    id: "siswa",
    icon: <Users className="w-5 h-5 text-blue-600" />,
    circleColor: "bg-blue-50 border border-blue-100/80",
    value: "3,2 Juta",
    label: "Siswa Dipantau",
    subtext: "Absensi, nilai, dan data sekolah terdeteksi.",
    lineColor: "bg-blue-600",
  },
  {
    id: "daerah",
    icon: <MapPin className="w-5 h-5 text-red-500" />,
    circleColor: "bg-red-50 border border-red-100/80",
    value: "514",
    label: "Kabupaten/Kota",
    subtext: "Jangkauan sistem di seluruh Indonesia.",
    lineColor: "bg-red-500",
  },
];

export default function StatsCard() {
  const reduce = useReducedMotion();
  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-30 mt-2 lg:mt-0">
      <m.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-md shadow-slate-200/50 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="lg:col-span-4 p-3 sm:p-4 flex flex-col justify-center bg-slate-50/60">
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#005D4C] tracking-wide uppercase mb-2 font-mono">
                <span className="h-px w-4 bg-[#005D4C]/40" aria-hidden="true" />
                Indonesia dalam Angka
              </span>
              <h2 className="font-display font-bold text-[13px] sm:text-sm text-slate-900 leading-snug tracking-tight">
                Data hari ini, menentukan masa depan mereka esok hari.
              </h2>
            </div>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {stats.map((stat) => (
              <div key={stat.id} className="p-3 sm:p-4 flex flex-col justify-between hover:bg-slate-50/60 transition-colors duration-150 group">
                <div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.circleColor}`}>
                    {stat.icon}
                  </div>
                  <div className="flex items-baseline mb-0.5">
                    <span className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight transition-colors duration-150 group-hover:text-[#005D4C]">
                      {stat.value}
                    </span>
                  </div>
                  <h3 className="font-sans font-bold text-[11px] text-slate-800 mb-0.5">{stat.label}</h3>
                  <p className="font-sans text-[11px] text-slate-600 leading-relaxed">{stat.subtext}</p>
                </div>
                <div className="mt-2">
                  <div className={`w-7 h-[3px] rounded-full ${stat.lineColor} opacity-80 group-hover:w-12 transition-all duration-150`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </m.div>

      <p className="mt-3 text-center text-[11px] text-slate-500">
        *Angka ilustratif untuk demo — bukan data operasional.
      </p>
    </div>
  );
}
