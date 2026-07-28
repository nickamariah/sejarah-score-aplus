"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from "firebase/firestore"; 
import { db } from "../../lib/firebase";

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

  // 1. KUTIP DATA TAHAP MURID & SASARAN
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

            // 🌟 TETAPAN SASARAN LULUS (POST-TEST)
            if (tahapData === "Tinggi") setMarkahLulus(70);
            else if (tahapData === "Sederhana") setMarkahLulus(70); // Mesti capai 70
            else if (tahapData === "Rendah") setMarkahLulus(50); // Mesti capai 50
          }

          if (jenisUjian === "post_test") {
             const docIdUjian = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
             const skorSnap = await getDoc(doc(db, "skor_murid", docIdUjian));
             if (skorSnap.exists() && skorSnap.data().percubaan) {
                setPercubaanTerkini(skorSnap.data().percubaan);
             }
          }
        } catch (error) {
          console.error("Gagal mendapatkan data tahap murid:", error);
        }
      };
      fetchTahapMurid();
    }
  }, [isClient, tingkatan, bab, jenisUjian]);

  // 2. AUTO-SAVE (DARI LOCAL STORAGE)
  useEffect(() => {
    if (!isClient) return;
    const simpananObjektif = localStorage.getItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`);
    const simpananStruktur = localStorage.getItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`);
    
    if (simpananObjektif) setJawapanObjektif(JSON.parse(simpananObjektif));
    if (simpananStruktur) setJawapanStruktur(JSON.parse(simpananStruktur));
  }, [isClient, tingkatan, bab, jenisUjian]);

  // 3. KUTIP SOALAN DARI FIREBASE
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
        setSoalanSenarai([...objektifDahShuffle, ...strukturDisaring]);
      } catch (error) {
        console.error("Ralat tarik soalan:", error);
      } finally {
        setLoading(false);
      }
    };
    tarikSoalan();
  }, [tingkatan, bab, jenisUjian, isClient]);

  // 4. HANTAR UJIAN & KIRA MARKAH
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
            let skorObjektifAkhir = 0;
            let markahPenuhUjian = 0;

            soalanSenarai.forEach(s => {
              if (s.jenis === "objektif") {
                markahPenuhUjian += 1; 
                const jawapanMurid = String(jawapanObjektif[s.id] || "").trim().toLowerCase();
                const skemaBersih = String(s.jawapan || "").trim().toLowerCase();
                if (jawapanMurid === skemaBersih && skemaBersih !== "") skorObjektifAkhir += 1;
              } else {
                markahPenuhUjian += Number(s.markah) || 0; 
              }
            });

            setSkor(skorObjektifAkhir); 
            let jumlahMarkahStrukturAI = 0;
            let ulasanAIPenuh: Record<string, any> = {};

            await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000));

            for (const [soalanId, jawapanMurid] of Object.entries(jawapanStruktur)) {
              const detailSoalan = soalanSenarai.find(s => s.id === soalanId);
              if (detailSoalan) {
                try {
                  const res = await fetch("/api/semak-ai", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ soalan: detailSoalan.soalan, jawapanMurid: jawapanMurid, markahPenuh: Number(detailSoalan.markah) || 0, skemaJawapan: detailSoalan.skemaJawapan || detailSoalan.jawapan || "" })
                  });
                  if (!res.ok) throw new Error("Ralat dari server AI");
                  const aiData = await res.json();
                  ulasanAIPenuh[soalanId] = { markahAI: Number(aiData.markahDicadangkan) || 0, komenAI: aiData.komen || "Tiada ulasan." };
                  jumlahMarkahStrukturAI += (Number(aiData.markahDicadangkan) || 0);
                } catch (err) {
                  ulasanAIPenuh[soalanId] = { markahAI: 0, komenAI: "SISTEM AI GAGAL. Sila semak secara manual." };
                }
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }

            const docId = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
            const adaSoalanStruktur = Object.keys(jawapanStruktur).length > 0;
            const skorKeseluruhan = skorObjektifAkhir + jumlahMarkahStrukturAI;
            const peratus = markahPenuhUjian > 0 ? Math.round((skorKeseluruhan / markahPenuhUjian) * 100) : 0;
            const percubaanBaru = jenisUjian === "post_test" ? percubaanTerkini + 1 : 1;
            
            setPeratusAkhir(peratus);
            setPercubaanTerkini(percubaanBaru);

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
              // 🌟 PENENTUAN ARAS PRE-TEST 
              let tahapBaru = "Rendah";
              if (peratus >= 70) tahapBaru = "Tinggi"; // <--- Dinaik taraf jadi 70
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

          } catch (error) {
            console.error("Ralat simpan data:", error);
          }
        }
        setMenganalisisAI(false);
      }
    };

    simpanMarkahFirebase();
  }, [tamat, soalanSenarai, tingkatan, bab, isClient, jawapanStruktur, telahDisimpan, jawapanObjektif, jenisUjian, markahLulus, percubaanTerkini]); 

  // 5. KAWALAN UI & AUTO SAVE MASA MURID MENJAWAB
  const pilihJawapanObjektif = (soalanId: string, jawapanDipilih: string) => {
    setJawapanObjektif(prev => {
      const stateBaru = { ...prev, [soalanId]: jawapanDipilih };
      localStorage.setItem(`auto_obj_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru));
      return stateBaru;
    });
  };

  const tukarJawapanStruktur = (soalanId: string, teks: string) => {
    setJawapanStruktur(prev => {
      const stateBaru = { ...prev, [soalanId]: teks };
      localStorage.setItem(`auto_str_${tingkatan}_${bab}_${jenisUjian}`, JSON.stringify(stateBaru));
      return stateBaru;
    });
  };

  const pergiSoalanSebelum = () => { if (indexSemasa > 0) setIndexSemasa(indexSemasa - 1); };

  const pergiSoalanSeterusnyaAtauTamat = () => {
    if (indexSemasa + 1 < soalanSenarai.length) setIndexSemasa(indexSemasa + 1);
    else if (confirm("Adakah anda pasti untuk menghantar ujian ini? Sila pastikan semua jawapan telah disemak.")) setTamat(true);
  };

  const paparanTajukUjian = jenisUjian === "post_test" ? "Pasca-Ujian (Post-Test)" : "Pra-Ujian (Pre-Test)";

  if (!isClient) return <div className="min-h-screen flex items-center justify-center font-bold text-sky-600">Memulakan Ujian...</div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sky-700 font-semibold">Memuatkan Soalan Firebase...</div>;
  if (soalanSenarai.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><div className="p-8 bg-white rounded-xl shadow-md text-center"><h2 className="text-xl font-bold mb-2">Soalan Belum Tersedia</h2><button onClick={() => router.push('/murid')} className="bg-sky-600 text-white px-6 py-2 rounded-lg">Kembali</button></div></div>
  );

  if (tamat) {
    if (menganalisisAI || peratusAkhir === null) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center"><div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600 mb-6"></div><h2 className="text-3xl font-bold text-sky-700">Sistem AI Sedang Menyemak...</h2></div>
    );

    const isLulus = peratusAkhir >= markahLulus;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-8 border-sky-500">
          <h2 className="text-3xl font-extrabold mb-4 text-slate-800">{paparanTajukUjian} Tamat</h2>
          <p className="text-lg text-slate-600 mb-6">{bab} | Tingkatan {tingkatan}</p>
          {jenisUjian === "pre_test" ? (
             <div className="bg-indigo-50 border-indigo-200 text-indigo-800 p-6 rounded-xl mb-6">✅ <strong>Skor: {peratusAkhir}%</strong><br/>Sistem telah menganalisis tahap kefahaman anda. Teruskan ke Modul Bimbingan.</div>
          ) : (
             isLulus ? (
               <div className="bg-emerald-50 border-emerald-200 text-emerald-800 p-6 rounded-xl mb-6">🎉 <strong>TAHNIAH! Lulus dengan {peratusAkhir}%.</strong><br/>Anda berjaya melepasi sasaran {markahLulus}%.</div>
             ) : (
               percubaanTerkini >= 2 ? (
                 <div className="bg-red-50 border-red-200 text-red-800 p-6 rounded-xl mb-6">⚠️ <strong>Markah: {peratusAkhir}% (Sasaran: {markahLulus}%).</strong><br/>Anda telah mencuba 2 kali. Sistem merujuk pencapaian ini kepada Guru untuk bimbingan.</div>
               ) : (
                 <div className="bg-amber-50 border-amber-200 text-amber-800 p-6 rounded-xl mb-6">⚠️ <strong>Markah: {peratusAkhir}% (Sasaran: {markahLulus}%).</strong><br/>Sila ikuti Modul Permainan Interaktif di Dashboard kemudian cuba lagi.</div>
               )
             )
          )}
          <button onClick={() => router.push('/murid')} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold">Kembali ke Dashboard</button>
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center">
      <div className="max-w-3xl w-full bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-slate-100 flex flex-col min-h-[500px]">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold">{bab}</h1>
            <p className="text-sm font-bold text-indigo-600 uppercase mt-1">{labelBahagian}</p>
          </div>
          <span className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg text-sm font-bold">Soalan {indexSemasa + 1} / {soalanSenarai.length}</span>
        </div>

        <div className="mb-8 flex justify-between gap-4">
          <h2 className="text-2xl font-semibold leading-relaxed whitespace-pre-wrap flex-1">{semasa.soalan}</h2>
          {semasa.markah && <span className="shrink-0 bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-sm font-bold">[ {semasa.markah} Markah ]</span>}
        </div>

        {semasa.imageUrl && (
          <div className="mb-8 flex justify-center bg-slate-50 p-4 rounded-xl border"><img src={semasa.imageUrl} alt="Rajah" className="max-h-96 rounded-lg" /></div>
        )}

        <div className="flex-1">
          {jenisSoalan === "objektif" ? (
            <div className="grid gap-4">
              {senaraiPilihan.map((item: any, i: number) => {
                const isSelected = jawapanObjektif[semasa.id] === item[0];
                return (
                  <button key={item[0]} onClick={() => pilihJawapanObjektif(semasa.id, item[0])}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all font-medium flex gap-4 items-center ${isSelected ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}>
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-100'}`}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-lg">{item[1] as string}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={jawapanStruktur[semasa.id] || ""} onChange={(e) => tukarJawapanStruktur(semasa.id, e.target.value)}
              onPaste={(e) => { e.preventDefault(); alert("Paste tidak dibenarkan. Sila taip dengan usaha sendiri ya!"); }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()}
              autoComplete="off" spellCheck="false"
              placeholder="Sila taip jawapan (Copy & Paste tidak dibenarkan)"
              className="w-full p-5 border-2 border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 resize-y min-h-[150px] text-lg"
            ></textarea>
          )}
        </div>

        <div className="mt-10 pt-6 border-t flex justify-between gap-4">
          <button onClick={pergiSoalanSebelum} disabled={indexSemasa === 0} className="px-6 py-3 rounded-xl font-bold bg-slate-200 disabled:opacity-0">⬅️ Kembali</button>
          <button onClick={pergiSoalanSeterusnyaAtauTamat} disabled={!soalanSudahDijawab} className={`px-8 py-3 rounded-xl font-bold ${!soalanSudahDijawab ? 'bg-slate-300 text-slate-500' : 'bg-sky-600 text-white'}`}>
            {isSoalanTerakhir ? 'Hantar Ujian ✅' : 'Seterusnya ➡️'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function UjianDiagnostik() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sky-600 font-bold">Memuatkan Sistem Ujian...</div>}><KandunganUjian /></Suspense>;
}