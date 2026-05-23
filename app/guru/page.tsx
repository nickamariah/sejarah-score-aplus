"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MakmalDataKajian from "../../utils/MakmalDataKajian";

const initialQuestionBank = [
  { id: 1, jenis: "Bahan Bacaan", tingkatan: "4", bab: 1, tajuk: "Warisan Negara Bangsa", status: "Muat Naik" }
];

const chartData = [
  { name: "Bab 1", Pre: 72, Post: 88 },
  { name: "Bab 3", Pre: 65, Post: 79 }
];

type TabKey = "murid" | "kandungan" | "analitik" | "upload";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingMurid, setLoadingMurid] = useState(true);
  const [questionBank, setQuestionBank] = useState(initialQuestionBank);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- STATE UNTUK BORANG MURID BARU ---
  const [newNama, setNewNama] = useState('');
  const [newTingkatan, setNewTingkatan] = useState('4');
  const [newKelas, setNewKelas] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // =====================================================================
  // TUKAR URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA
  // =====================================================================
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

  // --- FUNGSI TARIK DATA (DIPANGGIL MASA MULA-MULA BUKA) ---
  const tarikDataMurid = async () => {
    setLoadingMurid(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ action: "GET_SENARAI_MURID" }),
      });
      const result = await response.json();
      if (result.status === "success") {
        setStudents(result.data);
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setLoadingMurid(false);
    }
  };

  useEffect(() => {
    if (GAS_URL.startsWith("http")) tarikDataMurid();
    else setLoadingMurid(false);
  }, []);

  // --- FUNGSI HANTAR DATA MURID BARU KEPADA GAS ---
  const handleSimpanMurid = async () => {
    if (!newNama || !newKelas) {
      showToastMessage("Sila isikan Nama dan Kelas!", "error");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "TAMBAH_MURID",
          payload: { nama: newNama, tingkatan: newTingkatan, kelas: newKelas }
        }),
      });
      const result = await response.json();
      
      if (result.status === "success") {
        showToastMessage("Murid berjaya didaftarkan!", "success");
        setShowAddStudentModal(false);
        setNewNama(''); setNewKelas(''); // Kosongkan borang
        tarikDataMurid(); // Refresh jadual secara automatik
      } else {
        showToastMessage("Gagal menambah murid.", "error");
      }
    } catch (error) {
      showToastMessage("Ralat sistem. Sila cuba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
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
            <button onClick={() => setActiveTab("analitik")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "analitik" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><ChartBar size={20} /> Makmal Data Kajian</button>
            <button onClick={() => setActiveTab("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><FileText size={20} /> Tambah Bahan Baru</button>
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
          {activeTab === "murid" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Pengurusan Murid</h3>
                  <p className="text-slate-400 text-sm">Tinjau senarai murid, status prestasi dan tindakan terpantas.</p>
                </div>
                <button onClick={() => setShowAddStudentModal(true)} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors">
                  <Plus size={18} className="mr-2" /> Tambah Murid Baru
                </button>
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
                        {students.length > 0 ? students.map((student, idx) => (
                          <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="p-4 text-slate-200">{student.name}</td>
                            <td className="p-4 text-slate-400">{student.tingkatan}</td>
                            <td className="p-4 text-slate-400">{student.kelas}</td>
                            <td className="p-4 font-medium text-emerald-400">{student.skor}</td>
                            <td className="p-4 text-slate-400">{student.status}</td>
                            <td className="p-4 flex gap-3">
                              <button className="text-slate-400 hover:text-cyan-400"><Edit3 size={18} /></button>
                              <button className="text-slate-400 hover:text-red-400"><Trash2 size={18} /></button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod murid ditemui.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "analitik" && ( <MakmalDataKajian /> )}
          {activeTab === "kandungan" && ( <div className="p-6 text-slate-400 text-center py-20"><BookOpen size={48} className="mx-auto mb-4 opacity-50" /><h3>Sistem Bank Soalan</h3></div> )}
          {activeTab === "upload" && ( <div className="p-6 text-slate-400 text-center py-20">Sistem Upload Bahan</div> )}
        </main>
      </div>

      {/* MODAL TAMBAH MURID */}
      <AnimatePresence>
        {showAddStudentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className="bg-[#1e293b] p-8 rounded-3xl border border-slate-700 w-full max-w-md shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-2">Tambah Murid Baru</h3>
              <p className="text-slate-400 mb-6">Daftar murid baharu ke pangkalan data.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Nama Penuh</label>
                  <input value={newNama} onChange={e => setNewNama(e.target.value)} type="text" placeholder="Contoh: Ali bin Abu" className="w-full bg-[#0f172a] text-white border border-slate-700 rounded-xl p-3 focus:border-cyan-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Tingkatan</label>
                    <select value={newTingkatan} onChange={e => setNewTingkatan(e.target.value)} className="w-full bg-[#0f172a] text-white border border-slate-700 rounded-xl p-3 focus:border-cyan-500 focus:outline-none">
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                    <input value={newKelas} onChange={e => setNewKelas(e.target.value)} type="text" placeholder="Contoh: Alfa" className="w-full bg-[#0f172a] text-white border border-slate-700 rounded-xl p-3 focus:border-cyan-500 focus:outline-none" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setShowAddStudentModal(false)} disabled={isSubmitting} className="px-5 py-2.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">Batal</button>
                <button onClick={handleSimpanMurid} disabled={isSubmitting} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition-colors flex items-center">
                  {isSubmitting ? <><Loader2 className="animate-spin mr-2" size={18} /> Menyimpan...</> : "Simpan Data"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 z-50">
            <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}