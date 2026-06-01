"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
// PENTING: Ubah path ini mengikut lokasi fail config firebase anda
import { db } from "@/lib/firebase"; 

// 1. Interface Database (Dari gambar yang anda kongsikan)
interface UlasanDetail {
  komenAI: string;
}

interface SkorMuridData {
  bab: string;
  idMurid: string;
  namaMurid: string;
  tingkatan: string;
  markahPenuhUjian: number;
  skor: number;         
  skorAkhir: number;    
  skorObjektif: number; 
  markahStruktur: number;
  statusPermarkahanEsei: string;
  tarikh: string;
  jawapanStruktur: Record<string, string>; 
  ulasanAI: Record<string, UlasanDetail>;
}

export default function SemakanUjianMurid() {
  const params = useParams();
  const documentId = params.id as string; // Contoh: "M001_t4_Bab 1" (Dalam URL ia mungkin ada %20 untuk space)

  const [data, setData] = useState<SkorMuridData | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. Fungsi untuk tarik data dari Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Decode URI jika ada space dalam ID, cth: M001_t4_Bab%201 -> M001_t4_Bab 1
        const decodedId = decodeURIComponent(documentId); 
        
        const docRef = doc(db, "skor_murid", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData(docSnap.data() as SkorMuridData);
          console.log("Data berjaya ditarik:", docSnap.data());
        } else {
          console.log("Tiada dokumen dijumpai untuk ID:", decodedId);
        }
      } catch (error) {
        console.error("Ralat Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchData();
    }
  }, [documentId]);

  // 3. Paparan ketika loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-gray-600">Memuatkan data semakan...</p>
      </div>
    );
  }

  // 4. Paparan jika tiada data
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold text-red-500">
          Ralat: Rekod ujian tidak dijumpai. Pastikan URL betul.
        </p>
      </div>
    );
  }

  // 5. Paparan Utama (Header & Markah)
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* KAD MAKLUMAT PELAJAR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan Diagnostik: {data.bab}</h1>
            <p className="text-gray-500">Tingkatan {data.tingkatan} • {data.namaMurid} ({data.idMurid})</p>
          </div>
          <span className={`mt-2 md:mt-0 px-4 py-1.5 text-sm rounded-full font-semibold ${
            data.statusPermarkahanEsei === 'disemak_oleh_guru' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            {data.statusPermarkahanEsei.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        {/* BAHAGIAN MARKAH */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase">Skor Objektif</p>
            <p className="text-2xl font-black text-blue-800 mt-1">{data.skorObjektif}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center border border-indigo-100">
            <p className="text-xs text-indigo-600 font-bold uppercase">Markah Struktur</p>
            <p className="text-2xl font-black text-indigo-800 mt-1">{data.markahStruktur}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100 col-span-2">
            <p className="text-xs text-purple-600 font-bold uppercase">Skor Akhir / Keseluruhan</p>
            <p className="text-3xl font-black text-purple-800 mt-1">
              {data.skorAkhir} <span className="text-lg text-purple-500 font-medium">/ {data.markahPenuhUjian}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Placeholder untuk Senarai Jawapan (Akan dibuat di Langkah 2) */}
      {/* BAHAGIAN 2: SENARAI JAWAPAN & ULASAN AI */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-bold text-gray-800 px-1">Semakan Terperinci & Bimbingan AI</h2>
        
        {/* Loop melalui jawapanStruktur (jika ada data) */}
        {data.jawapanStruktur && Object.keys(data.jawapanStruktur).length > 0 ? (
          Object.entries(data.jawapanStruktur).map(([soalanId, jawapanMurid], index) => {
            
            // Tarik komen AI berdasarkan ID soalan yang sama (cth: B1S001)
            const ulasan = data.ulasanAI?.[soalanId]?.komenAI || "Tiada bimbingan AI untuk soalan ini.";

            return (
              <div key={soalanId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                {/* ID Soalan (Nanti kita boleh ganti dengan teks soalan sebenar) */}
                <div className="mb-4">
                  <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm border border-gray-200">
                    Soalan: {soalanId}
                  </span>
                </div>

                <div className="mb-4">
                  {/* Jawapan Murid */}
                  <div className="p-4 rounded-md border bg-gray-50 border-gray-200">
                    <span className="text-xs font-semibold uppercase block mb-1 text-gray-500">Jawapan Anda:</span>
                    <p className="font-medium text-gray-800">
                      {jawapanMurid ? jawapanMurid : <span className="text-gray-400 italic">Tiada jawapan diberikan</span>}
                    </p>
                  </div>
                </div>

                {/* AI Scaffolding/Ulasan */}
                <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 flex gap-4 items-start">
                  <div className="text-2xl mt-1">🤖</div>
                  <div className="flex-1">
                    <span className="text-xs font-semibold uppercase block mb-1 text-indigo-600">Bimbingan AI (Scaffolding):</span>
                    <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                      {ulasan}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 italic">
            Tiada rekod jawapan struktur dijumpai untuk ujian ini.
          </div>
        )}
      </div>

    </div>
  );
}