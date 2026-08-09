"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { ArrowLeft, Save, Loader2, User, BookOpen, AlertTriangle, Sparkles, CheckCircle, RefreshCw, Lightbulb } from "lucide-react";

export default function PemarkahanGuru() {
  const params = useParams();
  const rawId = params.id as string;
  const documentId = decodeURIComponent(rawId);

  const [dataMurid, setDataMurid] = useState<any>(null);
  const [soalanBank, setSoalanBank] = useState<any[]>([]);
  const [markahGuru, setMarkahGuru] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);
  
  // State untuk butang Refresh AI individu & Semua
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [isSemakSemuaLoading, setIsSemakSemuaLoading] = useState(false);
  const [soalanDisemakSemula, setSoalanDisemakSemula] = useState<string[]>([]);

  useEffect(() => {
    tarikData();
  }, [documentId]);

  const tarikData = async () => {
    try {
      const docRef = doc(db, "skor_murid", documentId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const rekod = docSnap.data();
        setDataMurid(rekod);

        const keysJawapan = rekod.jawapanStruktur ? Object.keys(rekod.jawapanStruktur) : [];
        const keysUlasan = rekod.ulasanAI ? Object.keys(rekod.ulasanAI) : [];
        const keysMarkah = rekod.markahGuru ? Object.keys(rekod.markahGuru) : [];
        
        const senaraiIdSoalanSah = Array.from(new Set([...keysJawapan, ...keysUlasan, ...keysMarkah]));

        const q = query(
          collection(db, "questionBank"), 
          where("tingkatan", "==", rekod.tingkatan),
          where("bab", "==", rekod.bab)
        );
        const qSnap = await getDocs(q);
        const qList: any[] = [];
        
        qSnap.forEach((d) => {
           const soalanData = d.data();
           const soalanId = d.id;
           if (soalanData.jenis !== "objektif" && senaraiIdSoalanSah.includes(soalanId)) {
              qList.push({ id: soalanId, ...soalanData });
           }
        });
        
        qList.sort((a, b) => Number(a.urutan) - Number(b.urutan));
        setSoalanBank(qList);

        const markahAwal: Record<string, number> = {};
        qList.forEach(soalan => {
          if (rekod.markahGuru && rekod.markahGuru[soalan.id] !== undefined) {
            markahAwal[soalan.id] = rekod.markahGuru[soalan.id];
          } else if (rekod.ulasanAI && rekod.ulasanAI[soalan.id]) {
            markahAwal[soalan.id] = rekod.ulasanAI[soalan.id].markahAI || 0;
          } else {
            markahAwal[soalan.id] = 0; 
          }
        });
        setMarkahGuru(markahAwal);
      }
    } catch (error) {
      console.error("Ralat Firebase:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkahChange = (soalanId: string, nilai: string, markahPenuh: number) => {
    let num = parseInt(nilai) || 0;
    if (num > markahPenuh) num = markahPenuh; 
    if (num < 0) num = 0; 

    setMarkahGuru(prev => ({ ...prev, [soalanId]: num }));
  };

  // 🌟 FUNGSI: SEMAK SEMULA SATU SOALAN
  const semakSemulaGunaAI = async (soalan: any, teksJawapanMurid: string) => {
    setLoadingAI(soalan.id); 
    
    try {
      const res = await fetch("/api/semak-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          soalan: soalan.soalan,
          skemaJawapan: soalan.skemaJawapan || "Tiada skema khusus.", 
          markahPenuh: soalan.markah,
          jawapanMurid: teksJawapanMurid || "Tiada jawapan diberikan."
        })
      });

      const data = await res.json();
      
      if (res.ok && data.markahDicadangkan !== undefined) {
        const ulasanTerkini = {
          ...dataMurid.ulasanAI,
          [soalan.id]: {
            komenAI: data.komen,
            markahAI: data.markahDicadangkan
          }
        };

        await updateDoc(doc(db, "skor_murid", documentId), {
          ulasanAI: ulasanTerkini
        });

        setSoalanDisemakSemula(prev => [...prev, soalan.id]);
        
        if (data.markahDicadangkan === 0) {
            alert(`Selesai disemak. Jawapan murid ini memang SALAH berdasarkan skema. AI beri 0 Markah.`);
        } else {
            alert(`Selesai disemak! Markah dinaikkan kepada: ${data.markahDicadangkan} M`);
        }
        tarikData(); 
      } else {
        alert("Ralat dari API AI: " + (data.komen || "Sila cuba lagi."));
      }
    } catch (error) {
      console.error("Ralat Semakan AI:", error);
      alert("Gagal menghubungi server AI. Sila periksa sambungan internet.");
    } finally {
      setLoadingAI(null);
    }
  };

  // 🌟 FUNGSI BAHARU: SEMAK SEMULA SEMUA AI (Pukal)
  const semakSemulaSemuaAI = async () => {
    // 1. Tapis mana soalan yang masih GAGAL dan belum ditekan Refresh
    const soalanPerluSemak = soalanBank.filter(soalan => {
      const jawapanMurid = dataMurid?.jawapanStruktur?.[soalan.id] || "";
      const ulasanAI = dataMurid?.ulasanAI?.[soalan.id];
      const isAIGagal = ulasanAI?.komenAI?.includes("GAGAL");
      const sudahDisemakSemula = soalanDisemakSemula.includes(soalan.id);
      
      return isAIGagal && jawapanMurid.length > 5 && !sudahDisemakSemula;
    });

    if (soalanPerluSemak.length === 0) {
      alert("Tiada soalan yang perlukan semakan semula.");
      return;
    }

    setIsSemakSemuaLoading(true);

    try {
      let ulasanTerkini = { ...dataMurid.ulasanAI };
      let soalanDisemakSekarang: string[] = [];

      // 2. Jalankan panggilan API untuk semua soalan secara serentak (Parallel)
      const semakanPromises = soalanPerluSemak.map(async (soalan) => {
        const jawapanMurid = dataMurid.jawapanStruktur?.[soalan.id];
        
        const res = await fetch("/api/semak-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            soalan: soalan.soalan,
            skemaJawapan: soalan.skemaJawapan || "Tiada skema khusus.", 
            markahPenuh: soalan.markah,
            jawapanMurid: jawapanMurid || "Tiada jawapan diberikan."
          })
        });

        const data = await res.json();
        if (res.ok && data.markahDicadangkan !== undefined) {
          ulasanTerkini[soalan.id] = {
            komenAI: data.komen,
            markahAI: data.markahDicadangkan
          };
          soalanDisemakSekarang.push(soalan.id);
        }
      });

      await Promise.all(semakanPromises);

      // 3. Simpan kesemua ulasan baru ke Firestore dengan 1 kali request
      await updateDoc(doc(db, "skor_murid", documentId), {
        ulasanAI: ulasanTerkini
      });

      setSoalanDisemakSemula(prev => [...prev, ...soalanDisemakSekarang]);
      alert(`Selesai! Sebanyak ${soalanDisemakSekarang.length} jawapan murid telah disemak semula secara automatik.`);
      tarikData(); // Tarik data baru untuk UI
      
    } catch (error) {
      console.error("Ralat Semakan Pukal AI:", error);
      alert("Gagal menyemak semua. Sila pastikan talian internet anda stabil.");
    } finally {
      setIsSemakSemuaLoading(false);
    }
  };

  const simpanPemarkahan = async () => {
    setMenyimpan(true);
    try {
      let totalStrukturBaru = 0;
      Object.values(markahGuru).forEach(m => { totalStrukturBaru += (Number(m) || 0); });

      const skorAkhirBaru = (Number(dataMurid.skorObjektif) || 0) + totalStrukturBaru;
      const penuhUjian = Number(dataMurid.markahPenuhUjian) || 100; 
      const peratusBaru = penuhUjian > 0 ? Math.round((skorAkhirBaru / penuhUjian) * 100) : 0;

      let tahapBaru = "Rendah";
      if (peratusBaru >= 80) tahapBaru = "Tinggi";
      else if (peratusBaru >= 50) tahapBaru = "Sederhana";

      await updateDoc(doc(db, "skor_murid", documentId), {
        markahGuru: markahGuru,
        markahStruktur: totalStrukturBaru,
        skorAkhir: skorAkhirBaru,
        skor: peratusBaru,
        statusPermarkahanEsei: "disemak_oleh_guru"
      });

      if (dataMurid.idMurid) {
         await updateDoc(doc(db, "users", dataMurid.idMurid), {
           markahTerkini: peratusBaru,
           tahapInkuiri: tahapBaru
         });
      }

      alert("Markah berjaya disimpan! Status pelajar telah dikemaskini.");
      window.close();
      
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan markah. Sila pastikan talian internet anda stabil.");
    } finally {
      setMenyimpan(false);
    }
  };

  // Logik memeriksa jika perlu paparkan Butang Semak Semua
  const adaAIGagalBelumDisemak = soalanBank.some(soalan => {
    const jawapanMurid = dataMurid?.jawapanStruktur?.[soalan.id] || "";
    const ulasanAI = dataMurid?.ulasanAI?.[soalan.id];
    const isAIGagal = ulasanAI?.komenAI?.includes("GAGAL");
    const sudahDisemakSemula = soalanDisemakSemula.includes(soalan.id);
    return isAIGagal && jawapanMurid.length > 5 && !sudahDisemakSemula;
  });

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-sky-400 font-bold"><Loader2 className="animate-spin mr-3" size={28}/> Menarik rekod kertas jawapan...</div>;
  if (!dataMurid) return <div className="flex h-screen items-center justify-center bg-slate-900 text-rose-400 font-bold text-lg"><AlertTriangle className="mr-2"/> Rekod ujian tidak dijumpai.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-200 py-6 sm:py-10 px-4 font-sans relative">
      <style dangerouslySetInnerHTML={{ __html: `body { background-color: #0f172a; margin: 0; }` }} />

      <div className="max-w-4xl w-full mx-auto flex-1">
        
        {/* ACTION BAR (HEADER) */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <button onClick={() => window.close()} className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-400 hover:text-white bg-slate-800 sm:bg-transparent py-2.5 rounded-lg sm:py-0 transition">
            <ArrowLeft size={20}/> Kembali ke Dashboard
          </button>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* 🌟 BUTANG SEMAK SEMULA SEMUA AI MUNCUL DI SINI */}
            {adaAIGagalBelumDisemak && (
              <button 
                onClick={semakSemulaSemuaAI} 
                disabled={isSemakSemuaLoading}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-5 py-3 sm:py-2.5 rounded-xl font-bold shadow-lg shadow-rose-900/50 disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {isSemakSemuaLoading ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                {isSemakSemuaLoading ? "Menyemak Pukal..." : "Semak Semula AI (Ralat)"}
              </button>
            )}

            <button 
              onClick={simpanPemarkahan} 
              disabled={menyimpan}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 sm:py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/50 disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {menyimpan ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>}
              {menyimpan ? "Menyimpan..." : "Sahkan & Simpan"}
            </button>
          </div>
        </div>

        {/* KAD MAKLUMAT MURID */}
        <div className="bg-[#1e293b] p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><User size={100}/></div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-6 border-b border-slate-700/50 pb-4 relative z-10">Semakan Kertas Jawapan Murid</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="p-3.5 bg-blue-900/40 text-blue-400 rounded-xl shadow-inner"><User size={24}/></div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Identiti Murid</p>
                <p className="text-base sm:text-lg font-bold text-slate-200 leading-tight">{dataMurid.namaMurid}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">UID: {dataMurid.idMurid}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <div className="p-3.5 bg-indigo-900/40 text-indigo-400 rounded-xl shadow-inner"><BookOpen size={24}/></div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-0.5">Konteks Ujian</p>
                <p className="text-base sm:text-lg font-bold text-slate-200 leading-tight flex items-center gap-2">
                  {dataMurid.bab} 
                  <span className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-wider border ${dataMurid.jenisUjian === "post_test" ? "bg-emerald-900/30 text-emerald-400 border-emerald-800/50" : dataMurid.jenisUjian === "pre_test" ? "bg-indigo-900/30 text-indigo-400 border-indigo-800/50" : "bg-orange-900/30 text-orange-400 border-orange-800/50"}`}>
                    {dataMurid.jenisUjian === "post_test" ? "POST" : dataMurid.jenisUjian === "pre_test" ? "PRE" : "PEMULIHAN"}
                  </span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">Tingkatan {dataMurid.tingkatan}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SENARAI SOALAN DAN JAWAPAN */}
        <div className="space-y-8 pb-12">
          {soalanBank.length > 0 ? soalanBank.map((soalan, index) => {
            const jawapanMurid = dataMurid.jawapanStruktur?.[soalan.id] || "";
            const ulasanAI = dataMurid.ulasanAI?.[soalan.id];
            const isAIGagal = ulasanAI?.komenAI?.includes("GAGAL");
            const sudahDisemakSemula = soalanDisemakSemula.includes(soalan.id); 

            return (
              <div key={soalan.id} className="bg-[#1e293b] rounded-3xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col h-full">
                
                {/* HEADER SOALAN */}
                <div className="bg-slate-800/80 p-5 sm:p-6 flex flex-col sm:flex-row justify-between items-start border-b border-slate-700 gap-4 shrink-0">
                  <div>
                    <span className="bg-slate-900 text-slate-400 border border-slate-600 text-[10px] font-black px-3 py-1.5 rounded-lg mb-3 inline-block uppercase tracking-widest shadow-inner">Soalan {index + 1}</span>
                    <p className="text-base sm:text-lg font-medium text-slate-200 leading-relaxed">{soalan.soalan}</p>
                  </div>
                  <span className="bg-amber-900/20 text-amber-500 text-xs font-black px-4 py-2 rounded-xl shrink-0 border border-amber-800/50 shadow-sm w-max">
                    Max: {soalan.markah} M
                  </span>
                </div>

                <div className="p-5 sm:p-6 space-y-6 flex-1 flex flex-col">
                  
                  {/* 🌟 KOTAK SKEMA JAWAPAN UNTUK RUJUKAN GURU */}
                  {soalan.skemaJawapan && (
                    <div className="bg-emerald-900/10 border border-emerald-800/30 p-4 sm:p-5 rounded-2xl shadow-inner">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                        <Lightbulb size={14}/> Skema Jawapan (Rujukan Guru):
                      </p>
                      <div className="text-emerald-200/90 whitespace-pre-wrap text-sm leading-relaxed">
                        {soalan.skemaJawapan}
                      </div>
                    </div>
                  )}

                  {/* JAWAPAN MURID */}
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Teks Jawapan Murid:</p>
                    <div className="bg-slate-900/80 border border-slate-700 p-5 rounded-2xl text-slate-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed shadow-inner">
                      {jawapanMurid ? jawapanMurid : <span className="text-rose-400/80 italic font-medium flex items-center gap-2"><AlertTriangle size={16}/> Tiada jawapan diberikan / Ditinggalkan kosong oleh murid.</span>}
                    </div>
                  </div>

                  {/* ULASAN AI TENTANG JAWAPAN INI */}
                  {ulasanAI && (
                    <div className={`p-5 rounded-2xl border shrink-0 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isAIGagal ? 'bg-rose-900/10 border-rose-800/50' : 'bg-cyan-900/10 border-cyan-800/50'}`}>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${isAIGagal ? 'text-rose-400' : 'text-cyan-400'}`}>
                          {isAIGagal ? <AlertTriangle size={16}/> : <Sparkles size={16}/>} 
                          Bantuan AI (Cadangan: {ulasanAI.markahAI}M)
                        </p>
                        <p className={`text-sm leading-relaxed ${isAIGagal ? 'text-rose-300' : 'text-cyan-200'}`}>
                          {ulasanAI.komenAI}
                        </p>
                      </div>
                      
                      {/* Butang Individu (Refresh 1 soalan) */}
                      {!sudahDisemakSemula && isAIGagal && jawapanMurid.length > 5 && (
                        <button 
                          onClick={() => semakSemulaGunaAI(soalan, jawapanMurid)}
                          disabled={loadingAI === soalan.id || isSemakSemuaLoading}
                          className="shrink-0 bg-rose-900/50 hover:bg-rose-800 text-rose-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-rose-700/50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {loadingAI === soalan.id ? <Loader2 size={14} className="animate-spin"/> : <RefreshCw size={14}/>}
                          Semak Semula AI
                        </button>
                      )}
                      {sudahDisemakSemula && (
                        <span className="shrink-0 text-xs font-bold text-slate-500 border border-slate-600 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle size={14}/> Disemak</span>
                      )}
                    </div>
                  )}

                  {/* INPUT MARKAH MUKTAMAD (OLEH GURU) */}
                  <div className="bg-slate-800 p-5 sm:p-6 rounded-2xl border border-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 mt-auto shadow-md">
                    <div>
                      <label className="block text-sm font-black text-emerald-400 uppercase tracking-widest mb-1">Keputusan Guru</label>
                      <p className="text-[10px] text-slate-400">Markah ini akan menggantikan cadangan AI.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <input 
                        type="number" 
                        min="0" 
                        max={soalan.markah}
                        value={markahGuru[soalan.id] ?? ""}
                        onChange={(e) => handleMarkahChange(soalan.id, e.target.value, soalan.markah)}
                        className="w-full sm:w-24 bg-slate-900 border-2 border-emerald-500/50 rounded-xl p-3 sm:p-4 text-center text-xl font-black text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-inner transition-all"
                      />
                      <span className="text-slate-400 font-bold text-lg">/ {soalan.markah}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          }) : (
            <div className="bg-[#1e293b] p-12 rounded-3xl border border-slate-700 border-dashed text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-slate-800 rounded-full"><BookOpen size={32} className="text-slate-500"/></div>
              <div>
                <p className="text-lg font-bold text-slate-300 mb-1">Tiada soalan esei / struktur ditemui.</p>
                <p className="text-sm text-slate-500">Semua soalan dalam kertas ujian ini berkemungkinan berbentuk objektif, atau murid belum memulakan/menjawab apa-apa soalan struktur.</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}