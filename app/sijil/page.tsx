"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Printer, ArrowLeft, Star, CheckCircle } from "lucide-react";

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
      gradient: "from-amber-50 to-orange-100", border: "border-orange-300 text-orange-400", 
      tajuk: "Warisan Negara Bangsa",
      quote: `"Bangsa yang tidak mengenali sejarahnya adalah bangsa yang kehilangan jati diri. Teruskan memelihara warisan kita!"` 
    },
    "2": { 
      gradient: "from-blue-50 to-cyan-100", border: "border-cyan-300 text-cyan-500", 
      tajuk: "Kebangkitan Nasionalisme",
      quote: `"Semangat juang yang tinggi bermula dari minda yang merdeka. Syabas atas semangat nasionalisme anda!"` 
    },
    "3": { 
      gradient: "from-emerald-50 to-teal-100", border: "border-teal-300 text-teal-500", 
      tajuk: "Konflik Dunia & Pendudukan Jepun",
      quote: `"Dunia yang damai dibina oleh mereka yang belajar dari kesilapan konflik masa lalu. Hebat!"` 
    },
    "4": { 
      gradient: "from-purple-50 to-fuchsia-100", border: "border-fuchsia-300 text-fuchsia-400", 
      tajuk: "Era Peralihan Kuasa British",
      quote: `"Setiap peralihan membawa cabaran, dan anda telah membuktikan anda mampu mengatasinya dengan cemerlang."` 
    },
    "5": { 
      gradient: "from-rose-50 to-pink-100", border: "border-pink-300 text-pink-400", 
      tajuk: "Persekutuan Tanah Melayu 1948",
      quote: `"Penyatuan membawa kekuatan. Anda telah menunjukkan kefahaman jitu tentang erti perpaduan tanah air."` 
    },
    "default": { 
      gradient: "from-slate-50 to-sky-100", border: "border-sky-300 text-sky-500", 
      tajuk: `Bab ${bab}`,
      quote: `"Kejayaan hari ini adalah bukti usaha keras anda semalam. Teruskan melakar sejarah peribadi anda yang cemerlang!"` 
    }
  };

  const tema = sijilTema[bab] || sijilTema["default"];

  // 🌟 LOGIK AUTO-RESIZE NAMA MURID
  const panjangNama = namaMurid.length;
  let saizFontNama = "text-3xl md:text-5xl lg:text-6xl"; 
  
  if (panjangNama > 40) {
    saizFontNama = "text-xl md:text-3xl lg:text-4xl"; 
  } else if (panjangNama > 30) {
    saizFontNama = "text-2xl md:text-4xl lg:text-5xl"; 
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] p-4 sm:p-8 flex flex-col items-center justify-center font-sans print:bg-white print:p-0">
      
      {/* 🌟 CSS KHAS UNTUK CETAKAN (AUTO LANDSCAPE A4) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: A4 landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          ::-webkit-scrollbar { display: none; }
        }
      `}} />

      {/* HEADER BUTANG */}
      <div className="mb-6 flex gap-4 print:hidden w-full max-w-5xl justify-center md:justify-between items-center">
        <button onClick={() => window.close()} className="bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-slate-700 hover:text-white transition shadow-lg border border-slate-700">
          <ArrowLeft className="w-5 h-5" /> Tutup
        </button>
        <button onClick={() => window.print()} className="bg-sky-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-500 hover:scale-105 transition-all shadow-lg shadow-sky-900/50">
          <Printer className="w-5 h-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* WRAPPER SCROLL UNTUK MOBILE */}
      <div className="w-full overflow-x-auto pb-6 print:pb-0 flex justify-start md:justify-center items-center print:overflow-hidden print:w-screen print:h-screen">
        
        {/* BEKAS KANVAS SIJIL UTAMA */}
        <div className={`min-w-[900px] md:min-w-0 w-full max-w-5xl aspect-[1.414] bg-gradient-to-br ${tema.gradient} rounded-lg shadow-2xl p-6 md:p-10 flex flex-col relative overflow-hidden shrink-0 mx-auto print:shadow-none print:w-full print:h-full print:rounded-none print:p-12`} style={{ backgroundColor: "white" }}>
          
          {/* BINGKAI DALAMAN */}
          <div className={`absolute inset-4 md:inset-6 border-[6px] border-double ${tema.border.split(' ')[0]} opacity-70 rounded-lg pointer-events-none print:inset-8`}></div>
          
          {/* BINTANG PENJURU */}
          <Star className={`absolute top-8 left-8 md:top-12 md:left-12 w-10 h-10 ${tema.border.split(' ')[1]} opacity-40 print:top-14 print:left-14`} fill="currentColor" />
          <Star className={`absolute top-8 right-8 md:top-12 md:right-12 w-10 h-10 ${tema.border.split(' ')[1]} opacity-40 print:top-14 print:right-14`} fill="currentColor" />
          <Star className={`absolute bottom-8 left-8 md:bottom-12 md:left-12 w-10 h-10 ${tema.border.split(' ')[1]} opacity-40 print:bottom-14 print:left-14`} fill="currentColor" />
          <Star className={`absolute bottom-8 right-8 md:bottom-12 md:right-12 w-10 h-10 ${tema.border.split(' ')[1]} opacity-40 print:bottom-14 print:right-14`} fill="currentColor" />

          {/* KANDUNGAN TENGAH */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-12">
            
            {/* LOGO */}
            <div className="mb-4">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto shadow-inner border border-yellow-200">
                <Award className="w-12 h-12 text-yellow-600 drop-shadow-sm" />
              </div>
            </div>

            {/* TAJUK */}
            <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-slate-600 uppercase mb-2">I-RAGs Tutor • Sistem Pembelajaran Sejarah</p>
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 drop-shadow-sm font-serif uppercase tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
              SIJIL PENGUASAAN
            </h1>

            <p className="text-sm md:text-base text-slate-600 mb-4 italic" style={{ fontFamily: "Georgia, serif" }}>Dengan bangganya dianugerahkan kepada:</p>
            
            {/* NAMA MURID */}
            <h2 className={`${saizFontNama} font-black text-sky-900 mb-6 border-b-2 border-slate-400/50 pb-3 inline-block px-12 uppercase tracking-wide leading-tight`} style={{ fontFamily: "Georgia, serif" }}>
              {namaMurid}
            </h2>

            {/* KENYATAAN PENCAPAIAN */}
            <p className="text-base md:text-xl text-slate-700 max-w-3xl leading-relaxed mb-8 px-4">
              Kerana telah menunjukkan dedikasi dan kefahaman yang sangat cemerlang dalam menguasai topik <br/>
              <strong className="text-slate-900 font-bold">Tingkatan {tingkatan}, Bab {bab}: {tema.tajuk}</strong> <br/>
              dengan memperoleh skor ujian sebanyak <span className="font-extrabold text-3xl text-emerald-600 ml-1">{skor}%</span>.
            </p>

            {/* MUTIARA KATA (KINI LEBIH STABIL DI TENGAH-BAWAH) */}
            <div className={`bg-white/80 p-4 md:p-5 rounded-xl border ${tema.border.split(' ')[0]} shadow-sm max-w-2xl w-full mb-8`}>
              <p className="text-sm md:text-base font-bold text-slate-800 italic" style={{ fontFamily: "Georgia, serif" }}>
                {tema.quote}
              </p>
            </div>

            {/* 🌟 RUANGAN TANDATANGAN (MEMBUATKAN SIJIL NAMPAK REALISTIK) */}
            <div className="w-full max-w-3xl flex justify-between items-end mt-auto px-8">
               <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-2"></div>
                  <p className="text-xs md:text-sm font-bold text-slate-700">Guru Mata Pelajaran</p>
                  <p className="text-[10px] md:text-xs text-slate-500">Panitia Sejarah Sekolah</p>
               </div>
               
               {/* COP DIGITAL AI */}
               <div className="flex flex-col items-center justify-center opacity-80">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-sky-600 flex items-center justify-center mb-1">
                     <CheckCircle className="text-sky-600 w-8 h-8" />
                  </div>
                  <p className="text-[9px] font-bold text-sky-700 uppercase tracking-widest">Disahkan Auto</p>
               </div>

               <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-2"></div>
                  <p className="text-xs md:text-sm font-bold text-slate-700">Ketua Penyelidik I-RAGs</p>
                  <p className="text-[10px] md:text-xs text-slate-500">Sistem Tutor Pintar AI</p>
               </div>
            </div>

          </div>
        </div>

      </div>

      <p className="md:hidden text-slate-400 text-xs italic text-center animate-pulse print:hidden mt-2">
        *Leret ke kiri/kanan untuk lihat sijil penuh
      </p>
    </div>
  );
}

export default function SijilPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-sky-400 font-bold">Menjana Sijil Cemerlang...</div>}>
      <KandunganSijil />
    </Suspense>
  );
}