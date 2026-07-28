"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Gamepad2, Sparkles, CheckCircle2, ArrowRight, BrainCircuit } from "lucide-react";

function GameKandungan() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tingkatan = searchParams?.get("tingkatan") || "4";
  const bab = searchParams?.get("bab") || "Bab 1";
  const aras = searchParams?.get("aras") || "rendah";

  const [loading, setLoading] = useState(true);
  const [pasangan, setPasangan] = useState<{ id: number; q: string; a: string }[]>([]);
  const [kadSoalan, setKadSoalan] = useState<{ id: number; teks: string }[]>([]);
  const [kadJawapan, setKadJawapan] = useState<{ id: number; teks: string }[]>([]);

  const [pilihQ, setPilihQ] = useState<number | null>(null);
  const [pilihA, setPilihA] = useState<number | null>(null);
  const [padananBerjaya, setPadananBerjaya] = useState<number[]>([]);
  const [ralatSeketika, setRalatSeketika] = useState(false);

  // Fungsi kocok (shuffle) kad supaya rawak
  const shuffleArray = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

  useEffect(() => {
    const janaPermainanAI = async () => {
      try {
        // Panggil API OpenAI untuk jana 5 pasangan soalan (Fail API akan dibina selepas ini)
        const res = await fetch("/api/jana-game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tingkatan, bab, aras })
        });

        if (!res.ok) throw new Error("Gagal jana permainan");
        const data = await res.json();

        // Menyusun data kepada bentuk kad berasingan
        const formatData = data.pasangan.map((item: any, i: number) => ({
          id: i + 1, q: item.soalan, a: item.jawapan
        }));

        setPasangan(formatData);
        setKadSoalan(shuffleArray(formatData.map((d: any) => ({ id: d.id, teks: d.q }))));
        setKadJawapan(shuffleArray(formatData.map((d: any) => ({ id: d.id, teks: d.a }))));
      } catch (error) {
        console.error("Ralat bina game:", error);
        // Data sandaran (Fallback) jika AI gagal
        const fallback = [
          { id: 1, q: "Pemerintah tertinggi kerajaan", a: "Sultan" },
          { id: 2, q: "Membantu urusan kewangan", a: "Bendahari" },
          { id: 3, q: "Menjaga keamanan laut", a: "Laksamana" },
          { id: 4, q: "Ketua pentadbir dan penasihat", a: "Bendahara" },
          { id: 5, q: "Menjaga keamanan kota", a: "Temenggung" }
        ];
        setKadSoalan(shuffleArray(fallback.map(d => ({ id: d.id, teks: d.q }))));
        setKadJawapan(shuffleArray(fallback.map(d => ({ id: d.id, teks: d.a }))));
      } finally {
        setLoading(false);
      }
    };
    janaPermainanAI();
  }, [tingkatan, bab, aras]);

  // Logik Memadankan Kad
  useEffect(() => {
    if (pilihQ !== null && pilihA !== null) {
      if (pilihQ === pilihA) {
        // Jika Betul!
        setPadananBerjaya(prev => [...prev, pilihQ]);
        setPilihQ(null);
        setPilihA(null);
      } else {
        // Jika Salah (Gegar sekejap dan reset)
        setRalatSeketika(true);
        setTimeout(() => {
          setPilihQ(null);
          setPilihA(null);
          setRalatSeketika(false);
        }, 800);
      }
    }
  }, [pilihQ, pilihA]);

  const permainanTamat = padananBerjaya.length === 5 && !loading;

  const simpanDanSeterusnya = () => {
    // 🌟 REKOD GAME SELESAI DALAM LOCALSTORAGE UNTUK DASHBOARD BACA
    const completedGames = JSON.parse(localStorage.getItem("completedGames") || "[]");
    const gameKey = `t${tingkatan}-bab${bab.replace("Bab ", "")}`;
    if (!completedGames.includes(gameKey)) {
      completedGames.push(gameKey);
      localStorage.setItem("completedGames", JSON.stringify(completedGames));
    }
    // Hantar murid kembali ke Ujian Pasca
    router.push(`/jawab?tingkatan=${tingkatan}&bab=${bab}&jenisUjian=post_test`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white px-4 text-center">
        <BrainCircuit className="w-16 h-16 text-purple-400 animate-pulse mb-6" />
        <h2 className="text-2xl font-bold mb-2">AI Sedang Membina Permainan...</h2>
        <p className="text-slate-400">Merangka soalan khas untuk {bab} berdasarkan aras anda.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 flex flex-col items-center font-sans">
      <div className="max-w-4xl w-full">
        
        <div className="mb-8 text-center">
          <span className="bg-purple-100 text-purple-800 px-4 py-1.5 rounded-full text-sm font-bold uppercase flex items-center gap-2 w-max mx-auto shadow-sm border border-purple-200">
            <Gamepad2 className="w-4 h-4" /> Intervensi Interaktif
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 mt-4">Padankan Fakta!</h1>
          <p className="text-slate-500 mt-2">Pilih kad soalan di sebelah kiri dan cari jawapan yang tepat di sebelah kanan.</p>
        </div>

        {permainanTamat ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-10 rounded-3xl shadow-xl text-center border-t-8 border-emerald-500">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">Tahniah! Anda Hebat! 🎉</h2>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">Anda berjaya memadankan semua fakta dengan betul. Kini anda sudah bersedia untuk menebus kembali markah anda.</p>
            <button onClick={simpanDanSeterusnya} className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition flex items-center gap-3 mx-auto shadow-md">
              Seterusnya: Ambil Ujian Pasca <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 relative">
            
            {/* KAD SOALAN */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 text-center mb-4 bg-white py-2 rounded-xl border border-slate-200 shadow-sm">KAD SOALAN</h3>
              {kadSoalan.map((q) => {
                const isMatched = padananBerjaya.includes(q.id);
                const isSelected = pilihQ === q.id;
                
                if (isMatched) return <div key={q.id} className="h-20 bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl opacity-50"></div>;
                
                return (
                  <button key={q.id} onClick={() => setPilihQ(q.id)}
                    className={`w-full h-24 px-6 p-4 rounded-2xl font-bold text-left transition-all flex items-center shadow-sm border-2
                      ${isSelected ? 'bg-purple-600 text-white border-purple-700 scale-[1.02]' : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50'}
                      ${ralatSeketika && isSelected ? 'animate-bounce bg-red-500 border-red-600' : ''}
                    `}>
                    {q.teks}
                  </button>
                );
              })}
            </div>

            {/* KAD JAWAPAN */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-700 text-center mb-4 bg-white py-2 rounded-xl border border-slate-200 shadow-sm">KAD JAWAPAN</h3>
              {kadJawapan.map((a) => {
                const isMatched = padananBerjaya.includes(a.id);
                const isSelected = pilihA === a.id;
                
                if (isMatched) return <div key={a.id} className="h-20 bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl opacity-50"></div>;

                return (
                  <button key={a.id} onClick={() => setPilihA(a.id)}
                    className={`w-full h-24 px-6 p-4 rounded-2xl font-bold text-center transition-all flex items-center justify-center shadow-sm border-2
                      ${isSelected ? 'bg-amber-500 text-white border-amber-600 scale-[1.02]' : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50'}
                      ${ralatSeketika && isSelected ? 'animate-bounce bg-red-500 border-red-600' : ''}
                    `}>
                    {a.teks}
                  </button>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

export default function PermainanInteraktif() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">Memuatkan...</div>}>
      <GameKandungan />
    </Suspense>
  );
}