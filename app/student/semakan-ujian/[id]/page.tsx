"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// KITA TAMBAH collection, query, where, getDocs UNTUK TARIK SOALAN SEBENAR
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

// 1. Interface Database
interface UlasanDetail {
  komenAI: string;
  markahAI?: number;
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
  namaGuru?: string; 
  tarikh: string;
  jawapanObjektif?: Record<string, string>; // TAMBAH INI UNTUK BACA OBJEKTIF
  jawapanStruktur: Record<string, string>; 
  ulasanAI: Record<string, UlasanDetail>;
  markahGuru?: Record<string, number>;
}

export default function SemakanUjianMurid() {
  const params = useParams();
  const router = useRouter(); 
  const documentId = params.id as string; 

  const [data, setData] = useState<SkorMuridData | null>(null);
  const [soalanBank, setSoalanBank] = useState<any[]>([]); // STATE BARU UNTUK SIMPAN SOALAN
  const [loading, setLoading] = useState(true);

   // 2. Fungsi untuk tarik data dari Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const decodedId = decodeURIComponent(documentId); 
        
        // A) Tarik markah murid
        const docRef = doc(db, "skor_murid", decodedId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const resultData = docSnap.data() as SkorMuridData;
          setData(resultData);

          // B) Tarik teks soalan sebenar dari questionBank
          const q = query(
            collection(db, "questionBank"), 
            where("tingkatan", "==", resultData.tingkatan),
            where("bab", "==", resultData.bab)
          );
          const qSnap = await getDocs(q);
          const qList: any[] = [];
          qSnap.forEach((d) => qList.push({ id: d.id, ...d.data() }));
          
          // Susun soalan ikut ID (S001, S002...)
          qList.sort((a, b) => a.id.localeCompare(b.id));
          setSoalanBank(qList);

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

  const jawapanObjektifMurid = data.jawapanObjektif || {};

  // 5. Paparan Utama (Header & Markah)
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-gray-50 min-h-screen">
      
      {/* BUTANG KEMBALI */}
      <div className="mb-6">
  <button 
    onClick={() => window.location.href = '/murid'} 
    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
    Kembali ke Dashboard
  </button>
</div>

      {/* KAD MAKLUMAT PELAJAR */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Laporan Diagnostik: {data.bab}</h1>
            <p className="text-gray-500">Tingkatan {data.tingkatan} • {data.namaMurid} ({data.idMurid})</p>
          </div>
          <span className={`mt-2 md:mt-0 px-4 py-1.5 text-sm rounded-full font-semibold uppercase ${
            data.statusPermarkahanEsei === 'disemak_oleh_guru' 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            {data.statusPermarkahanEsei === 'disemak_oleh_guru' && data.namaGuru
              ? `DISEMAK OLEH: ${data.namaGuru}`
              : data.statusPermarkahanEsei.replace(/_/g, ' ')}
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
            <p className="text-xs text-purple-600 font-bold uppercase">Skor Keseluruhan</p>
            <p className="text-3xl font-black text-purple-800 mt-1">
              {data.skorAkhir} <span className="text-lg text-purple-500 font-medium">/ {data.markahPenuhUjian}</span>
              {/* KITA TAMBAH PERATUS DI SINI 👇 */}
              <span className="ml-3 text-2xl text-purple-600 font-bold">({data.skor}%)</span>
            </p>
          </div>
        </div>
      </div>

      {/* BAHAGIAN 2: SENARAI JAWAPAN & ULASAN AI */}
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold text-gray-800 px-1 border-b pb-2">Semakan Terperinci & Refleksi</h2>
        
        {soalanBank.length > 0 ? (
          soalanBank.map((soalan, index) => {
            const jenis = soalan.jenis?.toLowerCase() || "objektif";
            
            // ==========================================
            // LOGIK PAPARAN SOALAN OBJEKTIF
            // ==========================================
            if (jenis === "objektif") {
              const jawapanPilihanMurid = jawapanObjektifMurid[soalan.id];
              const isBetul = jawapanPilihanMurid === soalan.jawapan;
              
              return (
                <div key={soalan.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="mb-4">
                    <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm border border-gray-200">Soalan {index + 1}</span>
                    <p className="mt-3 font-medium text-gray-800">{soalan.soalan}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-md border ${isBetul ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <span className={`text-xs font-bold uppercase block mb-1 ${isBetul ? 'text-green-600' : 'text-red-600'}`}>
                        {isBetul ? '✅ Jawapan Anda (Betul)' : '❌ Jawapan Anda (Salah)'}
                      </span>
                      <p className="font-medium text-gray-800">
                        {jawapanPilihanMurid ? `${jawapanPilihanMurid}: ${soalan.pilihan?.[jawapanPilihanMurid]}` : <span className="text-gray-400 italic">Tiada jawapan</span>}
                      </p>
                    </div>

                    {!isBetul && (
                      <div className="p-4 rounded-md border bg-blue-50 border-blue-200">
                        <span className="text-xs font-bold uppercase block mb-1 text-blue-600">💡 Jawapan Sebenar</span>
                        <p className="font-medium text-gray-800">{soalan.jawapan}: {soalan.pilihan?.[soalan.jawapan]}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            } 
// ==========================================
            // LOGIK PAPARAN SOALAN STRUKTUR
            // ==========================================
            else {
              const jawapanEseiMurid = data.jawapanStruktur?.[soalan.id];
              const ulasan = data.ulasanAI?.[soalan.id];
              
              // 🌟 KIRA MARKAH AKHIR (Utamakan markah guru, kalau cikgu belum tanda, baru tunjuk markah AI)
              const markahAkhir = data.markahGuru?.[soalan.id] !== undefined 
                                    ? data.markahGuru[soalan.id] 
                                    : (ulasan?.markahAI || 0);

              return (
                <div key={soalan.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="mb-4 flex justify-between items-start gap-4">
                    <div>
                      <span className="font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-md text-sm border border-gray-200">Soalan {index + 1}</span>
                      <p className="mt-3 font-medium text-gray-800">{soalan.soalan}</p>
                    </div>
                    
                    {/* 🌟 KOTAK TAYANG MARKAH (GURU / AI) */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                        {data.markahGuru?.[soalan.id] !== undefined ? 'Disemak Guru' : 'Disemak AI'}
                      </span>
                      <span className={`text-sm font-black px-3 py-1.5 rounded-lg border shadow-sm ${
                         markahAkhir === Number(soalan.markah) ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 
                         markahAkhir > 0 ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        Skor: {markahAkhir} / {soalan.markah}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="p-4 rounded-md border bg-gray-50 border-gray-200">
                      <span className="text-xs font-semibold uppercase block mb-1 text-gray-500">Jawapan Anda:</span>
                      <p className="font-medium text-gray-800 whitespace-pre-wrap">
                        {jawapanEseiMurid ? jawapanEseiMurid : <span className="text-gray-400 italic">Tiada jawapan diberikan</span>}
                      </p>
                    </div>
                  </div>

                  {ulasan && (
                    <div className="bg-indigo-50 p-4 rounded-md border border-indigo-100 flex gap-4 items-start">
                      <div className="text-2xl mt-1">🤖</div>
                      <div className="flex-1">
                        <span className="text-xs font-semibold uppercase block mb-1 text-indigo-600">
                          Ulasan AI (Asal):
                        </span>
                        <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-wrap">
                          {ulasan.komenAI}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          })
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 italic">
            Tiada rekod soalan dijumpai.
          </div>
        )}
      </div>
    </div>
  );
}