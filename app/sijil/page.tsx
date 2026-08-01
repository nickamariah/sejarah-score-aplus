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

  // 🌟 LOGIK AUTO-RESIZE NAMA MURID
  const panjangNama = namaMurid.length;
  let saizFontNama = "text-3xl md:text-5xl"; 
  
  if (panjangNama > 40) {
    saizFontNama = "text-xl md:text-2xl"; 
  } else if (panjangNama > 30) {
    saizFontNama = "text-2xl md:text-3xl"; 
  } else if (panjangNama > 22) {
    saizFontNama = "text-3xl md:text-4xl"; 
  }

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-slate-800 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      
      <div className="mb-6 flex gap-4 print:hidden w-full max-w-4xl justify-center md:justify-start">
        <button onClick={() => window.close()} className="bg-slate-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-600 transition shadow-lg">
          <ArrowLeft className="w-5 h-5" /> Tutup
        </button>
        <button onClick={() => window.print()} className="bg-sky-500 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-600 transition shadow-lg">
          <Printer className="w-5 h-5" /> Cetak / Simpan PDF
        </button>
      </div>

      {/* 🌟 PENYELESAIAN UTAMA: Wrapper dengan overflow-x-auto supaya boleh scroll di fon */}
      <div className="w-full overflow-x-auto flex justify-start md:justify-center pb-4 print:overflow-visible">
        
        {/* Tambah min-w-[800px] supaya bentuk A4 tak kemek di telefon, dan shrink-0 supaya tak dipaksa kecil */}
        <div 
          className={`min-w-200 md:min-w-0 w-full max-w-4xl aspect-[1.414] bg-linear-to-br ${tema.gradient} rounded-lg shadow-2xl p-8 md:p-12 flex flex-col relative overflow-hidden shrink-0 mx-auto`}
          style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} 
        >
          <div className={`absolute inset-4 md:inset-6 border-[6px] border-double ${tema.border} opacity-50 rounded-lg pointer-events-none`}></div>
          
          {/* Saiz bintang dan jarak 'top/left' dikecilkan sikit (responsif) */}
          <Star className={`absolute top-6 left-6 md:top-10 md:left-10 w-8 h-8 md:w-12 md:h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
          <Star className={`absolute top-6 right-6 md:top-10 md:right-10 w-8 h-8 md:w-12 md:h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
          <Star className={`absolute bottom-6 left-6 md:bottom-10 md:left-10 w-8 h-8 md:w-12 md:h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />
          <Star className={`absolute bottom-6 right-6 md:bottom-10 md:right-10 w-8 h-8 md:w-12 md:h-12 ${tema.border.replace('border-', 'text-')} opacity-30`} />

          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
            
            <div className="mb-4">
              <Award className="w-16 h-16 md:w-28 md:h-28 text-yellow-500 drop-shadow-md mx-auto" />
            </div>

            <p className="text-xs md:text-lg font-bold tracking-[0.2em] text-slate-500 uppercase mb-2">I-RAGs Tutor • Sistem Pembelajaran Sejarah</p>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-800 mb-4 md:mb-6 drop-shadow-sm font-serif">
              SIJIL PENGUASAAN
            </h1>

            <p className="text-base md:text-xl text-slate-600 mb-4 italic">Dengan bangganya dianugerahkan kepada:</p>
            
            {/* Buang whitespace-nowrap supaya jika nama betul-betul panjang, ia boleh turun ke bawah dengan kemas */}
            <h2 className={`${saizFontNama} font-black text-sky-900 mb-6 border-b-2 border-slate-300 pb-2 inline-block px-4 md:px-8 uppercase tracking-wide leading-tight`}>
              {namaMurid}
            </h2>

            <p className="text-sm md:text-xl text-slate-700 max-w-2xl leading-relaxed mb-6 md:mb-8 px-4">
              Kerana telah menunjukkan dedikasi dan kefahaman yang sangat cemerlang dalam menguasai topik <br/>
              <strong className="text-slate-900">Tingkatan {tingkatan}, Bab {bab}: {tema.tajuk}</strong> <br/>
              dengan memperoleh skor ujian sebanyak <span className="font-bold text-2xl text-emerald-600">{skor}%</span>.
            </p>

            <div className={`mt-auto bg-white/60 p-3 md:p-6 rounded-2xl border ${tema.border} shadow-sm max-w-3xl w-full`}>
              <p className="text-xs md:text-lg font-bold text-slate-800 italic">
                {tema.quote}
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* Teks panduan untuk murid guna fon (hanya keluar waktu di skrin fon) */}
      <p className="md:hidden text-slate-400 text-xs mt-2 italic text-center animate-pulse">
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