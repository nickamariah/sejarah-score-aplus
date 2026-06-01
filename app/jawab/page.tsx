"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// ==========================================
// 1. KOMPONEN KANDUNGAN UJIAN (Isi Sebenar)
// ==========================================
function KandunganUjian() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tingkatan = searchParams?.get("tingkatan") || "4";
  const bab = searchParams?.get("bab") || "Bab 1";

  const [soalanSenarai, setSoalanSenarai] = useState<any[]>([]);
  const [indexSemasa, setIndexSemasa] = useState(0);
  const [skor, setSkor] = useState(0); // Markah Objektif
  const [tamat, setTamat] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // STATE JAWAPAN
  const [jawapanTeks, setJawapanTeks] = useState(""); // Input teks semasa
  const [jawapanStruktur, setJawapanStruktur] = useState<Record<string, string>>({}); // Kumpulkan semua jawapan struktur
  const [telahDisimpan, setTelahDisimpan] = useState(false); // Elak AI tanda 2 kali
  const [menganalisisAI, setMenganalisisAI] = useState(false); // Untuk paparan loading AI

  // TARIK SOALAN DARI FIREBASE
  useEffect(() => {
    if (!isClient) return;

    const tarikSoalan = async () => {
      try {
        const q = query(
          collection(db, "questionBank"),
          where("tingkatan", "==", tingkatan), 
          where("bab", "==", bab)
        );

        const querySnapshot = await getDocs(q);
        const soalanData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          soalanData.push({ id: doc.id, ...doc.data() });
        });

        soalanData.sort((a, b) => a.id.localeCompare(b.id));
        setSoalanSenarai(soalanData);
      } catch (error) {
        console.error("Ralat tarik soalan:", error);
      } finally {
        setLoading(false);
      }
    };

    tarikSoalan();
  }, [tingkatan, bab, isClient]);

  
  // SIMPAN MARKAH & JAWAPAN ESEI KE FIREBASE (BERSAMA AI AUTO-MARKING)
  useEffect(() => {
    if (!isClient) return;

    const simpanMarkahFirebase = async () => {
      // Kita tambah sekatan !telahDisimpan supaya sistem tak hantar 2 kali ke AI
      if (tamat && soalanSenarai.length > 0 && !telahDisimpan) {
        setTelahDisimpan(true); 
        setMenganalisisAI(true); // Hidupkan paparan "AI Sedang Menganalisis"
        
        const rawUser = localStorage.getItem("currentUser");
        if (rawUser) {
          const user = JSON.parse(rawUser);
          
          try {
            let jumlahMarkahStrukturAI = 0;
            let ulasanAIPenuh: Record<string, any> = {};

            // PANGGIL AI UNTUK TANDA SETIAP SOALAN ESEI SATU PERSATU
            for (const [soalanId, jawapanMurid] of Object.entries(jawapanStruktur)) {
                const detailSoalan = soalanSenarai.find(s => s.id === soalanId);
                
                if (detailSoalan) {
                    console.log(`Menghantar soalan ${soalanId} ke AI Gemini...`);
                    const res = await fetch("/api/semak-ai", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            soalan: detailSoalan.soalan,
                            jawapanMurid: jawapanMurid,
                            markahPenuh: Number(detailSoalan.markah) || 0,
                            // TAMBAH BARIS INI:
                            skemaJawapan: detailSoalan.skemaJawapan || "" 
                        })
                    });
                    
                    const aiData = await res.json();
                    
                    // Kumpulkan hasil jawapan dari AI
                    ulasanAIPenuh[soalanId] = {
                        markahAI: Number(aiData.markahDicadangkan) || 0,
                        komenAI: aiData.komen || "Tiada ulasan."
                    };
                    // Tambahkan markah AI ke jumlah keseluruhan
                    jumlahMarkahStrukturAI += (Number(aiData.markahDicadangkan) || 0);
                }
            }

            // SELESAI AI MENANDA! SEKARANG BARU SIMPAN SEMUANYA KE FIREBASE
            const docId = `${user.id}_t${tingkatan}_${bab}`;
            const adaSoalanStruktur = Object.keys(jawapanStruktur).length > 0;
            
            // PENGIRAAN MARKAH PENUH UJIAN YANG SEBENAR
            let markahPenuhUjian = 0;
            soalanSenarai.forEach(s => {
              // Jika objektif (tiada medan markah), anggap 1 markah. Jika esei, ambil markah penuhnya.
              markahPenuhUjian += Number(s.markah) || 1; 
            });

            // PENGIRAAN PERATUSAN BARU
            const skorAkhir = skor + jumlahMarkahStrukturAI; // Objektif + Markah AI
            const peratus = Math.round((skorAkhir / markahPenuhUjian) * 100); 

            await setDoc(doc(db, "skor_murid", docId), {
              idMurid: user.id,
              namaMurid: user.name || user.nama,
              tingkatan: tingkatan,
              bab: bab,
              
              skorObjektif: skor,
              skor: peratus, // Peratusan yang lebih tepat!
              markahPenuhUjian: markahPenuhUjian, // KITA SIMPAN MARKAH PENUH DALAM FIREBASE
              
              // DATA AI YANG TELAH SIAP DITANDA
              jawapanStruktur: jawapanStruktur, 
              ulasanAI: ulasanAIPenuh, 
              markahStruktur: jumlahMarkahStrukturAI, 
              skorAkhir: skorAkhir, 
              
              statusPermarkahanEsei: adaSoalanStruktur ? "disemak_oleh_AI" : "tiada_esei",
              tarikh: new Date().toISOString()
            });
            
            console.log("Markah, Jawapan, dan Ulasan AI berjaya disimpan!");
          } catch (error) {
            console.error("Ralat simpan data atau AI:", error);
          }
        }

        // Tandakan selesai untuk Dashboard (Kod sedia ada)
        const chapterId = bab.replace("Bab ", "");
        const modKey = `t${tingkatan}-ch${chapterId}-mod1`;
        const completed = JSON.parse(localStorage.getItem("completedModules") || "[]");
        if (!completed.includes(modKey)) {
          completed.push(modKey);
          localStorage.setItem("completedModules", JSON.stringify(completed));
        }
        
        setMenganalisisAI(false); // Matikan loading
      }
    };

    simpanMarkahFirebase();
  }, [tamat, skor, soalanSenarai.length, tingkatan, bab, isClient, jawapanStruktur, telahDisimpan, soalanSenarai]);

     

  // FUNGSI JAWAB SOALAN
  const jawabSoalan = (jawapanMurid: string) => {
    const soalanSemasa = soalanSenarai[indexSemasa];
    
    if (soalanSemasa.jenis === "objektif") {
      if (jawapanMurid === soalanSemasa.jawapan) {
        setSkor(prev => prev + 1);
      }
    } else {
      // SIMPAN JAWAPAN ESEI KE DALAM STATE jawapanStruktur
      setJawapanStruktur(prev => ({
        ...prev,
        [soalanSemasa.id]: jawapanMurid
      }));
      console.log(`Menyimpan Esei [${soalanSemasa.id}]:`, jawapanMurid);
    }

    setJawapanTeks(""); // Kosongkan textarea untuk soalan seterusnya

    if (indexSemasa + 1 < soalanSenarai.length) {
      setIndexSemasa(indexSemasa + 1);
    } else {
      setTamat(true);
    }
  };

  // ==========================================
  // PAPARAN ANTARAMUKA (UI)
  // ==========================================
  if (!isClient) return <div className="min-h-screen flex items-center justify-center font-bold text-sky-600">Sistem Memulakan Ujian...</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sky-700 font-semibold">Memuatkan Soalan Firebase...</div>;
  
  if (soalanSenarai.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="p-8 bg-white rounded-xl shadow-md text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Soalan Belum Tersedia</h2>
        <p className="text-slate-600 mb-6">Guru belum memasukkan soalan untuk Tingkatan {tingkatan}, {bab}.</p>
        <button onClick={() => router.push('/murid')} className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-700">
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );

  if (tamat) {

    // PAPARAN KETIKA AI SEDANG MENANDA JAWAPAN
  if (menganalisisAI) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600 mb-6"></div>
        <h2 className="text-3xl font-bold text-sky-700">Sistem AI Sedang Menyemak...</h2>
        <p className="text-slate-500 mt-2 max-w-md">
          Sila tunggu sebentar. Guru AI (Google Gemini) sedang membaca, menganalisis, dan memberikan markah untuk jawapan esei anda.
        </p>
      </div>
    );
  }
    const peratus = Math.round((skor / soalanSenarai.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-8 border-sky-500">
          <h2 className="text-3xl font-extrabold mb-4 text-slate-800">Ujian Diagnostik Tamat</h2>
          <p className="text-lg text-slate-600 mb-2">{bab} | Tingkatan {tingkatan}</p>
          <div className="text-5xl font-black text-sky-600 mb-8">{peratus}%</div>
          
          {peratus >= 80 ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl mb-6">
              🔥 <strong>TAHNIAH! LALUAN CEMERLANG.</strong><br/>
              Anda telah menguasai bab ini. Modul Bacaan dilangkau.
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-6">
              📚 <strong>LALUAN BIMBINGAN (SCAFFOLDING).</strong><br/>
              Mari kita baca nota dan kukuhkan pemahaman anda bersama AI.
            </div>
          )}

          <button onClick={() => router.push('/murid')} className="w-full sm:w-auto bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-700 transition">
            Kembali ke Laluan Pembelajaran
          </button>
        </div>
      </div>
    );
  }

  const semasa = soalanSenarai[indexSemasa];
  const jenisSoalan = semasa.jenis ? semasa.jenis.toLowerCase() : "objektif"; 

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-slate-100">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{bab}</h1>
            <p className="text-sm font-medium text-sky-600">{semasa.topik}</p>
          </div>
          <span className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            Soalan {indexSemasa + 1} / {soalanSenarai.length}
          </span>
        </div>

        {/* SOALAN DAN MARKAH */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h2 className="text-2xl font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap flex-1">
            {semasa.soalan}
          </h2>
          {semasa.markah && (
            <span className="shrink-0 bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
              [ {semasa.markah} Markah ]
            </span>
          )}
        </div>

        {/* GAMBAR RAJAH (JIKA ADA) */}
        {semasa.imageUrl && semasa.imageUrl.trim() !== "" && (
          <div className="mb-8 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <img 
              src={semasa.imageUrl} 
              alt="Rajah Soalan" 
              className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
            />
          </div>
        )}

        {/* PILIHAN JAWAPAN (Objektif) ATAU KOTAK ESEI (Struktur) */}
        {jenisSoalan === "objektif" ? (
          <div className="grid gap-4">
            {semasa.pilihan && Object.entries(semasa.pilihan)
              .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
              .map(([kunci, teks]) => (
              <button
                key={kunci}
                onClick={() => jawabSoalan(kunci)}
                className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-slate-700 flex gap-4 items-center group"
              >
                <span className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-sky-500 group-hover:text-white transition-colors flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0">
                  {kunci}
                </span>
                <span className="text-lg">{teks as string}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <textarea
              value={jawapanTeks}
              onChange={(e) => setJawapanTeks(e.target.value)}
              placeholder="Sila taip jawapan anda di sini..."
              className="w-full p-5 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none resize-y min-h-[150px] text-lg text-slate-700"
            ></textarea>
            
            <button
              onClick={() => jawabSoalan(jawapanTeks)}
              disabled={jawapanTeks.trim() === ""}
              className="mt-4 bg-sky-600 text-white font-bold py-4 px-8 rounded-xl hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
            >
              Hantar Jawapan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN UTAMA
// ==========================================
export default function UjianDiagnostik() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-sky-600">Sistem Sedang Memuatkan Ujian...</div>}>
      <KandunganUjian />
    </Suspense>
  );
}