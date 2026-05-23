"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, ExternalLink } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// --- DATA CARTA DUMMY ---
const chartData = [
  { name: "Bab 1", Pre: 72, Post: 88 },
  { name: "Bab 3", Pre: 65, Post: 79 }
];

type TabKey = "murid" | "kandungan" | "analitik" | "upload";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // STATE MURID
  const [students, setStudents] = useState<any[]>([]);
  const [loadingMurid, setLoadingMurid] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newTingkatan, setNewTingkatan] = useState('4');
  const [newKelas, setNewKelas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE MODUL
  const [modulList, setModulList] = useState<any[]>([]);
  const [loadingModul, setLoadingModul] = useState(true);
  const [uploadTingkatan, setUploadTingkatan] = useState('4');
  const [uploadBab, setUploadBab] = useState('1');
  const [uploadJenis, setUploadJenis] = useState('Bahan Bacaan');
  const [uploadTajuk, setUploadTajuk] = useState(''); // STATE BARU UNTUK TAJUK
  const [uploadUrl, setUploadUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // =====================================================================
  // TUKAR URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA
  // =====================================================================
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

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

  useEffect(() => {
    if (GAS_URL.startsWith("http")) { tarikDataMurid(); tarikDataModul(); } 
    else { setLoadingMurid(false); setLoadingModul(false); }
  }, []);

  const handleSimpanMurid = async () => {
    if (!newNama || !newKelas) return showToastMessage("Sila isikan Nama dan Kelas!", "error");
    setIsSubmitting(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "TAMBAH_MURID", payload: { nama: newNama, tingkatan: newTingkatan, kelas: newKelas } }),
      });
      const result = await response.json();
      if (result.status === "success") {
        showToastMessage("Murid berjaya ditambah!", "success");
        setShowAddStudentModal(false); setNewNama(''); setNewKelas('');
        tarikDataMurid();
      } else showToastMessage("Gagal menambah murid.", "error");
    } catch (error) { showToastMessage("Ralat sistem.", "error"); } finally { setIsSubmitting(false); }
  };

  const handleSimpanBahan = async () => {
    if (!uploadTajuk || !uploadUrl) {
      showToastMessage("Sila isikan Tajuk dan URL bahan!", "error");
      return;
    }
    setIsUploading(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "SAVE_MODUL",
          payload: { tingkatan: uploadTingkatan, bab: uploadBab, jenis: uploadJenis, tajuk: uploadTajuk, url: uploadUrl }
        }),
      });
      const result = await response.json();
      if (result.status === "success") {
        showToastMessage("Bahan berjaya disimpan!", "success");
        setUploadTajuk(''); setUploadUrl(''); 
        tarikDataModul(); 
        setActiveTab("kandungan"); 
      } else { showToastMessage("Gagal menyimpan bahan.", "error"); }
    } catch (error) { showToastMessage("Ralat sistem.", "error"); } finally { setIsUploading(false); }
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
            <button onClick={() => setActiveTab("kandungan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "kandungan" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><BookOpen size={20} /> Bank Soalan & Modul</button>
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
          {/* TAB 1: PENGURUSAN MURID */}
          {activeTab === "murid" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Pengurusan Murid</h3>
                  <p className="text-slate-400 text-sm">Tinjau senarai murid, status prestasi dan tindakan terpantas.</p>
                </div>
                <button onClick={() => setShowAddStudentModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors"><Plus size={18} className="mr-2" /> Tambah Murid Baru</button>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                {loadingMurid ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data dari Google Sheet... ⏳</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                          <th className="p-4 font-semibold text-sm text-slate-300">Nama Murid</th>
                          <th className="p-4 font-semibold text-sm text-slate-300">Tingkatan</th>
                          <th className="p-4 font-semibold text-sm text-slate-300">Kelas</th>
                          <th className="p-4 font-semibold text-sm text-slate-300">Skor</th>
                          <th className="p-4 font-semibold text-sm text-slate-300">Status</th>
                          <th className="p-4 font-semibold text-sm text-slate-300">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.length > 0 ? students.map((s, i) => (
                          <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="p-4 text-slate-200">{s.name}</td><td className="p-4 text-slate-400">{s.tingkatan}</td><td className="p-4 text-slate-400">{s.kelas}</td>
                            <td className="p-4 font-medium text-emerald-400">{s.skor}</td><td className="p-4 text-slate-400">{s.status}</td>
                            <td className="p-4 flex gap-3"><button className="text-slate-400 hover:text-cyan-400"><Edit3 size={18} /></button><button className="text-slate-400 hover:text-red-400"><Trash2 size={18} /></button></td>
                          </tr>
                        )) : <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BANK SOALAN (JADUAL) */}
          {activeTab === "kandungan" && (
            <div className="space-y-6">
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Bank Soalan & Modul</h3>
                    <p className="text-slate-400 text-sm">Senarai semua bahan yang telah dimuat naik.</p>
                  </div>
                  <button onClick={() => setActiveTab("upload")} className="text-sm bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center">
                    <Plus size={16} className="mr-2" /> Upload Bahan Baru
                  </button>
                </div>

                <div className="bg-[#0f172a] rounded-xl border border-slate-700 overflow-hidden">
                  {loadingModul ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Menarik senarai bahan... ⏳</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-800/50">
                            <th className="p-4 font-semibold text-sm text-slate-300">Tingkatan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Bab</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Jenis</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Tajuk Bahan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Pautan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modulList.length > 0 ? modulList.map((m, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
                              <td className="p-4 text-amber-400 font-medium">T4</td>
                              <td className="p-4 text-slate-200">Bab {m.bab}</td>
                              <td className="p-4 text-cyan-400">{m.jenis}</td>
                              <td className="p-4 text-slate-200 font-medium">{m.tajuk}</td>
                              <td className="p-4"><a href={m.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1"><ExternalLink size={14} /> Buka</a></td>
                              <td className="p-4 flex gap-3"><button className="text-slate-500 hover:text-red-400"><Trash2 size={18} /></button></td>
                            </tr>
                          )) : <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada bahan ditemui.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD BAHAN (DENGAN INPUT TAJUK) */}
          {activeTab === "upload" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 max-w-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <FileText className="text-cyan-500" /> Muat Naik Bahan Modul Baru
              </h3>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Tingkatan</label>
                    <select value={uploadTingkatan} onChange={e => setUploadTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                      <option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Bab Berapa?</label>
                    <select value={uploadBab} onChange={e => setUploadBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={num}>Bab {num}</option>))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Jenis Bahan</label>
                  <select value={uploadJenis} onChange={e => setUploadJenis(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                    <option value="Bahan Bacaan">Bahan Bacaan (Nota)</option>
                    <option value="Pre Test">Pre Test (Ujian Awal)</option>
                    <option value="Post Test">Post Test (Ujian Akhir)</option>
                    <option value="Pengukuhan">Modul Pengukuhan</option>
                  </select>
                </div>

                {/* INPUT BARU: TAJUK BAHAN */}
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Tajuk Bahan</label>
                  <input type="text" value={uploadTajuk} onChange={(e) => setUploadTajuk(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Contoh: Peta Minda Bab 1 / Video YouTube"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Pautan URL (Google Drive / Canva / YouTube)</label>
                  <input type="text" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <button onClick={handleSimpanBahan} disabled={isUploading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center">
                    {isUploading ? <><Loader2 className="animate-spin mr-2" size={18} /> Menyimpan...</> : "Simpan Bahan ke Pangkalan Data"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MAKMAL */}
          {activeTab === "analitik" && ( <MakmalDataKajian /> )}
        </main>
      </div>

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