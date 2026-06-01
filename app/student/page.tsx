"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, getDocs } from "firebase/firestore";
// PENTING: Pastikan path firebase ini betul
import { db } from "@/lib/firebase"; 

// Interface Ringkas untuk paparan senarai kad
interface UjianRingkas {
  idDokumen: string;
  bab: string;
  tingkatan: string;
  namaMurid: string;
  skorAkhir: number;
  markahPenuhUjian: number;
  statusPermarkahanEsei: string;
  tarikh: string;
}

export default function DashboardMurid() {
  const [senaraiUjian, setSenaraiUjian] = useState<UjianRingkas[]>([]);
  const [loading, setLoading] = useState(true);

  // ANDAIAN: Murid yang sedang login adalah M001
  // (Nota: Pastikan ejaan ID di database menggunakan sifar '0' atau huruf 'O' dengan betul)
  const idMuridSemasa = "M001"; 

  useEffect(() => {
    const fetchSenaraiUjian = async () => {
      try {
        // Bina query: Cari dalam 'skor_murid' di mana 'idMurid' == "M001"
        const q = query(
          collection(db, "skor_murid"), 
          where("idMurid", "==", idMuridSemasa)
        );
        
        const querySnapshot = await getDocs(q);
        const ujianData: UjianRingkas[] = [];
        
        querySnapshot.forEach((doc) => {
          // Masukkan data dokumen bersama-sama dengan ID dokumen
          ujianData.push({
            idDokumen: doc.id,
            ...(doc.data() as Omit<UjianRingkas, 'idDokumen'>)
          });
        });

        setSenaraiUjian(ujianData);
      } catch (error) {
        console.error("Ralat menarik data senarai ujian:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSenaraiUjian();
  }, [idMuridSemasa]);

  // Fungsi untuk format tarikh supaya cantik dibaca
  const formatTarikh = (tarikhString: string) => {
    if (!tarikhString) return "Tarikh tiada";
    const date = new Date(tarikhString);
    return date.toLocaleDateString('ms-MY', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-lg font-semibold text-gray-600">Memuatkan Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen">
      
      {/* HEADER DASHBOARD */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          Selamat Datang, {senaraiUjian.length > 0 ? senaraiUjian[0].namaMurid : "Pelajar"} 👋
        </h1>
        <p className="text-blue-100">
          Ini adalah pusat rujukan untuk melihat prestasi dan semakan Ujian Diagnostik anda.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-gray-800">Senarai Ujian Anda</h2>

      {/* GRID SENARAI KAD UJIAN */}
      {senaraiUjian.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {senaraiUjian.map((ujian) => (
            <Link 
              href={`/student/semakan-ujian/${ujian.idDokumen}`} 
              key={ujian.idDokumen}
              className="block group"
            >
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full flex flex-col justify-between">
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                      Tingkatan {ujian.tingkatan}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {formatTarikh(ujian.tarikh)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors">
                    Laporan Diagnostik: {ujian.bab}
                  </h3>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase mb-1">Skor Akhir</p>
                      <p className="text-2xl font-black text-purple-700">
                        {ujian.skorAkhir} <span className="text-sm font-medium text-purple-400">/ {ujian.markahPenuhUjian}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      ujian.statusPermarkahanEsei === 'disemak_oleh_guru' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {ujian.statusPermarkahanEsei === 'disemak_oleh_guru' ? 'DISEMAK GURU' : 'AUTO-SEMAK AI'}
                    </span>
                  </div>
                </div>

              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="text-4xl mb-3">📁</div>
          <h3 className="text-lg font-bold text-gray-700">Tiada rekod ujian setakat ini.</h3>
          <p className="text-gray-500 text-sm mt-2">Sila ambil ujian untuk melihat keputusan di sini.</p>
        </div>
      )}

    </div>
  );
}