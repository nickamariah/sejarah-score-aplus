"use client";

import React, { useState } from "react";
import { LogOut } from "lucide-react";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState("Analitik");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [topik, setTopik] = useState("");
  const [googleDriveLink, setGoogleDriveLink] = useState("");
  const [uploadTingkatan, setUploadTingkatan] = useState<'4'|'5'>('4');
  const [uploadBab, setUploadBab] = useState<number>(1);
  const [uploadJenis, setUploadJenis] = useState<string>('Bahan Bacaan');
  const [uploadUrl, setUploadUrl] = useState<string>('');

  const tabs = ["Analitik", "Bank Soalan", "Kuiz RAG"];

  const handleUpload = () => {
    // Save to database logic would go here
    setShowUploadModal(false);
    setTopik("");
    setGoogleDriveLink("");
  };

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
        window.alert('Modul berjaya disimpan.');
        setShowUploadModal(false);
        setUploadUrl('');
        setUploadJenis('Bahan Bacaan');
        setUploadBab(1);
        setUploadTingkatan('4');
      } else {
        window.alert('Gagal menyimpan modul. Sila cuba lagi.');
      }
    } catch (err) {
      window.alert('Ralat sambungan. Sila cuba lagi.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
        <aside className="w-64 rounded-xl bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-6 text-lg font-semibold text-white">Panel Guru</h2>
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left rounded-md px-3 py-2 transition ${
                  activeTab === tab
                    ? "bg-amber-400 text-slate-900 font-semibold"
                    : "hover:bg-slate-700"
                }`}
              >
                {tab === "Analitik" ? "Analitik Kelas" : tab}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Guru</h1>
              <p className="text-sm text-slate-300">Ringkasan kelas dan aktiviti</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-900 hover:brightness-95 transition"
              >
                Upload Nota / Soalan
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition"
              >
                <LogOut className="w-5 h-5" />
                Log Keluar
              </button>
            </div>
          </header>

          <section className="grid grid-cols-3 gap-6">
            <div className="rounded-lg bg-white p-6 text-slate-900 shadow">
              <p className="text-sm">Jumlah Murid</p>
              <p className="mt-2 text-3xl font-bold">128</p>
            </div>

            <div className="rounded-lg bg-white p-6 text-slate-900 shadow">
              <p className="text-sm">Purata Markah</p>
              <p className="mt-2 text-3xl font-bold">78%</p>
            </div>

            <div className="rounded-lg bg-white p-6 text-slate-900 shadow">
              <p className="text-sm">Kuiz Aktif</p>
              <p className="mt-2 text-3xl font-bold">4</p>
            </div>
          </section>

          <section className="mt-8 rounded-lg bg-white p-6 text-slate-900 shadow">
            <h3 className="mb-3 text-lg font-semibold">
              {activeTab === "Analitik" ? "Analitik Kelas" : activeTab}
            </h3>
            <p className="text-sm text-slate-700">
              {activeTab === "Analitik" &&
                "Ringkasan prestasi kelas Anda"}
              {activeTab === "Bank Soalan" &&
                "Bahan soalan tersedia untuk didagangkan"}
              {activeTab === "Kuiz RAG" &&
                "Kuiz yang dijana daripada bahan RAG"}
            </p>
          </section>
        </main>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full text-slate-900">
            <h2 className="text-2xl font-bold mb-6">Muat Naik Bahan RAG</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tingkatan</label>
                <select value={uploadTingkatan} onChange={(e) => setUploadTingkatan(e.target.value as '4'|'5')} className="w-full px-4 py-2 border rounded">
                  <option value="4">Tingkatan 4</option>
                  <option value="5">Tingkatan 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bab</label>
                <select value={uploadBab} onChange={(e) => setUploadBab(parseInt(e.target.value))} className="w-full px-4 py-2 border rounded">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i} value={i + 1}>Bab {i + 1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Jenis Modul</label>
                <select value={uploadJenis} onChange={(e) => setUploadJenis(e.target.value)} className="w-full px-4 py-2 border rounded">
                  <option>Bahan Bacaan</option>
                  <option>Pre Test</option>
                  <option>Modul Pengukuhan</option>
                  <option>Post Test</option>
                  <option>Games</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL (Google Drive atau pautan lain)</label>
                <input type="text" value={uploadUrl} onChange={(e) => setUploadUrl(e.target.value)} placeholder="https://..." className="w-full px-4 py-2 border rounded" />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button onClick={handleSaveModul} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Simpan ke GAS</button>
              <button onClick={() => { setShowUploadModal(false); setTopik(""); setGoogleDriveLink(""); setUploadUrl(''); }} className="flex-1 bg-slate-300 text-slate-900 py-2 rounded-lg font-semibold hover:bg-slate-400 transition">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
