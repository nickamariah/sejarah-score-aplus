"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase"; 

export default function SemakanGuruPage() {
  const [senaraiPelajar, setSenaraiPelajar] = useState<any[]>([]);
  
  // 1. KEMAS KINI: Simpan kedua-dua teks soalan & markah penuh
  const [soalanBank, setSoalanBank] = useState<Record<string, { soalan: string, markahPenuh: number }>>({}); 
  
  const [loading, setLoading] = useState(true);
  const [pelajarPilihan, setPelajarPilihan] = useState<any | null>(null);
  
  // State untuk markah (boleh terima nombor atau string kosong jika guru tekan backspace)
  const [markahInput, setMarkahInput] = useState<Record<string, number | string>>({});

  useEffect(() => {
    tarikData();
  }, []);

  const tarikData = async () => {
    setLoading(true);
    try {
      // Tarik senarai soalan dan markahnya
      const soalanSnapshot = await getDocs(collection(db, "questionBank"));
      const soalanTemp: Record<string, { soalan: string, markahPenuh: number }> = {};
      
      soalanSnapshot.forEach((doc) => {
        const data = doc.data();
        soalanTemp[doc.id] = {
          soalan: data.soalan,
          markahPenuh: Number(data.markah) || 0 // Pastikan markah penuh ditarik
        };
      });
      setSoalanBank(soalanTemp);

      // Tarik senarai jawapan murid
      const markahSnapshot = await getDocs(collection(db, "skor_murid"));
      const senaraiTemp: any[] = [];
      markahSnapshot.forEach((doc) => {
        senaraiTemp.push({ idDoc: doc.id, ...doc.data() });
      });

      senaraiTemp.sort((a, b) => new Date(b.tarikh).getTime() - new Date(a.tarikh).getTime());
      setSenaraiPelajar(senaraiTemp);

    } catch (error) {
      console.error("Ralat menarik data:", error);
    } finally {
      setLoading(false);
    }
  };

  const bukaPaparanSemakan = (pelajar: any) => {
    setPelajarPilihan(pelajar);
    setMarkahInput({}); 
  };

  // 2. KEMAS KINI: Fungsi Sekatan Logik Markah Lebih Had
  const handleUbahMarkah = (soalanId: string, value: string, markahPenuh: number) => {
    // Jika guru tekan backspace sampai kosong
    if (value === "") {
      setMarkahInput(prev => ({ ...prev, [soalanId]: "" }));
      return;
    }

    let markah = parseInt(value);

    // Halang markah lebih dari markah penuh
    if (markah > markahPenuh) {
      alert(`Maaf, markah maksimum untuk soalan ini ialah ${markahPenuh}.`);
      markah = markahPenuh; // Automatik tukar jadi markah penuh
    } 
    // Halang markah negatif
    else if (markah < 0) {
      markah = 0;
    }

    setMarkahInput(prev => ({
      ...prev,
      [soalanId]: markah
    }));
  };

  const simpanMarkah = async () => {
    if (!pelajarPilihan) return;

    try {
      // 1. Kira jumlah markah Esei/Struktur
      const jumlahMarkahStruktur = Object.values(markahInput).reduce((a, b) => Number(a) + (Number(b) || 0), 0);
      
      // 2. Tarik markah objektif sedia ada
      const markahObjektif = Number(pelajarPilihan.skorObjektif) || 0;
      
      // 3. Campurkan kedua-duanya (Dapat 16)
      const jumlahKeseluruhan = Number(markahObjektif) + Number(jumlahMarkahStruktur);

      // 4. PENGIRAAN PERATUSAN (UPDATE TERBARU)
      // Tarik markah penuh ujian dari Firebase (contoh: 18). Jika tiada, kita letak default 18 untuk ujian ini.
      const markahPenuhUjian = Number(pelajarPilihan.markahPenuhUjian) || 18; 
      const peratusBaru = Math.round((jumlahKeseluruhan / markahPenuhUjian) * 100); // 16/18 * 100 = 89%

      const docRef = doc(db, "skor_murid", pelajarPilihan.idDoc);

      // 5. Kemas kini ke Firebase
      await updateDoc(docRef, {
        markahStruktur: jumlahMarkahStruktur,
        skorAkhir: jumlahKeseluruhan, 
        skor: peratusBaru, // <-- SISTEM KEMAS KINI PERATUS (89%)
        statusPermarkahanEsei: "disemak_oleh_guru"
      });

      alert(`Berjaya! Jumlah Markah: ${jumlahKeseluruhan}/${markahPenuhUjian} (${peratusBaru}%)`);
      
      setPelajarPilihan(null);
      tarikData();

    } catch (error) {
      console.error("Ralat menyimpan markah:", error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-sky-600">Memuatkan Dashboard Guru...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        
        {!pelajarPilihan ? (
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">👨‍🏫 Dashboard Semakan Guru</h1>
            <p className="text-slate-600 mb-8">Pemantauan dan permarkahan secara Human-in-the-Loop.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="p-4 rounded-tl-lg font-semibold">Nama Murid</th>
                    <th className="p-4 font-semibold">Topik</th>
                    <th className="p-4 font-semibold">Status Esei</th>
                    <th className="p-4 font-semibold">Markah Sedia Ada</th>
                    <th className="p-4 rounded-tr-lg font-semibold text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {senaraiPelajar.map((pelajar) => (
                    <tr key={pelajar.idDoc} className="border-b hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-800">{pelajar.namaMurid}</td>
                      <td className="p-4 text-slate-600">Ting. {pelajar.tingkatan} | {pelajar.bab}</td>
                      <td className="p-4">
                        {pelajar.statusPermarkahanEsei === "menunggu_permarkahan_AI" && (
                          <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Perlu Semakan</span>
                        )}
                        {pelajar.statusPermarkahanEsei === "disemak_oleh_guru" && (
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">Selesai Disemak</span>
                        )}
                        {pelajar.statusPermarkahanEsei === "tiada_esei" && (
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Objektif Sahaja</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        Objektif: {pelajar.skorObjektif || 0} <br/>
                        Esei: <span className="font-bold text-sky-600">{pelajar.markahStruktur || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        {pelajar.statusPermarkahanEsei !== "tiada_esei" && (
                          <button 
                            onClick={() => bukaPaparanSemakan(pelajar)}
                            className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-sky-700"
                          >
                            Semak Jawapan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {senaraiPelajar.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">Tiada rekod pelajar dijumpai.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          
          <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
            <button 
              onClick={() => setPelajarPilihan(null)}
              className="mb-6 text-sky-600 font-semibold hover:underline flex items-center gap-2"
            >
              ⬅ Kembali ke Senarai
            </button>

            <div className="border-b pb-6 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Semakan Jawapan Esei</h2>
              <p className="text-slate-600 mt-2">
                Murid: <strong>{pelajarPilihan.namaMurid}</strong> ({pelajarPilihan.idMurid})<br/>
                Topik: Tingkatan {pelajarPilihan.tingkatan} | {pelajarPilihan.bab}
              </p>
            </div>

            {pelajarPilihan.jawapanStruktur && Object.entries(pelajarPilihan.jawapanStruktur).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(pelajarPilihan.jawapanStruktur).map(([soalanId, jawapanMurid], index) => {
                  // 3. KEMAS KINI: Tarik Data Soalan & Markah Penuh
                  const detailSoalan = soalanBank[soalanId] || { soalan: "Teks soalan tidak ditemui.", markahPenuh: 0 };

                  return (
                    <div key={soalanId} className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="mb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                          <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-bold mr-2">Soalan {index + 1} ({soalanId})</span>
                          <p className="mt-2 font-semibold text-slate-800">{detailSoalan.soalan}</p>
                        </div>
                        {/* PAPARKAN MARKAH PENUH SOALAN KEPADA GURU */}
                        <span className="shrink-0 bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                          [{detailSoalan.markahPenuh} Markah]
                        </span>
                      </div>
                      
                      <div className="bg-white p-4 border-l-4 border-sky-500 rounded-r shadow-sm mb-4">
                        <p className="text-sm text-sky-600 font-bold mb-1">Jawapan Murid:</p>
                        <p className="text-slate-700 whitespace-pre-wrap">{jawapanMurid as string}</p>
                      </div>

                      <div className="flex items-center gap-4 mt-4 bg-white p-4 rounded-lg shadow-sm">
                        <label className="font-semibold text-slate-700">Berikan Markah (Max: {detailSoalan.markahPenuh}):</label>
                        <input 
                          type="number" 
                          min="0"
                          max={detailSoalan.markahPenuh} // Had pada antaramuka HTML
                          placeholder="0"
                          className="border border-slate-300 rounded p-2 w-24 text-center font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none"
                          value={markahInput[soalanId] ?? ""}
                          onChange={(e) => handleUbahMarkah(soalanId, e.target.value, detailSoalan.markahPenuh)}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button 
                    onClick={simpanMarkah}
                    className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-700 transition"
                  >
                    Simpan Markah
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 italic">Tiada jawapan struktur dijumpai untuk murid ini.</p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}