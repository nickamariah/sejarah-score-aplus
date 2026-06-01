"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  CheckCircle2,
  Trophy,
  Gamepad2,
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
import { db } from "../../lib/firebase"; // Pastikan path ini betul ikut fail Dr. Nic
import Link from "next/link"; // Pastikan Link di-import di bahagian atas sekali fail

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

// 🌟 SENARAI MODUL BARU (DIAGNOSTIK DAHULU, NOTA DALAM AI)
const modules = [
  { id: 1, name: "Ujian Diagnostik", icon: Zap, color: "amber", note: "Wajib dijawab untuk penentuan aras." },
  { id: 2, name: "Bimbingan AI (RAG)", icon: Sparkles, color: "purple", note: "Sesi bimbingan berdasarkan kelemahan anda." },
  { id: 3, name: "Post Test", icon: CheckCircle2, color: "emerald", note: "Ujian pengesahan kefahaman akhir." },
  { id: 4, name: "Games Pengukuhan", icon: Gamepad2, color: "pink", note: "Ganjaran main sambil belajar." },
];

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  
  // SEMUA STATE HANYA DEKLARASI SEKALI DI SINI
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [skorBab, setSkorBab] = useState<Record<number, number>>({});
  const [docIds, setDocIds] = useState<Record<number, string>>({}); 

  // ===============================================================
  // 1. TARIK DATA MURID (Hanya run SEKALI masa mula-mula masuk)
  // ===============================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        setUserData(user);
        // Tetapkan tab aktif ikut tingkatan murid masa mula-mula login
        if (user.tingkatan?.toString() === "5") {
          setActiveLevel("t5");
        } else {
          setActiveLevel("t4");
        }
      }
    } catch (e) {}
  }, []); 

  // ===============================================================
  // 2. TARIK MARKAH & ID DARI FIREBASE
  // ===============================================================
  useEffect(() => {
    const tarikMarkahFirebase = async () => {
      const rawUser = localStorage.getItem("currentUser");
      if (!rawUser) return;
      const user = JSON.parse(rawUser);

      try {
        const tingkatanSemasa = activeLevel === "t4" ? "4" : "5";
        
        const q = query(
          collection(db, "skor_murid"),
          where("idMurid", "==", user.id),
          where("tingkatan", "==", tingkatanSemasa)
        );

        const querySnapshot = await getDocs(q);
        const loadedScores: Record<number, number> = {};
        const loadedDocIds: Record<number, string> = {}; 
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          loadedScores[babNum] = data.skor;
          loadedDocIds[babNum] = doc.id; 
        });

        setSkorBab(loadedScores);
        setDocIds(loadedDocIds); 
      } catch (error) {
        console.error("Ralat tarik markah dari Firebase:", error);
      }
    };

    tarikMarkahFirebase();
  }, [activeLevel]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  const openModule = (chapterId: number, moduleId: number) => {
    if (moduleId === 1) {
      const aras = activeLevel === "t4" ? "4" : "5";
      window.location.href = `/jawab?tingkatan=${aras}&bab=Bab ${chapterId}`;
      return;
    }
    window.alert(`Modul ${moduleId} sedang dibangunkan (Fasa Seterusnya).`);
  };

  const getAdaptiveMeta = (chapterId: number, moduleId: number) => {
    const meta = { hidden: false, adaptiveLocked: false, displayName: "" };
    const skor = skorBab[chapterId];

    if (skor === undefined) {
      // BELUM JAWAB UJIAN DIAGNOSTIK
      if (moduleId !== 1) meta.adaptiveLocked = true;
    } else if (skor >= 80) {
      // CEMERLANG
      if ([2, 3].includes(moduleId)) meta.hidden = true;
      if ([4].includes(moduleId)) meta.adaptiveLocked = false;
    } else if (skor >= 50) {
      // SEDERHANA
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Aras Sederhana)`;
      if (moduleId === 4) meta.adaptiveLocked = true;
    } else {
      // BIMBINGAN
      if (moduleId === 2) meta.displayName = `Bimbingan AI (Bimbingan Penuh)`;
      if (moduleId === 4) meta.adaptiveLocked = true;
    }
    return meta;
  };

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  // Kira peratusan penguasaan keseluruhan
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
                <p className="text-xs md:text-sm uppercase tracking-widest text-slate-500">Selamat datang,</p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{userData?.name || userData?.nama || "Pelajar Pintar"}</h1>
                <p className="text-sm text-slate-600">Pusat Pembelajaran HUB I-RAGS</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700 text-xs font-semibold">🔥 Streak: 7</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sky-700 text-xs font-semibold">XP: 1240</span>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition">
              <LogOut className="w-5 h-5" /> Log Keluar
            </button>
          </div>
        </motion.div>

        {/* CARTA & ANALITIK PENGUASAAN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 rounded-xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col items-center justify-center">
            <h3 className="text-sm text-slate-500 uppercase tracking-widest font-semibold">Penguasaan Bab</h3>
            <div className="w-40 h-40 mt-6">
              <CircularProgressbar
                value={masteryPercent}
                text={`${masteryPercent}%`}
                styles={buildStyles({
                  textSize: "18px",
                  pathColor: `rgba(14, 165, 233, ${masteryPercent / 100 || 0.1})`, 
                  textColor: "#0f172a",
                  trailColor: "#f1f5f9",
                })}
              />
            </div>
            <p className="mt-6 text-sm text-slate-600 text-center font-medium">Selesaikan Ujian Diagnostik dan Modul untuk tingkatkan peratusan anda.</p>
          </div>

          <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-500 font-semibold">Analitik Kemahiran</p>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Radar Prestasi Sejarah</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-bold text-amber-700 shadow-sm">
                <Trophy className="w-4 h-4 text-amber-500" /> Top 14%
              </div>
            </div>
            <div className="mt-4 h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Skor" dataKey="A" stroke="#0ea5e9" strokeWidth={2} fill="#38bdf8" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

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
              
              {/* Kepala Bab */}
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
                  <motion.div animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }}>
                    <ChevronDown className="w-6 h-6 text-slate-400" />
                  </motion.div>
                </div>
              </button>

              {/* Isi Modul */}
              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-200 bg-slate-50/50 p-6 overflow-hidden">
                    <div className="grid gap-4 sm:grid-cols-2">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const adaptive = getAdaptiveMeta(chapter.id, module.id);
                        if (adaptive.hidden) return null;
                        
                        const modKey = `${activeLevel}-ch${chapter.id}-mod${module.id}`;
                        const isCompleted = completedModules.includes(modKey);
                        const isModul1Completed = module.id === 1 && skorBab[chapter.id] !== undefined;
                        const isButtonDisabled = adaptive.adaptiveLocked || (module.id === 1 && isModul1Completed);

                        return (
                          <div key={module.id} className={`p-5 rounded-xl border ${adaptive.adaptiveLocked ? 'bg-slate-100 border-slate-200' : isModul1Completed ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex items-start gap-4 transition-all hover:shadow-md`}>
                            <div className={`p-3 rounded-xl shrink-0 shadow-inner ${adaptive.adaptiveLocked ? 'bg-slate-200 text-slate-500' : isModul1Completed ? 'bg-emerald-100 text-emerald-600' : 'bg-gradient-to-br from-sky-100 to-sky-200 text-sky-700'}`}>
                              {adaptive.adaptiveLocked ? <Lock className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-slate-800">{adaptive.displayName || module.name}</h4>
                              <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">{module.note}</p>
                              
                              <div className="flex items-center justify-between">
                                {isCompleted || isModul1Completed ? (
                                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-4 h-4"/> Selesai
                                  </span>
                                ) : <div />}
                                
                                <div className="flex gap-2">
                                  {/* 🌟 JIKA MODUL 1 DAN SUDAH DIJAWAB, TUNJUK BUTANG LINK */}
                                  {module.id === 1 && isModul1Completed ? (
                                    <Link 
                                      href={`/student/semakan-ujian/${docIds[chapter.id]}`} 
                                      className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded-lg font-bold text-sm transition shadow border border-indigo-200 flex items-center gap-2"
                                    >
                                      🔍 Lihat Semakan
                                    </Link>
                                  ) : (
                                    /* 🌟 JIKA BELUM DIJAWAB ATAU MODUL LAIN, TUNJUK BUTANG BIASA */
                                    <button 
                                      onClick={() => openModule(chapter.id, module.id)}
                                      disabled={isButtonDisabled}
                                      className={`px-4 py-2 text-sm font-bold rounded-lg transition-all shadow border ${
                                        isButtonDisabled 
                                          ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed' 
                                          : 'bg-sky-600 text-white hover:bg-sky-700 border-sky-700'
                                      }`}
                                    >
                                      {adaptive.adaptiveLocked 
                                        ? 'Terkunci 🔒' 
                                        : module.id === 1 
                                        ? 'Jawab Ujian 📝' 
                                        : module.id === 4 
                                        ? 'Mula Permainan 🎮' 
                                        : 'Buka Modul 🚀'}
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

        {/* FOOTER MOTIVASI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 md:p-8 text-white shadow-lg flex items-center gap-4">
          <Medal className="w-10 h-10 shrink-0 text-amber-100" />
          <div>
            <h3 className="text-xl font-bold">Teruskan Pembelajaran!</h3>
            <p className="text-amber-50 text-sm md:text-base mt-1">Selesaikan Ujian Diagnostik untuk membuka laluan khas AI dan kumpul lebih banyak XP.</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}