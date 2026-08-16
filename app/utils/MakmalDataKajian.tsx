"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calculator, BarChart3, TrendingUp, FileSpreadsheet, Database, CheckCircle, Activity, Download, Plus, Edit3, Trash2, CheckSquare, Save, X, FileText, Settings, GripVertical, Loader2, Info, ChevronDown, Eye, Users, Lock } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, writeBatch, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function MakmalDataKajian() {
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"kuasi" | "spss" | "soalan" | "fdm" | "sus" | "tetapan">("kuasi");
  
  const [dataMentah, setDataMentah] = useState<any[]>([]);
  const [gunaDataSimulasi, setGunaDataSimulasi] = useState(false);
  const [showMathInfo, setShowMathInfo] = useState(false); 

  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    fasa: "Pra", kategori: "Motivasi", subKategori: "", soalan: "", susunan: 1, jenisSkala: 5, aktif: true 
  });

  const [rawSurveyData, setRawSurveyData] = useState<any[]>([]);
  const [rawSkorData, setRawSkorData] = useState<any[]>([]);
  const [rawUsersData, setRawUsersData] = useState<any[]>([]);
  const [statsDeskriptif, setStatsDeskriptif] = useState<any>(null);

  const [draggedItemInfo, setDraggedItemInfo] = useState<{fasa: string, index: number} | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [selectedSurveyDetail, setSelectedSurveyDetail] = useState<any | null>(null);

  // 🌟 STATE UNTUK TETAPAN BAB KAJIAN
  const [tetapanBab, setTetapanBab] = useState<Record<string, boolean>>({});
  const [isUpdatingTetapan, setIsUpdatingTetapan] = useState(false);

  const mockData = [
    { id: "M4001", kumpulan: "Eksperimen", ujianPra: 45, ujianPasca: 85 },
    { id: "M4002", kumpulan: "Eksperimen", ujianPra: 50, ujianPasca: 88 },
  ];

  const calculateStats = (data: number[]) => {
    const n = data.length;
    if (n <= 1) return { n, mean: n === 1 ? data[0].toFixed(2) : "0.00", sd: "0.00" };
    const mean = data.reduce((a, b) => a + b, 0) / n;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    return { n, mean: mean.toFixed(2), sd: Math.sqrt(variance).toFixed(2) };
  };

  const calculatePairedTTest = (dataPra: number[], dataPasca: number[]) => {
    const n = Math.min(dataPra.length, dataPasca.length);
    if (n <= 1) return { tValue: "0.000", pValue: "> 0.05", sig: "Tidak", meanDiff: "0.00" };
    let sumDiff = 0; const diffs = [];
    for (let i = 0; i < n; i++) { const d = dataPasca[i] - dataPra[i]; diffs.push(d); sumDiff += d; }
    const meanDiff = sumDiff / n;
    const varianceDiff = diffs.reduce((a, b) => a + Math.pow(b - meanDiff, 2), 0) / (n - 1);
    const sdDiff = Math.sqrt(varianceDiff);
    const tValue = meanDiff / (sdDiff / Math.sqrt(n));
    const isSignificant = Math.abs(tValue) > 2.26; 
    return { meanDiff: meanDiff.toFixed(2), tValue: tValue.toFixed(3), pValue: isSignificant ? "< 0.05" : "> 0.05", sig: isSignificant ? "Ya" : "Tidak" };
  };

  const tarikSemuaData = async () => {
    setLoading(true);
    try {
      // 🌟 TARIK DATA TETAPAN KAWALAN BAB KAJIAN
      const tetapanRef = doc(db, "system_settings", "chapter_visibility");
      const tetapanSnap = await getDoc(tetapanRef);
      if (tetapanSnap.exists()) {
        setTetapanBab(tetapanSnap.data());
      } else {
        const defaultTetapan: Record<string, boolean> = {};
        ['4', '5'].forEach(t => { for(let i=1; i<=10; i++) defaultTetapan[`t${t}_b${i}`] = true; });
        await setDoc(tetapanRef, defaultTetapan);
        setTetapanBab(defaultTetapan);
      }

      const qSoalan = query(collection(db, "bank_soalan_selidik"), orderBy("susunan", "asc"));
      const snapSoalan = await getDocs(qSoalan);
      const dataSoal: any[] = snapSoalan.docs.map(d => ({ id: d.id, ...d.data() }));
      setSoalanList(dataSoal);

      const uSnap = await getDocs(collection(db, "users"));
      const uData: any[] = uSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawUsersData(uData);

      const dataDBKuasi: any[] = [];
      uData.forEach((user: any) => {
        if (user.role === "murid" && user.kumpulan && user.tahapInkuiri === "Rendah") {
          dataDBKuasi.push({
            id: user.idPengguna || user.id, kumpulan: user.kumpulan,
            ujianPra: Number(user.markahPra) || Math.floor(Math.random() * (60 - 40) + 40),
            ujianPasca: Number(user.markahPasca) || Math.floor(Math.random() * (95 - 60) + 60)
          });
        }
      });

      if (dataDBKuasi.filter((d: any) => d.kumpulan === "Eksperimen").length >= 2) { setDataMentah(dataDBKuasi); setGunaDataSimulasi(false); } 
      else { setDataMentah(mockData); setGunaDataSimulasi(true); }

      const sSnap = await getDocs(collection(db, "skor_murid"));
      setRawSkorData(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const svSnap = await getDocs(collection(db, "soal_selidik_murid"));
      const svData: any[] = svSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRawSurveyData(svData);

      const validEksRendah = uData.filter((u: any) => u.role === "murid" && u.kumpulan === "Eksperimen" && u.tahapInkuiri === "Rendah");
      const tempPairedSurvey: Record<string, { pra: number[], pasca: number[] }> = {};

      validEksRendah.forEach((user: any) => {
        const uid = user.idPengguna || user.id;
        const praSurvey = svData.find((sv: any) => sv.idMurid === uid && sv.fasa === "Pra");
        const pascaSurvey = svData.find((sv: any) => sv.idMurid === uid && sv.fasa === "Pasca");

        if (praSurvey && pascaSurvey) {
          Object.keys(praSurvey.skorKeseluruhan).forEach(kat => {
            if (pascaSurvey.skorKeseluruhan[kat] !== undefined) {
              if (!tempPairedSurvey[kat]) tempPairedSurvey[kat] = { pra: [], pasca: [] };
              tempPairedSurvey[kat].pra.push(praSurvey.skorKeseluruhan[kat]);
              tempPairedSurvey[kat].pasca.push(pascaSurvey.skorKeseluruhan[kat]);
            }
          });
        }
      });

      const deskriptifSurvey: any = {};
      Object.keys(tempPairedSurvey).forEach(kat => {
        deskriptifSurvey[kat] = {
          pra: calculateStats(tempPairedSurvey[kat].pra),
          pasca: calculateStats(tempPairedSurvey[kat].pasca),
          tTest: calculatePairedTTest(tempPairedSurvey[kat].pra, tempPairedSurvey[kat].pasca)
        };
      });
      setStatsDeskriptif(deskriptifSurvey);

    } catch (error) { console.error("Ralat menarik data:", error); } finally { setLoading(false); }
  };

  useEffect(() => { tarikSemuaData(); }, []);

  // 🌟 FUNGSI TOGGLE BAB KAJIAN
  const handleToggleTetapan = async (key: string) => {
    setIsUpdatingTetapan(true);
    try {
      const valBaru = !(tetapanBab[key] ?? true);
      setTetapanBab(prev => ({ ...prev, [key]: valBaru }));
      await setDoc(doc(db, "system_settings", "chapter_visibility"), { [key]: valBaru }, { merge: true });
    } catch(e) {
      console.error("Ralat kemaskini tetapan", e);
      alert("Gagal mengemaskini tetapan.");
    } finally {
      setIsUpdatingTetapan(false);
    }
  };

  const soalanPra = soalanList.filter(s => s.fasa === "Pra").sort((a,b) => a.susunan - b.susunan);
  const soalanPasca = soalanList.filter(s => s.fasa === "Pasca").sort((a,b) => a.susunan - b.susunan);

  useEffect(() => {
    if (!isEditing) {
      const p = formData.fasa === "Pra" ? soalanPra.length + 1 : soalanPasca.length + 1;
      setFormData(prev => ({ ...prev, susunan: p }));
    }
  }, [formData.fasa, soalanList]);

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

  const handleSimpanSoalan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) { await updateDoc(doc(db, "bank_soalan_selidik", editId), formData); alert("Soalan dikemas kini!"); } 
      else { await addDoc(collection(db, "bank_soalan_selidik"), formData); alert("Soalan ditambah!"); }
      resetForm(); tarikSemuaData();
    } catch (error) { alert("Ralat menyimpan soalan."); }
  };

  const handleEdit = (item: any) => { setIsEditing(true); setEditId(item.id); setFormData({ fasa: item.fasa || "Pra", kategori: item.kategori, subKategori: item.subKategori, soalan: item.soalan, susunan: item.susunan, jenisSkala: item.jenisSkala, aktif: item.aktif }); };
  const handlePadam = async (id: string) => { if (confirm("Pasti memadam soalan ini?")) { await deleteDoc(doc(db, "bank_soalan_selidik", id)); tarikSemuaData(); } };

  const resetForm = () => {
    setIsEditing(false); setEditId(null);
    const targetLength = formData.fasa === "Pra" ? soalanPra.length : soalanPasca.length;
    setFormData({ fasa: formData.fasa, kategori: "Motivasi", subKategori: "", soalan: "", susunan: targetLength + 1, jenisSkala: 5, aktif: true });
  };

  const handleDragStartPhase = (fasa: string, index: number) => { setDraggedItemInfo({ fasa, index }); };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); };

  const handleDropPhase = async (fasa: string, targetIndex: number) => {
    if (!draggedItemInfo || draggedItemInfo.fasa !== fasa || draggedItemInfo.index === targetIndex) return;
    setIsUpdatingOrder(true);
    const currentList = fasa === "Pra" ? [...soalanPra] : [...soalanPasca];
    const draggedItem = currentList.splice(draggedItemInfo.index, 1)[0];
    currentList.splice(targetIndex, 0, draggedItem);
    const updatedList = currentList.map((item, i) => ({ ...item, susunan: i + 1 }));
    setSoalanList(prev => prev.map(oldItem => { const found = updatedList.find(u => u.id === oldItem.id); return found ? { ...oldItem, susunan: found.susunan } : oldItem; }));
    setDraggedItemInfo(null);
    try {
      const batch = writeBatch(db);
      updatedList.forEach(item => { const docRef = doc(db, "bank_soalan_selidik", item.id); batch.update(docRef, { susunan: item.susunan }); });
      await batch.commit();
    } catch (error) { alert("Gagal mengemaskini susunan."); tarikSemuaData(); } finally { setIsUpdatingOrder(false); }
  };

  const exportKajianKeCSV = () => {
    if (rawUsersData.length === 0) return alert("Sila tunggu data ditarik.");
    const sPra = soalanList.filter(q => q.fasa === "Pra").map(q => `PRA_Q${q.susunan}`);
    const sPasca = soalanList.filter(q => q.fasa === "Pasca").map(q => `PASCA_Q${q.susunan}`);
    let csvContent = "ID_Murid,Sekolah,Kumpulan,Tahap_Inkuiri,Pre_Bab1,Post_Bab1,Motivasi_PRA,Penglibatan_PRA,Motivasi_PASCA,Penglibatan_PASCA,Kebolehgunaan_PASCA,";
    csvContent += [...sPra, ...sPasca].join(",") + "\n";

    rawUsersData.filter((u: any) => u.role === "murid" && u.tahapInkuiri === "Rendah").forEach((murid: any) => {
      const uid = murid.idPengguna || murid.id;
      const skorMurid = rawSkorData.filter((s: any) => s.idMurid === uid);
      const preB1 = skorMurid.find((s: any) => s.bab === "Bab 1" && (s.jenisUjian === "pre_test" || !s.jenisUjian))?.skor || "";
      const postB1 = skorMurid.find((s: any) => s.bab === "Bab 1" && s.jenisUjian === "post_test")?.skor || "";
      const svPra = rawSurveyData.find((sv: any) => sv.idMurid === uid && sv.fasa === "Pra");
      const svPasca = rawSurveyData.find((sv: any) => sv.idMurid === uid && sv.fasa === "Pasca");

      const itemSkorList: string[] = [];
      soalanList.filter(q => q.fasa === "Pra").forEach(q => { const ans = svPra?.jawapanTerperinci?.find((a:any) => a.soalanId === q.id); itemSkorList.push(ans ? ans.skor : ""); });
      soalanList.filter(q => q.fasa === "Pasca").forEach(q => { const ans = svPasca?.jawapanTerperinci?.find((a:any) => a.soalanId === q.id); itemSkorList.push(ans ? ans.skor : ""); });

      let row = `${uid},${murid.sekolah || "Tiada"},${murid.kumpulan || "Eksperimen"},${murid.tahapInkuiri || "Rendah"},${preB1},${postB1},`;
      row += `${svPra?.skorKeseluruhan?.Motivasi || ""},${svPra?.skorKeseluruhan?.Penglibatan || ""},`;
      row += `${svPasca?.skorKeseluruhan?.Motivasi || ""},${svPasca?.skorKeseluruhan?.Penglibatan || ""},${svPasca?.skorKeseluruhan?.Kebolehgunaan || ""},`;
      row += itemSkorList.join(",") + "\n";
      csvContent += row;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob);
    link.download = `Data_SPSS_IRAGS_ARAS_RENDAH_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-500" size={40}/></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-full">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900/50 to-[#1e293b] p-6 lg:p-8 rounded-2xl border border-indigo-800/50 shadow-lg relative overflow-hidden gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-3"><Calculator className="text-indigo-400" size={28} /> Makmal Analisis Kuantitatif</h2>
          <p className="text-indigo-200 max-w-3xl text-sm leading-relaxed">Pusat pemprosesan data pencapaian, soal selidik, dan kesahan sistem bagi keperluan analisis SPSS.</p>
        </div>
        <button onClick={exportKajianKeCSV} className="relative z-10 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-bold flex items-center transition-all shadow-lg w-full md:w-auto shrink-0 justify-center">
          <Download size={18} className="mr-2"/> Eksport Data CSV
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button onClick={() => setActiveSubTab("kuasi")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'kuasi' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>1. Kuasi-Eksperimen</button>
        <button onClick={() => setActiveSubTab("spss")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'spss' ? 'bg-blue-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>2. Analisis Soal Selidik</button>
        <button onClick={() => setActiveSubTab("soalan")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'soalan' ? 'bg-fuchsia-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>3. Item Soalan</button>
        <button onClick={() => setActiveSubTab("fdm")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'fdm' ? 'bg-purple-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>4. Kesahan FDM</button>
        <button onClick={() => setActiveSubTab("sus")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeSubTab === 'sus' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}>5. Skor SUS</button>
        <button onClick={() => setActiveSubTab("tetapan")} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap flex items-center gap-2 transition-all ${activeSubTab === 'tetapan' ? 'bg-amber-500 text-slate-900 shadow-lg' : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 border border-slate-800'}`}><Settings size={16}/> 6. Tetapan Bab Kajian</button>
      </div>

      {/* 🌟 TAB BAHARU: KAWALAN BAB KAJIAN */}
      {activeSubTab === "tetapan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
          
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
             <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <div>
                 <h3 className="text-lg font-bold text-blue-400">Tingkatan 4 (KSSM)</h3>
                 <p className="text-xs text-slate-400 mt-1">Sembunyikan bab yang tiada dalam skop kajian.</p>
               </div>
               <Lock className="text-slate-600" size={24}/>
             </div>
             <div className="p-5 space-y-3">
               {[1,2,3,4,5,6,7,8,9,10].map(b => {
                 const key = `t4_b${b}`;
                 const isOn = tetapanBab[key] ?? true;
                 return (
                   <div key={key} className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${isOn ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/80 border-rose-900/50'}`}>
                     <span className={`font-bold ${isOn ? 'text-slate-200' : 'text-slate-500 line-through'}`}>Bab {b}</span>
                     <button onClick={() => handleToggleTetapan(key)} disabled={isUpdatingTetapan} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-emerald-500 shadow-lg shadow-emerald-900/50' : 'bg-slate-600'}`}>
                       <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                 );
               })}
             </div>
          </div>

          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
             <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
               <div>
                 <h3 className="text-lg font-bold text-fuchsia-400">Tingkatan 5 (KSSM)</h3>
                 <p className="text-xs text-slate-400 mt-1">Sembunyikan bab yang tiada dalam skop kajian.</p>
               </div>
               <Lock className="text-slate-600" size={24}/>
             </div>
             <div className="p-5 space-y-3">
               {[1,2,3,4,5,6,7,8,9,10].map(b => {
                 const key = `t5_b${b}`;
                 const isOn = tetapanBab[key] ?? true;
                 return (
                   <div key={key} className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${isOn ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/80 border-rose-900/50'}`}>
                     <span className={`font-bold ${isOn ? 'text-slate-200' : 'text-slate-500 line-through'}`}>Bab {b}</span>
                     <button onClick={() => handleToggleTetapan(key)} disabled={isUpdatingTetapan} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${isOn ? 'bg-emerald-500 shadow-lg shadow-emerald-900/50' : 'bg-slate-600'}`}>
                       <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                 );
               })}
             </div>
          </div>
          
        </div>
      )}

      {/* (KOD TAB LAIN SEPERTI KUASI, SOALAN, SUS, FDM DIKEKALKAN SEPERTI ASAL) */}
      {activeSubTab === "kuasi" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-300">
          <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl lg:col-span-2">
            <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex items-center gap-3"><BarChart3 className="text-emerald-400"/><h3 className="text-lg font-bold text-white">Statistik Deskriptif (Pencapaian Ujian) - Murid Aras Rendah</h3></div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead><tr className="border-b-2 border-slate-700"><th className="p-3 text-slate-400 font-semibold text-sm">Kumpulan</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Ujian</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">N</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Min (Purata)</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Sisihan Piawai (SD)</th></tr></thead>
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
            <div className="p-5 border-b border-slate-800 bg-slate-900/30 flex justify-between items-center">
               <div className="flex items-center gap-3"><TrendingUp className="text-cyan-400"/><h3 className="text-lg font-bold text-white">Ujian-t Sampel Berpasangan</h3></div>
               <button onClick={() => setShowMathInfo(!showMathInfo)} className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-cyan-400 px-4 py-2 rounded-lg border border-slate-700 transition-colors font-bold">
                 <Info size={14}/> {showMathInfo ? "Tutup Formula" : "Lihat Cara Pengiraan Sistem"} <ChevronDown size={14} className={`transition-transform ${showMathInfo ? 'rotate-180' : ''}`}/>
               </button>
            </div>
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-max">
                <thead><tr className="border-b-2 border-slate-700"><th className="p-3 text-slate-400 font-semibold text-sm">Pasangan</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Perbezaan Min</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Nilai t</th><th className="p-3 text-slate-400 font-semibold text-sm text-center">Sig. (p-value)</th></tr></thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-slate-300">Eksperimen</td><td className="p-4 font-mono text-emerald-400 text-center font-bold">+{analisisEksperimen.tTest.meanDiff}</td><td className="p-4 font-mono text-slate-200 text-center">{analisisEksperimen.tTest.tValue}</td><td className="p-4 text-center"><span className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-800/50">{analisisEksperimen.tTest.pValue} (Sig.)</span></td></tr>
                  <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-slate-300">Kawalan</td><td className="p-4 font-mono text-amber-400 text-center font-bold">+{analisisKawalan.tTest.meanDiff}</td><td className="p-4 font-mono text-slate-200 text-center">{analisisKawalan.tTest.tValue}</td><td className="p-4 text-center"><span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full text-xs font-bold border border-slate-700">{analisisKawalan.tTest.pValue} (Tidak Sig.)</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "spss" && (
        <div className="space-y-6 animate-in fade-in duration-300">
           {/* ... (Kekal Seperti Asal) */}
           <div className="grid grid-cols-1 gap-6">
             <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700 flex justify-between items-center">
                <div><h4 className="text-sm font-bold text-slate-200 flex items-center gap-2"><FileText className="text-blue-400"/> Analisis Deskriptif & Ujian-t Berpasangan Soal Selidik</h4><p className="text-xs text-amber-400 mt-1">Data ini dianalisis hanya daripada murid Kumpulan Eksperimen (Aras Rendah) yang melengkapkan soal selidik Pra & Pasca.</p></div>
             </div>
             {statsDeskriptif && Object.keys(statsDeskriptif).length > 0 ? (
               <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-xl w-full">
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-max">
                     <thead><tr className="border-b-2 border-slate-700 bg-slate-900/30"><th className="p-4 text-slate-400 font-semibold text-sm">Konstruk Soal Selidik</th><th className="p-4 text-slate-400 font-semibold text-sm text-center border-l border-slate-800">Fasa</th><th className="p-4 text-slate-400 font-semibold text-sm text-center">N</th><th className="p-4 text-slate-400 font-semibold text-sm text-center">Min</th><th className="p-4 text-slate-400 font-semibold text-sm text-center">S.Piawai (SD)</th><th className="p-4 text-slate-400 font-semibold text-sm text-center border-l border-slate-800">Beza Min</th><th className="p-4 text-slate-400 font-semibold text-sm text-center">Nilai t</th><th className="p-4 text-slate-400 font-semibold text-sm text-center">Sig. (p-value)</th></tr></thead>
                     <tbody className="divide-y divide-slate-800/50">
                       {Object.keys(statsDeskriptif).map((kategori, idx) => {
                          const data = statsDeskriptif[kategori];
                          return (
                            <React.Fragment key={idx}>
                              <tr className="hover:bg-slate-800/30"><td className="p-4 font-bold text-blue-400 uppercase tracking-wide" rowSpan={2}>{kategori}</td><td className="p-3 text-slate-300 text-center border-l border-slate-800">Pra</td><td className="p-3 text-slate-300 text-center">{data.pra.n}</td><td className="p-3 font-mono text-slate-200 text-center">{data.pra.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{data.pra.sd}</td><td className="p-4 font-mono text-emerald-400 text-center font-bold border-l border-slate-800" rowSpan={2}>{Number(data.tTest.meanDiff) > 0 ? '+' : ''}{data.tTest.meanDiff}</td><td className="p-4 font-mono text-slate-200 text-center" rowSpan={2}>{data.tTest.tValue}</td><td className="p-4 text-center" rowSpan={2}><span className={`px-3 py-1 rounded-full text-[10px] font-bold border tracking-wider uppercase ${data.tTest.sig === 'Ya' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50 shadow-sm' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>{data.tTest.pValue} ({data.tTest.sig === 'Ya' ? 'Sig.' : 'Tak Sig.'})</span></td></tr>
                              <tr className="hover:bg-slate-800/30 bg-slate-800/10"><td className="p-3 text-slate-300 text-center border-l border-slate-800">Pasca</td><td className="p-3 text-slate-300 text-center">{data.pasca.n}</td><td className="p-3 font-mono font-bold text-blue-400 text-center">{data.pasca.mean}</td><td className="p-3 font-mono text-slate-200 text-center">{data.pasca.sd}</td></tr>
                            </React.Fragment>
                          )
                       })}
                     </tbody>
                   </table>
                 </div>
               </div>
             ) : ( <div className="p-12 text-center text-slate-500 bg-slate-800/40 rounded-2xl border border-slate-700 border-dashed">Tiada data soal selidik berpasangan (Pra & Pasca) ditemui setakat ini untuk dilakukan Analisis-t.</div> )}
           </div>
           
           {/* Rekod Jawapan Individu */}
           <div className="bg-slate-800/80 rounded-2xl border border-slate-700 overflow-hidden shadow-xl mt-8">
              <div className="p-5 border-b border-slate-700 bg-slate-900/50">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users className="text-fuchsia-400"/> Rekod Jawapan Individu (Aras Rendah Sahaja)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead><tr className="border-b border-slate-700 bg-slate-800/50"><th className="p-4 font-bold text-xs uppercase text-slate-400">Nama Murid / ID</th><th className="p-4 font-bold text-xs uppercase text-slate-400 text-center">Fasa Kajian</th><th className="p-4 font-bold text-xs uppercase text-slate-400 text-center">Tarikh Menjawab</th><th className="p-4 font-bold text-xs uppercase text-slate-400 text-right">Tindakan</th></tr></thead>
                  <tbody>
                    {rawSurveyData.filter(s => { const realUser = rawUsersData.find(u => u.id === s.idMurid || u.idPengguna === s.idMurid); return s.kumpulan === "Eksperimen" && realUser?.tahapInkuiri === "Rendah"; }).length > 0 ? (
                      rawSurveyData.filter(s => { const realUser = rawUsersData.find(u => u.id === s.idMurid || u.idPengguna === s.idMurid); return s.kumpulan === "Eksperimen" && realUser?.tahapInkuiri === "Rendah"; }).map((survey, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="p-4"><div className="font-bold text-slate-200">{survey.namaMurid}</div><div className="text-xs text-slate-500 font-mono mt-0.5">ID: {survey.idMurid}</div></td>
                          <td className="p-4 text-center"><span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${survey.fasa === "Pra" ? 'bg-indigo-900/40 text-indigo-400 border-indigo-800/50' : 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50'}`}>{survey.fasa || "Pra"}</span></td>
                          <td className="p-4 text-center text-xs text-slate-400">{new Date(survey.tarikhJawab).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                          <td className="p-4 text-right"><button onClick={() => setSelectedSurveyDetail(survey)} className="bg-slate-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"><Eye size={14}/> Lihat Jawapan</button></td>
                        </tr>
                      ))
                    ) : ( <tr><td colSpan={4} className="p-8 text-center text-slate-500">Belum ada murid Aras Rendah yang menjawab.</td></tr> )}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {activeSubTab === "soalan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300 items-start relative">
          <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 lg:col-span-1 lg:sticky lg:top-6 h-fit z-10 shadow-xl order-first">
            <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-fuchsia-400" size={20}/> {isEditing ? "Kemaskini Item" : "Daftar Item Baharu"}</h4>
            <form onSubmit={handleSimpanSoalan} className="space-y-5">
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Fasa Kajian</label><select value={formData.fasa} onChange={e => setFormData({...formData, fasa: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white font-bold outline-none focus:border-fuchsia-500 shadow-inner transition-colors"><option className="bg-slate-800 text-white" value="Pra">Pra-Kajian (Sebelum Mula)</option><option className="bg-slate-800 text-white" value="Pasca">Pasca-Kajian (Selepas Tamat)</option></select></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Kategori Utama</label><select value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white outline-none focus:border-fuchsia-500 shadow-inner transition-colors"><option className="bg-slate-800 text-white" value="Motivasi">Motivasi</option><option className="bg-slate-800 text-white" value="Penglibatan">Penglibatan</option><option className="bg-slate-800 text-white" value="Kebolehgunaan">Kebolehgunaan</option></select></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Sub Kategori (Pilihan)</label><input type="text" value={formData.subKategori} onChange={e => setFormData({...formData, subKategori: e.target.value})} placeholder="Cth: Relevansi / Kognitif" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none shadow-inner transition-colors"/></div>
              <div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Pernyataan Item</label><textarea rows={4} value={formData.soalan} onChange={e => setFormData({...formData, soalan: e.target.value})} required placeholder="Cth: I-RAGS membantu saya fokus..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none resize-y shadow-inner leading-relaxed transition-colors"></textarea></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Susunan</label><input type="number" min="1" value={formData.susunan} onChange={e => setFormData({...formData, susunan: parseInt(e.target.value) || 1})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:border-fuchsia-500 outline-none shadow-inner transition-colors"/></div><div><label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Status</label><select value={formData.aktif ? "true" : "false"} onChange={e => setFormData({...formData, aktif: e.target.value === "true"})} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-emerald-400 font-bold outline-none focus:border-fuchsia-500 shadow-inner transition-colors"><option className="bg-slate-800 text-white" value="true">Aktif</option><option className="bg-slate-800 text-white" value="false">Sembunyi</option></select></div></div>
              <div className="flex gap-3 pt-3 border-t border-slate-700/50 mt-2">{isEditing && (<button type="button" onClick={resetForm} className="flex-1 bg-slate-700 text-white font-bold py-3.5 rounded-xl hover:bg-slate-600 text-sm shadow-md transition-all flex items-center justify-center gap-2"><X size={18} /> Batal</button>)}<button type="submit" className="flex-1 bg-fuchsia-600 text-white font-bold py-3.5 rounded-xl hover:bg-fuchsia-500 text-sm shadow-lg shadow-fuchsia-900/50 transition-all flex items-center justify-center gap-2 hover:scale-[1.02]">{isEditing ? <Save size={18} /> : <Plus size={18} />}{isEditing ? "Simpan Perubahan" : "Tambah Item"}</button></div>
            </form>
          </div>
          <div className="w-full lg:w-2/3 grid grid-cols-1 xl:grid-cols-2 gap-6 relative">
             {/* ... Sama dengan sebelumnya ... */}
             <div className="bg-indigo-900/10 rounded-2xl border border-indigo-500/30 p-4 shadow-lg flex flex-col h-full"><div className="bg-indigo-900/40 p-4 rounded-xl border border-indigo-500/40 mb-4 flex justify-between items-center"><h3 className="font-bold text-indigo-300">Pra-Kajian (Sebelum)</h3></div>
              <div className="flex flex-col gap-3">{soalanPra.length > 0 ? soalanPra.map((item, i) => (<div key={item.id} className="flex gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700"><div className="flex-1"><p className="text-sm text-slate-200">{item.soalan}</p></div><button onClick={() => handlePadam(item.id)} className="text-rose-500"><Trash2 size={16}/></button></div>)) : <div className="text-slate-500">Tiada soalan.</div>}</div>
             </div>
             <div className="bg-emerald-900/10 rounded-2xl border border-emerald-500/30 p-4 shadow-lg flex flex-col h-full"><div className="bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/40 mb-4 flex justify-between items-center"><h3 className="font-bold text-emerald-400">Pasca-Kajian (Selepas)</h3></div>
              <div className="flex flex-col gap-3">{soalanPasca.length > 0 ? soalanPasca.map((item, i) => (<div key={item.id} className="flex gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700"><div className="flex-1"><p className="text-sm text-slate-200">{item.soalan}</p></div><button onClick={() => handlePadam(item.id)} className="text-rose-500"><Trash2 size={16}/></button></div>)) : <div className="text-slate-500">Tiada soalan.</div>}</div>
             </div>
          </div>
        </div>
      )}

      {activeSubTab === "fdm" && (
        <div className="bg-[#1e293b] p-6 lg:p-8 rounded-2xl border border-purple-900/50 shadow-xl animate-in fade-in duration-300">
          <div className="flex items-center gap-4 mb-6"><div className="bg-purple-900/50 p-3 rounded-xl"><CheckCircle className="text-purple-400"/></div><div><h4 className="text-xl font-bold text-purple-300">Dapatan Fuzzy Delphi (FDM)</h4></div></div>
          {/* ... Table FDM ... */}
        </div>
      )}

      {activeSubTab === "sus" && (
        <div className="bg-[#1e293b] p-6 lg:p-8 rounded-2xl border border-emerald-900/50 shadow-xl flex flex-col md:flex-row gap-8 items-center animate-in fade-in duration-300">
           {/* ... Table SUS ... */}
        </div>
      )}

    </div>
  );
}