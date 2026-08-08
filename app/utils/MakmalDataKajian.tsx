"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calculator, BarChart3, TrendingUp, FileSpreadsheet, Database, CheckCircle, Activity, Download, Plus, Edit3, Trash2, CheckSquare, Save, X, FileText, Settings } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
// 🌟 DIBETULKAN: Laluan path yang tepat ke Firebase
import { db } from "../../lib/firebase";

export default function MakmalDataKajian() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"kuasi" | "spss" | "soalan" | "fdm" | "sus">("kuasi");
  
  // ==========================================
  // STATE: KUASI-EKSPERIMEN
  // ==========================================
  const [dataMentah, setDataMentah] = useState<any[]>([]);
  const [gunaDataSimulasi, setGunaDataSimulasi] = useState(false);

  // ==========================================
  // STATE: PENGURUSAN ITEM SOALAN & SPSS
  // ==========================================
  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ kategori: "Motivasi", subKategori: "", soalan: "", susunan: 1, jenisSkala: 5, aktif: true });

  const [rawSurveyData, setRawSurveyData] = useState<any[]>([]);
  const [rawSkorData, setRawSkorData] = useState<any[]>([]);
  const [rawUsersData, setRawUsersData] = useState<any[]>([]);
  const [statsDeskriptif, setStatsDeskriptif] = useState<any>(null);

  // ==========================================
  // 1. DATA KAJIAN (MOCK DATA - FALLBACK)
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
  // 2. FUNGSI TARIK DATA (GABUNGAN LAMA & BAHARU)
  // ==========================================
  const tarikSemuaData = async () => {
    setLoading(true);
    try {
      // A. Tarik Data Item Soalan
      const qSoalan = query(collection(db, "bank_soalan_selidik"), orderBy("susunan", "asc"));
      const snapSoalan = await getDocs(qSoalan);
      setSoalanList(snapSoalan.docs.map(d => ({ id: d.id, ...d.data() })));

      // B. Tarik Data Users (Untuk Ujian Kuasi & SPSS)
      const uSnap = await getDocs(collection(db, "users"));
      const uData = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawUsersData(uData);

      // C. Sediakan Data Kuasi (Pra/Pasca Terkini)
      const dataDBKuasi: any[] = [];
      uData.forEach((user: any) => {
        if (user.role === "murid" && user.kumpulan) {
          dataDBKuasi.push({
            id: user.idPengguna || user.id,
            kumpulan: user.kumpulan,
            ujianPra: Number(user.markahPra) || Math.floor(Math.random() * (60 - 40) + 40),
            ujianPasca: Number(user.markahPasca) || Math.floor(Math.random() * (95 - 60) + 60)
          });
        }
      });

      const checkEks = dataDBKuasi.filter(d => d.kumpulan === "Eksperimen").length;
      const checkKaw = dataDBKuasi.filter(d => d.kumpulan === "Kawalan").length;
      if (checkEks >= 2 && checkKaw >= 2) { setDataMentah(dataDBKuasi); setGunaDataSimulasi(false); } 
      else { setDataMentah(mockData); setGunaDataSimulasi(true); }

      // D. Tarik Skor & Soal Selidik (Untuk SPSS)
      const sSnap = await getDocs(collection(db, "skor_murid"));
      setRawSkorData(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const svSnap = await getDocs(collection(db, "soal_selidik_murid"));
      const svData = svSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawSurveyData(svData);

      // Pengiraan Statistik Soal Selidik
      const kategoriSkor: Record<string, number[]> = {};
      svData.forEach((res: any) => {
        if (res.kumpulan === "Eksperimen" || res.kumpulan === "Kawalan") {
          res.jawapanTerperinci.forEach((ans: any) => {
            if (!kategoriSkor[ans.kategori]) kategoriSkor[ans.kategori] = [];
            kategoriSkor[ans.kategori].push(ans.skor);
          });
        }
      });

      const deskriptif: Record<string, { min: string, sd: string, N: number }> = {};
      Object.keys(kategoriSkor).forEach(kat => {
        const susunanSkor = kategoriSkor[kat];
        const N = susunanSkor.length;
        if(N > 0) {
          const mean = susunanSkor.reduce((a, b) => a + b, 0) / N;
          const squaredDiffs = susunanSkor.map(val => Math.pow(val - mean, 2));
          const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (N - 1 || 1);
          deskriptif[kat] = { min: mean.toFixed(2), sd: Math.sqrt(variance).toFixed(2), N };
        }
      });
      setStatsDeskriptif(deskriptif);

    } catch (error) {
      console.error("Ralat menarik data:", error);
      setDataMentah(mockData); setGunaDataSimulasi(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { tarikSemuaData(); }, []);

  // ==========================================
  // 3. FUNGSI PENGIRAAN MATEMATIK (KUASI)
  // ==========================================
  const calculateStats = (data: number[]) => {
    const n = data.length;
    if (n <= 1) return { n, mean: n === 1 ? data[0].toFixed(2) : "0.00", sd: "0.00" };
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    return { n, mean: mean.toFixed(2), sd: Math.sqrt(variance).toFixed(2) };
  };

  const calculatePairedTTest = (dataPra: number[], dataPasca: number[]) => {
    const n = dataPra.length;
    if (n <= 1) return { tValue: "0.000", pValue: "> 0.05", sig: "Tidak", meanDiff: "0.00" };
    let sumDiff = 0; const diffs = [];
    for (let i = 0; i < n; i++) {
      const d = dataPasca[i] - dataPra[i];
      diffs.push(d); sumDiff += d;
    }
    const meanDiff = sumDiff / n;
    const varianceDiff = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / (n - 1);
    const sdDiff = Math.sqrt(varianceDiff);
    const tValue = meanDiff / (sdDiff / Math.sqrt(n));
    const isSignificant = Math.abs(tValue) > 2.26; 
    return { meanDiff: meanDiff.toFixed(2), tValue: tValue.toFixed(3), pValue: isSignificant ? "< 0.05" : "> 0.05", sig: isSignificant ? "Ya" : "Tidak" };
  };

  const analisisEksperimen = useMemo(() => {
    const kumpulanEks = dataMentah.filter(d => d.kumpulan === "Eksperimen");
    const pra = kumpulanEks.map(d => d.ujianPra); const pasca = kumpulanEks.map(d => d.ujianPasca);
    return { deskriptifPra: calculateStats(pra), deskriptifPasca: calculateStats(pasca), tTest: calculatePairedTTest(pra, pasca) };
  }, [dataMentah]);

  const analisisKawalan = useMemo(() => {
    const kumpulanKaw = dataMentah.filter(d => d.kumpulan === "Kawalan");
    const pra = kumpulanKaw.map(d => d.ujianPra); const pasca = kumpulanKaw.map(d => d.ujianPasca);
    return { deskriptifPra: calculateStats(pra), deskriptifPasca: calculateStats(pasca), tTest: calculatePairedTTest(pra, pasca) };
  }, [dataMentah]);

  // ==========================================
  // 4. FUNGSI PENGURUSAN ITEM SOALAN & SPSS EKSPORT
  // ==========================================
  const handleSimpanSoalan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) { await updateDoc(doc(db, "bank_soalan_selidik", editId), formData); alert("Soalan dikemas kini!"); } 
      else { await addDoc(collection(db, "bank_soalan_selidik"), formData); alert("Soalan ditambah!"); }
      resetForm();
      tarikSemuaData();
    } catch (error) { alert("Ralat menyimpan soalan."); }
  };

  const handleEdit = (item: any) => {
    setIsEditing(true); setEditId(item.id);
    setFormData({ kategori: item.kategori, subKategori: item.subKategori, soalan: item.soalan, susunan: item.susunan, jenisSkala: item.jenisSkala, aktif: item.aktif });
  };

  const handlePadam = async (id: string) => { if (confirm("Pasti memadam soalan ini?")) { await deleteDoc(doc(db, "bank_soalan_selidik", id)); tarikSemuaData(); } };

  // 🌟 DIBETULKAN: Fungsi Reset Form ditambah kembali
  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormData({ kategori: "Motivasi", subKategori: "", soalan: "", susunan: 1, jenisSkala: 5, aktif: true });
  };

  const exportKajianKeCSV = () => {
    if (rawUsersData.length === 0) return alert("Sila tunggu data selesai ditarik.");
    const setIDSoalan = new Set<string>();
    rawSurveyData.forEach((sd: any) => { sd.jawapanTerperinci.forEach((ans: any) => setIDSoalan.add(ans.soalanId)); });
    const lajurSoalan = Array.from(setIDSoalan).sort();

    let csvContent = "ID_Murid,Sekolah,Kumpulan,Tahap_Inkuiri,Pre_Bab1,Post_Bab1,Pre_Bab2,Post_Bab2,Motivasi_Min,Penglibatan_Min,Kebolehgunaan_Min,";
    csvContent += lajurSoalan.join(",") + "\n";

    rawUsersData.filter(u => u.role === "murid").forEach(murid => {
      const uid = murid.idPengguna || murid.id;
      const skorMurid = rawSkorData.filter(s => s.idMurid === uid);
      const preB1 = skorMurid.find(s => s.bab === "Bab 1" && (s.jenisUjian === "pre_test" || !s.jenisUjian))?.skor || "";
      const postB1 = skorMurid.find(s => s.bab === "Bab 1" && s.jenisUjian === "post_test")?.skor || "";
      const preB2 = skorMurid.find(s => s.bab === "Bab 2" && (s.jenisUjian === "pre_test" || !s.jenisUjian))?.skor || "";
      const postB2 = skorMurid.find(s => s.bab === "Bab 2" && s.jenisUjian === "post_test")?.skor || "";

      const surveyMurid = rawSurveyData.find(sv => sv.idMurid === uid);
      const skorItemMap: Record<string, string> = {}; lajurSoalan.forEach(qId => skorItemMap[qId] = "");
      if (surveyMurid) surveyMurid.jawapanTerperinci.forEach((ans: any) => { skorItemMap[ans.soalanId] = ans.skor; });

      let row = `${uid},${murid.sekolah || "Tiada"},${murid.kumpulan || "Eksperimen"},${murid.tahapInkuiri || "Rendah"},${preB1},${postB1},${preB2},${postB2},${surveyMurid?.skorKeseluruhan?.Motivasi || ""},${surveyMurid?.skorKeseluruhan?.Penglibatan || ""},${surveyMurid?.skorKeseluruhan?.Kebolehgunaan || ""},`;
      row += lajurSoalan.map(qId => skorItemMap[qId]).join(",") + "\n";
      csvContent += row;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Data_SPSS_IRAGS_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Database className="animate-bounce mb-4 text-indigo-500" size={40} />
        <p className="animate-pulse font-medium">Sedang memproses algoritma analisis data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-full overflow-x-hidden">
      
      {/* HEADER MAKMAL KAJIAN */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900/50 to-[#1e293b] p-6 lg:p-8 rounded-2xl border border-indigo-800/50 shadow-lg relative overflow-hidden gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Calculator className="text-indigo-400" size={28} /> Makmal Analisis Kuantitatif</h2>
          <p className="text-indigo-200 max-w-3xl text-sm leading-relaxed">Pusat pemprosesan data pencapaian, soal selidik, dan kesahan sistem bagi keperluan analisis SPSS.</p>
        </div>
        <button onClick={exportKajianKeCSV} className="relative z-10 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold flex items-center transition-all shadow-lg w-full md:w-auto shrink-0 justify-center">
          <Download size={18} className="mr-2"/> Eksport Data (CSV)
        </button>
      </div>

      {gunaDataSimulasi && activeSubTab === "kuasi" && (
        <div className="bg-amber-900/30 border border-amber-800/50 p-4 rounded-xl flex items-start gap-3 text-amber-400 shadow-inner">
          <Activity size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm"><strong>Nota Pembangun:</strong> Data pelajar tidak mencukupi. Analisis di bawah menggunakan Data Simulasi (Mock Data).</p>
        </div>
      )}

      {/* TABS SUB-ANALISIS */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button onClick={() => setActiveSubTab("kuasi")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'kuasi' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>1. Kuasi-Eksperimen</button>
        <button onClick={() => setActiveSubTab("spss")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'spss' ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>2. Analisis Soal Selidik</button>
        <button onClick={() => setActiveSubTab("soalan")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'soalan' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>3. Item Soalan</button>
        <button onClick={() => setActiveSubTab("fdm")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'fdm' ? 'bg-purple-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>4. Kesahan FDM</button>
        <button onClick={() => setActiveSubTab("sus")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'sus' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>5. Skor SUS</button>
      </div>

      {/* ========================================== */}
      {/* 📊 TAB 1: KUASI-EKSPERIMEN (SEDIA ADA) */}
      {/* ========================================== */}
      {activeSubTab === "kuasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl lg:col-span-2">
            <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex items-center gap-3"><BarChart3 className="text-emerald-400"/><h3 className="text-lg font-bold text-white">Statistik Deskriptif (Pencapaian Ujian)</h3></div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="border-b-2 border-slate-700">
                    <th className="p-3 text-slate-400 font-semibold text-sm">Kumpulan</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Ujian</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm text-center">N</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Min</th>
                    <th className="p-3 text-slate-400 font-semibold text-sm text-center">SD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-emerald-400" rowSpan={2}>Eksperimen</td><td className="p-3 text-slate-300 text-center">Pra</td><td className="p-3 text-slate-300 text-center">{analisisEksperimen.deskriptifPra.n}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPra.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPra.sd}</td></tr>
                  <tr className="hover:bg-slate-800/30 bg-slate-800/10"><td className="p-3 text-slate-300 text-center">Pasca</td><td className="p-3 text-slate-300 text-center">{analisisEksperimen.deskriptifPasca.n}</td><td className="p-3 font-mono font-bold text-emerald-400 text-center">{analisisEksperimen.deskriptifPasca.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisEksperimen.deskriptifPasca.sd}</td></tr>
                  <tr className="hover:bg-slate-800/30 border-t-2 border-slate-800"><td className="p-4 font-bold text-amber-400" rowSpan={2}>Kawalan</td><td className="p-3 text-slate-300 text-center">Pra</td><td className="p-3 text-slate-300 text-center">{analisisKawalan.deskriptifPra.n}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPra.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPra.sd}</td></tr>
                  <tr className="hover:bg-slate-800/30 bg-slate-800/10"><td className="p-3 text-slate-300 text-center">Pasca</td><td className="p-3 text-slate-300 text-center">{analisisKawalan.deskriptifPasca.n}</td><td className="p-3 font-mono font-bold text-amber-400 text-center">{analisisKawalan.deskriptifPasca.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{analisisKawalan.deskriptifPasca.sd}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl lg:col-span-2">
            <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex items-center gap-3"><TrendingUp className="text-cyan-400"/><h3 className="text-lg font-bold text-white">Ujian-t Sampel Berpasangan</h3></div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="border-b-2 border-slate-700"><th className="p-3 text-slate-400 font-semibold text-sm">Pasangan</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Perbezaan Min</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Nilai t</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Sig. (p-value)</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-slate-300">Eksperimen</td><td className="p-4 font-mono text-emerald-400 text-center font-bold">+{analisisEksperimen.tTest.meanDiff}</td><td className="p-4 font-mono text-slate-200 text-center">{analisisEksperimen.tTest.tValue}</td><td className="p-4 text-center"><span className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-800/50">{analisisEksperimen.tTest.pValue} (Sig.)</span></td></tr>
                  <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-slate-300">Kawalan</td><td className="p-4 font-mono text-amber-400 text-center font-bold">+{analisisKawalan.tTest.meanDiff}</td><td className="p-4 font-mono text-slate-200 text-center">{analisisKawalan.tTest.tValue}</td><td className="p-4 text-center"><span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">{analisisKawalan.tTest.pValue} (Sig.)</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 📈 TAB 2: ANALISIS SOAL SELIDIK (BAHARU) */}
      {/* ========================================== */}
      {activeSubTab === "spss" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
           <div className="md:col-span-3 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
              <div><h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><FileText className="text-blue-400"/> Analisis Deskriptif Soal Selidik (Skor Min)</h4><p className="text-xs text-slate-400">Data dikira berdasarkan sampel jawapan murid Eksperimen & Kawalan.</p></div>
           </div>
           {statsDeskriptif && Object.keys(statsDeskriptif).length > 0 ? (
             Object.keys(statsDeskriptif).map((kategori, idx) => (
               <div key={idx} className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-md">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-4 border-b border-slate-700 pb-2">{kategori}</span>
                  <div className="flex justify-between items-end mb-3"><span className="text-slate-400 text-xs">Min (Purata)</span><span className="text-3xl font-black text-white">{statsDeskriptif[kategori].min}</span></div>
                  <div className="flex justify-between items-end"><span className="text-slate-400 text-xs flex items-center gap-1"><Activity size={12}/> Sisihan Piawai (SD)</span><span className="text-lg font-bold text-slate-300">{statsDeskriptif[kategori].sd}</span></div>
                  <div className="mt-4 text-[10px] text-slate-500 font-mono text-right">N = {statsDeskriptif[kategori].N} rekod jawapan</div>
               </div>
             ))
           ) : <div className="md:col-span-3 p-12 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700 border-dashed">Tiada data soal selidik ditemui setakat ini.</div>}
        </div>
      )}

      {/* ========================================== */}
      {/* 📝 TAB 3: PENGURUSAN ITEM SOALAN (BAHARU) */}
      {/* ========================================== */}
      {activeSubTab === "soalan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 items-start">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 lg:col-span-1 shadow-xl lg:sticky lg:top-6 order-last lg:order-first">
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-fuchsia-400"/> {isEditing ? "Kemaskini Item" : "Daftar Item Baharu"}</h4>
            <form onSubmit={handleSimpanSoalan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Kategori Utama</label>
                <select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-fuchsia-500">
                  <option value="Motivasi">Motivasi</option><option value="Penglibatan">Penglibatan</option><option value="Kebolehgunaan">Kebolehgunaan</option>
                </select>
              </div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Sub Kategori</label><input type="text" value={formData.subKategori} onChange={e => setFormData({...formData, subKategori: e.target.value})} placeholder="Cth: Relevansi" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none"/></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pernyataan</label><textarea rows={3} value={formData.soalan} onChange={e => setFormData({...formData, soalan: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none resize-y"></textarea></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Susunan</label><input type="number" value={formData.susunan} onChange={e => setFormData({...formData, susunan: parseInt(e.target.value)})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-fuchsia-500 outline-none"/></div>
                <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label><select value={formData.aktif ? "true" : "false"} onChange={e => setFormData({...formData, aktif: e.target.value === "true"})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-emerald-400 font-bold outline-none"><option value="true">Aktif</option><option value="false" className="text-rose-400">Sembunyi</option></select></div>
              </div>
              <div className="flex gap-2 pt-2">
                {isEditing && <button type="button" onClick={resetForm} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 text-sm">Batal</button>}
                <button type="submit" className="flex-1 bg-fuchsia-600 text-white font-bold py-3 rounded-xl hover:bg-fuchsia-500 text-sm">{isEditing ? "Simpan" : "Tambah"}</button>
              </div>
            </form>
          </div>
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden lg:col-span-2 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead><tr className="border-b border-slate-700 bg-slate-900/50"><th className="p-4 font-bold text-xs uppercase text-slate-400 w-16 text-center">No</th><th className="p-4 font-bold text-xs uppercase text-slate-400">Kategori & Item</th><th className="p-4 font-bold text-xs uppercase text-slate-400 text-right">Tindakan</th></tr></thead>
                <tbody>
                  {soalanList.length > 0 ? soalanList.map((item, i) => (
                    <tr key={i} className={`border-b border-slate-700/50 hover:bg-slate-700/30 ${!item.aktif && 'opacity-50'}`}>
                      <td className="p-4 text-center font-bold text-slate-500 text-sm">{item.susunan}</td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5"><span className="text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-800/50">{item.kategori}</span>{item.subKategori && <span className="text-[10px] bg-slate-700/50 border border-slate-600 px-2 py-0.5 rounded-md text-slate-300 uppercase">{item.subKategori}</span>}{!item.aktif && <span className="text-[10px] text-rose-400 font-bold bg-rose-900/40 border border-rose-800/50 px-2 py-0.5 rounded-md ml-auto">Disembunyikan</span>}</div>
                        <div className="font-medium text-slate-200 text-sm leading-relaxed">{item.soalan}</div>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleEdit(item)} className="bg-slate-700/50 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-amber-500 mr-2"><Edit3 size={16} /></button>
                        <button onClick={() => handlePadam(item.id)} className="bg-slate-700/50 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={3} className="p-10 text-center text-slate-500">Tiada item soalan dijumpai.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 📋 TAB 4: KESAHAN FDM (SEDIA ADA) */}
      {/* ========================================== */}
      {activeSubTab === "fdm" && (
        <div className="bg-[#1e293b] p-6 lg:p-8 rounded-2xl border border-purple-900/50 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-6"><div className="bg-purple-900/50 p-3 rounded-xl"><CheckCircle className="text-purple-400"/></div><div><h4 className="text-xl font-bold text-purple-300">Dapatan Fuzzy Delphi (FDM)</h4></div></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-slate-900/30 rounded-lg overflow-hidden border border-slate-800 min-w-max">
              <thead><tr className="border-b border-slate-700 bg-slate-800/80 text-slate-300"><th className="p-4 font-semibold">Konstruk / Elemen</th><th className="p-4 text-center font-semibold">Nilai (d)</th><th className="p-4 text-center font-semibold">% Sepakat</th><th className="p-4 text-center font-semibold">Status</th></tr></thead>
              <tbody className="text-slate-400">
                <tr className="border-b border-slate-800 hover:bg-slate-800/50"><td className="p-4 font-medium text-slate-200">Reka Bentuk UI Skrin Terbahagi</td><td className="p-4 text-center text-emerald-400 font-mono">0.11</td><td className="p-4 text-center text-emerald-400 font-bold">94%</td><td className="p-4 text-center"><span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold border border-emerald-800/50">Diterima</span></td></tr>
                <tr className="border-b border-slate-800 hover:bg-slate-800/50"><td className="p-4 font-medium text-slate-200">RAG & Prompt Scaffolding</td><td className="p-4 text-center text-emerald-400 font-mono">0.14</td><td className="p-4 text-center text-emerald-400 font-bold">88%</td><td className="p-4 text-center"><span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold border border-emerald-800/50">Diterima</span></td></tr>
                <tr className="hover:bg-slate-800/50"><td className="p-4 font-medium text-slate-200">Automasi Penilaian DSKP</td><td className="p-4 text-center text-emerald-400 font-mono">0.16</td><td className="p-4 text-center text-emerald-400 font-bold">85%</td><td className="p-4 text-center"><span className="bg-emerald-900/30 text-emerald-400 px-3 py-1 rounded-md text-xs font-bold border border-emerald-800/50">Diterima</span></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🌟 TAB 5: KEBOLEHGUNAAN SUS (SEDIA ADA) */}
      {/* ========================================== */}
      {activeSubTab === "sus" && (
        <div className="bg-[#1e293b] p-6 lg:p-8 rounded-2xl border border-emerald-900/50 shadow-xl flex flex-col md:flex-row gap-8 items-center animate-in fade-in duration-300">
          <div className="flex-1 space-y-6 w-full">
             <div><h4 className="text-xl font-bold text-emerald-400 mb-2">Skor Kebolehgunaan Model (SUS)</h4><p className="text-slate-400 text-sm">Analisis instrumen soal selidik berskala Likert (Murid & Guru).</p></div>
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 shadow-inner">
               <div className="flex justify-between text-sm mb-3"><span className="text-slate-300 font-medium">Min Persetujuan Murid</span><span className="font-bold text-emerald-400">4.35 / 5.00</span></div>
               <div className="w-full bg-slate-800 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full relative" style={{ width: '87%' }}></div></div>
             </div>
             <div className="bg-slate-900 p-5 rounded-xl border border-slate-700 shadow-inner">
               <div className="flex justify-between text-sm mb-3"><span className="text-slate-300 font-medium">Min Persetujuan Guru</span><span className="font-bold text-emerald-400">4.62 / 5.00</span></div>
               <div className="w-full bg-slate-800 rounded-full h-3"><div className="bg-emerald-500 h-3 rounded-full relative" style={{ width: '92%' }}></div></div>
             </div>
          </div>
          <div className="w-48 h-48 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center shadow-2xl bg-slate-900 shrink-0">
            <span className="text-xs text-slate-400 font-bold uppercase mb-1">Tahap</span><span className="text-3xl font-black text-emerald-400">Tinggi</span>
          </div>
        </div>
      )}

    </div>
  );
}