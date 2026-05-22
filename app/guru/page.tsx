"use client";

import React, { useState } from "react";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState("Analitik");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [topik, setTopik] = useState("");
  const [googleDriveLink, setGoogleDriveLink] = useState("");

  const tabs = ["Analitik", "Bank Soalan", "Kuiz RAG"];

  const handleUpload = () => {
    // Save to database logic would go here
    setShowUploadModal(false);
    setTopik("");
    setGoogleDriveLink("");
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
            <div>
              <button
                onClick={() => setShowUploadModal(true)}
                className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-900 hover:brightness-95 transition"
              >
                Upload Nota / Soalan
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
                <label className="block text-sm font-medium mb-2">
                  Topik / Bab
                </label>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder="Contoh: Bab 1 - Warisan Negara"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Link Google Drive / URL PDF
                </label>
                <input
                  type="text"
                  value={googleDriveLink}
                  onChange={(e) => setGoogleDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={handleUpload}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Simpan ke Database
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setTopik("");
                  setGoogleDriveLink("");
                }}
                className="flex-1 bg-slate-300 text-slate-900 py-2 rounded-lg font-semibold hover:bg-slate-400 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
