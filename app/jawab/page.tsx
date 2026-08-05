"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";
import { Loader2, Image as ImageIcon, ChevronRight, Volume2, VolumeX, Music, Palette, ArrowLeft } from "lucide-react";

// ==========================================
// 1. KOMPONEN GAMBAR SOALAN
// ==========================================
const GambarSoalan = ({ src }: { src: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  if (!src) return null;
  return (
    <div className="relative flex justify-center w-full my-6">
      {!isLoaded && !hasError && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-sky-500 w-6 h-6" /></div>}
      <img
        src={src} alt="Rujukan Soalan"
        className={`max-w-full max-h-72 object-contain rounded-xl shadow-sm border border-slate-200 transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)} onError={() => { setHasError(true); setIsLoaded(true); }}
      />
      {hasError && <div className="p-4 bg-red-50 text-red-500 border border-red-100 rounded-xl text-sm flex items-center gap-2"><ImageIcon size={18} /> Gagal memuatkan gambar rajah.</div>}
    </div>
  );
};

// ==========================================
// 2. KOMPONEN UTAMA: KUIZ INTERAKTIF
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
  
  const [soalanSelesai, setSoalanSelesai] = useState(false);
  const [jawapanTepatSemasa, setJawapanTepatSemasa] = useState(false);

  const [telahDisimpan, setTelahDisimpan] = useState(false);
  const [menganalisisAI, setMenganalisisAI] = useState(false);
  const [peratusAkhir, setPeratusAkhir] = useState<number | null>(null);
  const [tahapMurid, setTahapMurid] = useState("Sederhana");
  const [markahLulus, setMarkahLulus] = useState(50); 
  const [percubaanTerkini, setPercubaanTerkini] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const senaraiLagu = [
    { id: '1', nama: '📖 Selawat Tafrijiyah ', src: '/selawat.mp3' },
    { id: '2', nama: '🎵 Lofi Santai', src: '/santai.mp3' },
    { id: '3', nama: '🚀 Rentak Fokus', src: '/fokus.mp3' },
    { id: '4', nama: '⚔️ Epik Sejarah', src: '/epik.mp3' },
  ];
  const [selectedTrack, setSelectedTrack] = useState(senaraiLagu[0].src);

  const senaraiTheme = [
    { id: 'default', nama: '🌞 Cerah (Asal)', class: 'bg-slate-50' },
    { id: 'gelap', nama: '🌙 Mod Gelap', class: 'bg-slate-900' },
    { id: 'angkasa', nama: '🌌 Angkasa', class: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black' },
    { id: 'senja', nama: '🌅 Senja', class: 'bg-gradient-to-br from-orange-50 to-rose-200' },
  ];
  const [selectedTheme, setSelectedTheme] = useState(senaraiTheme[0].class);

  const keluarKuiz = () => {
    const sahkan = window.confirm("Anda pasti mahu keluar?\nJawapan ujian ini TIDAK akan disimpan jika anda keluar sebelum tamat.");
    if (sahkan) {
      router.push('/murid');
    }
  };

  const playSound = (jenis: 'betul' | 'salah' | 'info') => {
    try {
      const audio = new Audio(jenis === 'betul' ? '/ting.mp3' : jenis === 'salah' ? '/buzzer.mp3' : '/ting.mp3');
      audio.play().catch(e => console.log("Pelayar menyekat bunyi auto:", e));
    } catch (error) { console.log("Audio ralat"); }
  };

  const toggleMusic = () => {
    if (bgmRef.current) {
      if (isMusicPlaying) bgmRef.current.pause();
      else bgmRef.current.play().catch(e => console.log("Autoplay dihalang:", e));
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const handleTrackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSrc = e.target.value;
    setSelectedTrack(newSrc);
    if (bgmRef.current) {
      bgmRef.current.src = newSrc;
      if (isMusicPlaying) bgmRef.current.play().catch(e => console.log("Autoplay dihalang:", e));
    }
  };

  useEffect(() => {
    if (tamat && bgmRef.current) {
      bgmRef.current.pause();
      setIsMusicPlaying(false);
    }
  }, [tamat]);

  const shuffleArray = (array: any[]) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // ==========================================
  // 🌟 LOGIK PINTAR: CABUTAN SOALAN IKUT ARAS & RAWAK
  // ==========================================
  useEffect(() => {
    if (!isClient) return;

    const initializeExam = async () => {
      const rawUser = localStorage.getItem("currentUser");
      if (!rawUser) {
        setLoading(false);
        return;
      }
      
      const user = JSON.parse(rawUser);
      let currentAttempt = 0;
      let currentTahap = "Sederhana"; 

      try {
        // 1. Dapatkan Tahap & Percubaan Murid
        const userSnap = await getDoc(doc(db, "users", user.id));
        if (userSnap.exists()) {
          const data = userSnap.data();
          currentTahap = data.tahapInkuiri || "Sederhana";
          setTahapMurid(currentTahap);
          
          if (currentTahap === "Tinggi" || currentTahap === "Sederhana") setMarkahLulus(70);
          else setMarkahLulus(50); 
        }

        if (jenisUjian === "post_test") {
           const docIdUjian = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
           const skorSnap = await getDoc(doc(db, "skor_murid", docIdUjian));
           if (skorSnap.exists() && skorSnap.data().percubaan) {
              currentAttempt = skorSnap.data().percubaan;
              setPercubaanTerkini(currentAttempt);
           }
        }

        // 2. Tarik Bank Soalan
        const q = query(collection(db, "questionBank"), where("tingkatan", "==", tingkatan), where("bab", "==", bab));
        const querySnapshot = await getDocs(q);
        
        let soalanObjektif: any[] = [];
        let soalanStruktur: any[] = [];

        querySnapshot.forEach((docSnap) => {
          let data = docSnap.data();
          const kegunaan = data.kegunaan || "semua";
          
          if (kegunaan === "simpanan") return; 
          
          let layak = false;
          if (kegunaan === "semua" || kegunaan === "semua_ujian" || kegunaan === "pre_post") layak = true;
          else if (jenisUjian === "pre_test" && kegunaan === "pre_test") layak = true;
          else if (jenisUjian === "post_test") {
             if (kegunaan === "post_test") layak = true;
             if (currentAttempt > 0 && kegunaan === "pemulihan") layak = true;
          }

          if (!layak) return;

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

        // ==========================================
        // 🌟 KAWALAN JUMLAH SOALAN (KUOTA DINAMIK MENGIKUT ARAS) TERKINI
        // ==========================================
        let hadObjektif = 30; // Nilai lalai
        let hadStruktur = 5;  // Nilai lalai

        if (jenisUjian === "pre_test") {
            // UJIAN DIAGNOSTIK: Semua jawab, tapis betul-betul
            hadObjektif = 30; 
            hadStruktur = 5;
        } else if (jenisUjian === "post_test") {
            if (currentAttempt === 0) { 
                // UJIAN PASCA (CUBAAN PERTAMA) - Disesuaikan ikut aras murid
                if (currentTahap === "Sederhana" || currentTahap === "Tinggi") {
                   hadObjektif = 25; 
                   hadStruktur = 4;
                } else { // Aras Rendah
                   hadObjektif = 25; 
                   hadStruktur = 3;
                }
            } else { 
                // MOD PEMULIHAN (CUBAAN KEDUA): Soalan lebih santai/mudah
                hadObjektif = 20; 
                hadStruktur = 2; 
            }
        }

        // RAWAKKAN SEMUA SOALAN DAN POTONG MENGIKUT HAD DI ATAS
        let objektifDahShuffle = shuffleArray(soalanObjektif);
        if (objektifDahShuffle.length > hadObjektif) {
            objektifDahShuffle = objektifDahShuffle.slice(0, hadObjektif);
        }

        let strukturDahShuffle = shuffleArray(soalanStruktur);
        if (strukturDahShuffle.length > hadStruktur) {
            strukturDahShuffle = strukturDahShuffle.slice(0, hadStruktur);
        }

        const finalSoalan = [...objektifDahShuffle, ...strukturDahShuffle];
        setSoalanSenarai(finalSoalan);

      } catch (error) { 
        console.error("Gagal menarik data ujian:", error); 
      } finally { 
        setLoading(false); 
      }
    };

    initializeExam();
  }, [isClient, tingkatan, bab, jenisUjian]);

  // LOGIK HANTAR MARKAH AKHIR
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
            let jawapanObjektifBersih: Record<string, string> = {};
            let jawapanStrukturBersih: Record<string, string> = {};

            soalanSenarai.forEach(s => {
              if (s.jenis === "objektif") {
                markahPenuhUjian += 1; 
                if (jawapanObjektif[s.id]) jawapanObjektifBersih[s.id] = jawapanObjektif[s.id];
                const jawapanMurid = String(jawapanObjektif[s.id] || "").trim().toLowerCase();
                const skemaBersih = String(s.jawapan || "").trim().toLowerCase();
                if (jawapanMurid === skemaBersih && skemaBersih !== "") skorObjektifAkhir += 1;
              } else { 
                markahPenuhUjian += Number(s.markah) || 0; 
                if (jawapanStruktur[s.id]) jawapanStrukturBersih[s.id] = jawapanStruktur[s.id];
              }
            });

            setSkor(skorObjektifAkhir); 
            let jumlahMarkahStrukturAI = 0;
            let ulasanAIPenuh: Record<string, any> = {};

            await new Promise(resolve => setTimeout(resolve, 1500));

            for (const [soalanId, jawapanMurid] of Object.entries(jawapanStrukturBersih)) {
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
              }
            }

            const docId = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
            const adaSoalanStruktur = Object.keys(jawapanStrukturBersih).length > 0;
            const skorKeseluruhan = skorObjektifAkhir + jumlahMarkahStrukturAI;
            const peratus = markahPenuhUjian > 0 ? Math.round((skorKeseluruhan / markahPenuhUjian) * 100) : 0;
            const percubaanBaru = jenisUjian === "post_test" ? percubaanTerkini + 1 : 1;
            
            setPeratusAkhir(peratus); setPercubaanTerkini(percubaanBaru);

            await setDoc(doc(db, "skor_murid", docId), {
              idMurid: user.id, namaMurid: user.name || user.nama, tingkatan, bab,
              skorObjektif: skorObjektifAkhir, jawapanObjektif: jawapanObjektifBersih, skor: peratus, markahPenuhUjian,
              jawapanStruktur: jawapanStrukturBersih, ulasanAI: ulasanAIPenuh, markahStruktur: jumlahMarkahStrukturAI, skorAkhir: skorKeseluruhan,
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

  const handleInputStruktur = (e: React.ChangeEvent<HTMLTextAreaElement>, soalanId: string) => {
    if(soalanSelesai) return; 
    setJawapanStruktur(prev => { 
      const stateBaru = { ...prev, [soalanId]: e.target.value }; 
      localStorage.setItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru)); 
      return stateBaru; 
    });
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const sahkanJawapanStruktur = () => {
    const semasaId = soalanSenarai[indexSemasa].id;
    if(!jawapanStruktur[semasaId] || jawapanStruktur[semasaId].trim() === '') return;
    playSound('info');
    setSoalanSelesai(true);
  };

  const pilihJawapanObjektif = (soalanId: string, jawapanDipilih: string) => {
    if(soalanSelesai) return; 
    
    setJawapanObjektif(prev => { 
        const stateBaru = { ...prev, [soalanId]: jawapanDipilih }; 
        localStorage.setItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru)); 
        return stateBaru; 
    });

    const semasa = soalanSenarai[indexSemasa];
    const skemaBersih = String(semasa.jawapan || "").trim().toLowerCase();
    const isCorrect = jawapanDipilih.toLowerCase() === skemaBersih;
    
    setJawapanTepatSemasa(isCorrect);
    setSoalanSelesai(true);

    if(isCorrect) playSound('betul');
    else playSound('salah');

    const isSoalanTerakhir = indexSemasa + 1 === soalanSenarai.length;

    if (!isSoalanTerakhir) {
      setTimeout(() => {
        setSoalanSelesai(false);
        setJawapanTepatSemasa(false);
        setIndexSemasa(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" }); 
      }, 2500); 
    }
  };

  const pergiSoalanSeterusnyaAtauTamat = () => {
    setSoalanSelesai(false);
    setJawapanTepatSemasa(false);

    if (indexSemasa + 1 < soalanSenarai.length) setIndexSemasa(indexSemasa + 1);
    else if (confirm("Pasti mahu hantar ujian ini? Sistem akan menganalisis markah penuh anda sekarang.")) setTamat(true);
    
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  };

  if (!isClient) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-sky-600">Memulakan Ujian...</div>;
  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sky-700 font-semibold"><Loader2 className="animate-spin mr-3"/> Menjana Kertas Soalan Mengikut Aras...</div>;
  if (soalanSenarai.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4"><div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center"><h2 className="text-xl font-bold">Soalan Belum Tersedia</h2><p className="text-slate-500 text-sm mt-2">Sila minta guru masukkan soalan ke dalam Bank Soalan terlebih dahulu.</p><button onClick={() => router.push('/murid')} className="mt-4 w-full bg-sky-600 text-white px-6 py-3 rounded-lg font-bold">Kembali ke Dashboard</button></div></div>;

  if (tamat) {
    if (menganalisisAI || peratusAkhir === null) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center"><Loader2 className="animate-spin w-12 h-12 text-sky-600 mb-4" /><h2 className="text-2xl font-bold text-sky-700">AI Sedang Menyemak...</h2><p className="text-slate-500 text-sm mt-2">Sila tunggu sebentar. Esei anda sedang dinilai.</p></div>
    );
    const isLulus = peratusAkhir >= markahLulus;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-lg w-full p-8 bg-white rounded-2xl shadow-sm border border-slate-200 border-t-8 border-t-sky-500 text-center">
          <h2 className="text-2xl font-extrabold mb-2">{jenisUjian === "post_test" ? "Pasca-Ujian" : "Pra-Ujian"} Tamat</h2>
          <p className="text-sm text-slate-500 mb-6 font-semibold uppercase">{bab}</p>
          <div className={`p-6 rounded-xl mb-8 ${isLulus || jenisUjian === "pre_test" ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
            {isLulus || jenisUjian === "pre_test" ? "🎉" : "⚠️"} <span className="font-bold text-lg">Skor: {peratusAkhir}%</span>
          </div>
          <button onClick={() => router.push('/murid')} className="w-full bg-slate-800 text-white px-8 py-3 rounded-xl font-bold">Kembali ke Dashboard</button>
        </div>
      </div>
    );
  }

  const semasa = soalanSenarai[indexSemasa];
  const jenisSoalan = semasa.jenis?.toLowerCase() || "objektif";
  const senaraiPilihan = semasa.shuffledPilihan || (semasa.pilihan ? Object.entries(semasa.pilihan) : []);
  const isSoalanTerakhir = indexSemasa + 1 === soalanSenarai.length;
  const progressPercentage = ((indexSemasa + 1) / soalanSenarai.length) * 100;
  
  const jawapanBetulTeks = jenisSoalan === "objektif" ? (senaraiPilihan.find((p: any[]) => p[0] === semasa.jawapan)?.[1] || semasa.jawapan) : "";

  return (
    <div className={`min-h-screen pb-28 pt-20 transition-colors duration-700 ${selectedTheme}`}> 
      
      <audio ref={bgmRef} src={selectedTrack} loop />

      <div className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 z-40">
         <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
           
           <div className="flex items-center gap-3 md:gap-4">
             <button
               onClick={keluarKuiz}
               className="p-1.5 md:px-3 md:py-1.5 bg-slate-200/50 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
               title="Kembali ke Dashboard"
             >
               <ArrowLeft size={16} />
               <span className="hidden md:inline text-xs font-bold">Kembali</span>
             </button>
             
             <div>
               <h1 className="text-sm md:text-base font-extrabold text-slate-800">{bab}</h1>
               <p className="text-[10px] md:text-xs font-bold text-sky-600 uppercase mt-0.5">Soalan Kuiz Interaktif</p>
             </div>
           </div>
           
           <div className="flex items-center gap-2 md:gap-4">
             
             <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                <Palette size={14} className="text-slate-500 ml-2" />
                <select 
                  value={selectedTheme}
                  onChange={(e) => setSelectedTheme(e.target.value)}
                  className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none cursor-pointer py-1.5 pl-1 pr-2 hover:text-sky-600 transition-colors appearance-none"
                  title="Tukar Latar Belakang"
                >
                  {senaraiTheme.map(theme => (
                    <option key={theme.id} value={theme.class}>{theme.nama}</option>
                  ))}
                </select>
             </div>

             <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={toggleMusic} 
                  className={`p-1.5 rounded-lg transition-colors ${isMusicPlaying ? 'bg-white text-emerald-500 shadow-sm' : 'bg-transparent text-slate-400 hover:bg-slate-200'}`}
                  title={isMusicPlaying ? "Matikan Muzik" : "Hidupkan Muzik"}
                >
                  {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <div className="flex items-center border-l border-slate-300 pl-1 md:pl-2">
                  <Music size={12} className="text-slate-400 mr-1 hidden md:block" />
                  <select 
                    value={selectedTrack}
                    onChange={handleTrackChange}
                    className="bg-transparent text-[10px] md:text-xs font-bold text-slate-700 outline-none cursor-pointer py-1 pr-2 hover:text-sky-600 transition-colors appearance-none max-w-25 md:max-w-none truncate"
                  >
                    {senaraiLagu.map(lagu => (
                      <option key={lagu.id} value={lagu.src}>{lagu.nama}</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="text-right hidden md:block">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Kemajuan</span>
               <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">{indexSemasa + 1} / {soalanSenarai.length}</span>
             </div>
           </div>
         </div>
         <div className="w-full bg-slate-100 h-1.5"><div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 w-full mt-2">
         <div className="md:hidden text-center mb-4 text-xs font-bold text-slate-400 drop-shadow-md">
           Soalan {indexSemasa + 1} daripada {soalanSenarai.length}
         </div>

         <div className="bg-white/95 backdrop-blur-md p-6 md:p-8 rounded-2xl shadow-xl border border-white/40">
           
           <div className="flex justify-between items-start gap-4 mb-6">
             <h2 className="text-base md:text-lg font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{semasa.soalan}</h2>
             {semasa.markah && <span className="shrink-0 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200">{semasa.markah} Markah</span>}
           </div>

           <GambarSoalan src={semasa.imageUrl} />

           <div className="mt-8">
             {jenisSoalan === "objektif" ? (
               <div className="grid gap-3">
                 {senaraiPilihan.map((item: any, i: number) => {
                   const isSelected = jawapanObjektif[semasa.id] === item[0];
                   const isCorrectOption = soalanSelesai && item[0] === semasa.jawapan;
                   const isWrongSelected = soalanSelesai && isSelected && !jawapanTepatSemasa;
                   
                   let butangWarna = 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50'; 
                   let hurufWarna = 'bg-slate-100 text-slate-500';

                   if (soalanSelesai) {
                     // Jika Ujian Pasca & Salah, JANGAN tunjuk warna Hijau untuk jawapan yang betul
                     if (isCorrectOption && jenisUjian === "pre_test") { 
                         butangWarna = 'border-emerald-500 bg-emerald-50 shadow-md'; 
                         hurufWarna = 'bg-emerald-500 text-white'; 
                     }
                     else if (isWrongSelected) { 
                         butangWarna = 'border-red-500 bg-red-50 opacity-90'; 
                         hurufWarna = 'bg-red-500 text-white'; 
                     }
                     else { 
                         butangWarna = 'border-slate-200 bg-slate-50 opacity-40'; 
                     } 
                   } else if (isSelected) {
                     butangWarna = 'border-sky-500 bg-sky-50 shadow-sm'; hurufWarna = 'bg-sky-500 text-white';
                   }

                   return (
                     <button key={item[0]} onClick={() => pilihJawapanObjektif(semasa.id, item[0])} disabled={soalanSelesai}
                       className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium flex gap-4 items-center ${butangWarna}`}>
                       <span className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center font-bold text-sm md:text-base transition-colors ${hurufWarna}`}>
                         {(isCorrectOption && jenisUjian === "pre_test") ? '✓' : isWrongSelected ? '✗' : String.fromCharCode(65 + i)}
                       </span>
                       <span className={`text-sm md:text-base ${isCorrectOption && jenisUjian === "pre_test" ? 'text-emerald-900 font-bold' : isWrongSelected ? 'text-red-900' : 'text-slate-700'}`}>{item[1] as string}</span>
                     </button>
                   );
                 })}

                 {/* LOGIK RAHSIA SKEMA (ANTI-HAFALAN POST TEST) */}
                 {soalanSelesai && (
                   <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 border ${jawapanTepatSemasa ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                     <span className="text-2xl mt-0.5">{jawapanTepatSemasa ? '🎯' : '😢'}</span>
                     <div>
                       <h4 className="font-bold text-base">{jawapanTepatSemasa ? 'Tepat Sekali!' : 'Oops, Kurang Tepat!'}</h4>
                       
                       {!jawapanTepatSemasa && jenisUjian === "pre_test" && (
                         <p className="text-sm mt-1 opacity-90">Jawapan sebenar ialah: <strong>{jawapanBetulTeks}</strong></p>
                       )}
                       {!jawapanTepatSemasa && jenisUjian === "post_test" && (
                         <p className="text-sm mt-1 opacity-90 font-medium text-red-700">Ini adalah ujian pasca. Sila semak semula kefahaman anda terhadap nota rujukan nanti.</p>
                       )}
                     </div>
                   </div>
                 )}
               </div>
             ) : (
               <div className="relative">
                 <textarea
                   ref={textareaRef}
                   value={jawapanStruktur[semasa.id] || ""} 
                   onChange={(e) => handleInputStruktur(e, semasa.id)}
                   disabled={soalanSelesai}
                   placeholder="Sila taip jawapan esei/struktur di sini..."
                   className={`w-full p-4 md:p-5 text-slate-900 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/10 resize-none min-h-40 max-h-96 overflow-y-auto text-sm md:text-base transition-all outline-none leading-relaxed ${soalanSelesai ? 'bg-slate-100 border-slate-300 opacity-80' : 'bg-slate-50 border-slate-300 focus:bg-white focus:border-sky-500'}`}
                 />
                 
                 {soalanSelesai ? (
                   <div className="mt-4 p-5 bg-sky-50 border border-sky-200 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <h4 className="font-bold text-sky-800 flex items-center gap-2 mb-2">💡 Jawapan Direkodkan:</h4>
                     {jenisUjian === "pre_test" ? (
                       <p className="text-sky-900 text-sm md:text-base whitespace-pre-wrap leading-relaxed">
                          <strong>Rujukan Skema Asas:</strong><br/>
                          {semasa.skemaJawapan || semasa.jawapan || "Tiada skema khusus disediakan."}
                       </p>
                     ) : (
                       <p className="text-sky-900 text-sm font-medium">Sistem AI akan menilai struktur jawapan anda secara menyeluruh di akhir ujian.</p>
                     )}
                     <p className="text-xs text-sky-600 mt-3 font-semibold italic">*Jawapan anda akan dinilai oleh Guru dan Cikgu AI nanti.</p>
                   </div>
                 ) : (
                   <button 
                     onClick={sahkanJawapanStruktur} 
                     disabled={!jawapanStruktur[semasa.id]?.trim()}
                     className="mt-4 w-full md:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     ✅ Sahkan & Semak Jawapan
                   </button>
                 )}
               </div>
             )}
           </div>
         </div>
      </div>

      {soalanSelesai && (jenisSoalan !== "objektif" || isSoalanTerakhir) && (
        <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm border-t border-slate-200 p-4 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300">
           <div className="max-w-3xl mx-auto flex justify-end">
             <button onClick={pergiSoalanSeterusnyaAtauTamat} className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold transition-all text-sm md:text-base w-full shadow-lg ${isSoalanTerakhir ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/30' : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'}`}>
               {isSoalanTerakhir ? 'Tamat & Analisis Markah' : 'Teruskan ke Soalan Seterusnya'} <ChevronRight size={20}/>
             </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default function UjianDiagnostik() {
  return <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sky-600 font-bold"><Loader2 className="animate-spin mr-3"/>Memuatkan Sistem...</div>}><KandunganUjian /></Suspense>;
}