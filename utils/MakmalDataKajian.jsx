"use client"; // Wajib ada sebab guna useEffect dan Recharts
import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function MakmalDataKajian() {
  const [dataMakmal, setDataMakmal] = useState(null);
  const [loading, setLoading] = useState(true);

  // TUKAR URL INI JUGA
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

  // Tarik data dari GAS sebaik sahaja Guru buka komponen ini
  useEffect(() => {
    async function tarikData() {
      try {
        const response = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify({ action: "dapatkanDataMakmal" }),
        });
        const result = await response.json();
        
        if (result.status === "success") {
          setDataMakmal(result.analisis); // result.analisis ini datang dari fail Code.gs yang kita buat di Langkah 2
        }
      } catch (error) {
        console.error("Gagal tarik data:", error);
      } finally {
        setLoading(false);
      }
    }
    tarikData();
  }, []);

  // Paparan masa loading
  if (loading) return <div className="p-10 text-center animate-pulse">Memuatkan Makmal Data Penyelidikan... ⏳</div>;
  if (!dataMakmal) return <div className="p-10 text-center text-red-500">Gagal menarik data dari pangkalan data.</div>;

  // Format warna untuk Carta Pie
  const dataPie = [
    { name: 'Cemerlang', value: dataMakmal.pecahanLaluan.cemerlang },
    { name: 'Sederhana', value: dataMakmal.pecahanLaluan.sederhana },
    { name: 'Bimbingan', value: dataMakmal.pecahanLaluan.bimbingan },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444']; // Hijau, Kuning, Merah

  return (
    <div className="p-6 bg-slate-50 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">📊 Makmal Data Kajian PhD (Live Telemetry)</h2>
      
      {/* 1. KAD STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-white border-l-4 border-blue-500 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500">Jumlah Interaksi Sistem</h3>
          <p className="text-4xl font-bold text-blue-700 mt-2">{dataMakmal.jumlahInteraksi} <span className="text-lg text-slate-400">rekod digital</span></p>
        </div>
        
        <div className="p-6 bg-white border-l-4 border-purple-500 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500">Kekerapan Penggunaan Scaffolding AI</h3>
          <p className="text-4xl font-bold text-purple-700 mt-2">{dataMakmal.kekerapanScaffolding} <span className="text-lg text-slate-400">kali digunakan</span></p>
        </div>
      </div>

      {/* 2. CARTA RECHARTS */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-bold mb-4 text-center text-slate-700">Taburan Laluan Pembelajaran Adaptif Murid</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPie}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
              >
                {dataPie.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}