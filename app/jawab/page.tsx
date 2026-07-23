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

  const [jawapanTeks, setJawapanTeks] = useState("");
  const [jawapanStruktur, setJawapanStruktur] = useState<Record<string, string>>({});
  const [jawapanObjektif, setJawapanObjektif] = useState<Record<string, string>>({});
  const [telahDisimpan, setTelahDisimpan] = useState(false);
  const [menganalisisAI, setMenganalisisAI] = useState(false);

  // 🌟 TAMBAHAN: State untuk peratus, tahap murid & markah lulus
  const [peratusAkhir, setPeratusAkhir] = useState<number | null>(null);
  const [tahapMurid, setTahapMurid] = useState("Sederhana");
  const [markahLulus, setMarkahLulus] = useState(50); // Default sementara

  // FUNGSI SHUFFLE KOCOK SOALAN & JAWAPAN
  const shuffleArray = (array: any[]) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // 🌟 BARU: AMBIL TAHAP MURID DARI FIREBASE SEBELUM MULA
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

            // Tentukan markah lulus mengikut tahap murid
            if (tahapData === "Tinggi") {
              setMarkahLulus(80);
            } else if (tahapData === "Sederhana") {
              setMarkahLulus(50);
            } else if (tahapData === "Rendah") {
              setMarkahLulus(40);
            }
          }
        } catch (error) {
          console.error("Gagal mendapatkan data tahap murid:", error);
        }
      };

      fetchTahapMurid();
    }
  }, [isClient]);

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
        let soalanObjektif: any[] = [];
        let soalanStruktur: any[] = [];

        querySnapshot.forEach((docSnap) => {
          let data = docSnap.data();
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

        // Hanya shuffle soalan objektif.
        const objektifDahShuffle = shuffleArray(soalanObjektif);
        
        // Soalan struktur dibiarkan mengikut susunan asal.
        setSoalanSenarai([...objektifDahShuffle, ...soalanStruktur]);
      } catch (error) {
        console.error("Ralat tarik soalan:", error);
      } finally {
        setLoading(false);
      }
    };

    tarikSoalan();
  }, [tingkatan, bab, isClient]);

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

            const masaGiliranRawak = Math.floor(Math.random() * 8000) + 1000;
            console.log(`Sistem menunggu giliran selama ${masaGiliranRawak}ms sebelum tembak API...`);
            await new Promise(resolve => setTimeout(resolve, masaGiliranRawak));

            for (const [soalanId, jawapanMurid] of Object.entries(jawapanStruktur)) {
              const detailSoalan = soalanSenarai.find(s => s.id === soalanId);

              if (detailSoalan) {
                try {
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

                  if (!res.ok) throw new Error("Ralat dari server AI");

                  const aiData = await res.json();

                  ulasanAIPenuh[soalanId] = {
                    markahAI: Number(aiData.markahDicadangkan) || 0,
                    komenAI: aiData.komen || "Tiada ulasan."
                  };
                  jumlahMarkahStrukturAI += (Number(aiData.markahDicadangkan) || 0);

                } catch (err) {
                  console.error("Gagal API untuk soalan:", soalanId);
                  ulasanAIPenuh[soalanId] = {
                    markahAI: 0,
                    komenAI: "SISTEM AI GAGAL (Talian Terputus/Server Sibuk). Sila semak secara manual."
                  };
                }

                await new Promise(resolve => setTimeout(resolve, 2500));
              }
            }

            const docId = `${user.id}_t${tingkatan}_${bab}_${jenisUjian}`;
            const adaSoalanStruktur = Object.keys(jawapanStruktur).length > 0;

            let markahPenuhUjian = 0;
            soalanSenarai.forEach(s => {
              if (s.jenis === "objektif") {
                markahPenuhUjian += 1; 
              } else {
                markahPenuhUjian += Number(s.markah) || 0; 
              }
            });

            const skorAkhir = skor + jumlahMarkahStrukturAI;
            const peratus = markahPenuhUjian > 0 ? Math.round((skorAkhir / markahPenuhUjian) * 100) : 0;
            
            // Simpan peratus akhir untuk UI
            setPeratusAkhir(peratus);

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
              tarikh: new Date().toISOString(),
              jenisUjian: jenisUjian 
            });

            // 🌟 PENGURUSAN STATUS LULUS/GAGAL & ULANG BIMBINGAN
            const chapterId = bab.replace("Bab ", "");
            const modKeyTest = `t${tingkatan}-ch${chapterId}-mod-${jenisUjian}`;
            const modKeyBimbingan = `t${tingkatan}-ch${chapterId}-mod-bimbingan`; 
            let completed = JSON.parse(localStorage.getItem("completedModules") || "[]");

            if (jenisUjian === "pre_test") {
              let tahapBaru = "Rendah";
              if (peratus >= 80) tahapBaru = "Tinggi";
              else if (peratus >= 50) tahapBaru = "Sederhana";

              if (!completed.includes(modKeyTest)) completed.push(modKeyTest);
              localStorage.setItem("completedModules", JSON.stringify(completed));

              await updateDoc(doc(db, "users", user.id), {
                markahTerkini: peratus,
                tahapInkuiri: tahapBaru
              });

            } else if (jenisUjian === "post_test") {
              if (peratus >= markahLulus) {
                // JIKA LULUS POST-TEST
                if (!completed.includes(modKeyTest)) completed.push(modKeyTest);
                localStorage.setItem("completedModules", JSON.stringify(completed));

                await updateDoc(doc(db, "users", user.id), {
                  markahPostTestTerkini: peratus,
                  statusBabTerkini: "Lulus"
                });
              } else {
                // JIKA GAGAL POST-TEST
                // Keluarkan log bimbingan dan ujian ini supaya ia reset di Dashboard
                completed = completed.filter((mod: string) => mod !== modKeyBimbingan && mod !== modKeyTest);
                localStorage.setItem("completedModules", JSON.stringify(completed));

                await updateDoc(doc(db, "users", user.id), {
                  markahPostTestTerkini: peratus,
                  statusBabTerkini: "Ulang Bimbingan"
                });
              }
            }

          } catch (error) {
            console.error("Ralat simpan data ke Firebase:", error);
          }
        }

        setMenganalisisAI(false);
      }
    };

    simpanMarkahFirebase();
  }, [tamat, skor, soalanSenarai, tingkatan, bab, isClient, jawapanStruktur, telahDisimpan, jawapanObjektif, jenisUjian, markahLulus]); // Masukkan markahLulus dlm dependency array

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

  const paparanTajukUjian = jenisUjian === "post_test" ? "Pasca-Ujian (Post-Test)" : "Pra-Ujian (Pre-Test)";

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

  // 🌟 PAPARAN SELEPAS TAMAT UJIAN
  if (tamat) {
    if (menganalisisAI || peratusAkhir === null) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600 mb-6"></div>
          <h2 className="text-3xl font-bold text-sky-700">Sistem AI Sedang Menyemak...</h2>
          <p className="text-slate-500 mt-2 max-w-md">
            Sila tunggu sebentar. Guru AI sedang membaca, menganalisis, dan memberikan markah untuk jawapan anda.
          </p>
        </div>
      );
    }

    const isLulus = peratusAkhir >= markahLulus;

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-2xl w-full p-8 bg-white rounded-2xl shadow-xl text-center border-t-8 border-sky-500">
          <h2 className="text-3xl font-extrabold mb-4 text-slate-800">{paparanTajukUjian} Tamat</h2>
          <p className="text-lg text-slate-600 mb-6">{bab} | Tingkatan {tingkatan}</p>

          {jenisUjian === "pre_test" ? (
             <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-6 rounded-xl mb-6">
               ✅ <strong>Ujian Selesai. (Skor: {peratusAkhir}%)</strong><br/>
               Sistem telah menganalisis tahap kefahaman anda. Sila teruskan ke Modul Bimbingan di Dashboard.
             </div>
          ) : (
             isLulus ? (
               <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-xl mb-6">
                 🎉 <strong>TAHNIAH! Anda Lulus dengan {peratusAkhir}%.</strong><br/>
                 Sebagai pelajar Tahap {tahapMurid}, anda telah berjaya melepasi sasaran {markahLulus}%. Teruskan ke modul/bab seterusnya!
               </div>
             ) : (
               <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl mb-6">
                 ⚠️ <strong>Markah anda: {peratusAkhir}% (Sasaran Tahap {tahapMurid}: {markahLulus}%).</strong><br/>
                 Oleh sebab markah belum mencapai sasaran peribadi anda, <b>Modul Bimbingan telah dibuka semula</b>. Sila ulangkaji bimbingan tersebut dan ambil semula ujian ini.
               </div>
             )
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
  const senaraiPilihan = semasa.shuffledPilihan || (semasa.pilihan ? Object.entries(semasa.pilihan) : []);
  
  const labelBahagian = jenisSoalan === "objektif" ? "Bahagian A: Objektif" : "Bahagian B: Struktur/Esei";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-slate-100">
        
        {/* Lencana (Badge) Menunjukkan Jenis Ujian */}
        <div className="flex justify-center mb-6">
           <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
             {paparanTajukUjian}
           </span>
        </div>

        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{bab}</h1>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mt-1">{labelBahagian}</p>
          </div>
          <span className="bg-sky-100 text-sky-800 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
            Soalan {indexSemasa + 1} / {soalanSenarai.length}
          </span>
        </div>

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

        {semasa.imageUrl && semasa.imageUrl.trim() !== "" && (
          <div className="mb-8 flex justify-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <img
              src={semasa.imageUrl}
              alt="Rajah Soalan"
              className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
            />
          </div>
        )}

        {jenisSoalan === "objektif" ? (
          <div className="grid gap-4">
            {senaraiPilihan.map((item: any, index: number) => {
              const kunciAsal = item[0];
              const teks = item[1];
              const hurufVisual = String.fromCharCode(65 + index);

              return (
                <button
                  key={kunciAsal}
                  onClick={() => jawabSoalan(kunciAsal)}
                  className="w-full text-left p-5 rounded-xl border-2 border-slate-200 hover:border-sky-500 hover:bg-sky-50 transition-all font-medium text-slate-700 flex gap-4 items-center group"
                >
                  <span className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-sky-500 group-hover:text-white transition-colors flex items-center justify-center font-bold text-slate-600 shadow-sm shrink-0">
                    {hurufVisual}
                  </span>
                  <span className="text-lg">{teks as string}</span>
                </button>
              );
            })}
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

export default function UjianDiagnostik() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-sky-600">Sistem Sedang Memuatkan Ujian...</div>}>
      <KandunganUjian />
    </Suspense>
  );
}