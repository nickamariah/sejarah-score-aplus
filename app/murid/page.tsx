"use client";

import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Sparkles, Map, Trophy, BookOpen, CheckCircle2 } from "lucide-react";

const radarData = [
  { subject: "Pemahaman", A: 88, fullMark: 100 },
  { subject: "Tarikh", A: 82, fullMark: 100 },
  { subject: "Analisis", A: 76, fullMark: 100 },
  { subject: "Kefahaman", A: 90, fullMark: 100 },
  { subject: "Kreativiti", A: 72, fullMark: 100 },
];

const masteryPath = [
  { step: "Pengenalan Zaman", progress: "Sedia" },
  { step: "Kesultanan Melayu", progress: "Dalam Proses" },
  { step: "Perang Dunia", progress: "Belum Mula" },
  { step: "Kemerdekaan", progress: "Belum Mula" },
];

export default function CheerfulDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8 font-sans text-slate-900">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 text-4xl font-bold text-white shadow-xl">
                S
n              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Selamat datang,</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-950">Siti Nurul</h1>
                <p className="mt-1 text-slate-500">Dashboard Murid Sejarah Score A+</p>
              </div>
            </div>
            <div className="rounded-3xl bg-amber-50 p-5 text-amber-950 shadow-inner shadow-amber-100/70">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Skor Terkini
              </div>
              <p className="mt-3 text-5xl font-bold">92%</p>
              <p className="text-sm text-slate-600">Keceriaan & kemajuan tinggi</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Radar Kemahiran</p>
                <h2 className="mt-3 text-2xl font-semibold text-slate-950">Prestasi Sejarah</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
                <Trophy className="h-4 w-4 text-amber-500" /> Top 14%
              </div>
            </div>
            <div className="mt-8 h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" stroke="#475569" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Skor" dataKey="A" stroke="#0f172a" fill="#0f172a" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <aside className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-slate-100 p-4 text-slate-700 shadow-sm">
                <Map className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Peta Laluan</p>
                <h2 className="text-2xl font-semibold text-slate-950">Mastery Path</h2>
              </div>
            </div>
            <div className="space-y-4">
              {masteryPath.map((item) => (
                <div key={item.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.step}</p>
                      <p className="mt-1 text-sm text-slate-500">Langkah seterusnya dalam perjalananmu</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.progress === "Dalam Proses" ? "bg-amber-100 text-amber-700" : item.progress === "Sedia" ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                      {item.progress}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-3xl bg-slate-950 p-6 text-slate-50 shadow-lg">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-cyan-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200">Cadangan seterusnya</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-200">
                Baca nota bab Kemerdekaan dan lengkapkan kuiz mini untuk naik tahap penguasaan. Skor tambahan akan membantu anda mencapai status A+.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Tambah kepada rutin pembelajaran harian</span>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
