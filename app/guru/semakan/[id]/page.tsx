"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { ArrowLeft, Save, Loader2, User, BookOpen, AlertTriangle } from "lucide-react";

export default function PemarkahanGuru() {
  const params = useParams();
  const rawId = params.id as string;
  const documentId = decodeURIComponent(rawId);

  const [dataMurid, setDataMurid] = useState<any>(null);
  const [soalanBank, setSoalanBank] = useState<any[]>([]);
  const [markahGuru, setMarkahGuru] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    const tarikData = async () => {
      try {
        // 1. Tarik rekod jawapan murid
        const docRef = doc(db, "skor_murid", documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const rekod = docSnap.data();
          setDataMurid(rekod);

          // Sediakan markah input awal
          const markahAwal: Record<string, number> = {};
          if (rekod.jawapanStruktur) {
            Object.keys(rekod.jawapanStruktur).forEach(soalanId => {
              if (rekod.markahGuru && rekod.markahGuru[soalanId] !== undefined) {
                markahAwal[soalanId] = rekod.markahGuru[soalanId];
              } else if (rekod.ulasanAI && rekod.ulasanAI[soalanId]) {
                markahAwal[soalanId] = rekod.ulasanAI[soalanId].markahAI || 0;
              } else {
                markahAwal[soalanId] = 0;
              }
            });
          }
          setMarkahGuru(markahAwal);

          // 2. Tarik soalan sebenar dari Bank Soalan
          const q = query(
            collection(db, "questionBank"), 
            where("tingkatan", "==", rekod.tingkatan),
            where("bab", "==", rekod.bab)
          );
          const qSnap = await getDocs(q);
          const qList: any[] = [];
          qSnap.forEach((d) => {
             const soalanData = d.data();
             if(soalanData.jenis !== "objektif") {
                qList.push({ id: d.id, ...soalanData });
             }
          });
          
          qList.sort((a, b) => a.id.localeCompare(b.id));
          setSoalanBank(qList);
        }
      } catch (error) {
        console.error("Ralat Firebase:", error);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) tarikData();
  }, [documentId]);

  // FUNGSI KEMASKINI INPUT MARKAH
  const handleMarkahChange = (soalanId: string, nilai: string, markahPenuh: number) => {
    let num = parseInt(nilai) || 0;
    if (num > markahPenuh) num = markahPenuh; 
    if (num < 0) num = 0; 

    setMarkahGuru(prev => ({
      ...prev,
      [soalanId]: num
    }));
  };

  // 🌟 FUNGSI SIMPAN MARKAH KE FIREBASE (TELAH DIBETULKAN)
  const simpanPemarkahan = async () => {
    setMenyimpan(true);
    try {
      // 1. Kira jumlah markah Esei/Struktur yang baru
      let totalStrukturBaru = 0;
      Object.values(markahGuru).forEach(m => { 
        totalStrukturBaru += (Number(m) || 0); 
      });

      // 2. Kira markah keseluruhan (Objektif sedia ada + Esei baru)
      const skorAkhirBaru = (Number(dataMurid.skorObjektif) || 0) + totalStrukturBaru;
      const penuhUjian = Number(dataMurid.markahPenuhUjian) || 100; // Elak bahagi dengan 0
      const peratusBaru = penuhUjian > 0 ? Math.round((skorAkhirBaru / penuhUjian) * 100) : 0;

      // 3. Tentukan Tahap Inkuiri Murid yang terkini
      let tahapBaru = "Rendah";
      if (peratusBaru >= 80) tahapBaru = "Tinggi";
      else if (peratusBaru >= 50) tahapBaru = "Sederhana";

      // 4. Update jadual 'skor_murid'
      await updateDoc(doc(db, "skor_murid", documentId), {
        markahGuru: markahGuru,
        markahStruktur: totalStrukturBaru,
        skorAkhir: skorAkhirBaru,
        skor: peratusBaru,
        statusPermarkahanEsei: "disemak_oleh_guru"
      });

      // 5. Update jadual 'users' supaya dashboard murid & guru selari
      if (dataMurid.idMurid) {
         await updateDoc(doc(db, "users", dataMurid.idMurid), {
           markahTerkini: peratusBaru,
           tahapInkuiri: tahapBaru
         });
      }

      alert("Markah berjaya disimpan! Status telah dikemaskini.");
      
      // Tutup tab ini
      window.close();
      
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan markah.");
    } finally {
      setMenyimpan(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-900 text-sky-400 font-bold"><Loader2 className="animate-spin mr-2"/> Memuatkan kertas jawapan...</div>;
  if (!dataMurid) return <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400 font-bold">Rekod tidak dijumpai.</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => window.close()} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
            <ArrowLeft size={20}/> Kembali
          </button>
          <button 
            onClick={simpanPemarkahan} 
            disabled={menyimpan}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg disabled:opacity-50 transition"
          >
            {menyimpan ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            {menyimpan ? "Menyimpan..." : "Simpan Pemarkahan"}
          </button>
        </div>

        <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-700 shadow-xl mb-8">
          <h1 className="text-2xl font-bold text-white mb-6 border-b border-slate-700 pb-4">Semakan Kertas Jawapan Murid</h1>
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg"><User size={24}/></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Nama Murid</p>
                <p className="text-lg font-bold text-white">{dataMurid.namaMurid}</p>
                <p className="text-sm text-slate-400">{dataMurid.idMurid}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-lg"><BookOpen size={24}/></div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold">Topik Ujian</p>
                <p className="text-lg font-bold text-white">{dataMurid.bab}</p>
                <p className="text-sm text-slate-400">Tingkatan {dataMurid.tingkatan}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {soalanBank.length > 0 ? soalanBank.map((soalan, index) => {
            const jawapanMurid = dataMurid.jawapanStruktur?.[soalan.id];
            const ulasanAI = dataMurid.ulasanAI?.[soalan.id];
            const isAIGagal = ulasanAI?.komenAI?.includes("GAGAL");

            return (
              <div key={soalan.id} className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden shadow-lg">
                <div className="bg-slate-800/50 p-5 flex justify-between items-start border-b border-slate-700">
                  <div>
                    <span className="bg-slate-700 text-slate-300 text-xs font-bold px-3 py-1 rounded-md mb-3 inline-block">Soalan {index + 1}</span>
                    <p className="text-lg font-medium text-white">{soalan.soalan}</p>
                  </div>
                  <span className="bg-amber-900/30 text-amber-500 text-sm font-bold px-4 py-2 rounded-lg shrink-0 border border-amber-800/50">
                    Max: {soalan.markah} M
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* JAWAPAN MURID */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Jawapan Murid:</p>
                    <div className="bg-[#0f172a] border border-slate-700 p-4 rounded-xl text-slate-300 whitespace-pre-wrap">
                      {jawapanMurid ? jawapanMurid : <span className="text-slate-600 italic">Tiada jawapan diberikan.</span>}
                    </div>
                  </div>

                  {/* ULASAN AI (RUJUKAN GURU) */}
                  {ulasanAI && (
                    <div className={`p-4 rounded-xl border ${isAIGagal ? 'bg-rose-900/10 border-rose-900/50' : 'bg-cyan-900/10 border-cyan-900/50'}`}>
                      <p className={`text-xs font-bold uppercase mb-2 flex items-center gap-2 ${isAIGagal ? 'text-rose-400' : 'text-cyan-400'}`}>
                        {isAIGagal ? <AlertTriangle size={14}/> : '🤖'} Ulasan AI (Cadangan: {ulasanAI.markahAI}M)
                      </p>
                      <p className={`text-sm ${isAIGagal ? 'text-rose-300/80' : 'text-cyan-300/80'}`}>{ulasanAI.komenAI}</p>
                    </div>
                  )}

                  {/* KEPUTUSAN & INPUT GURU */}
                  <div className="bg-slate-800 p-5 rounded-xl border border-slate-600 flex items-center gap-6">
                    <label className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Markah Muktamad Guru:</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="number" 
                        min="0" 
                        max={soalan.markah}
                        value={markahGuru[soalan.id] ?? ""}
                        onChange={(e) => handleMarkahChange(soalan.id, e.target.value, soalan.markah)}
                        className="w-20 bg-[#0f172a] border-2 border-emerald-500/50 rounded-lg p-3 text-center text-xl font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                      <span className="text-slate-500 font-medium">/ {soalan.markah}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="bg-[#1e293b] p-10 rounded-2xl border border-slate-700 text-center text-slate-500">
              Tiada soalan struktur ditemui untuk ujian ini.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}