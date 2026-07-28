"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Printer, ArrowLeft, Star } from "lucide-react";

function KandunganSijil() {
  const searchParams = useSearchParams();
  const tingkatan = searchParams?.get("tingkatan") || "4";
  const bab = searchParams?.get("bab") || "1";
  const skor = searchParams?.get("skor") || "100";

  const [namaMurid, setNamaMurid] = useState("MEMUATKAN NAMA...");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      setNamaMurid(user.nama || user.name || "PELAJAR CEMERLANG");
    }
  }, []);

  // 🌟 DATA DINAMIK: Warna & Kata-Kata Semangat Berbeza Mengikut Bab
  const sijilTema: Record<string, { gradient: string; border: string; quote: string; tajuk: string }> = {
    "1": { 
      gradient: "from-amber-50 to-orange-100", border: "border-orange-300", 
      tajuk: "Warisan Negara Bangsa",
      quote: `"Bangsa yang tidak mengenali sejarahnya adalah bangsa yang kehilangan jati diri. Teruskan memelihara warisan kita!"` 
    },
    "2": { 
      gradient: "from-blue-50 to-cyan-100", border: "border-cyan-300", 
      tajuk: "Kebangkitan Nasionalisme",
      quote: `"Semangat juang yang tinggi bermula dari minda yang merdeka. Syabas atas semangat nasionalisme anda!"` 
    },
    "3": { 
      gradient: "from-emerald-50 to-teal-100", border: "border-teal-300", 
      tajuk: "Konflik Dunia & Pendudukan Jepun",
      quote: `"Dunia yang damai dibina oleh mereka yang belajar dari kesilapan konflik masa lalu. Hebat!"` 
    },
    "4": { 
      gradient: "from-purple-50 to-fuchsia-100", border: "border-fuchsia-300", 
      tajuk: "Era Peralihan Kuasa British",
      quote: `"Setiap peralihan membawa cabaran, dan anda telah membuktikan anda mampu mengatasinya dengan cemerlang."` 
    },
    "5": { 
      gradient: "from-rose-50 to-pink-100", border: "border-pink-300", 
      tajuk: "Persekutuan Tanah Melayu 1948",
      quote: `"Penyatuan membawa kekuatan. Anda telah menunjukkan kefahaman jitu tentang erti perpaduan tanah air."` 
    },
    // Default jika bab > 5 atau T5
    "default": { 
      gradient: "from-slate-50 to-sky-100", border: "border-sky-300", 
      tajuk: `Bab ${bab}`,
      quote: `"Kejayaan hari ini adalah bukti usaha keras anda semalam. Teruskan melakar sejarah peribadi anda yang cemerlang!"` 
    }
  };

  const tema = sijilTema[bab] || sijilTema["default"];

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      
      {/* 🛑 BUTANG KAWALAN (Akan ghaib bila di-print) */}
      <div className="mb-6 flex gap-4 print:hidden">
        <button onClick={() => window.close()} className="bg-slate-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-600 transition shadow-lg">
          <ArrowLeft className="w-5 h-5" /> Tutup
        </button>
        <button onClick={() => window.print()} className="bg-sky-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition shadow-lg">
          <Printer className="w-5 h-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* 📜 KANVAS SIJIL (Format A4 Landscape) */}
      <div 
        className={`w-full max-w-[1050px] aspect-[1.414] bg-gradient-to-br ${tema.gradient} rounded-lg shadow-2xl p-6 md:p-12 flex flex-col relative overflow-hidden`}
        style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} // Memaksa browser print warna background
      >
        {/* Border Dalam (Corak Sijil) */}
        <div className={`absolute inset-4 md:inset-8 border-[6px] border-double ${tema.border} opacity-50 rounded-lg pointer-events-none`}></div>
        
        {/* Dekorasi Bucu */}
        <Star className={`absolute top-10 left-10 w-12 h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
        <Star className={`absolute top-10 right-10 w-12 h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
        <Star className={`absolute bottom-10 left-10 w-12 h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
        <Star className={`absolute bottom-10 right-10 w-12 h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
          
          <div className="mb-4">
            <Award className="w-20 h-20 md:w-28 md:h-28 text-yellow-500 drop-shadow-md mx-auto" />
          </div>

          <p className="text-sm md:text-lg font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">I-RAGs Tutor • Sistem Pembelajaran Sejarah</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-6 drop-shadow-sm font-serif">
            SIJIL PENGUASAAN
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-4 italic">Dengan bangganya dianugerahkan kepada:</p>
          
          {/* NAMA MURID */}
          <h2 className="text-3xl md:text-5xl font-black text-sky-900 mb-6 border-b-2 border-slate-300 pb-2 inline-block px-8 uppercase tracking-wide">
            {namaMurid}
          </h2>

          <p className="text-base md:text-xl text-slate-700 max-w-2xl leading-relaxed mb-8">
            Kerana telah menunjukkan dedikasi dan kefahaman yang sangat cemerlang dalam menguasai topik <br/>
            <strong className="text-slate-900">Tingkatan {tingkatan}, Bab {bab}: {tema.tajuk}</strong> <br/>
            dengan memperoleh skor ujian sebanyak <span className="font-bold text-2xl text-emerald-600">{skor}%</span>.
          </p>

          {/* KATA-KATA SEMANGAT */}
          <div className={`mt-auto bg-white/60 p-4 md:p-6 rounded-2xl border ${tema.border} shadow-sm max-w-3xl`}>
            <p className="text-sm md:text-lg font-bold text-slate-800 italic">
              {tema.quote}
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default function SijilPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-800 text-white">Menjana Sijil...</div>}>
      <KandunganSijil />
    </Suspense>
  );
}