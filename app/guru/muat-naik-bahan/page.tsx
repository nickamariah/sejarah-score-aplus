"use client";

import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase"; // Pastikan path ini betul

export default function MuatNaikBahanRujukan() {
  const [fail, setFail] = useState<File | null>(null);
  const [tajuk, setTajuk] = useState("");
  const [bab, setBab] = useState("Bab 1"); // Default
  const [loading, setLoading] = useState(false);
  const [mesej, setMesej] = useState("");

  // Fungsi untuk handle pemilihan fail
  const handlePilihFail = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Pastikan hanya PDF
      if (selectedFile.type !== "application/pdf") {
        setMesej("Sila muat naik fail berformat PDF sahaja.");
        setFail(null);
        return;
      }
      setFail(selectedFile);
      setMesej("");
    }
  };

  // Fungsi untuk muat naik ke Firebase
  const handleMuatNaik = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fail) {
      setMesej("Sila pilih fail PDF terlebih dahulu.");
      return;
    }

    setLoading(true);
    setMesej("");

    try {
      // 1. Cipta rujukan (path) di Firebase Storage
      // Format nama fail: bahan_rujukan/Bab1_timestamp_namafail.pdf
      const namaFailUnik = `${bab.replace(/\s+/g, '')}_${Date.now()}_${fail.name}`;
      const storageRef = ref(storage, `bahan_rujukan/${namaFailUnik}`);

      // 2. Muat naik fail fizikal ke Firebase Storage
      await uploadBytes(storageRef, fail);
      
      // 3. Dapatkan pautan (URL) fail tersebut
      const downloadURL = await getDownloadURL(storageRef);

      // 4. Simpan maklumat fail (metadata) ke dalam Firestore
      await addDoc(collection(db, "bahan_rujukan"), {
        tajuk: tajuk,
        bab: bab,
        namaFail: fail.name,
        urlPautan: downloadURL,
        tarikhMuatNaik: new Date().toISOString(),
        jenis: "PDF"
      });

      setMesej("✅ Fail berjaya dimuat naik dan direkodkan!");
      setFail(null);
      setTajuk("");
      // Reset form pada HTML
      (document.getElementById("form-muat-naik") as HTMLFormElement).reset();

    } catch (error) {
      console.error("Ralat memuat naik:", error);
      setMesej("❌ Gagal memuat naik fail. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-gray-50 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Muat Naik Bahan Rujukan (PDF)</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Bahan yang dimuat naik di sini akan digunakan oleh Gemini AI sebagai rujukan (RAG) untuk memberi maklum balas dan pemarkahan yang lebih tepat.
        </p>

        <form id="form-muat-naik" onSubmit={handleMuatNaik} className="space-y-5">
          
          {/* Input Tajuk */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tajuk Nota / Bahan</label>
            <input 
              type="text" 
              required
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="Cth: Nota Sejarah Tingkatan 4 Bab 1"
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
              <option value="Umum">Umum (Semua Bab)</option>
            </select>
          </div>

          {/* Input Fail PDF */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
            <input 
              type="file" 
              accept="application/pdf" 
              onChange={handlePilihFail}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-2">Hanya fail .pdf dibenarkan (Maksimum 10MB dicadangkan)</p>
          </div>

          {/* Butang Submit */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-md"
            }`}
          >
            {loading ? "Memuat Naik..." : "Muat Naik Fail Sekarang"}
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