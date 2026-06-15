"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  Trophy,
  Medal,
  ChevronDown,
  Lock,
  Sparkles,
  LogOut
} from "lucide-react";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase"; 
import Link from "next/link"; 

const radarData = [
  { subject: "Pemahaman", A: 88, fullMark: 100 },
  { subject: "Fakta", A: 82, fullMark: 100 },
  { subject: "Analisis", A: 76, fullMark: 100 },
  { subject: "KBAT", A: 90, fullMark: 100 },
  { subject: "Kreativiti", A: 72, fullMark: 100 },
];

const chapters = {
  t4: [
    { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan" },
    { id: 2, title: "Bab 2: Kebangkitan Nasionalisme", desc: "Asas kebangkitan dan semangat kebangsaan" },
  ],
  t5: [
    { id: 1, title: "Bab 1: Kedaulatan Negara", desc: "Konsep dan kepentingan kedaulatan" },
    { id: 2, title: "Bab 2: Perlembagaan Persekutuan", desc: "Rangka perlembagaan dan hak" },
  ]
};

// 🌟 SENARAI MODUL BARU (GAMES DIBUANG)
const modules = [
  { id: 1, name: "Ujian Diagnostik", icon: Zap, color: "amber", note: "Wajib dijawab untuk penentuan aras." },
  { id: 2, name: "Bimbingan AI (RAG)", icon: Sparkles, color: "purple", note: "Sesi bimbingan berdasarkan kelemahan anda." },
  { id: 3, name: "Post Test", icon: CheckCircle2, color: "emerald", note: "Ujian pengesahan kefahaman akhir." }
];

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [skorBab, setSkorBab] = useState<Record<number, number>>({});
  const [docIds, setDocIds] = useState<Record<number, string>>({}); 
  
  const [aiSelesai, setAiSelesai] = useState<string[]>([]); 

  // ===============================================================
  // TARIK DATA MURID & MODULES YANG DAH SIAP
  // ===============================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        setUserData(user);
        if (user.tingkatan?.toString() === "5") {
          setActiveLevel("t5");
        } else {
          setActiveLevel("t4");
        }
      }
      // Tarik status Post-Test dari memory
      const comp = JSON.parse(localStorage.getItem("completedModules") || "[]");
      setCompletedModules(comp);
    } catch (e) {}
  }, []); 

  // ===============================================================
  // TARIK MARKAH & SEMAK STATUS AI DARI FIREBASE
  // ===============================================================
  useEffect(() => {
    const tarikDataFirebase = async () => {
      const rawUser = localStorage.getItem("currentUser");
      if (!rawUser) return;
      const user = JSON.parse(rawUser);

      try {
        const tingkatanSemasa = activeLevel === "t4" ? "4" : "5";
        
        const qSkor = query(collection(db, "skor_murid"), where("idMurid", "==", user.id), where("tingkatan", "==", tingkatanSemasa));
        const snapSkor = await getDocs(qSkor);
        const loadedScores: Record<number, number> = {};
        const loadedDocIds: Record<number, string> = {}; 
        
        snapSkor.forEach((doc) => {
          const data = doc.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          loadedScores[babNum] = data.skor;
          loadedDocIds[babNum] = doc.id; 
        });
        setSkorBab(loadedScores);
        setDocIds(loadedDocIds); 

        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", user.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const selesaiChat: string[] = [];
        
        snapChat.forEach((doc) => {
          const data = doc.data();
          if (data.chapterId) selesaiChat.push(data.chapterId); 
        });
        setAiSelesai(selesaiChat);

      } catch (error) {
        console.error("Ralat tarik data Firebase:", error);
      }
    };

    tarikDataFirebase();
  }, [activeLevel]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("completedModules"); 
    window.location.href = "/";
  };

  const openModule = (chapterId: number, moduleId: number, aras: string) => {
    const t = activeLevel === "t4" ? "4" : "5";

    if (moduleId === 1) {
      window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}`;
    } 
    else if (moduleId === 2) {
      const formatBab = `tingkatan${t}_bab${chapterId}_sub1.1`;
      window.location.href = `/pembelajaran?bab=${formatBab}&aras=${aras}`;
    } 
    else if (moduleId === 3) {
      window.location.href = `/post-test?tingkatan=${t}&bab=${chapterId}`;
    } 
  };

  const getAdaptiveMeta = (chapterId: number, moduleId: number) => {
    const meta = { hidden: false, adaptiveLocked: false, displayName: "", aras: "" };
    const skor = skorBab[chapterId];
    
    const formatBabKey = `tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}`;
    const isBimbinganSelesai = aiSelesai.some(id => id.includes(formatBabKey));

    if (skor === undefined) {
      if (moduleId !== 1) meta.adaptiveLocked = true;
    } else if (skor >= 80) {
      if ([2, 3].includes(moduleId)) meta.hidden = true; 
    } else if (skor >= 50) {
      meta.aras = "sederhana";
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Aras Sederhana)`;
      // Kunci Modul 3 jika AI belum selesai
      if (moduleId === 3 && !isBimbinganSelesai) meta.adaptiveLocked = true; 
    } else {
      meta.aras = "rendah";
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Bimbingan Penuh)`;
      // Kunci Modul 3 jika AI belum selesai
      if (moduleId === 3 && !isBimbinganSelesai) meta.adaptiveLocked = true; 
    }
    return meta;
  };

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
  const totalModules = currentChapters.length * modules.length;
  const completedCount = completedModules.filter((k) => k.startsWith(activeLevel)).length;
  const masteryPercent = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 md:px-6 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        
        {/* HEADER PROFIL */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl md:text-3xl font-bold text-white shadow">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : (userData?.nama ? userData.nama.charAt(0).toUpperCase() : "P")}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{userData?.name || userData?.nama || "Pelajar Pintar"}</h1>
                <p className="text-sm text-slate-600">Pusat Pembelajaran HUB I-RAGS</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition">
              <LogOut className="w-5 h-5" /> Log Keluar
            </button>
          </div>
        </motion.div>

        {/* TABS TINGKATAN */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex gap-3">
          {["t4", "t5"].map((level) => (
            <button
              key={level}
              onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${
                activeLevel === level ? "bg-sky-600 text-white ring-2 ring-sky-600 ring-offset-2" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </motion.div>

        {/* SENARAI BAB & MODUL */}
        <motion.div className="space-y-4">
          {currentChapters.map((chapter, index) => (
            <motion.div key={chapter.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              
              <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="text-left flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{chapter.desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  {skorBab[chapter.id] !== undefined && (
                    <span className={`px-4 py-1.5 rounded-lg text-sm font-bold border shadow-sm ${skorBab[chapter.id] >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : skorBab[chapter.id] >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      Skor: {skorBab[chapter.id]}%
                    </span>
                  )}
                  <ChevronDown className="w-6 h-6 text-slate-400" />
                </div>
              </button>

              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-200 bg-slate-50/50 p-6 overflow-hidden">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const adaptive = getAdaptiveMeta(chapter.id, module.id);
                        if (adaptive.hidden) return null;
                        
                        const isModul1Completed = module.id === 1 && skorBab[chapter.id] !== undefined;
                        
                        const formatBabKey = `tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapter.id}`;
                        const isModul2Completed = module.id === 2 && aiSelesai.some(id => id.includes(formatBabKey));
                        
                        const isButtonDisabled = adaptive.adaptiveLocked || (module.id === 1 && isModul1Completed);

                        return (
                          <div key={module.id} className={`p-5 rounded-xl border ${adaptive.adaptiveLocked ? 'bg-slate-100 border-slate-200' : (isModul1Completed || isModul2Completed) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex items-start gap-4 transition-all hover:shadow-md`}>
                            <div className={`p-3 rounded-xl shrink-0 shadow-inner ${adaptive.adaptiveLocked ? 'bg-slate-200 text-slate-500' : (isModul1Completed || isModul2Completed) ? 'bg-emerald-100 text-emerald-600' : 'bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700'}`}>
                              {adaptive.adaptiveLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800">{adaptive.displayName || module.name}</h4>
                              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{module.note}</p>
                              
                              <div className="flex items-center justify-between">
                                {(isModul1Completed || isModul2Completed) ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4"/> Selesai
                                  </span>
                                ) : <div />}
                                
                                <div className="flex gap-2">
                                  
                                  {/* 🌟 LOGIK KUNCI SEMAKAN 🌟 */}
                                  {module.id === 1 && isModul1Completed ? (
                                    (skorBab[chapter.id] >= 80 || completedModules.includes(`${activeLevel}-ch${chapter.id}-mod3`)) ? (
                                      <Link href={`/student/semakan-ujian/${docIds[chapter.id]}`} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-bold text-sm transition shadow border border-indigo-200 flex items-center gap-2">
                                        🔍 Lihat Semakan
                                      </Link>
                                    ) : (
                                      <button disabled className="bg-slate-100 text-slate-400 border-slate-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 cursor-not-allowed">
                                        🔒 Semakan Dikunci
                                      </button>
                                    )
                                  ) : (
                                    <button 
                                      onClick={() => openModule(chapter.id, module.id, adaptive.aras)}
                                      disabled={isButtonDisabled}
                                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all shadow border ${
                                        isButtonDisabled 
                                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                                          : 'bg-sky-600 text-white hover:bg-sky-700 border-sky-700'
                                      }`}
                                    >
                                      {adaptive.adaptiveLocked ? 'Terkunci 🔒' : module.id === 1 ? 'Jawab Ujian 📝' : 'Buka Modul 🚀'}
                                    </button>
                                  )}

                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}