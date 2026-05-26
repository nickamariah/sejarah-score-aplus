import { useState, useEffect } from "react";
// Import Firestore dan db yang kita setup di Langkah 1
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Ubah mengikut lokasi fail firebase Dr. Nic

export default function UjianDiagnostik() {
  const [soalanSenarai, setSoalanSenarai] = useState<any[]>([]);
  const [indexSemasa, setIndexSemasa] = useState(0);
  const [skor, setSkor] = useState(0);
  const [tamat, setTamat] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fungsi Tarik Soalan Dari Firebase
  useEffect(() => {
    const tarikSoalan = async () => {
      try {
        // Kita nak tarik soalan Tingkatan 4, Bab 1 sahaja dulu sebagai ujian
        const q = query(
          collection(db, "questionBank"),
          where("tingkata", "==", "4"), // Guna ejaan exact dari Firestore
          where("bab", "==", "Bab 1")
        );

        const querySnapshot = await getDocs(q);
        const soalanData: any[] = [];
        
        querySnapshot.forEach((doc) => {
          // doc.data() akan bawa masuk semua soalan, jawapan, pilihan
          soalanData.push({ id: doc.id, ...doc.data() });
        });

        setSoalanSenarai(soalanData);
      } catch (error) {
        console.error("Ralat tarik soalan:", error);
      } finally {
        setLoading(false);
      }
    };

    tarikSoalan();
  }, []);

  // Fungsi Bila Murid Jawab
  const jawabSoalan = (jawapanMurid: string) => {
    const soalanSemasa = soalanSenarai[indexSemasa];
    
    // Semak betul ke tak (Contoh: "A" === "D")
    if (jawapanMurid === soalanSemasa.jawapan) {
      setSkor(skor + 1);
    }

    // Pergi soalan seterusnya atau tamatkan
    if (indexSemasa + 1 < soalanSenarai.length) {
      setIndexSemasa(indexSemasa + 1);
    } else {
      setTamat(true);
      // Di sini kita akan jalankan logik Adaptif (Cemerlang/Sederhana)
      // Contoh: TentukanLaluanAdaptif(skorAkhir)
    }
  };

  if (loading) return <div className="p-10 text-center">Memuatkan Ujian Diagnostik...</div>;
  if (soalanSenarai.length === 0) return <div className="p-10 text-center">Tiada soalan dijumpai.</div>;

  // PAPARAN KUIZ TAMAT & LOGIK ADAPTIF
  if (tamat) {
    const peratus = Math.round((skor / soalanSenarai.length) * 100);
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow text-center">
        <h2 className="text-3xl font-bold mb-4">Ujian Diagnostik Tamat</h2>
        <p className="text-xl mb-4">Skor Anda: {peratus}%</p>
        
        {peratus >= 80 ? (
          <div className="bg-green-100 text-green-800 p-4 rounded-lg">
            🔥 TAHNIAH! Anda berada di Aras Cemerlang. Nota dilangkau (skipped). Mari terus ke Bab seterusnya!
          </div>
        ) : (
          <div className="bg-amber-100 text-amber-800 p-4 rounded-lg">
            📚 Anda berada di Aras Bimbingan. Mari kita baca nota dan dibimbing oleh AI.
          </div>
        )}
      </div>
    );
  }

  // PAPARAN SOALAN SEMASA
  const semasa = soalanSenarai[indexSemasa];

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-sky-100">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">{semasa.topik}</span>
        <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-bold">
          Soalan {indexSemasa + 1} / {soalanSenarai.length}
        </span>
      </div>

      <h2 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
        {semasa.soalan}
      </h2>

      <div className="grid gap-3">
        {/* Kita pusingkan (map) pilihan A, B, C, D dari Firestore */}
        {Object.entries(semasa.pilihan).map(([kunci, teks]) => (
          <button
            key={kunci}
            onClick={() => jawabSoalan(kunci)}
            className="w-full text-left p-4 rounded-lg border-2 border-slate-100 hover:border-sky-400 hover:bg-sky-50 transition-all font-medium text-slate-700 flex gap-4 items-center"
          >
            <span className="w-8 h-8 rounded bg-white shadow flex items-center justify-center font-bold text-sky-700">
              {kunci}
            </span>
            <span>{teks as string}</span>
          </button>
        ))}
      </div>
    </div>
  );
}