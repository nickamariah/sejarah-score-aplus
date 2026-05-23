"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, Download, ChartBar, Users, BookOpen, FileText } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// --- DATA OLAHAN (DUMMY DATA) ---
const initialQuestionBank = [
  { id: 1, jenis: "Bahan Bacaan", tingkatan: "4", bab: 1, tajuk: "Warisan Negara Bangsa", status: "Muat Naik" },
  { id: 2, jenis: "Pre Test", tingkatan: "4", bab: 3, tajuk: "Konflik Dunia & Pendudukan Jepun", status: "Muat Naik" },
  { id: 3, jenis: "Post Test", tingkatan: "5", bab: 5, tajuk: "Pembentukan Malaysia", status: "Muat Naik" }
];

const chartData = [
  { name: "Bab 1", Pre: 72, Post: 88 },
  { name: "Bab 3", Pre: 65, Post: 79 },
  { name: "Bab 5", Pre: 80, Post: 92 },
  { name: "Bab 8", Pre: 58, Post: 70 },
];

type TabKey = "murid" | "kandungan" | "analitik" | "upload";

export default function GuruDashboard() {
  // --- STATE PENGURUSAN ---
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [students, setStudents] = useState<any[]>([]);
  const [loadingMurid, setLoadingMurid] = useState(true);
  const [questionBank, setQuestionBank] = useState(initialQuestionBank);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // =====================================================================
  // PENTING: TUKAR URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA YANG SEBENAR
  // =====================================================================
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

  // --- FUNGSI TARIK DATA MURID ---
  useEffect(() => {
    const tarikDataMurid = async () => {
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
        console.error("Gagal menarik data murid:", error);
      } finally {
        setLoadingMurid(false);
      }
    };

    if (GAS_URL.startsWith("http")) {
      tarikDataMurid();
    } else {
      setLoadingMurid(false);
    }
  }, []);

  const showToastMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      
      {/* --- SIDEBAR MENU --- */}
      <div className="w-72 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white mb-2">Makmal Penyelidikan</h1>
            <p className="text-sm text-slate-400">Sistem admin bertaraf PhD untuk analisis dan kandungan.</p>
          </div>

          <nav className="space-y-2">
            <button onClick={() => setActiveTab("murid")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "murid" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <Users size={20} /> Pengurusan Murid
            </button>
            <button onClick={() => setActiveTab("kandungan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "kandungan" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <BookOpen size={20} /> Bank Soalan & Modul
            </button>
            <button onClick={() => setActiveTab("analitik")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "analitik" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <ChartBar size={20} /> Makmal Data Kajian
            </button>
            <button onClick={() => setActiveTab("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <FileText size={20} /> Tambah Bahan Baru
            </button>
          </nav>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-auto">
          <LogOut size={20} /> Log Keluar
        </button>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-1">Makmal Penyelidikan</p>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Admin PhD</h2>
          <p className="text-slate-400">Kendalikan murid, kandungan, dan analisis data tesis dalam satu platform.</p>
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
                <button 
                  onClick={() => setShowAddStudentModal(true)} 
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg shadow-cyan-500/20"
                >
                  <Plus size={18} className="mr-2" /> Tambah Murid Baru
                </button>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                {loadingMurid ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">
                    Memuatkan pangkalan data kajian... ⏳
                  </div>
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
                          <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 text-slate-200">{student.name}</td>
                            <td className="p-4 text-slate-400">{student.tingkatan}</td>
                            <td className="p-4 text-slate-400">{student.kelas}</td>
                            <td className="p-4 font-medium text-emerald-400">{student.skor}</td>
                            <td className="p-4 text-slate-400">{student.status}</td>
                            <td className="p-4 flex gap-3">
                              <button className="text-slate-400 hover:text-cyan-400 transition-colors"><Edit3 size={18} /></button>
                              <button className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={6} className="p-8 text-center text-slate-500">Tiada rekod murid ditemui. Sila tambah murid baru.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BANK SOALAN */}
          {activeTab === "kandungan" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 text-center text-slate-400 py-20">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Bank Soalan & Modul</h3>
              <p>Ruangan menguruskan bahan pengajaran dan pembelajaran anda.</p>
            </div>
          )}

          {/* TAB 3: MAKMAL DATA KAJIAN */}
          {activeTab === "analitik" && (
            <div className="space-y-6">
              <MakmalDataKajian />
              
              <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <h3 className="text-xl font-bold text-white mb-6">Perbandingan Pre & Post Test (Semua Bab)</h3>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                      <Legend />
                      <Bar dataKey="Pre" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Post" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: UPLOAD */}
          {activeTab === "upload" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 max-w-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Tambah Bahan Baru</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">URL Bahan (Google Drive / Lain-lain)</label>
                  <input 
                    type="text" 
                    value={uploadUrl} 
                    onChange={(e) => setUploadUrl(e.target.value)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                    placeholder="https://..."
                  />
                </div>
                <div className="pt-4">
                  <button onClick={() => { showToastMessage("Bahan berjaya disimpan!", "success"); setUploadUrl(''); }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
                    Simpan Bahan
                  </button>
                </div>
              </div>