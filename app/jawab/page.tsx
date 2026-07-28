"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";
import { Loader2, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

// ==========================================
// 1. KOMPONEN KHAS: GAMBAR SOALAN (SMART LOADER)
// ==========================================
const GambarSoalan = ({ src }: { src: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!src) return null;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[150px] w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 my-6 p-2">
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-sky-500 z-10 bg-slate-50/80 backdrop-blur-sm">
          <Loader2 className="animate-spin mb-2 w-6 h-6" />
          <span className="text-xs font-bold animate-pulse">Memuatkan gambar rajah...</span>
        </div>
      )}
      <img
        src={src}
        alt="Gambar Rujukan Soalan"
        className={`max-w-full max-h-64 md:max-h-80 object-contain transition-opacity duration-500 rounded-lg ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => { setHasError(true); setIsLoaded(true); }}
      />
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 bg-slate-100">
          <ImageIcon className="w-8 h-8 mb-2 opacity-50"/>
          <span className="text-xs font-bold text-center px-4">⚠️ Gagal memuatkan gambar.<br/>Sila semak internet anda.</span>
        </div>
      )}
    </div>
  );
};

// ==========================================
// 2. KOMPONEN UTAMA: KANDUNGAN UJIAN
// ==========================================
function KandunganUjian() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const router = useRouter();
  const searchParams = useSearchParams();

  const tingkatan = searchParams?.get("tingkatan") || "4";
  const bab = searchParams?.get("bab") || "Bab 1";
  const jenisUjian = searchParams?.get("jenisUjian") || "pre_test"; 

  const [soalanSenarai, setSoalanSenarai] = useState<any[]>([]);
  const [indexSemasa, setIndexSemasa] = useState(0);
  const [skor, setSkor] = useState(0); 
  const [tamat, setTamat] = useState(false);
  const [loading, setLoading] = useState(true);

  const [jawapanStruktur, setJawapanStruktur] = useState<Record<string, string>>({});
  const [jawapanObjektif, setJawapanObjektif] = useState<Record<string, string>>({});
  
  const [telahDisimpan, setTelahDisimpan] = useState(false);
  const [menganalisisAI, setMenganalisisAI] = useState(false);

  const [peratusAkhir, setPeratusAkhir] = useState<number | null>(null);
  const [tahapMurid, setTahapMurid] = useState("Sederhana");
  const [markahLulus, setMarkahLulus] = useState(50); 
  
  const [percubaanTerkini, setPercubaanTerkini] = useState(0);

  const shuffleArray = (array: any[]) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (!isClient) return;
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const fetchTahapMurid = async () => {
        try {
          const userSnap = await getDoc(doc(db, "users", user.id));
          if (userSnap.exists()) {
            const data = userSnap.data();
            const tahapData = data.tahapInkuiri || "Sederhana";
            setTahapMurid(tahapData);

            if (tahapData === "Tinggi") setMarkahLulus(70);
            else if (tahapData === "Sederhana") setMarkahLulus(70); 
            else if (tahapData === "Rendah") setMarkahLulus(50); 
          }

          if (jenisUjian === "post_test") {
             const docIdUjian = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
             const skorSnap = await getDoc(doc(db, "skor_murid", docIdUjian));
             if (skorSnap.exists() && skorSnap.data().percubaan) {
                setPercubaanTerkini(skorSnap.data().percubaan);
             }
          }
        } catch (error) { console.error("Gagal mendapat data:", error); }
      };
      fetchTahapMurid();
    }
  }, [isClient, tingkatan, bab, jenisUjian]);

  useEffect(() => {
    if (!isClient) return;
    const simpananObjektif = localStorage.getItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`);
    const simpananStruktur = localStorage.getItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`);
    if (simpananObjektif) setJawapanObjektif(JSON.parse(simpananObjektif));
    if (simpananStruktur) setJawapanStruktur(JSON.parse(simpananStruktur));
  }, [isClient, tingkatan, bab, jenisUjian]);

  useEffect(() => {
    if (!isClient) return;
    const tarikSoalan = async () => {
      try {
        const q = query(collection(db, "questionBank"), where("tingkatan", "==", tingkatan), where("bab", "==", bab));
        const querySnapshot = await getDocs(q);
        let soalanObjektif: any[] = [];
        let soalanStruktur: any[] = [];

        querySnapshot.forEach((docSnap) => {
          let data = docSnap.data();
          const kegunaan = data.kegunaan || "semua";
          if (kegunaan === "simpanan") return; 
          if (kegunaan !== "semua" && kegunaan !== jenisUjian) return;

          if (data.jenis === "objektif") {
            if (data.pilihan) {
              let pilihanArray = Object.entries(data.pilihan);
              data.shuffledPilihan = shuffleArray(pilihanArray);
            }
            soalanObjektif.push({ id: docSnap.id, ...data });
          } else {
            soalanStruktur.push({ id: docSnap.id, ...data });
          }
        });

        const objektifDahShuffle = shuffleArray(soalanObjektif);
        const strukturDisaring = soalanStruktur.filter((s: any) => !isNaN(Number(s.urutan)) && Number(s.urutan) > 0 && Number(s.urutan) !== 999);
        strukturDisaring.sort((a: any, b: any) => Number(a.urutan) - Number(b.urutan));
        
        const finalSoalan = [...objektifDahShuffle, ...strukturDisaring];
        setSoalanSenarai(finalSoalan);

        // 🌟 FUNGSI PRELOAD GAMBAR: Supaya internet murid dah siap download gambar sebelum mereka buka soalan
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            finalSoalan.forEach((q) => {
              if (q.imageUrl && q.imageUrl.trim() !== "") {
                const imgPreload = new window.Image();
                imgPreload.src = q.imageUrl;
              }
            });
          }
        }, 1000);

      } catch (error) { console.error("Ralat tarik soalan:", error); } finally { setLoading(false); }
    };
    tarikSoalan();
  }, [tingkatan, bab, jenisUjian, isClient]);

  useEffect(() => {
    if (!isClient) return;
    const simpanMarkahFirebase = async () => {
      if (tamat && soalanSenarai.length > 0 && !telahDisimpan) {
        setTelahDisimpan(true);
        setMenganalisisAI(true);
        const rawUser = localStorage.getItem("currentUser");
        
        if (rawUser) {
          const user = JSON.parse(rawUser);
          try {
            let skorObjektifAkhir = 0; let markahPenuhUjian = 0;
            soalanSenarai.forEach(s => {
              if (s.jenis === "objektif") {
                markahPenuhUjian += 1; 
                const jawapanMurid = String(jawapanObjektif[s.id] || "").trim().toLowerCase();
                const skemaBersih = String(s.jawapan || "").trim().toLowerCase();
                if (jawapanMurid === skemaBersih && skemaBersih !== "") skorObjektifAkhir += 1;
              } else { markahPenuhUjian += Number(s.markah) || 0; }
            });

            setSkor(skorObjektifAkhir); 
            let jumlahMarkahStrukturAI = 0;
            let ulasanAIPenuh: Record<string, any> = {};

            await new Promise(resolve => setTimeout(resolve, 1500));

            for (const [soalanId, jawapanMurid] of Object.entries(jawapanStruktur)) {
              const detailSoalan = soalanSenarai.find(s => s.id === soalanId);
              if (detailSoalan) {
                try {
                  const res = await fetch("/api/semak-ai", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ soalan: detailSoalan.soalan, jawapanMurid: jawapanMurid, markahPenuh: Number(detailSoalan.markah) || 0, skemaJawapan: detailSoalan.skemaJawapan || detailSoalan.jawapan || "" })
                  });
                  if (!res.ok) throw new Error("Ralat AI");
                  const aiData = await res.json();
                  ulasanAIPenuh[soalanId] = { markahAI: Number(aiData.markahDicadangkan) || 0, komenAI: aiData.komen || "Tiada ulasan." };
                  jumlahMarkahStrukturAI += (Number(aiData.markahDicadangkan) || 0);
                } catch (err) { ulasanAIPenuh[soalanId] = { markahAI: 0, komenAI: "SISTEM AI GAGAL. Sila semak secara manual." }; }
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }

            const docId = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
            const adaSoalanStruktur = Object.keys(jawapanStruktur).length > 0;
            const skorKeseluruhan = skorObjektifAkhir + jumlahMarkahStrukturAI;
            const peratus = markahPenuhUjian > 0 ? Math.round((skorKeseluruhan / markahPenuhUjian) * 100) : 0;
            const percubaanBaru = jenisUjian === "post_test" ? percubaanTerkini + 1 : 1;
            
            setPeratusAkhir(peratus); setPercubaanTerkini(percubaanBaru);

            await setDoc(doc(db, "skor_murid", docId), {
              idMurid: user.id, namaMurid: user.name || user.nama, tingkatan, bab,
              skorObjektif: skorObjektifAkhir, jawapanObjektif, skor: peratus, markahPenuhUjian,
              jawapanStruktur, ulasanAI: ulasanAIPenuh, markahStruktur: jumlahMarkahStrukturAI, skorAkhir: skorKeseluruhan,
              statusPermarkahanEsei: adaSoalanStruktur ? "disemak_oleh_AI" : "tiada_esei",
              tarikh: new Date().toISOString(), jenisUjian, percubaan: percubaanBaru
            });

            localStorage.removeItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`);
            localStorage.removeItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`);

            const chapterId = bab.replace("Bab ", "");
            const modKeyTest = `t${tingkatan}-ch${chapterId}-mod-${jenisUjian}`;
            const modKeyBimbingan = `t${tingkatan}-ch${chapterId}-mod-bimbingan`; 
            let completed = JSON.parse(localStorage.getItem("completedModules") || "[]");

            if (jenisUjian === "pre_test") {
              let tahapBaru = "Rendah";
              if (peratus >= 70) tahapBaru = "Tinggi"; 
              else if (peratus >= 50) tahapBaru = "Sederhana";
              if (!completed.includes(modKeyTest)) completed.push(modKeyTest);
              localStorage.setItem("completedModules", JSON.stringify(completed));
              await updateDoc(doc(db, "users", user.id), { markahTerkini: peratus, tahapInkuiri: tahapBaru });
            } else if (jenisUjian === "post_test") {
              if (peratus >= markahLulus) {
                if (!completed.includes(modKeyTest)) completed.push(modKeyTest);
                localStorage.setItem("completedModules", JSON.stringify(completed));
                await updateDoc(doc(db, "users", user.id), { markahPostTestTerkini: peratus, statusBabTerkini: "Lulus" });
              } else {
                completed = completed.filter((mod: string) => mod !== modKeyBimbingan && mod !== modKeyTest);
                localStorage.setItem("completedModules", JSON.stringify(completed));
                await updateDoc(doc(db, "users", user.id), { markahPostTestTerkini: peratus, statusBabTerkini: "Ulang Bimbingan" });
              }
            }
          } catch (error) { console.error("Ralat simpan data:", error); }
        }
        setMenganalisisAI(false);
      }
    };
    simpanMarkahFirebase();
  }, [tamat, soalanSenarai, tingkatan, bab, isClient, jawapanStruktur, telahDisimpan, jawapanObjektif, jenisUjian, markahLulus, percubaanTerkini]); 

  const pilihJawapanObjektif = (soalanId: string, jawapanDipilih: string) => {
    setJawapanObjektif(prev => { const stateBaru = { ...prev, [soalanId]: jawapanDipilih }; localStorage.setItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru)); return stateBaru; });
  };
  const tukarJawapanStruktur = (soalanId: string, teks: string) => {
    setJawapanStruktur(prev => { const stateBaru = { ...prev, [soalanId]: teks }; localStorage.setItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru)); return stateBaru; });
  };

  const pergiSoalanSebelum = () => { if (indexSemasa > 0) setIndexSemasa(indexSemasa - 1); };
  const pergiSoalanSeterusnyaAtauTamat = () => {
    if (indexSemasa + 1 < soalanSenarai.length) setIndexSemasa(indexSemasa + 1);
    else if (confirm("Pasti mahu hantar ujian ini? Sila pastikan semua jawapan telah disemak.")) setTamat(true);
  };

  const paparanTajukUjian = jenisUjian === "post_test" ? "Pasca-Ujian (Post)" : "Pra-Ujian (Pre)";

  if (!isClient) return <div className="min-h-screen bg-slate-100 flex items-center justify-center font-bold text-sky-600">Memulakan Ujian...</div>;
  if (loading) return <div className="min-h-screen bg-slate-100 flex items-center justify-center text-sky-700 font-semibold"><Loader2 className="animate-spin mr-3"/> Memuat turun soalan...</div>;
  if (soalanSenarai.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4"><div className="p-8 bg-white rounded-xl shadow-md text-center max-w-md w-full"><h2 className="text-xl font-bold mb-4 text-slate-800">Soalan Belum Tersedia</h2><p className="text-sm text-slate-500 mb-6">Sistem mendapati tiada soalan untuk bab ini lagi.</p><button onClick={() => router.push('/murid')} className="w-full bg-sky-600 hover:bg-sky-500 text-white px-6 py-3 rounded-lg font-bold transition-colors">Kembali ke Dashboard</button></div></div>
  );

  if (tamat) {
    if (menganalisisAI || peratusAkhir === null) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4 text-center"><Loader2 className="animate-spin w-12 h-12 text-sky-600 mb-4" /><h2 className="text-2xl font-bold text-sky-700">AI Sedang Menyemak...</h2><p className="text-slate-500 text-sm mt-2">Sila tunggu sebentar. Esei anda sedang dinilai.</p></div>
    );
    const isLulus = peratusAkhir >= markahLulus;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-lg w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-8 border-sky-500">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2 text-slate-800">{paparanTajukUjian} Tamat</h2>
          <p className="text-sm font-semibold text-slate-500 mb-6 uppercase tracking-wider">{bab} | Tingkatan {tingkatan}</p>
          {jenisUjian === "pre_test" ? (
             <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 p-6 rounded-xl mb-8">✅ <span className="font-bold text-lg">Skor: {peratusAkhir}%</span><br/><span className="text-sm mt-2 block">Sistem telah menganalisis tahap anda. Teruskan ke Modul Bimbingan.</span></div>
          ) : (
             isLulus ? (
               <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-xl mb-8">🎉 <span className="font-bold text-lg">TAHNIAH! Lulus dengan {peratusAkhir}%</span><br/><span className="text-sm mt-2 block">Anda berjaya melepasi sasaran {markahLulus}%.</span></div>
             ) : (
               percubaanTerkini >= 2 ? (
                 <div className="bg-red-50 border border-red-100 text-red-800 p-6 rounded-xl mb-8">⚠️ <span className="font-bold text-lg">Markah: {peratusAkhir}%</span><br/><span className="text-sm mt-2 block">Sasaran: {markahLulus}%. Anda telah mencuba 2 kali. Sistem akan merujuk kepada Guru.</span></div>
               ) : (
                 <div className="bg-amber-50 border border-amber-100 text-amber-800 p-6 rounded-xl mb-8">⚠️ <span className="font-bold text-lg">Markah: {peratusAkhir}%</span><br/><span className="text-sm mt-2 block">Sasaran: {markahLulus}%. Sila ikuti Modul Permainan Interaktif di Dashboard kemudian cuba lagi.</span></div>
               )
             )
          )}
          <button onClick={() => router.push('/murid')} className="w-full bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-md">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  const semasa = soalanSenarai[indexSemasa];
  const jenisSoalan = semasa.jenis?.toLowerCase() || "objektif";
  const senaraiPilihan = semasa.shuffledPilihan || (semasa.pilihan ? Object.entries(semasa.pilihan) : []);
  const labelBahagian = jenisSoalan === "objektif" ? "Bahagian A: Objektif" : "Bahagian B: Struktur/Esei";
  const isSoalanTerakhir = indexSemasa + 1 === soalanSenarai.length;

  let soalanSudahDijawab = false;
  if (jenisSoalan === "objektif") soalanSudahDijawab = !!jawapanObjektif[semasa.id];
  else soalanSudahDijawab = (jawapanStruktur[semasa.id] || "").trim().length > 0;

  const progressPercentage = ((indexSemasa + 1) / soalanSenarai.length) * 100;

  // ========================================================
  // REKA BENTUK UI BARU: PROFESIONAL, KOMPAK & STICKY FOOTER
  // ========================================================
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:py-6 md:px-4 items-center justify-center">
      
      {/* Container Utama (Reka Bentuk "Card" Berhenti di Bawah Skrin) */}
      <div className="w-full max-w-4xl bg-white shadow-2xl md:rounded-2xl flex flex-col h-[100dvh] md:h-[90vh] overflow-hidden border border-slate-200">
        
        {/* HEADER: KEKAL DI ATAS (STICKY) */}
        <div className="p-4 md:p-6 bg-white shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] z-20">
           <div className="flex justify-between items-end mb-3">
             <div>
               <h1 className="text-lg md:text-xl font-extrabold text-slate-800">{bab}</h1>
               <p className="text-xs font-bold text-sky-600 uppercase mt-0.5">{labelBahagian}</p>
             </div>
             <div className="text-right">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Soalan</span>
               <div className="text-sm md:text-base font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md mt-1">
                 {indexSemasa + 1} / {soalanSenarai.length}
               </div>
             </div>
           </div>
           
           {/* Progress Bar Visual */}
           <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
           </div>
        </div>

        {/* KAWASAN KANDUNGAN SOALAN (BOLEH TENGGELAM/SCROLL) */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
           
           <div className="flex justify-between items-start gap-4 mb-6">
             <h2 className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{semasa.soalan}</h2>
             {semasa.markah && <span className="shrink-0 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md text-xs font-bold whitespace-nowrap mt-1 border border-amber-200">{semasa.markah} Markah</span>}
           </div>

           {/* SMART IMAGE COMPONENT */}
           <GambarSoalan src={semasa.imageUrl} />

           {/* RUANG JAWAPAN */}
           <div className="mt-6">
             {jenisSoalan === "objektif" ? (
               <div className="grid gap-3">
                 {senaraiPilihan.map((item: any, i: number) => {
                   const isSelected = jawapanObjektif[semasa.id] === item[0];
                   return (
                     <button key={item[0]} onClick={() => pilihJawapanObjektif(semasa.id, item[0])}
                       className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex gap-4 items-center group ${isSelected ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/30'}`}>
                       <span className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm md:text-base transition-colors ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-sky-100 group-hover:text-sky-600'}`}>{String.fromCharCode(65 + i)}</span>
                       <span className={`text-sm md:text-base ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>{item[1] as string}</span>
                     </button>
                   );
                 })}
               </div>
             ) : (
               <div className="relative">
                 <textarea
                   value={jawapanStruktur[semasa.id] || ""} onChange={(e) => tukarJawapanStruktur(semasa.id, e.target.value)}
                   onPaste={(e) => { e.preventDefault(); alert("Sila taip sendiri. Kemahiran mengingati fakta amat penting!"); }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}
                   autoComplete="off" spellCheck="false"
                   placeholder="Sila taip jawapan di sini..."
                   className="w-full p-4 md:p-5 bg-white text-slate-900 placeholder-slate-400 border-2 border-slate-300 rounded-xl focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 resize-y min-h-[140px] text-sm md:text-base transition-all outline-none"
                 ></textarea>
                 {jawapanStruktur[semasa.id]?.trim().length > 0 && (
                    <div className="absolute top-4 right-4 text-emerald-500 bg-white rounded-full"><CheckCircle2 size={20}/></div>
                 )}
               </div>
             )}
           </div>
        </div>

        {/* FOOTER NAVIGASI: KEKAL DI BAWAH (STICKY) */}
        <div className="p-4 md:p-6 bg-white border-t border-slate-200 shrink-0 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] z-20">
           <div className="flex justify-between items-center gap-4 max-w-2xl mx-auto">
             <button onClick={pergiSoalanSebelum} disabled={indexSemasa === 0} className="flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm md:text-base w-1/3">
               <ChevronLeft size={20}/> <span className="hidden md:inline">Sebelumnya</span>
             </button>
             
             <button onClick={pergiSoalanSeterusnyaAtauTamat} disabled={!soalanSudahDijawab} className={`flex items-center justify-center gap-2 px-6 md:px-8 py-2.5 md:py-3 rounded-xl font-bold transition-all text-sm md:text-base w-2/3 shadow-sm ${!soalanSudahDijawab ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : isSoalanTerakhir ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/20'}`}>
               {isSoalanTerakhir ? 'Hantar Ujian Sekarang' : 'Seterusnya'} {isSoalanTerakhir ? <CheckCircle2 size={20}/> : <ChevronRight size={20}/>}
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}

export default function UjianDiagnostik() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center text-sky-600 font-bold"><Loader2 className="animate-spin mr-3"/>Memuatkan Sistem...</div>}><KandunganUjian /></Suspense>;
}