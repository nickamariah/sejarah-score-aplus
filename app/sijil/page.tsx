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

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center font-sans print:bg-white print:p-0">
      
      {/* CSS KHAS UNTUK CETAKAN (A4 LANDSCAPE PENUH) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { width: 100%; height: 100%; margin: 0 !important; padding: 0 !important; background-color: white !important; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}} />

      {/* BUTANG MENU */}
      <div className="mb-6 flex gap-4 print:hidden w-full max-w-4xl justify-center md:justify-start items-center">
        <button onClick={() => window.close()} className="bg-slate-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-600 transition shadow-lg">
          <ArrowLeft className="w-5 h-5" /> Tutup
        </button>
        <button onClick={() => window.print()} className="bg-sky-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition shadow-lg hover:scale-105">
          <Printer className="w-5 h-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* WRAPPER SCROLL */}
      <div className="w-full overflow-x-auto flex justify-start md:justify-center pb-4 print:block print:overflow-visible print:pb-0">
        
        {/* BEKAS KANVAS SIJIL UTAMA */}
        <div 
          className={`min-w-[850px] md:min-w-0 w-full max-w-4xl aspect-[1.414] bg-gradient-to-br ${tema.gradient} rounded-xl shadow-2xl p-6 md:p-8 flex flex-col relative overflow-hidden shrink-0 mx-auto 
          print:shadow-none print:w-[297mm] print:h-[210mm] print:max-w-none print:min-w-0 print:aspect-auto print:rounded-none print:p-0 print:m-0`}
        >
          {/* BINGKAI DALAMAN */}
          <div className={`absolute inset-4 md:inset-5 border-[5px] border-double ${tema.border} opacity-50 rounded-lg pointer-events-none print:inset-8`}></div>
          
          {/* BINTANG PENJURU */}
          <Star className={`absolute top-8 left-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:w-16 print:h-16 print:top-14 print:left-14`} fill="currentColor" />
          <Star className={`absolute top-8 right-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:w-16 print:h-16 print:top-14 print:right-14`} fill="currentColor" />
          <Star className={`absolute bottom-8 left-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:w-16 print:h-16 print:bottom-14 print:left-14`} fill="currentColor" />
          <Star className={`absolute bottom-8 right-8 w-8 h-8 md:w-10 md:h-10 ${tema.border.replace('border-', 'text-')} opacity-40 print:w-16 print:h-16 print:bottom-14 print:right-14`} fill="currentColor" />

          {/* KANDUNGAN TENGAH (JARAK TELAH DISEIMBANGKAN UNTUK A4) */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 md:px-12 print:px-20 w-full h-full py-4 print:py-12">
            
            <div className="mb-3 md:mb-5 print:mb-6">
              <Award className="w-16 h-16 md:w-20 md:h-20 print:w-28 print:h-28 text-yellow-500 drop-shadow-md mx-auto" />
            </div>

            <p className="text-[10px] md:text-sm print:text-lg font-bold tracking-[0.2em] text-slate-500 uppercase mb-2 print:mb-2">I-RAGs Tutor • Sistem Pembelajaran Sejarah</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl print:text-[3.5rem] font-extrabold text-slate-800 mb-4 md:mb-6 print:mb-6 drop-shadow-sm font-serif">
              SIJIL PENGUASAAN
            </h1>

            <p className="text-sm md:text-lg print:text-xl text-slate-600 mb-2 md:mb-4 print:mb-6 italic">Dengan bangganya dianugerahkan kepada:</p>
            
            {/* NAMA MURID */}
           <div className="w-full px-2 mb-4 md:mb-6 print:mb-8 flex justify-center overflow-hidden">
               <h2 className={`font-black text-sky-900 border-b-2 print:border-b-4 border-slate-300 pb-2 print:pb-3 inline-block px-2 md:px-8 print:px-12 uppercase tracking-wide whitespace-nowrap ${
                 (namaMurid || "").length > 35 ? "text-base sm:text-lg md:text-xl print:text-2xl" :
                 (namaMurid || "").length > 25 ? "text-lg sm:text-xl md:text-2xl print:text-[2.2rem]" : 
                 (namaMurid || "").length > 15 ? "text-xl sm:text-2xl md:text-3xl print:text-[2.8rem]" : 
                 "text-2xl sm:text-3xl md:text-4xl print:text-[3.5rem]"
               }`}>
                 {namaMurid}
               </h2>
            </div>

            <p className="text-xs sm:text-sm md:text-base print:text-xl text-slate-700 max-w-2xl print:max-w-4xl leading-relaxed mb-4 md:mb-6 print:mb-8 px-4 print:px-0">
              Kerana telah menunjukkan dedikasi dan kefahaman yang sangat cemerlang dalam menguasai topik <br/>
              <strong className="text-slate-900 print:text-2xl mt-1.5 inline-block">Tingkatan {tingkatan}, Bab {bab}: {tema.tajuk}</strong> <br/>
              <span className="inline-block mt-1.5">dengan memperoleh skor ujian sebanyak <span className="font-bold text-lg md:text-xl print:text-3xl text-emerald-600">{skor}%</span>.</span>
            </p>

            {/* KATA-KATA SEMANGAT */}
            <div className={`mt-auto bg-white/60 p-3 md:p-4 print:p-5 rounded-xl border ${tema.border} shadow-sm max-w-3xl print:max-w-4xl w-full mx-auto`}>
              <p className="text-xs md:text-sm lg:text-base print:text-xl font-bold text-slate-800 italic">
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