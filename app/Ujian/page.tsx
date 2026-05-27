"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

// ==========================================
// 1. KOMPONEN KANDUNGAN UJIAN (Isi Sebenar)
// ==========================================
function KandunganUjian() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Baca parameter dari URL
  const tingkatan = searchParams.get("tingkatan") || "4";
  const bab = searchParams.get("bab") || "Bab 1";

  const [soalanSenarai, setSoalanSenarai] = useState<any[]>([]);
  const [indexSemasa, setIndexSemasa] = useState(0);
  const [skor, setSkor] = useState(0);
  const [tamat, setTamat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tarikSoalan = async () => {
      try {
        const q = query(
          collection(db, "questionBank"),
          where("tingkatan", "==", tingkatan), 
          where("bab", "==", bab)
        );

        const querySnapshot = await getDocs(q);
        const soalanData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          soalanData.push({ id: doc.id, ...doc.data() });
        });

        setSoalanSenarai(soalanData);
      } catch (error) {
        console.error("Ralat tarik soalan:", error);
      } finally {
        setLoading(false);
      }
    };

    tarikSoalan();
  }, [tingkatan, bab]);

  const jawabSoalan = (jawapanMurid: string) => {
    const soalanSemasa = soalanSenarai[indexSemasa];
    
    if (jawapanMurid === soalanSemasa.jawapan) {
      setSkor(prev => prev + 1);
    }

    if (indexSemasa + 1 < soalanSenarai.length) {
      setIndexSemasa(indexSemasa + 1);
    } else {
      setTamat(true);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sky-700 font-semibold">Memuatkan Soalan Firebase...</div>;
  
  if (soalanSenarai.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-md text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Soalan Belum Tersedia</h2>
        <p className="text-slate-600 mb-6">Guru belum memasukkan soalan untuk Tingkatan {tingkatan}, {bab}.</p>
        <button onClick={() => router.push('/murid')} className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700">
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );

  if (tamat) {
    const peratus = Math.round((skor / soalanSenarai.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-8 border-sky-500">
          <h2 className="text-3xl font-extrabold mb-4 text-slate-800">Ujian Diagnostik Tamat</h2>
          <p className="text-lg text-slate-600 mb-2">{bab} | Tingkatan {tingkatan}</p>
          <div className="text-5xl font-black text-sky-600 mb-8">{peratus}%</div>
          
          {peratus >= 80 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl mb-6">
              🔥 <strong>TAHNIAH! LALUAN CEMERLANG.</strong><br/>
              Anda telah menguasai bab ini. Modul Bacaan dilangkau.
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-6">
              📚 <strong>LALUAN BIMBINGAN (SCAFFOLDING).</strong><br/>
              Mari kita baca nota dan kukuhkan pemahaman anda bersama AI.
            </div>
          )}

          <button onClick={() => router.push('/murid')} className="w-full sm:w-auto bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition">
            Kembali ke Laluan Pembelajaran
          </button>
        </div>
      </div>
    );
  }

  const semasa = soalanSenarai[indexSemasa];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{bab}</h1>
            <p className="text-sm font-medium text-sky-600">{semasa.topik}</p>
          </div>
          <span className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            Soa