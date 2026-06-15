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
  const [skor, setSkor] = useState(0); 
  const [tamat, setTamat] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [jawapanTeks, setJawapanTeks] = useState(""); 
  const [jawapanStruktur, setJawapanStruktur] = useState<Record<string, string>>({}); 
  const [jawapanObjektif, setJawapanObjektif] = useState<Record<string, string>>({});
  const [telahDisimpan, setTelahDisimpan] = useState(false); 
  const [menganalisisAI, setMenganalisisAI] = useState(false); 

  // ==========================================
  // 🌟 FUNGSI SHUFFLE (KOCOK)
  // ==========================================
  const shuffleArray = (array: any[]) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // TARIK SOALAN DARI FIREBASE DAN SHUFFLE!
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
        let soalanData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          
          // 🌟 JIKA SOALAN OBJEKTIF, KITA SHUFFLE PILIHAN JAWAPAN JUGA!
          if (data.jenis === "objektif" && data.pilihan) {
            // Tukar { A: "Epal", B: "Oren" } jadi array [["A", "Epal"], ["B", "Oren"]]
            let pilihanArray = Object.entries(data.pilihan);
            // Kocok susunan array tersebut
            data.shuffledPilihan = shuffleArray(pilihanArray);
          }
          
          soalanData.push({ id: doc.id, ...data });
        });

        // 🌟 KITA SHUFFLE KESELURUHAN SOALAN SEBELUM SIMPAN DALAM STATE
        const soalanDahShuffle = shuffleArray(soalanData);
        setSoalanSenarai(soalanDahShuffle);

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
      if (tamat && soalanSenarai.length > 0 && !telahDisimpan) {
        setTelahDisimpan(true); 
        setMenganalisisAI(true); 
        
        const rawUser = localStorage.getItem("currentUser");
        if (rawUser) {
          const user = JSON.parse(rawUser);
          
          try {
            let jumlahMarkahStrukturAI = 0;
            let ulasanAIPenuh: Record<string, any> = {};

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
                            skemaJawapan: detailSoalan.skemaJawapan || "" 
                        })
                    });
                    
                    const aiData = await res.json();
                    
                    ulasanAIPenuh[soalanId] = {
                        markahAI: Number(aiData.markahDicadangkan) || 0,
                        komenAI: aiData.komen || "Tiada ulasan."
                    };
                    jumlahMarkahStrukturAI += (Number(aiData.markahDicadangkan) || 0);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }

            const docId = `${user.id}_t${tingkatan}_${bab}`;
            const adaSoalanStruktur = Object.keys(jawapanStruktur).length > 0;
            
            let markahPenuhUjian = 0;
            soalanSenarai.forEach(s => {
              markahPenuhUjian += Number(s.markah) || 1; 
            });

            const skorAkhir = skor + jumlahMarkahStrukturAI; 
            const peratus = Math.round((skorAkhir / markahPenuhUjian) * 100); 

            await setDoc(doc(db, "skor_murid", docId), {
              idMurid: user.id,
              namaMurid: user.name || user.nama,
              tingkatan: tingkatan,
              bab: bab,
              
              skorObjektif: skor,
              jawapanObjektif: jawapanObjektif, 
              skor: peratus, 
              markahPenuhUjian: markahPenuhUjian, 
              
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

        const chapterId = bab.replace("Bab ", "");
        const modKey = `t${tingkatan}-ch${chapterId}-mod1`;
        const completed = JSON.parse(localStorage.getItem("completedModules") || "[]");
        if (!completed.includes(modKey)) {
          completed.push(modKey);
          localStorage.setItem("completedModules", JSON.stringify(completed));
        }
        
        setMenganalisisAI(false); 
      }
    };

    simpanMarkahFirebase();
  }, [tamat, skor, soalanSenarai.length, tingkatan, bab, isClient, jawapanStruktur, telahDisimpan, soalanSenarai]);

  const jawabSoalan = (jawapanDihantar: string) => {
    const soalanSemasa = soalanSenarai[indexSemasa];
    
    if (soalanSemasa.jenis === "objektif") {
      setJawapanObjektif(prev => ({
        ...prev,
        [soalanSemasa.id]: jawapanDihantar
      }));

      if (jawapanDihantar === soalanSemasa.jawapan) {
        setSkor(prev => prev + 1);
      }
    } else {
      setJawapanStruktur(prev => ({
        ...prev,
        [soalanSemasa.id]: jawapanDihantar
      }));
    }

    setJawapanTeks(""); 

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
    if (menganalisisAI) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <div className="animate-spin rounded-full h-16 w-1