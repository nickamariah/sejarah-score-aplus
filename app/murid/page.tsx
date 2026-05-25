"use client";

import { useState, useEffect } from "react";

// Gantikan dengan URL Web App Google Apps Script anda
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";

// Interface untuk struktur data Modul
interface Modul {
  id: string;
  tajuk: string;
  tarikh: string;
  nota: string;
}

export default function DashboardMurid() {
  const [senaraiModul, setSenaraiModul] = useState<Modul[]>([]);
  const [modulPilihan, setModulPilihan] = useState<Modul | null>(null);
  const [sedangMemuat, setSedangMemuat] = useState<boolean>(true);
  const [idMurid] = useState<string>("MURID_001"); // Contoh ID Murid (Boleh diganti dengan sistem Login)

  // Fungsi untuk menghantar data Telemetri ke GAS
  const hantarTelemetri = async (jenisAktiviti: string, butiran: string) => {
    try {
      // Kita gunakan POST untuk hantar data senyap-senyap di background
      const formData = new URLSearchParams();
      formData.append("action", "rekodTelemetri");
      formData.append("idMurid", idMurid);
      formData.append("aktiviti", jenisAktiviti);
      formData.append("butiran", butiran);
      formData.append("timestamp", new Date().toISOString());

      await fetch(GAS_WEB_APP_URL, {
        method: "POST",
        body: formData,
        mode: "no-cors", // Gunakan no-cors untuk elak isu CORS jika hantar data sahaja
      });
      console.log(`Telemetri dihantar: ${jenisAktiviti}`);
    } catch (error) {
      console.error("Gagal menghantar telemetri:", error);
    }
  };

  // Fungsi untuk mengambil Jadual Modul dari GAS
  const ambilDataModul = async () => {
    setSedangMemuat(true);
    try {
      const response = await fetch(`${GAS_WEB_APP_URL}?action=getModul`);
      const data = await response.json();
      
      if (data && data.modul) {
        setSenaraiModul(data.modul);
      } else {
        // Fallback data (Mockup) jika belum sambung dengan GAS
        setSenaraiModul([
          { id: "M1", tajuk: "Bab 1: Warisan Negara Bangsa", tarikh: "2023-10-01", nota: "Ini adalah nota ringkas untuk Bab 1. Fokus kepada ciri-ciri negara bangsa." },
          { id: "M2", tajuk: "Bab 2: Kebangkitan Nasionalisme", tarikh: "2023-10-08", nota: "Nota Bab 2: Bincangkan faktor kemunculan nasionalisme di Tanah Melayu." },
        ]);
      }
    } catch (error) {
      console.error("Ralat mengambil data:", error);
      // Data Mockup jika ralat/offline
      setSenaraiModul([
        { id: "M1", tajuk: "Bab 1: Warisan Negara Bangsa", tarikh: "2023-10-01", nota: "Ini adalah nota ringkas untuk Bab 1. Fokus kepada ciri-ciri negara bangsa." },
        { id: "M2", tajuk: "Bab 2: Kebangkitan Nasionalisme", tarikh: "2023-10-08", nota: "Nota Bab 2: Bincangkan faktor kemunculan nasionalisme di Tanah Melayu." },
      ]);
    } finally {
      setSedangMemuat(false);
    }
  };

  // Kitaran hayat komponen (Component Lifecycle)
  useEffect(() => {
    ambilDataModul();
    hantarTelemetri("LOGIN", "Murid log masuk ke dashboard utama");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fungsi apabila murid klik "Baca Nota"
  const klikBacaNota = (modul: Modul) => {
    setModulPilihan(modul);
    hantarTelemetri("BACA_NOTA", `Murid membaca nota modul: ${modul.tajuk} (${modul.id})`);
  };

  // Fungsi untuk tutup modal nota
  const tutupNota = () => {
    setModulPilihan(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Dashboard Murid</h1>
          <p className="text-gray-600">Projek SEJARAH SCORE A+</p>
        </header>

        {/* Jadual Modul Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Jadual Modul Terkini</h2>
          
          {sedangMemuat ? (
            <div className="text-center py-10 text-gray-500">Memuatkan data dari pangkalan data...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {senaraiModul.map((modul) => (
                <div key={modul.id} className="border rounded-lg p-4 hover:shadow-md transition bg-blue-50/30">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{modul.tajuk}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                      {modul.tarikh}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{modul.nota}</p>
                  <button
                    onClick={() => klikBacaNota(modul)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition text-sm"
                  >
                    Baca Nota
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Modal / Paparan Nota Penuh */}
        {modulPilihan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-blue-50">
                <h3 className="text-xl font-bold text-blue-900">{modulPilihan.tajuk}</h3>
                <button 
                  onClick={tutupNota}
                  className="text-gray-500 hover:text-red-500 font-bold text-xl"
                >
                  &times;
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="prose max-w-none text-gray-700">
                  {/* Gunakan pre-wrap untuk kekalkan format baris baru (newlines) dari GAS */}
                  <p className="whitespace-pre-wrap">{modulPilihan.nota}</p>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 text-right">
                <button
                  onClick={tutupNota}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition"
                >
                  Tutup Nota
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}