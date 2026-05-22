"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, Download, ChartBar, Users, BookOpen, FileText } from "lucide-react";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const initialStudents = [
  { id: 1, name: "Amina Rahman", tingkatan: "4", kelas: "4 Alfa", skor: "88%", status: "Aktif" },
  { id: 2, name: "Faiz Hakim", tingkatan: "4", kelas: "4 Beta", skor: "73%", status: "Pemantauan" },
  { id: 3, name: "Nur Syafiqah", tingkatan: "5", kelas: "5 Sigma", skor: "91%", status: "Cemerlang" },
  { id: 4, name: "Haziq Iskandar", tingkatan: "5", kelas: "5 Delta", skor: "64%", status: "Penambahbaikan" },
];

const initialQuestionBank = [
  { id: 1, jenis: "Bahan Bacaan", tingkatan: "4", bab: 1, tajuk: "Warisan Negara Bangsa", status: "Muat Naik" },
  { id: 2, jenis: "Pre Test", tingkatan: "4", bab: 3, tajuk: "Konflik Dunia & Pendudukan Jepun", status: "Terancang" },
  { id: 3, jenis: "Post Test", tingkatan: "5", bab: 5, tajuk: "Pembentukan Malaysia", status: "Muat Naik" },
  { id: 4, jenis: "Games", tingkatan: "5", bab: 10, tajuk: "Kecemerlangan Malaysia di Persada Dunia", status: "Draf" },
];

const chartData = [
  { name: "Bab 1", Pre: 72, Post: 88 },
  { name: "Bab 3", Pre: 65, Post: 79 },
  { name: "Bab 5", Pre: 80, Post: 92 },
  { name: "Bab 8", Pre: 58, Post: 70 },
];

type TabKey = "murid" | "kandungan" | "analitik" | "upload";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [students, setStudents] = useState(initialStudents);
  const [questionBank, setQuestionBank] = useState(initialQuestionBank);
  const [uploadTingkatan, setUploadTingkatan] = useState<'4'|'5'>('4');
  const [uploadBab, setUploadBab] = useState<number>(1);
  const [uploadJenis, setUploadJenis] = useState<string>('Bahan Bacaan');
  const [uploadUrl, setUploadUrl] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteStudent = (id: number) => {
    setStudents((prev) => prev.filter((student) => student.id !== id));
    showToast('Rekod murid telah dipadam.', 'success');
  };

  const handleEditStudent = (id: number) => {
    showToast('Modul edit murid sedang dalam pembangunan.', 'info');
  };

  const handleViewQuestion = (id: number) => {
    showToast(`Lihat item ${id} dalam Bank Soalan.`, 'info');
  };

  const tabs = [
    { key: 'murid', label: 'Pengurusan Murid', icon: Users },
    { key: 'kandungan', label: 'Bank Soalan & Modul', icon: BookOpen },
    { key: 'analitik', label: 'Makmal Data Kajian', icon: ChartBar },
    { key: 'upload', label: 'Tambah Bahan Baru', icon: FileText },
  ];

  const handleSaveModul = async () => {
    try {
      const endpoint = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";
      const body = {
        action: 'SAVE_MODUL',
        tingkatan: uploadTingkatan,
        bab: uploadBab,
        jenis: uploadJenis,
        url: uploadUrl
      };
      const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && data.success) {
        showToast('Modul berjaya disimpan.', 'success');
        setUploadUrl('');
        setUploadJenis('Bahan Bacaan');
        setUploadBab(1);
        setUploadTingkatan('4');
      } else {
        showToast('Gagal menyimpan modul. Sila cuba lagi.', 'error');
      }
    } catch (err) {
      showToast('Ralat sambungan. Sila cuba lagi.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-[32px] border border-white/5 bg-slate-900 p-6 shadow-2xl ring-1 ring-white/5">
            <div className="mb-8">
              <p className="text-2xl font-semibold text-white">Makmal Penyelidikan</p>
              <p className="mt-3 text-sm text-slate-400">Sistem admin bertaraf PhD untuk analisis dan kandungan.</p>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as TabKey)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                      activeTab === tab.key
                        ? 'bg-slate-700 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="space-y-6">
            <div className="rounded-[32px] border border-white/5 bg-slate-900 p-6 shadow-2xl ring-1 ring-white/5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.18em] text-amber-300">Makmal Penyelidikan</p>
                  <h1 className="mt-3 text-3xl font-semibold text-white">Dashboard Admin PhD</h1>
                  <p className="mt-2 text-slate-400">Kendalikan murid, kandungan, dan analisis data tesis dalam satu platform.</p>
                </div>
                {activeTab === 'analitik' && (
                  <button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400">
                    <Download className="h-4 w-4" />
                    Eksport Data SPSS (CSV)
                  </button>
                )}
              </div>
            </div>

            {activeTab === 'murid' && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-lg">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Pengurusan Murid</h2>
                    <p className="mt-2 text-slate-400">Tinjau senarai murid, status prestasi dan tindakan terpantas.</p>
                  </div>
                  <button onClick={() => showToast('Tambah Murid baru dalam sistem akan datang.', 'info')} className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:bg-sky-400">
                    <Plus className="h-4 w-4" /> Tambah Murid Baru
                  </button>
                </div>

                <div className="overflow-hidden rounded-[28px] border border-white/5 bg-slate-900 shadow-2xl">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                    <thead className="bg-slate-950/90 text-slate-300">
                      <tr>
                        <th className="px-6 py-4">Nama Murid</th>
                        <th className="px-6 py-4">Tingkatan</th>
                        <th className="px-6 py-4">Kelas</th>
                        <th className="px-6 py-4">Skor</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-800/80">
                          <td className="px-6 py-4 text-white">{student.name}</td>
                          <td className="px-6 py-4 text-slate-300">{student.tingkatan}</td>
                          <td className="px-6 py-4 text-slate-300">{student.kelas}</td>
                          <td className="px-6 py-4 text-emerald-300">{student.skor}</td>
                          <td className="px-6 py-4 text-slate-300">{student.status}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleEditStudent(student.id)} className="rounded-full bg-slate-800 p-2 text-slate-300 hover:bg-slate-700">
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteStudent(student.id)} className="rounded-full bg-slate-800 p-2 text-rose-300 hover:bg-slate-700">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'analitik' && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Purata Kekerapan Scaffolding</p>
                    <p className="mt-4 text-3xl font-semibold text-white">4.8 / minggu</p>
                    <p className="mt-2 text-slate-400">Intervensi adaptif dalam sesi pembelajaran.</p>
                  </div>
                  <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Purata Masa Interaksi RAG</p>
                    <p className="mt-4 text-3xl font-semibold text-white">32 min</p>
                    <p className="mt-2 text-slate-400">Masa berinteraksi dengan silibus sokongan AI.</p>
                  </div>
                  <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Taburan Laluan Adaptif</p>
                    <p className="mt-4 text-3xl font-semibold text-white">65% T4 / 35% T5</p>
                    <p className="mt-2 text-slate-400">Analisis pilihan laluan berdasarkan prestasi.</p>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                  <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Carta Perbandingan</p>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Markah Pre-Test vs Post-Test</h2>
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition">
                      <Download className="h-4 w-4" /> Eksport Data SPSS (CSV)
                    </button>
                  </div>
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                        <YAxis tick={{ fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                        <Legend wrapperStyle={{ color: '#94a3b8' }} />
                        <Bar dataKey="Pre" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="Post" fill="#22c55e" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'kandungan' && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                  <h2 className="text-2xl font-semibold text-white">Bank Soalan & Modul</h2>
                  <p className="mt-2 text-slate-400">Pantau kandungan sedia ada dalam sistem.</p>
                </div>
                <div className="overflow-hidden rounded-[28px] border border-white/5 bg-slate-900 shadow-2xl">
                  <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
                    <thead className="bg-slate-950/90 text-slate-300">
                      <tr>
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Jenis</th>
                        <th className="px-6 py-4">Tingkatan</th>
                        <th className="px-6 py-4">Bab</th>
                        <th className="px-6 py-4">Tajuk</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900">
                      {questionBank.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-800/80">
                          <td className="px-6 py-4 text-slate-300">{item.id}</td>
                          <td className="px-6 py-4 text-white">{item.jenis}</td>
                          <td className="px-6 py-4 text-slate-300">{item.tingkatan}</td>
                          <td className="px-6 py-4 text-slate-300">{item.bab}</td>
                          <td className="px-6 py-4 text-white">{item.tajuk}</td>
                          <td className="px-6 py-4 text-emerald-300">{item.status}</td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleViewQuestion(item.id)} className="rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                              Lihat
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/5 bg-slate-900 p-6 shadow-2xl">
                  <h2 className="text-2xl font-semibold text-white">Tambah Bahan Baru</h2>
                  <p className="mt-2 text-slate-400">Muat naik soalan atau modul dengan metadata lengkap.</p>
                </div>
                <div className="rounded-[28px] border border-white/5 bg-slate-900 p-8 shadow-2xl">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">Tingkatan</label>
                      <select value={uploadTingkatan} onChange={(e) => setUploadTingkatan(e.target.value as '4'|'5')} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20">
                        <option value="4">Tingkatan 4</option>
                        <option value="5">Tingkatan 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-300">Bab</label>
                      <select value={uploadBab} onChange={(e) => setUploadBab(parseInt(e.target.value))} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <option key={i} value={i + 1}>Bab {i + 1}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-300">Jenis Modul</label>
                      <select value={uploadJenis} onChange={(e) => setUploadJenis(e.target.value)} className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20">
                        <option>Bahan Bacaan</option>
                        <option>Pre Test</option>
                        <option>Modul Pengukuhan</option>
                        <option>Post Test</option>
                        <option>Games</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-300">URL Sumber</label>
                      <input type="text" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://" className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20" />
                    </div>
                  </div>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <button onClick={handleSaveModul} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition">
                      <Plus className="h-4 w-4" /> Simpan Bahan
                    </button>
                    <button onClick={() => setUploadUrl('')} className="inline-flex items-center justify-center rounded-2xl bg-slate-800 px-6 py-3 text-sm font-semibold text-slate-200 shadow-lg shadow-slate-900/60 hover:bg-slate-700 transition">
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 rounded-2xl px-6 py-3 text-white shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-sky-500'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
