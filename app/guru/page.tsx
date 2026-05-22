"use client";

import React from "react";

export default function GuruDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
        <aside className="w-64 rounded-xl bg-slate-800 p-6 shadow-lg">
          <h2 className="mb-6 text-lg font-semibold text-white">Panel Guru</h2>
          <nav className="space-y-2">
            <button className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-700">Analitik Kelas</button>
            <button className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-700">Bank Soalan</button>
            <button className="w-full text-left rounded-md px-3 py-2 hover:bg-slate-700">Kuiz RAG</button>
          </nav>
        </aside>

        <main className="flex-1">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Guru</h1>
              <p className="text-sm text-slate-300">Ringkasan kelas dan aktiviti</p>
            </div>
            <div>
              <button className="rounded-md bg-amber-400 px-4 py-2 font-semibold text-slate-900 hover:brightness-95">Upload Nota / Soalan</button>
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
            <h3 className="mb-3 text-lg font-semibold">Kemas Kini Terkini</h3>
            <p className="text-sm text-slate-700">Tiada kemas kini penting sekarang.</p>
          </section>
        </main>
      </div>
    </div>
  );
}
