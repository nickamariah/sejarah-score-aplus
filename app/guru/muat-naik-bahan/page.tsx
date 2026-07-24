"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Storage dibuang sebab guna link sahaja

export default function MuatNaikBahanRujukan() {
  const [tajuk, setTajuk] = useState("");
  const [bab, setBab] = useState("Bab 1"); // Default
  const [pautanBahan, setPautanBahan] = useState(""); // Ganti fail PDF kepada Pautan/Link
  const [loading, setLoading] = useState(false);
  const [mesej, setMesej] = useState("");

  // Fungsi untuk simpan pautan ke Firebase (Firestore)
  const handleSimpanPautan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pautanBahan.trim() || !tajuk.trim()) {
      setMesej("Sila isi tajuk dan pautan bahan.");
      return;
    }

    setLoading(true);
    setMesej("");

    try {
      // Simpan maklumat fail (metadata) ke dalam Firestore
      await addDoc(collection(db, "bahan_rujukan"), {
        tajuk: tajuk,
        bab: bab,
        urlPautan: pautanBahan, // <-- Simpan URL yang cikgu taip
        tarikhMuatNaik: new Date().toISOString(),
        jenis: "Pautan"
      });

      setMesej("✅ Pautan bahan berjaya direkodkan!");
      
      // Reset input borang
      setTajuk("");
      setPautanBahan("");
      (document.getElementById("form-muat-naik") as HTMLFormElement).reset();

    } catch (error) {
      console.error("Ralat menyimpan pautan:", error);
      setMesej("❌ Gagal merekodkan pautan bahan. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Daftar Bahan Rujukan (AI RAGs)</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Sila masukkan pautan (Google Drive/Canva) bahan rujukan. Bahan ini akan digunakan oleh Guru AI sebagai rujukan (RAG) untuk memberi maklum balas dan pemarkahan yang lebih tepat.
        </p>

        <form id="form-muat-naik" onSubmit={handleSimpanPautan} className="space-y-5">
          
          {/* Input Tajuk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tajuk Nota / Bahan</label>
            <input 
              type="text" 
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Cth: Skema Jawapan Sejarah Tingkatan 4 Bab 1"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Pilih Bab */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bab / Topik</label>
            <select 
              value={bab}
              onChange={(e) => setBab(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Bab 1">Bab 1</option>
              <option value="Bab 2">Bab 2</option>
              <option value="Bab 3">Bab 3</option>
              <option value="Bab 4">Bab 4</option>
              <option value="Bab 5">Bab 5</option>
              <option value="Bab 6">Bab 6</option>
              <option value="Bab 7">Bab 7</option>
              <option value="Bab 8">Bab 8</option>
              <option value="Bab 9">Bab 9</option>
              <option value="Bab 10">Bab 10</option>
              <option value="Umum">Bahan Umum</option>
            </select>
          </div>

          {/* Input Pautan (Ganti input File) */}
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
            <label className="block text-sm font-bold text-blue-800 mb-2">Pautan (URL) Bahan Teks/PDF</label>
            <p className="text-xs text-blue-600 mb-3 font-medium">Pastikan fail Google Drive anda ditetapkan kepada "Anyone with the link can view".</p>
            <input 
              type="url" 
              required
              value={pautanBahan}
              onChange={(e) => setPautanBahan(e.target.value)}
              placeholder="https://drive.google.com/file/d/..."
              className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Butang Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
            }`}
          >
            {loading ? "Menyimpan Rekod..." : "Simpan Pautan Bahan"}
          </button>

          {/* Mesej Status */}
          {mesej && (
            <div className={`p-4 rounded-lg text-sm font-medium ${mesej.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {mesej}
            </div>
          )}

        </form>
      </div>
    </div>
  );
}