"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LamanLogMasuk() {
  const [idPengguna, setIdPengguna] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!idPengguna || !kataLaluan) {
      setErrorMsg("Sila masukkan ID Pengguna dan Kata Laluan.");
      return;
    }

    setIsLoading(true);

    // ==========================================
    // LOGIK LOGIN PINTAR (SIMULASI UNTUK TESIS)
    // ==========================================
    // Sengaja dilambatkan 1 saat supaya nampak realistik macam sistem sebenar
    setTimeout(() => {
      const idUpper = idPengguna.trim().toUpperCase();

      // 1. JIKA GURU / ADMIN LOGIN
      if (idUpper === "ADMIN" || idUpper === "GURU" || idUpper === "CIKGU") {
        // Simpan data Guru ke memori browser
        localStorage.setItem("currentUser", JSON.stringify({
          id: idUpper,
          name: "Penyelia Kajian",
          role: "guru"
        }));
        // Bawa ke Dashboard Guru
        window.location.href = "/guru";
      } 
      // 2. JIKA MURID LOGIN (Bermula dengan M, cth: M001)
      else if (idUpper.startsWith("M")) {
        // Tentukan tingkatan secara rawak untuk contoh (M001 = T4, M002 = T5)
        const tingkatanMurid = idUpper === "M002" ? "5" : "4"; 
        
        // Simpan data Murid ke memori browser
        localStorage.setItem("currentUser", JSON.stringify({
          id: idUpper,
          name: `Pelajar ${idUpper}`,
          tingkatan: tingkatanMurid,
          role: "murid"
        }));
        // Bawa ke Dashboard Murid
        window.location.href = "/murid";
      } 
      // 3. JIKA ID SALAH
      else {
        setErrorMsg("ID Pengguna tidak sah. Sila guna M001 (Murid) atau ADMIN (Guru).");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-sky-50 flex items-center justify-center p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row w-full max-w-4xl"
      >
        
        {/* BAHAGIAN KIRI - LOGO & TAJUK */}
        <div className="p-10 md:p-12 md:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-black text-sky-700 tracking-tight mb-4">
            HUB I-RAGS
          </h1>
          <p className="text-sky-600 font-medium leading-relaxed">
            Model Pembelajaran Inkuiri Adaptif Berasaskan RAG & Scaffolding
          </p>
        </div>

        {/* BAHAGIAN KANAN - BORANG LOGIN */}
        <div className="bg-slate-50 p-10 md:p-12 md:w-1/2 border-l border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-sky-800 mb-2">ID Pengguna</label>
              <input 
                type="text" 
                value={idPengguna}
                onChange={(e) => setIdPengguna(e.target.value)}
                placeholder="Cth: M001 atau ADMIN"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-sky-800 mb-2">Kata Laluan</label>
              <input 
                type="password" 
                value={kataLaluan}
                onChange={(e) => setKataLaluan(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition-all"
              />
            </div>

            {errorMsg && (
              <p className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-lg border border-red-200">
                {errorMsg}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-4 rounded-xl shadow-md shadow-amber-200 transition-transform active:scale-95 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Log Masuk"}
            </button>

            <div className="text-center mt-6">
              <p className="text-xs text-slate-500">
                Lupa ID atau kata laluan? Sila hubungi penyelia (Cikgu Nic).
              </p>
            </div>
          </form>
        </div>

      </motion.div>
    </div>
  );
}