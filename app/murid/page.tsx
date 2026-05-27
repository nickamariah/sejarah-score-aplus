"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Zap, CheckCircle2, Trophy, Gamepad2, ChevronDown, Lock, Sparkles, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

const chapters = {
  t4: [
    { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan" },
    { id: 2, title: "Bab 2: Kebangkitan Nasionalisme", desc: "Asas kebangkitan dan semangat kebangsaan" },
    { id: 3, title: "Bab 3: Konflik Dunia & Pendudukan Jepun Di negara Kita", desc: "Perang Dunia dan pendudukan Jepun di negara kita" },
    { id: 4, title: "Bab 4: Era Peralihan Kuasa British Di Negara Kita", desc: "Perubahan kuasa British dan kesannya" },
    { id: 5, title: "Bab 5: Persekutuan Tanah Melayu (PTM) 1948", desc: "Pembentukan PTM 1948" },
    { id: 6, title: "Bab 6: Ancaman Komunis & Perisytiharan Darurat", desc: "Perjuangan menentang ancaman komunis" },
    { id: 7, title: "Bab 7: Usaha Ke Arah Kemerdekaan", desc: "Gerakan dan rundingan ke arah merdeka" },
    { id: 8, title: "Bab 8: Pilihan Raya", desc: "Proses pilihan raya awal dan impaknya" },
    { id: 9, title: "Bab 9: PTM 1957", desc: "Peristiwa penting PTM 1957" },
    { id: 10, title: "Bab 10: Permasyuran Kemerdekaan", desc: "Upacara dan simbol permasyuran kemerdekaan" },
  ],
  t5: [
    { id: 1, title: "Bab 1: Kedaulatan Negara", desc: "Konsep dan kepentingan kedaulatan" },
    { id: 2, title: "Bab 2: Perlembagaan Persekutuan", desc: "Rangka perlembagaan dan hak" },
    { id: 3, title: "Bab 3: Raja berperlembagaan & Demokrasi Berparlimen", desc: "Peranan Raja dan Parlimen" },
    { id: 4, title: "Bab 4: Sistem Persekutuan", desc: "Susunan dan fungsi kerajaan persekutuan" },
    { id: 5, title: "Bab 5: Pembentukan Malaysia", desc: "Proses dan isu pembentukan Malaysia" },
    { id: 6, title: "Bab 6: Cabaran Selepas Pembentukaan Malaysia", desc: "Isu sosial dan politik pasca pembentukan" },
    { id: 7, title: "Bab 7: Membina Kesejahteraan Negara", desc: "Dasar dan program membina kesejahteraan" },
    { id: 8, title: "Bab 8: Membina Kemakmuran Negara", desc: "Strategi pembangunan ekonomi" },
    { id: 9, title: "Bab 9: Dasar Luar Malaysia", desc: "Pendekatan dan kepentingan dasar luar" },
    { id: 10, title: "Bab 10: Kecemerlangan Malaysia di Persada Dunia", desc: "Peranan Malaysia di pentas antarabangsa" },
  ]
};

// MODUL BAHARU (Nota dibuang, Diagnostik No 1)
const modules = [
  { id: 1, name: "Ujian Diagnostik", icon: Zap, color: "amber", note: "Wajib dijawab untuk penentuan aras." },
  { id: 2, name: "Bimbingan AI (RAG)", icon: Sparkles, color: "purple", note: "Sesi bimbingan berdasarkan kelemahan anda." },
  { id: 3, name: "Post Test", icon: CheckCircle2, color: "emerald", note: "Ujian pengesahan kefahaman akhir." },
  { id: 4, name: "Games Pengukuhan", icon: Gamepad2, color: "pink", note: "Ganjaran main sambil belajar." },
];

export default function MuridDashboard() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  
  // State untuk simpan markah setiap bab secara automatik
  const [skorBab, setSkorBab] = useState<Record<number, number>>({});

  useEffect(() => {
    // 1. Dapatkan data murid
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) setUserData(JSON.parse(rawUser));

    // 2. Dapatkan modul yang telah selesai (Auto dari Ujian Diagnostik)
    const savedCompleted = JSON.parse(localStorage.getItem("completedModules") || "[]");
    setCompletedModules(savedCompleted);

    // 3. Tarik semua markah Ujian Diagnostik dari LocalStorage
    const loadedScores: Record<number, number> = {};
    const tingkatan = activeLevel === "t4" ? "4" : "5";
    
    for (let i = 1; i <= 10; i++) {
      const skor = localStorage.getItem(`skor_${tingkatan}_Bab ${i}`);
      if (skor) {
        loadedScores[i] = parseInt(skor);
      }
    }
    setSkorBab(loadedScores);
    
  }, [activeLevel]); // Refresh bila tukar tingkatan

  const openModule = (chapterId: number, moduleId: number) => {
    if (moduleId === 1) {
      const aras = activeLevel === "t4" ? "4" : "5";
      window.location.href = `/ujian?tingkatan=${aras}&bab=Bab ${chapterId}`;
      return;
    }
    window.alert(`Modul ${moduleId} sedang dibangunkan (Fasa Seterusnya).`);
  };

  const getAdaptiveMeta = (chapterId: number, moduleId: number) => {
    const meta = { hidden: false, adaptiveLocked: false, displayName: "" };
    const skor = skorBab[chapterId]; // Dapatkan markah ujian untuk bab ini

    if (skor === undefined) {
      // BELUM JAWAB UJIAN DIAGNOSTIK
      if (moduleId !== 1) meta.adaptiveLocked = true;
    } else if (skor >= 80) {
      // LALUAN CEMERLANG (Skor 80+)
      if ([2, 3].includes(moduleId)) meta.hidden = true; // Sembunyi AI & Post Test
      if ([4, 5].includes(moduleId)) meta.adaptiveLocked = false; // Buka Game
    } else if (skor >= 50) {
      // LALUAN SEDERHANA
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Aras Sederhana)`;
      if ([4, 5].includes(moduleId)) meta.adaptiveLocked = true; // Kunci Game
    } else {
      // LALUAN BIMBINGAN (LEMAH)
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Bimbingan Penuh)`;
      if ([4, 5].includes(moduleId)) meta.adaptiveLocked = true;
    }
    return meta;
  };

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-900">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-sky-900">Dashboard Pintar</h1>
            <p className="text-slate-600">Pelajar: {userData?.name || "Pelajar"}</p>
          </div>
          <button onClick={() => { localStorage.removeItem("currentUser"); router.push("/"); }} className="text-red-600 font-bold flex items-center gap-2">
            <LogOut className="w-5 h-5"/> Log Keluar
          </button>
        </div>

        {/* Tab Tingkatan */}
        <div className="flex gap-3 mb-6">
          {["t4", "t5"].map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }} className={`px-6 py-2 rounded-xl font-bold ${activeLevel === level ? "bg-sky-600 text-white" : "bg-white text-slate-600 border"}`}>
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {/* Senarai Bab */}
        <div className="space-y-4">
          {currentChapters.map((chapter) => (
            <div key={chapter.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="text-left">
                  <h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3>
                  <p className="text-slate-500 text-sm">{chapter.desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* PAPARAN MARKAH AUTOMATIK JIKA DAH JAWAB */}
                  {skorBab[chapter.id] !== undefined && (
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${skorBab[chapter.id] >= 80 ? 'bg-emerald-100 text-emerald-700' : skorBab[chapter.id] >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      Skor: {skorBab[chapter.id]}%
                    </span>
                  )}
                  <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t bg-slate-50 p-6 overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-4">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const adaptive = getAdaptiveMeta(chapter.id, module.id);
                        if (adaptive.hidden) return null; // Jika Cemerlang, modul disorok terus
                        
                        const isCompleted = completedModules.includes(`${activeLevel}-ch${chapter.id}-mod${module.id}`);
                        
                        return (
                          <div key={module.id} className={`p-5 rounded-xl border ${adaptive.adaptiveLocked ? 'bg-slate-100 border-slate-200' : 'bg-white border-sky-100 shadow-sm'} flex items-start gap-4`}>
                            <div className={`p-3 rounded-lg ${adaptive.adaptiveLocked ? 'bg-slate-200 text-slate-500' : 'bg-sky-100 text-sky-600'}`}>
                              {adaptive.adaptiveLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800">{adaptive.displayName || module.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">{module.note}</p>
                              
                              <div className="mt-4 flex items-center justify-between">
                                {isCompleted ? (
                                  <span className="flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="w-4 h-4"/> Selesai
                                  </span>
                                ) : <div />}
                                
                                <button 
                                  onClick={() => openModule(chapter.id, module.id)}
                                  disabled={adaptive.adaptiveLocked}
                                  className={`px-4 py-2 text-sm font-bold rounded-lg transition ${adaptive.adaptiveLocked ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-md'}`}
                                >
                                  {adaptive.adaptiveLocked ? 'Terkunci 🔒' : 'Buka Modul 🚀'}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}