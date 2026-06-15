"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, Medal, ChevronDown, Lock, Sparkles, LogOut, BarChart3, MapMap
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
    { 
      id: 1, 
      title: "Bab 1: Warisan Negara Bangsa", 
      desc: "Mengenal identiti dan nilai kebangsaan",
      // 🌟 KITA TAMBAH SENARAI SUBTOPIK DI SINI
      subtopics: [
        { id: "1.1", title: "Konsep Alam Melayu" },
        { id: "1.2", title: "Ciri Kesultanan Melayu Melaka" },
        { id: "1.3", title: "Keunggulan Sistem Pentadbiran" },
        { id: "1.4", title: "Peranan Pemerintah & Rakyat" }
      ]
    },
    { 
      id: 2, 
      title: "Bab 2: Kebangkitan Nasionalisme", 
      desc: "Asas kebangkitan dan semangat kebangsaan",
      subtopics: [
        { id: "2.1", title: "Maksud Nasionalisme" },
        { id: "2.2", title: "Perkembangan Idea Nasionalisme" },
        { id: "2.3", title: "Nasionalisme di Asia Tenggara" }
      ]
    },
  ],
  t5: [
    { id: 1, title: "Bab 1: Kedaulatan Negara", desc: "Konsep dan kepentingan kedaulatan", subtopics: [] },
  ]
};

const modules = [
  { id: 1, name: "Ujian Diagnostik", icon: Zap, color: "amber", note: "Wajib dijawab untuk penentuan aras." },
  { id: 2, name: "Bimbingan AI (RAG)", icon: Sparkles, color: "purple", note: "Sesi bimbingan AI mengikut subtopik." },
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        setUserData(user);
        if (user.tingkatan?.toString() === "5") setActiveLevel("t5");
      }
      const comp = JSON.parse(localStorage.getItem("completedModules") || "[]");
      setCompletedModules(comp);
    } catch (e) {}
  }, []); 

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
        
        snapSkor.forEach((docSnap) => {
          const data = docSnap.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          loadedScores[babNum] = data.skor;
          loadedDocIds[babNum] = docSnap.id; 
        });
        setSkorBab(loadedScores);
        setDocIds(loadedDocIds); 

        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", user.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const selesaiChat: string[] = [];
        
        snapChat.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.chapterId) selesaiChat.push(data.chapterId); 
        });
        setAiSelesai(selesaiChat);
      } catch (error) {
        console.error("Ralat tarik data:", error);
      }
    };
    tarikDataFirebase();
  }, [activeLevel]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("completedModules"); 
    window.location.href = "/";
  };

  // 🌟 CARI SUBTOPIK TERKINI YANG MURID PATUT BELAJAR
  const getCurrentSubtopic = (chapterId: number, chapterData: any) => {
    if (!chapterData.subtopics || chapterData.subtopics.length === 0) return "sub1.1";
    
    // Semak dari awal, subtopik mana yang belum ada dalam aiSelesai
    for (const sub of chapterData.subtopics) {
      const formatBabSub = `tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}_sub${sub.id}`;
      if (!aiSelesai.includes(formatBabKey)) {
        return `sub${sub.id}`; // Pulangkan subtopik pertama yang belum siap
      }
    }
    // Jika dah siap semua subtopik, pulangkan subtopik terakhir
    return `sub${chapterData.subtopics[chapterData.subtopics.length - 1].id}`;
  };

  const openModule = (chapterId: number, moduleId: number, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    if (moduleId === 1) window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}`;
    else if (moduleId === 2) window.location.href = `/pembelajaran?bab=tingkatan${t}_bab${chapterId}_${subSemasa}&aras=${aras}`;
    else if (moduleId === 3) window.location.href = `/post-test?tingkatan=${t}&bab=${chapterId}`;
  };

  const getAdaptiveMeta = (chapterId: number, moduleId: number, chapterData: any) => {
    const meta = { hidden: false, adaptiveLocked: false, displayName: "", aras: "" };
    const skor = skorBab[chapterId];
    
    // 🌟 SYARAT BIMBINGAN SELESAI: Jika murid dah siapkan SEMUA subtopik dalam bab ini
    let isBimbinganSelesai = false;
    if (chapterData.subtopics && chapterData.subtopics.length > 0) {
      const totalSub = chapterData.subtopics.length;
      let siapCount = 0;
      chapterData.subtopics.forEach(sub => {
        if (aiSelesai.includes(`tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}_sub${sub.id}`)) siapCount++;
      });
      isBimbinganSelesai = (siapCount === totalSub);
    } else {
      isBimbinganSelesai = aiSelesai.some(id => id.includes(`tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}`));
    }

    const isPostTestSelesai = completedModules.includes(`${activeLevel}-ch${chapterId}-mod3`);

    if (skor === undefined) {
      if (moduleId !== 1) meta.adaptiveLocked = true;
    } else if (skor >= 80 || isPostTestSelesai) {
      if ([2, 3].includes(moduleId)) meta.hidden = true; 
    } else if (skor >= 50) {
      meta.aras = "sederhana";
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Aras Sederhana)`;
      if (moduleId === 3 && !isBimbinganSelesai) meta.adaptiveLocked = true; 
    } else {
      meta.aras = "rendah";
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Bimbingan Penuh)`;
      if (moduleId === 3 && !isBimbinganSelesai) meta.adaptiveLocked = true; 
    }
    return meta;
  };

  const getChapterStatus = (chapterId: number) => {
    const skor = skorBab[chapterId];
    const isPostTestSelesai = completedModules.includes(`${activeLevel}-ch${chapterId}-mod3`);
    if (skor === undefined) return { label: "Belum Mula", color: "bg-slate-100 text-slate-500 border-slate-200", bar: "w-0", icon: "⚪" };
    if (skor >= 80 || isPostTestSelesai) return { label: "Kuasai", color: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "w-full bg-emerald-500", icon: "✅" };
    if (aiSelesai.some(id => id.includes(`bab${chapterId}`))) return { label: "Sedia Ujian", color: "bg-sky-50 text-sky-700 border-sky-200", bar: "w-3/4 bg-sky-500", icon: "🚀" };
    return { label: "Bimbingan", color: "bg-amber-50 text-amber-700 border-amber-200", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "⏳" };
  };

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        
        {/* HEADER PROFIL */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-8 shadow-lg text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-sky-600 shadow-md border-4 border-sky-100">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <p className="text-sky-100 font-medium tracking-wide uppercase text-sm mb-1">Selamat datang kembali,</p>
                <h1 className="text-3xl font-extrabold tracking-tight">{userData?.name || "Pelajar Pintar"}</h1>
                <p className="text-sky-50 flex items-center gap-2 mt-2">
                  <Medal className="w-5 h-5 text-amber-300" /> Pusat Pembelajaran HUB I-RAGS
                </p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-sm border border-white/20 transition-all">
              <LogOut className="w-5 h-5" /> Log Keluar
            </button>
          </div>
        </motion.div>

        {/* ANALISIS PENGUASAAN BAB */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analisis Penguasaan Bab</h2>
              <p className="text-sm text-slate-500">Kenal pasti tahap penguasaan anda bagi setiap bab.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentChapters.map((ch) => {
              const status = getChapterStatus(ch.id);
              return (
                <div key={ch.id} className={`p-4 rounded-2xl border ${status.color} flex flex-col gap-3 shadow-sm transition-all hover:shadow-md`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg opacity-80">B{ch.id}</span>
                    <span className="text-xl">{status.icon}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-75">{status.label}</p>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
                      <div className={`h-full ${status.bar} rounded-full`}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* TABS TINGKATAN */}
        <div className="mb-6 flex gap-3">
          {["t4", "t5"].map((level) => (
            <button
              key={level}
              onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-sm ${
                activeLevel === level ? "bg-sky-600 text-white shadow-sky-200" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {/* SENARAI BAB & MODUL */}
        <div className="space-y-4">
          {currentChapters.map((chapter) => (
            <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              
              <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="text-left flex-1 flex items-center gap-4">
                  <div className="hidden sm:flex w-12 h-12 bg-sky-100 text-sky-600 rounded-xl items-center justify-center font-bold text-lg">
                    {chapter.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">{chapter.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  {skorBab[chapter.id] !== undefined && (
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${skorBab[chapter.id] >= 80 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : skorBab[chapter.id] >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      Skor: {skorBab[chapter.id]}%
                    </span>
                  )}
                  <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-100 bg-slate-50/50 p-6 overflow-hidden">
                    
                    {/* 🌟 KOTAK JEJAK SUBTOPIK (FUNGSI BARU) 🌟 */}
                    {skorBab[chapter.id] !== undefined && skorBab[chapter.id] < 80 && chapter.subtopics && chapter.subtopics.length > 0 && (
                      <div className="mb-6 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                          <MapMap className="w-4 h-4"/> Laluan Bimbingan Subtopik
                        </h4>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {chapter.subtopics.map((sub, idx) => {
                            const isSubSelesai = aiSelesai.includes(`tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapter.id}_sub${sub.id}`);
                            // Subtopik aktif adalah subtopik PERTAMA yang belum selesai
                            let isAktif = false;
                            if (!isSubSelesai) {
                              // Cek adakah subtopik sebelum ni dah selesai?
                              if (idx === 0) isAktif = true;
                              else if (aiSelesai.includes(`tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapter.id}_sub${chapter.subtopics[idx-1].id}`)) isAktif = true;
                            }

                            if (isSubSelesai) return (
                              <div key={sub.id} className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap">
                                ✅ {sub.id} {sub.title}
                              </div>
                            );
                            if (isAktif) return (
                              <div key={sub.id} className="px-4 py-2 bg-sky-100 text-sky-700 border-2 border-sky-400 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap shadow-sm">
                                🚀 {sub.id} {sub.title}
                              </div>
                            );
                            return (
                              <div key={sub.id} className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 whitespace-nowrap opacity-60">
                                🔒 {sub.id} {sub.title}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const adaptive = getAdaptiveMeta(chapter.id, module.id, chapter);
                        if (adaptive.hidden) return null;
                        
                        const subSemasa = getCurrentSubtopic(chapter.id, chapter);
                        const isModul1Completed = module.id === 1 && skorBab[chapter.id] !== undefined;
                        const isModul2Completed = module.id === 2 && !adaptive.adaptiveLocked && adaptive.hidden === true; // Jika AI siap semua, ia akan hidden atau dibuka post test
                        const isButtonDisabled = adaptive.adaptiveLocked || (module.id === 1 && isModul1Completed);

                        return (
                          <div key={module.id} className={`p-5 rounded-2xl border ${adaptive.adaptiveLocked ? 'bg-slate-100 border-slate-200' : (isModul1Completed || isModul2Completed) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex items-start gap-4 transition-all hover:shadow-md`}>
                            <div className={`p-3 rounded-xl shrink-0 shadow-inner ${adaptive.adaptiveLocked ? 'bg-slate-200 text-slate-400' : (isModul1Completed || isModul2Completed) ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
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
                                  {module.id === 1 && isModul1Completed ? (
                                    (skorBab[chapter.id] >= 80 || completedModules.includes(`${activeLevel}-ch${chapter.id}-mod3`)) ? (
                                      <Link href={`/student/semakan-ujian/${docIds[chapter.id]}`} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-bold text-sm transition shadow border border-indigo-200 flex items-center gap-2">
                                        🔍 Semakan
                                      </Link>
                                    ) : (
                                      <button disabled className="bg-slate-100 text-slate-400 border-slate-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 cursor-not-allowed">
                                        🔒 Dikunci
                                      </button>
                                    )
                                  ) : (
                                    <button 
                                      onClick={() => openModule(chapter.id, module.id, adaptive.aras, subSemasa)}
                                      disabled={isButtonDisabled}
                                      className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all shadow-sm border ${
                                        isButtonDisabled 
                                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                                          : 'bg-sky-600 text-white hover:bg-sky-700 border-sky-700 hover:shadow-md'
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

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}