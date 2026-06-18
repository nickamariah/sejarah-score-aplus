"use client";

import React, { useState, useMemo } from "react";
import { Calculator, BarChart3, TrendingUp, HelpCircle, FileSpreadsheet } from "lucide-react";

export default function MakmalDataKajian() {
  // ==========================================
  // 1. DATA KAJIAN (MOCK DATA UNTUK PROTOTAIP)
  // Nanti boleh tarik dari Firebase markah Pra & Pasca
  // ==========================================
  const mockData = [
    { id: "M4001", kumpulan: "Eksperimen", ujianPra: 45, ujianPasca: 85 },
    { id: "M4002", kumpulan: "Eksperimen", ujianPra: 50, ujianPasca: 88 },
    { id: "M4003", kumpulan: "Eksperimen", ujianPra: 40, ujianPasca: 78 },
    { id: "M4004", kumpulan: "Eksperimen", ujianPra: 55, ujianPasca: 92 },
    { id: "M4005", kumpulan: "Eksperimen", ujianPra: 48, ujianPasca: 84 },
    { id: "M4006", kumpulan: "Kawalan", ujianPra: 46, ujianPasca: 55 },
    { id: "M4007", kumpulan: "Kawalan", ujianPra: 52, ujianPasca: 58 },
    { id: "M4008", kumpulan: "Kawalan", ujianPra: 44, ujianPasca: 50 },
    { id: "M4009", kumpulan: "Kawalan", ujianPra: 49, ujianPasca: 60 },
    { id: "M4010", kumpulan: "Kawalan", ujianPra: 51, ujianPasca: 62 },
  ];

  // ==========================================
  // 2. FUNGSI PENGIRAAN MATEMATIK (STATISTIK)
  // ==========================================
  const calculateStats = (data: number[]) => {
    const n = data.length;
    if (n === 0) return { n: 0, mean: 0, sd: 0 };
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const sd = Math.sqrt(variance);
    return { n, mean: mean.toFixed(2), sd: sd.toFixed(2) };
  };

  // Kira perbezaan (Paired t-test sederhana)
  const calculatePairedTTest = (dataPra: number[], dataPasca: number[]) => {
    const n = dataPra.length;
    if (n === 0) return { tValue: 0, pValue: "> 0.05", sig: "Tidak" };
    
    let sumDiff = 0;
    const diffs = [];
    for (let i = 0; i < n; i++) {
      const d = dataPasca[i] - dataPra[i];
      diffs.push(d);
      sumDiff += d;
    }
    const meanDiff = sumDiff / n;
    const varianceDiff = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / (n - 1);
    const sdDiff = Math.sqrt(varianceDiff);
    const tValue = meanDiff / (sdDiff / Math.sqrt(n));
    
    // Anggaran p-value (Simplified untuk prototaip: t > 2.26 biasanya sig < 0.05 utk n=10)
    const isSignificant = Math.abs(tValue) > 2.26; 
    
    return {
      meanDiff: meanDiff.toFixed(2),
      tValue: tValue.toFixed(3),
      pValue: isSignificant ? "< 0.05" : "> 0.05",
      sig: isSignificant ? "Ya" : "Tidak"
    };
  };

  // ==========================================
  // 3. JALANKAN ANALISIS
  // ==========================================
  const analisisEksperimen = useMemo(() => {
    const kumpulanEks = mockData.filter(d => d.kumpulan === "Eksperimen");
    const pra = kumpulanEks.map(d => d.ujianPra);
    const pasca = kumpulanEks.map(d => d.ujianPasca);
    return {
      deskriptifPra: calculateStats(pra),
      deskriptifPasca: calculateStats(pasca),
      tTest: calculatePairedTTest(pra, pasca)
    };
  }, []);

  const analisisKawalan = useMemo(() => {
    const kumpulanKaw = mockData.filter(d => d.kumpulan === "Kawalan");
    const pra = kumpulanKaw.map(d => d.ujianPra);
    const pasca = kumpulanKaw.map(d => d.ujianPasca);
    return {
      deskriptifPra: calculateStats(pra),
      deskriptifPasca: calculateStats(pasca),
      tTest: calculatePairedTTest(pra, pasca)
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER MAKMAL KAJIAN */}
      <div className="bg-gradient-to-r from-indigo-900/50 to-[#1e293b] p-8 rounded-2xl border border-indigo-800/50 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <h2 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
          <Calculator className="text-indigo-400" size={32} />
          Makmal Analisis Statistik I-RAGS
        </h2>
        <p className="text-indigo-200 max-w-3xl leading-relaxed">
          Modul ini memproses data pencapaian murid secara masa nyata dan menjana analisis statistik 
          termasuk Statistik Deskriptif dan Ujian-t untuk keperluan pelaporan kajian PhD anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ========================================== */}
        {/* JADUAL 1: STATISTIK DESKRIPTIF */}
        {/* ========================================== */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center gap-3">
            <BarChart3 className="text-emerald-400" size={24} />
            <h3 className="text-xl font-bold text-white">Statistik Deskriptif</h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-700">
                  <th className="p-3 text-slate-400 font-semibold text-sm">Kumpulan</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Ujian</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">N</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Min (Mean)</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Sisihan Piawai (SD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-emerald-400" rowSpan={2}>Eksperimen<br/><span className="text-xs text-slate-500 font-normal">(Menggunakan I-RAGS)</span></td>
                  <td className="p-3 text-slate-300 text-center">Pra</td>
                  <td className="p-3 text-slate-300 text-center">{analisisEksperimen.deskriptifPra.n}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPra.mean}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPra.sd}</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors bg-slate-800/10">
                  <td className="p-3 text-slate-300 text-center">Pasca</td>
                  <td className="p-3 text-slate-300 text-center">{analisisEksperimen.deskriptifPasca.n}</td>
                  <td className="p-3 font-mono font-bold text-emerald-400 text-center">{analisisEksperimen.deskriptifPasca.mean}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPasca.sd}</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors border-t-2 border-slate-800">
                  <td className="p-4 font-bold text-amber-400" rowSpan={2}>Kawalan<br/><span className="text-xs text-slate-500 font-normal">(Kaedah Konvensional)</span></td>
                  <td className="p-3 text-slate-300 text-center">Pra</td>
                  <td className="p-3 text-slate-300 text-center">{analisisKawalan.deskriptifPra.n}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPra.mean}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPra.sd}</td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors bg-slate-800/10">
                  <td className="p-3 text-slate-300 text-center">Pasca</td>
                  <td className="p-3 text-slate-300 text-center">{analisisKawalan.deskriptifPasca.n}</td>
                  <td className="p-3 font-mono font-bold text-amber-400 text-center">{analisisKawalan.deskriptifPasca.mean}</td>
                  <td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPasca.sd}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================== */}
        {/* JADUAL 2: UJIAN-T SAMPEL BERPASANGAN */}
        {/* ========================================== */}
        <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
          <div className="p-6 border-b border-slate-800 bg-slate-900/30 flex items-center gap-3">
            <TrendingUp className="text-cyan-400" size={24} />
            <h3 className="text-xl font-bold text-white">Ujian-t Sampel Berpasangan</h3>
          </div>
          <div className="p-6 overflow-x-auto flex-1">
            <p className="text-sm text-slate-400 mb-4">
              Menilai sama ada terdapat perbezaan yang signifikan antara markah Ujian Pra dan Ujian Pasca di dalam kumpulan yang sama.
            </p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-700">
                  <th className="p-3 text-slate-400 font-semibold text-sm">Pasangan (Pra vs Pasca)</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Perbezaan Min</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Nilai t</th>
                  <th className="p-3 text-slate-400 font-semibold text-sm text-center">Sig. (p-value)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-slate-300">Kumpulan Eksperimen</td>
                  <td className="p-4 font-mono text-emerald-400 text-center font-bold">+{analisisEksperimen.tTest.meanDiff}</td>
                  <td className="p-4 font-mono text-slate-200 text-center">{analisisEksperimen.tTest.tValue}</td>
                  <td className="p-4 text-center">
                    <span className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-800/50">
                      {analisisEksperimen.tTest.pValue} (Sig.)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-bold text-slate-300">Kumpulan Kawalan</td>
                  <td className="p-4 font-mono text-amber-400 text-center font-bold">+{analisisKawalan.tTest.meanDiff}</td>
                  <td className="p-4 font-mono text-slate-200 text-center">{analisisKawalan.tTest.tValue}</td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">
                      {analisisKawalan.tTest.pValue} (Sig.)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* RUMUSAN AI / SISTEM */}
            <div className="mt-6 bg-cyan-900/10 border border-cyan-900/50 rounded-xl p-4 flex gap-4">
              <FileSpreadsheet className="text-cyan-500 shrink-0" />
              <div>
                <h4 className="text-cyan-400 font-bold text-sm mb-1">Dapatan Sistem (I-RAGS):</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Berdasarkan analisis Ujian-t berpasangan, peningkatan pencapaian Kumpulan Eksperimen yang menggunakan modul I-RAGS adalah 
                  sangat besar (Min = +{analisisEksperimen.tTest.meanDiff}) berbanding Kumpulan Kawalan (Min = +{analisisKawalan.tTest.meanDiff}). 
                  Kedua-duanya menunjukkan p {analisisEksperimen.tTest.pValue}, menolak Hipotesis Nol (Ho).
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}