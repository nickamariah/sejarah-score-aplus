"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Printer, ArrowLeft, Star } from "lucide-react";

function KandunganSijil() {
  const searchParams = useSearchParams();
  const tingkatan = searchParams?.get("tingkatan") || "4";
  const bab = searchParams?.get("bab") || "1";
  const skor = searchParams?.get("skor") || "100";
  const namaDariURL = searchParams?.get("nama");

  const [namaMurid, setNamaMurid] = useState("MEMUATKAN NAMA...");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (namaDariURL) {
      setNamaMurid(decodeURIComponent(namaDariURL));
    } else {
      const rawUser = localStorage.getItem("currentUser");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        setNamaMurid(user.nama || user.name || "PELAJAR CEMERLANG");
      }
    }
  }, [namaDariURL]);

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
    "default": { 
      gradient: "from-slate-50 to-sky-100", border: "border-sky-300", 
      tajuk: `Bab ${bab}`,
      quote: `"Kejayaan hari ini adalah bukti usaha keras anda semalam. Teruskan melakar sejarah peribadi anda yang cemerlang!"` 
    }
  };

  const tema = sijilTema[bab] || sijilTema["default"];

  // 🌟 LOGIK AUTO-RESIZE NAMA MURID YANG TELAH DIBAIKI
  const panjangNama = namaMurid.length;
  let saizFontNama = "text-2xl sm:text-3xl md:text-4xl lg:text-5xl"; 
  
  if (panjangNama > 35) {
    saizFontNama = "text-lg sm:text-xl md:text-2xl"; // Untuk nama terlampau panjang
  } else if (panjangNama > 20) {
    saizFontNama = "text-xl sm:text-2xl md:text-3xl lg:text-4xl"; // Untuk nama sederhana panjang macam Nur Hawani Binti Rosli
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center font-sans print:bg-white print:p-0">
      
      {/* CSS KHAS UNTUK CETAKAN */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}} />

      <div className="mb-6 flex gap-4 print:hidden w-full max-w-4xl justify-center md:justify-start items-center">
        <button onClick={() => window.close()} className="bg-slate-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-600 transition shadow-lg">
          <ArrowLeft className="w-5 h-5" /> Tutup
        </button>
        <button onClick={() => window.print()} className="bg-sky-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition shadow-lg hover:scale-105">
          <Printer className="w-5 h-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* WRAPPER SCROLL UNTUK MOBILE */}
      <div className="w-full overflow-x-auto flex justify-start md:justify-center pb-4 print:overflow-hidden print:pb-0">
        
        {/* BEKAS KANVAS SIJIL UTAMA */}
        <div 
          className={`min-w-[850px] md:min-w-0 w-full max-w-4xl aspect-[1.414] bg-gradient-to-br ${tema.gradient} rounded-xl shadow-2xl p-6 md:p-8 flex flex-col relative overflow-hidden shrink-0 mx-auto print:shadow-none print:w-full print:h-screen print:rounded-none print:p-10`}
        >
          {/* BINGKAI DALAMAN */}
          <div className={`absolute inset-4 md:inset-5 border-[5px] border-double ${tema.border} opacity-50 rounded-lg pointer-events-none print:inset-6`}></div>
          
          {/* BINTANG PENJURU */}
          <Star className={`absolute top-8 left-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:top-12 print:left-12`} fill="currentColor" />
          <Star className={`absolute top-8 right-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:top-12 print:right-12`} fill="currentColor" />
          <Star className={`absolute bottom-8 left-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:bottom-12 print:left-12`} fill="currentColor" />
          <Star className={`absolute bottom-8 right-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:bottom-12 print:right-12`} fill="currentColor" />

          {/* KANDUNGAN TENGAH */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 md:px-12 w-full h-full py-4">
            
            <div className="mb-3 md:mb-5">
              <Award className="w-16 h-16 md:w-20 md:h-20 text-yellow-500 drop-shadow-md mx-auto" />
            </div>

            <p className="text-[10px] md:text-sm font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">I-RAGs Tutor • Sistem Pembelajaran Sejarah</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-800 mb-4 md:mb-6 drop-shadow-sm font-serif">
              SIJIL PENGUASAAN
            </h1>

            <p className="text-sm md:text-lg text-slate-600 mb-2 md:mb-4 italic">Dengan bangganya dianugerahkan kepada:</p>
            
            {/* 🌟 NAMA MURID (BEBAS DARI PEMOTONGAN ELLIPSIS) */}
            <div className="w-full px-2 mb-4 md:mb-6">
               <h2 className={`${saizFontNama} font-black text-sky-900 border-b-2 border-slate-300 pb-2 inline-block px-4 md:px-8 uppercase tracking-wide leading-tight max-w-full`}>
                 {namaMurid}
               </h2>
            </div>

            <p className="text-xs sm:text-sm md:text-base text-slate-700 max-w-2xl leading-relaxed mb-4 md:mb-6 px-4">
              Kerana telah menunjukkan dedikasi dan kefahaman yang sangat cemerlang dalam menguasai topik <br/>
              <strong className="text-slate-900">Tingkatan {tingkatan}, Bab {bab}: {tema.tajuk}</strong> <br/>
              dengan memperoleh skor ujian sebanyak <span className="font-bold text-lg md:text-xl text-emerald-600">{skor}%</span>.
            </p>

            {/* 🌟 KATA-KATA SEMANGAT (DITOLAK KE ATAS, KEMAS DI TENGAH-BAWAH) */}
            <div className={`mt-auto bg-white/60 p-3 md:p-4 rounded-xl border ${tema.border} shadow-sm max-w-3xl w-full mx-auto`}>
              <p className="text-xs md:text-sm lg:text-base font-bold text-slate-800 italic">
                {tema.quote}
              </p>
            </div>

          </div>
        </div>

      </div>

      <p className="md:hidden text-slate-400 text-xs mt-2 italic text-center animate-pulse print:hidden">
        *Leret ke kiri/kanan untuk lihat sijil penuh
      </p>

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