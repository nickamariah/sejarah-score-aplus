'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import Link from 'next/link';

interface MaklumatUjian {
  bab: string;
  tingkatan: string;
  namaMurid: string;
  skor: number; // Dalam %
  skorAkhir: number;
  markahPenuhUjian: number;
  tarikh: string;
  idMurid: string;
}

function PaparanSijil() {
  const searchParams = useSearchParams();
  // Kita pastikan ID yang ditangkap dibaca dengan betul (buang %20 jadi space balik)
  const rawId = searchParams.get('id') || '';
  const idUjian = decodeURIComponent(rawId);

  const [dataUjian, setDataUjian] = useState<MaklumatUjian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const tarikData = async () => {
      if (!idUjian) {
        setError('Tiada ID ujian disertakan pada pautan ini.');
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'skor_murid', idUjian);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setDataUjian(docSnap.data() as MaklumatUjian);
        } else {
          setError('Maaf, rekod sijil tidak dijumpai. Sila pastikan ID betul.');
        }
      } catch (err) {
        console.error("Ralat sistem:", err);
        setError('Berlaku ralat ketika menghubungi pangkalan data.');
      } finally {
        setLoading(false);
      }
    };

    tarikData();
  }, [idUjian]);

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-500 mb-4"></div>
      <p className="font-bold text-gray-600">Menjana Sijil Pengesahan...</p>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center h-screen text-xl text-red-500 font-bold bg-slate-50">{error}</div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-100 font-sans">
      
      {dataUjian && (
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border-4 border-double border-orange-200 relative">
          
          {/* Corak Sijil (Header) */}
          <div className="bg-linear-to-r from-amber-500 via-orange-500 to-amber-500 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <h1 className="text-4xl font-black mb-2 relative z-10 tracking-wider">SIJIL PENGESAHAN I-RAGS</h1>
            <p className="text-orange-100 font-medium text-lg relative z-10">Pencapaian Cemerlang Ujian Diagnostik</p>
          </div>
          
          <div className="p-10 text-center">
            <p className="text-gray-500 mb-2">Dengan ini disahkan bahawa</p>
            <h2 className="text-3xl font-bold text-gray-800 uppercase tracking-wide border-b-2 border-gray-200 inline-block pb-2 mb-6">
              {dataUjian.namaMurid}
            </h2>
            <p className="text-gray-500 mb-8">({dataUjian.idMurid})</p>

            <p className="text-lg text-gray-700 mb-2">Telah berjaya menamatkan ujian dengan cemerlang bagi topik:</p>
            <p className="text-xl font-bold text-blue-800 bg-blue-50 py-3 px-6 rounded-lg inline-block mb-8 border border-blue-100">
              Tingkatan {dataUjian.tingkatan} - {dataUjian.bab}
            </p>

            <div className="flex justify-center gap-10 mb-8">
               <div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Markah</p>
                  <p className="text-3xl font-black text-orange-600">{dataUjian.skorAkhir}<span className="text-lg text-gray-400">/{dataUjian.markahPenuhUjian}</span></p>
               </div>
               <div>
                  <p className="text-sm text-gray-500 font-bold uppercase mb-1">Peratusan</p>
                  <p className="text-3xl font-black text-orange-600">{dataUjian.skor}%</p>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-between items-end text-left text-sm text-gray-500">
              <div>
                 <p><strong>ID Rujukan Sijil:</strong></p>
                 <p className="font-mono text-xs">{idUjian}</p>
              </div>
              <div className="text-right">
                 <p className="font-bold text-orange-600 text-lg">I-RAGS SYSTEM</p>
              </div>
            </div>
          </div>
          
        </div>
      )}

      {/* Butang Tutup / Kembali */}
      <div className="mt-8">
        <button 
          onClick={() => {
            window.close(); // 1. Cuba tutup tab (Berfungsi jika murid klik dari butang oren)
            window.history.back(); // 2. Jika browser halang, sistem akan bawa kembali ke page markah
          }} 
          className="text-gray-500 hover:text-gray-800 font-bold transition flex items-center gap-2 bg-white px-6 py-2 rounded-full shadow-sm border border-gray-200 "
        >
          Tutup Sijil ✖
        </button>
      </div>

    </div>
  );
}

// Kena letak Suspense kalau guna useSearchParams
export default function SijilSemakanPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Memuatkan sijil...</div>}>
      <PaparanSijil />
    </Suspense>
  );
}