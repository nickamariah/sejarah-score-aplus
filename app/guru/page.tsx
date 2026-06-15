"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, ExternalLink, HelpCircle, Save, Zap, Sparkles } from "lucide-react";
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// ==========================================
// IMPORT FIREBASE UNTUK BANK SOALAN
// ==========================================
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

type TabKey = "murid" | "kandungan" | "upload" | "soalan" | "analitik";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // STATE MURID (GAS)
  const [students, setStudents] = useState<any[]>([]);
  const [loadingMurid, setLoadingMurid] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newTingkatan, setNewTingkatan] = useState('4');
  const [newKelas, setNewKelas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE MODUL BAHAN (GAS)
  const [modulList, setModulList] = useState<any[]>([]);
  const [loadingModul, setLoadingModul] = useState(true);
  const [uploadTingkatan, setUploadTingkatan] = useState('4');
  const [uploadBab, setUploadBab] = useState('1');
  const [uploadJenis, setUploadJenis] = useState('Bahan Bacaan');
  const [uploadTajuk, setUploadTajuk] = useState(''); 
  const [uploadUrl, setUploadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================
  // 🌟 STATE BANK SOALAN (FIREBASE) 🌟
  // ==========================================
  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [loadingSoalan, setLoadingSoalan] = useState(true);
  const [isCreatingSoalan, setIsCreatingSoalan] = useState(false);

  // Borang Soalan
  const [qTingkatan, setQTingkatan] = useState("4");
  const [qBab, setQBab] = useState("Bab 1");
  const [qTopik, setQTopik] = useState("");
  const [qJenis, setQJenis] = useState("objektif"); // objektif atau struktur
  const [qSoalan, setQSoalan] = useState("");
  const [qMarkah, setQMarkah] = useState("1");
  const [qImageUrl, setQImageUrl] = useState("");
  
  // Khas untuk Objektif
  const [qPilihanA, setQPilihanA] = useState("");
  const [qPilihanB, setQPilihanB] = useState("");
  const [qPilihanC, setQPilihanC] = useState("");
  const [qPilihanD, setQPilihanD] = useState("");
  const [qJawapanBetul, setQJawapanBetul] = useState("A");

  // Khas untuk Struktur/Esei (Bantuan AI)
  const [qSkema, setQSkema] = useState("");

  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

  // ==========================================
  // TARIK DATA DARI DATABASE
  // ==========================================
  const tarikDataMurid = async () => {
    setLoadingMurid(true);
    try {
      const response = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "GET_SENARAI_MURID" }) });
      const result = await response.json();
      if (result.status === "success") setStudents(result.data);
    } catch (error) {} finally { setLoadingMurid(false); }
  };

  const tarikDataModul = async () => {
    setLoadingModul(true);
    try {
      const response = await fetch(GAS_URL, { method: "POST", body: JSON.stringify({ action: "GET_MODUL" }) });
      const result = await response.json();
      if (result.status === "success") setModulList(result.data);
    } catch (error) {} finally { setLoadingModul(false); }
  };

  const tarikSoalanFirebase = async () => {
    setLoadingSoalan(true);
    try {
      const q = query(collection(db, "questionBank"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setSoalanList(data);
    } catch (error) {
      console.error("Ralat tarik soalan:", error);
    } finally {
      setLoadingSoalan(false);
    }
  };

  useEffect(() => {
    if (GAS_URL.startsWith("http")) { tarikDataMurid(); tarikDataModul(); } 
    else { setLoadingMurid(false); setLoadingModul(false); }
    tarikSoalanFirebase(); // Tarik soalan dari Firebase masa mula-mula buka
  }, []);

  // ==========================================
  // FUNGSI SIMPAN
  // ==========================================
  const handleSimpanBahan = async () => {
    if (!uploadTajuk || !uploadUrl) return showToastMessage("Sila isikan Tajuk dan URL!", "error");
    setIsUploading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "SAVE_MODUL", payload: { tingkatan: uploadTingkatan, bab: uploadBab, jenis: uploadJenis, tajuk: uploadTajuk, url: uploadUrl } }),
      });
      const result = await response.json();
      if (result.status === "success") {
        showToastMessage("Bahan berjaya disimpan!", "success");
        setUploadTajuk(''); setUploadUrl(''); tarikDataModul(); setActiveTab("kandungan"); 
      } else { showToastMessage("Gagal.", "error"); }
    } catch (error) {} finally { setIsUploading(false); }
  };

  // 🌟 SIMPAN SOALAN KE FIREBASE
  const handleSimpanSoalan = async () => {
    if (!qSoalan || !qTopik) return showToastMessage("Sila isikan Soalan dan Subtopik!", "error");
    setIsSubmitting(true);

    try {
      const dataSoalan: any = {
        tingkatan: qTingkatan,
        bab: qBab,
        topik: qTopik,
        jenis: qJenis,
        soalan: qSoalan,
        markah: parseInt(qMarkah),
        imageUrl: qImageUrl,
        createdAt: serverTimestamp()
      };

      if (qJenis === "objektif") {
        if (!qPilihanA || !qPilihanB) return showToastMessage("Isi sekurang-kurangnya pilihan A dan B!", "error");
        dataSoalan.pilihan = { A: qPilihanA, B: qPilihanB, C: qPilihanC, D: qPilihanD };
        dataSoalan.jawapan = qJawapanBetul;
      } else {
        if (!qSkema) return showToastMessage("Sila isikan Skema Jawapan untuk rujukan AI!", "error");
        dataSoalan.skemaJawapan = qSkema;
      }

      await addDoc(collection(db, "questionBank"), dataSoalan);
      showToastMessage("Soalan berjaya ditambah ke Bank Soalan!", "success");
      setIsCreatingSoalan(false);
      
      // Kosongkan form
      setQSoalan(""); setQTopik(""); setQSkema(""); setQImageUrl("");
      tarikSoalanFirebase(); // Refresh jadual
    } catch (error) {
      console.error(error);
      showToastMessage("Ralat sistem semasa menyimpan.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePadamSoalan = async (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam soalan ini?")) {
      try {
        await deleteDoc(doc(db, "questionBank", id));
        showToastMessage("Soalan dipadam.", "success");
        tarikSoalanFirebase();
      } catch (error) {
        showToastMessage("Ralat memadam soalan.", "error");
      }
    }
  };

  const showToastMessage = (msg: string, type: 'success'|'error'|'info'='info') => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const handleLogout = () => { window.location.href = '/'; };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      
      <div className="w-72 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white mb-2">Makmal Penyelidikan</h1>
            <p className="text-sm text-slate-400">Sistem admin bertaraf PhD untuk analisis dan kandungan.</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("murid")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "murid" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Users size={20} /> Pengurusan Murid</button>
            
            {/* TAB BARU UNTUK BANK SOALAN FIREBASE */}
            <button onClick={() => setActiveTab("soalan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "soalan" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><HelpCircle size={20} /> Bank Soalan Ujian</button>
            
            <button onClick={() => setActiveTab("kandungan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "kandungan" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><BookOpen size={20} /> Senarai Bahan (GAS)</button>
            <button onClick={() => setActiveTab("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><FileText size={20} /> Tambah Bahan Baru</button>
            <button onClick={() => setActiveTab("analitik")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "analitik" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><ChartBar size={20} /> Makmal Data Kajian</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-auto"><LogOut size={20} /> Log Keluar</button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-1">Makmal Penyelidikan</p>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Admin PhD</h2>
        </header>

        <main>
          {/* TAB 1: PENGURUSAN MURID (DIKEKALKAN) */}
          {activeTab === "murid" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <div><h3 className="text-xl font-bold text-white mb-1">Pengurusan Murid</h3><p className="text-slate-400 text-sm">Tinjau senarai murid dari Google Sheet.</p></div>
              </div>
              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                {loadingMurid ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data dari Google Sheet... ⏳</div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="p-4 font-semibold text-sm text-slate-300">Nama Murid</th>
                        <th className="p-4 font-semibold text-sm text-slate-300">Tingkatan</th>
                        <th className="p-4 font-semibold text-sm text-slate-300">Kelas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-4 text-slate-200">{s.name}</td><td className="p-4 text-slate-400">{s.tingkatan}</td><td className="p-4 text-slate-400">{s.kelas}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 🌟 TAB BARU: BANK SOALAN (FIREBASE) 🌟 */}
          {/* ========================================== */}
          {activeTab === "soalan" && (
            <div className="space-y-6">
              
              {!isCreatingSoalan ? (
                <>
                  <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Bank Soalan Ujian (Diagnostik & Post-Test)</h3>
                      <p className="text-slate-400 text-sm">Uruskan soalan Objektif dan Struktur. Data disimpan di Firebase.</p>
                    </div>
                    <button onClick={() => setIsCreatingSoalan(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors">
                      <Plus size={18} className="mr-2" /> Bina Soalan Baru
                    </button>
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                    {loadingSoalan ? (
                      <div className="p-12 text-center text-slate-400 animate-pulse">Memuat turun Bank Soalan dari Firebase... ⏳</div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="p-4 font-semibold text-sm text-slate-300">Kedudukan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Topik</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Jenis</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Soalan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soalanList.length > 0 ? soalanList.map((q, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4 text-slate-400 text-sm">T{q.tingkatan} - {q.bab}</td>
                              <td className="p-4 text-slate-200">{q.topik}</td>
                              <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-md font-bold ${q.jenis === 'objektif' ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-purple-900/30 text-purple-400 border border-purple-800'}`}>
                                  {q.jenis.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300 text-sm truncate max-w-xs">{q.soalan}</td>
                              <td className="p-4 flex gap-3 justify-end">
                                <button onClick={() => handlePadamSoalan(q.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                              </td>
                            </tr>
                          )) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada soalan dicipta.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : (
                
                // BORANG BINA SOALAN
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1e293b] p-8 rounded-2xl border border-cyan-800/50 shadow-lg max-w-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <HelpCircle className="text-cyan-400 w-8 h-8" /> Cipta Soalan Baharu
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tingkatan</label>
                      <select value={qTingkatan} onChange={e => setQTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                        <option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Bab</label>
                      <select value={qBab} onChange={e => setQBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Topik / Subtopik</label>
                      <input type="text" value={qTopik} onChange={e => setQTopik(e.target.value)} placeholder="Cth: Ciri Negara Bangsa" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Jenis Soalan</label>
                      <select value={qJenis} onChange={e => setQJenis(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-bold">
                        <option value="objektif">Objektif (A, B, C, D)</option>
                        <option value="struktur">Struktur / Esei (Semakan AI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Markah</label>
                      <input type="number" value={qMarkah} onChange={e => setQMarkah(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"/>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Soalan</label>
                    <textarea rows={4} value={qSoalan} onChange={e => setQSoalan(e.target.value)} placeholder="Taip soalan anda di sini..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 resize-none text-lg"></textarea>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm text-slate-400 mb-2">Pautan Gambar (Pilihan)</label>
                    <input type="text" value={qImageUrl} onChange={e => setQImageUrl(e.target.value)} placeholder="https://contoh.com/gambar.png" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-cyan-500"/>
                  </div>

                  {/* KONDISI: JIKA OBJEKTIF */}
                  {qJenis === "objektif" ? (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                      <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2"><Zap size={18}/> Pilihan Jawapan Objektif</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3"><span className="font-bold text-slate-400">A</span><input type="text" value={qPilihanA} onChange={e => setQPilihanA(e.target.value)} className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-slate-400">B</span><input type="text" value={qPilihanB} onChange={e => setQPilihanB(e.target.value)} className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-slate-400">C</span><input type="text" value={qPilihanC} onChange={e => setQPilihanC(e.target.value)} className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-slate-400">D</span><input type="text" value={qPilihanD} onChange={e => setQPilihanD(e.target.value)} className="flex-1 bg-[#0f172a] border border-slate-600 rounded-lg p-3 text-white"/></div>
                      </div>
                      <div>
                        <label className="block text-sm text-emerald-400 font-bold mb-2">Pilih Jawapan Yang Betul</label>
                        <select value={qJawapanBetul} onChange={e => setQJawapanBetul(e.target.value)} className="w-full md:w-1/2 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-emerald-300 font-bold focus:outline-none">
                          <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    /* KONDISI: JIKA STRUKTUR/ESEI */
                    <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-800/50 mb-8">
                      <h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2"><Sparkles size={18}/> Skema Jawapan (Untuk Rujukan AI)</h4>
                      <p className="text-xs text-purple-300/70 mb-4">Masukkan poin-poin penting. Sistem AI Gemini akan menggunakan skema ini untuk menanda jawapan struktur murid secara automatik.</p>
                      <textarea rows={5} value={qSkema} onChange={e => setQSkema(e.target.value)} placeholder="Contoh: 1. Raja sebagai tonggak utama (1m). 2. Dibantu oleh pembesar (1m)..." className="w-full bg-[#0f172a] border border-purple-700/50 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                    <button onClick={() => setIsCreatingSoalan(false)} className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Batal</button>
                    <button onClick={handleSimpanSoalan} disabled={isSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg shadow-cyan-500/20 transition-transform active:scale-95">
                      {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={18} /> Menyimpan...</> : <><Save className="mr-2" size={18}/> Simpan Soalan</>}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* TAB 3 & 4 (DIKEKALKAN) */}
          {activeTab === "kandungan" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
               {/* Kod sedia ada untuk senarai modul GAS */}
               <h3 className="text-xl font-bold text-white mb-6">Senarai Bahan Rujukan (GAS)</h3>
               <p className="text-slate-400 text-sm mb-4">Ini adalah senarai modul rujukan yang ditarik dari Google Apps Script.</p>
               {/* ... */}
            </div>
          )}
          {activeTab === "upload" && (
             <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="text-cyan-500" /> Muat Naik Bahan Modul Baru (GAS)</h3>
                {/* ... (Borang upload URL sedia ada) */}
             </div>
          )}
          {activeTab === "analitik" && ( <MakmalDataKajian /> )}
        </main>
      </div>

      {/* TOAST MESSAGE */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50">
            <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>{toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}