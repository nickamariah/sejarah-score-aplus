"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
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

const radarData = [
  { subject: "Pemahaman", A: 88, fullMark: 100 },
  { subject: "Tarikh", A: 82, fullMark: 100 },
  { subject: "Analisis", A: 76, fullMark: 100 },
  { subject: "Kefahaman", A: 90, fullMark: 100 },
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

const modules = [
  { id: 1, name: "Bahan Bacaan", icon: BookOpen, color: "sky", note: "" },
  { id: 2, name: "Ujian Diagnostik", icon: Zap, color: "amber", note: "Skor cemerlang akan melangkau Bahan Bacaan & Pengukuhan" },
  { id: 3, name: "Modul Pengukuhan", icon: Sparkles, color: "purple", note: "Latihan RAG & Scaffolding AI" },
  { id: 4, name: "Post Test", icon: CheckCircle2, color: "emerald", note: "" },
  { id: 5, name: "Games", icon: Gamepad2, color: "pink", note: "" },
  { id: 6, name: "Status Kuasai", icon: Trophy, color: "amber", note: "" },
];

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [simulasiSkor, setSimulasiSkor] = useState<number | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [moduleLinks, setModuleLinks] = useState<Record<string, string>>({});
  const [showIframe, setShowIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  // Quiz state
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedChapterForQuiz, setSelectedChapterForQuiz] = useState<number | null>(null);
  const router = useRouter(); // <--- TAMBAH KOD INI DI SINI

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      if (raw) {
        const user = JSON.parse(raw);
        setUserData(user);
        if (user.tingkatan === "5") setActiveLevel("t5");
      }
    } catch (e) {
      // ignore parse errors
    }
  }, []);

  useEffect(() => {
    // fetch module links from GAS based on active level
    const fetchModules = async () => {
      try {
        const endpoint = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";
        const tingkatan = activeLevel === 't5' ? '5' : '4';
        const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ action: 'GET_MODUL', tingkatan }) });
        const text = await res.text();
        const data = JSON.parse(text);
        // expect data to be an object mapping keys to URLs
        setModuleLinks(data || {});
      } catch (err) {
        // ignore for now
      }
    };

    fetchModules();
  }, [activeLevel]);

  const openModule = (chapterId: number, moduleId: number) => {
    // Hantar Telemetri Modul Dibuka
    hantarTelemetri("BUKA_MODUL", `Membuka Bab ${chapterId}, Modul ${moduleId}`);

    // Jika murid tekan Modul 2 (Ujian Diagnostik)
    if (moduleId === 2) {
      // Kita hantar murid ke halaman Firebase beserta nombor Bab & Tingkatan
      const aras = activeLevel === "t4" ? "4" : "5";
      router.push(`/ujian?tingkatan=${aras}&bab=Bab ${chapterId}`);
      return;
    }
    
    // Other modules: open iframe
    const key = `${activeLevel}-ch${chapterId}-mod${moduleId}`;
    const url = moduleLinks[key];
    if (url) {
      setIframeUrl(url);
      setShowIframe(true);
    } else {
      window.alert('Bahan belum dimuat naik oleh guru');
    }
  };

  const fetchQuizQuestions = async (chapterId: number) => {
    try {
      const endpoint = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";
      const tingkatan = activeLevel === 't5' ? '5' : '4';
      const body = { action: 'GET_SOALAN', tingkatan, bab: chapterId, kategori: 'Pre Test' };
      const res = await fetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && Array.isArray(data)) {
        setQuizQuestions(data);
        setCurrentQuestionIndex(0);
        setQuizScore(0);
        setShowQuizResult(false);
        setSelectedChapterForQuiz(chapterId);
        setIsQuizOpen(true);
      } else {
        showToast('Tiada soalan ditemui', 'error');
      }
    } catch (err) {
      showToast('Ralat memuatkan soalan', 'error');
    }
  };

  const handleAnswerSubmit = (answer: string) => {
    const current = quizQuestions[currentQuestionIndex];
    let isCorrect = false;
    
    // Check if answer matches skema
    if (current.skema) {
      isCorrect = answer.toLowerCase() === current.skema.toLowerCase();
    }
    
    if (isCorrect) {
      setQuizScore(quizScore + 1);
    }

    // Move to next question or end quiz
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Quiz ended
      endQuiz();
    }
  };

  const endQuiz = () => {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    
    setSimulasiSkor(percentage);
    setShowQuizResult(true);
  };

  const closeQuiz = () => {
    setIsQuizOpen(false);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setShowQuizResult(false);
    setSelectedChapterForQuiz(null);
  };

  const closeIframe = () => {
    setShowIframe(false);
    setIframeUrl(null);
    showToast('Modul ditutup', 'info');
  };

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  const toggleChapter = (chapterId: number) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const toggleModule = (moduleKey: string) => {
    setCompletedModules((prev) =>
      prev.includes(moduleKey) ? prev.filter((m) => m !== moduleKey) : [...prev, moduleKey]
    );
  };

  const getModuleStatus = (chapterId: number, moduleId: number) => {
    const key = `${activeLevel}-ch${chapterId}-mod${moduleId}`;
    return completedModules.includes(key);
  };

  const markModuleComplete = (chapterId: number, moduleId: number) => {
    const key = `${activeLevel}-ch${chapterId}-mod${moduleId}`;
    toggleModule(key);
  };

  const isModuleLocked = (chapterId: number, moduleId: number) => {
    if (moduleId === 1) return false;
    const prevKey = `${activeLevel}-ch${chapterId}-mod${moduleId - 1}`;
    return !completedModules.includes(prevKey);
  };

  const handlePreTestSubmit = (skor: number) => {
    setSimulasiSkor(skor);
    let msg = "";
    if (skor >= 70) msg = "Tahniah! Anda telah kuasai bab ini!";
    else if (skor >= 50) msg = "Tahniah, tapi mari kita gilap lagi di Laluan Sederhana.";
    else msg = "Mari belajar bersama di Laluan Bimbingan.";
    // simple feedback modal
    window.alert(msg + ` (Skor: ${skor}%)`);
  };

  const getAdaptiveMeta = (chapterId: number, moduleId: number) => {
    // returns { hidden, adaptiveLocked, displayName }
    const meta: { hidden: boolean; adaptiveLocked: boolean; displayName?: string } = { hidden: false, adaptiveLocked: false };
    const skor = simulasiSkor;

    if (skor === null) {
      // before pre-test: lock modules 3,4,5
      if ([3, 4, 5].includes(moduleId)) meta.adaptiveLocked = true;
    } else if (skor >= 70) {
      // excellent: hide 3 & 4, unlock 5 & 6
      if ([3, 4].includes(moduleId)) meta.hidden = true;
      if ([5, 6].includes(moduleId)) meta.adaptiveLocked = false;
    } else if (skor >= 50) {
      // moderate: unlock 3 (simple), lock 4 & 5
      if (moduleId === 3) meta.displayName = 'Modul Pengukuhan (Laluan Sederhana)';
      if ([4, 5].includes(moduleId)) meta.adaptiveLocked = true;
    } else {
      // low: unlock 3 (detailed), lock 4 & 5
      if (moduleId === 3) meta.displayName = 'Modul Pengukuhan (Bimbingan Terperinci RAG)';
      if ([4, 5].includes(moduleId)) meta.adaptiveLocked = true;
    }

    return meta;
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  // Mastery percent across active level
  const totalModules = currentChapters.length * modules.length;
  const completedCount = completedModules.filter((k) => k.startsWith(activeLevel)).length;
  const masteryPercent = totalModules ? Math.round((completedCount / totalModules) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-8 md:px-6 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-white p-6 md:p-8 shadow-sm border border-slate-200 mb-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-2xl md:text-3xl font-bold text-white shadow">
                {userData?.nama ? userData.nama.charAt(0).toUpperCase() : "S"}
              </div>
              <div>
                <p className="text-xs md:text-sm uppercase tracking-widest text-slate-500">Selamat datang,</p>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{userData?.nama || "Pelajar"}</h1>
                <p className="text-sm text-slate-600">Laluan Pembelajaran Adaptif Sejarah A+</p>
                <div className="mt-2 flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-amber-700 text-xs font-semibold">🔥 Streak: {userData?.streak ?? 7}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sky-700 text-xs font-semibold">XP: {userData?.xp ?? 1240}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition"
              >
                <LogOut className="w-5 h-5" />
                Log Keluar
              </button>
            </div>
          </div>
        </motion.div>

        {/* Analytics + Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 rounded-xl bg-white p-6 shadow-sm border border-slate-200 flex flex-col items-center">
            <h3 className="text-sm text-slate-500 uppercase tracking-widest">Penguasaan Keseluruhan</h3>
            <div className="w-36 h-36 mt-4">
              <CircularProgressbar
                value={masteryPercent}
                text={`${masteryPercent}%`}
                styles={buildStyles({
                  textSize: "18px",
                  pathColor: `rgba(245, 158, 11, ${masteryPercent / 100})`,
                  textColor: "#92400e",
                  trailColor: "#f3f4f6",
                })}
              />
            </div>
            <p className="mt-4 text-sm text-slate-600 text-center">Selesaikan modul untuk naik tahap penguasaan dan dapat lencana.</p>
          </div>

          <div className="md:col-span-2 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-slate-500">Analitik Penguasaan</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">Prestasi Sejarah</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <Trophy className="w-4 h-4 text-amber-500" /> Top 14%
              </div>
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer width="100%" height={256}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e6e9ef" />
                  <PolarAngleAxis dataKey="subject" stroke="#475569" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                  <Radar name="Skor" dataKey="A" stroke="#b45309" fill="#b45309" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Level Tabs + Adaptive Pathway (kept below analytics) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-3"
        >
          {["t4", "t5"].map((level) => (
            <button
              key={level}
              onClick={() => {
                setActiveLevel(level as "t4" | "t5");
                setExpandedChapter(null);
              }}
              className={`px-5 py-2 rounded-xl font-semibold transition ${
                activeLevel === level
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </motion.div>

        <motion.div className="space-y-4">
          {currentChapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="text-left flex-1">
                  <h3 className="font-bold text-slate-900">{chapter.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{chapter.desc}</p>
                </div>
                <motion.div animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }} transition={{ duration: 0.2 }} className="ml-4 flex-shrink-0">
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {modules.map((module) => {
                        const Icon = module.icon;
                        const adaptive = getAdaptiveMeta(chapter.id, module.id);
                        if (adaptive.hidden) return null;
                        const adaptiveLocked = adaptive.adaptiveLocked;
                        const displayName = adaptive.displayName || module.name;
                        const isLocked = adaptiveLocked || isModuleLocked(chapter.id, module.id);
                        const isCompleted = getModuleStatus(chapter.id, module.id);
                        const key = `${activeLevel}-ch${chapter.id}-mod${module.id}`;

                        return (
                          <motion.div key={module.id} whileHover={{ y: -4 }} className={`rounded-lg p-4 flex items-start gap-4 transition ${isLocked ? 'bg-slate-100 opacity-60' : isCompleted ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-slate-200 hover:border-sky-300'}`}>
                            <div className={`p-2 rounded-lg flex items-center justify-center ${isLocked ? 'bg-slate-300 text-slate-600' : isCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-50 text-sky-600'}`}>
                              {isLocked ? <Lock className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-semibold text-slate-900">{displayName}</h4>
                                  {module.note && <p className="text-xs text-slate-600 mt-1">{module.note}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : null}
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => { if (!isLocked) openModule(chapter.id, module.id); }} disabled={isLocked} className={`text-sm font-semibold px-3 py-1 rounded ${isLocked ? 'text-slate-500' : 'text-sky-700 hover:bg-sky-50'}`}>
                                      {isCompleted ? 'Buka' : isLocked ? 'Terkunci' : 'Buka'}
                                    </button>
                                    <button onClick={() => { if (!isLocked) markModuleComplete(chapter.id, module.id); }} disabled={isLocked} className={`text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 ${isCompleted ? 'line-through' : ''}`}>Tandakan Selesai</button>
                                  </div>
                                </div>
                              </div>

                              {/* Pre-Test mock buttons for module 2 */}
                              {module.id === 2 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button onClick={() => handlePreTestSubmit(30)} className="px-3 py-1 rounded bg-red-50 text-red-700 border border-red-100 text-sm">Skor Rendah (30%)</button>
                                  <button onClick={() => handlePreTestSubmit(60)} className="px-3 py-1 rounded bg-amber-50 text-amber-700 border border-amber-100 text-sm">Skor Sederhana (60%)</button>
                                  <button onClick={() => handlePreTestSubmit(85)} className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-sm">Skor Cemerlang (85%)</button>
                                  {simulasiSkor !== null && <span className="ml-3 text-sm text-slate-600">Skor Terbaru: {simulasiSkor}%</span>}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 md:p-8 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <Medal className="w-6 h-6" />
            <h3 className="text-xl font-bold">Teruskan Pembelajaran!</h3>
          </div>
          <p className="text-amber-50 text-sm md:text-base">Siapkan semua modul untuk mendapatkan lencana penguasaan dan naik ke tahap berikutnya.</p>
        </motion.div>

        {showIframe && iframeUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white w-[90%] md:w-3/4 h-[80%] rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold">Pratonton Modul</h3>
                <div className="flex items-center gap-2">
                  <button onClick={closeIframe} className="px-3 py-1 rounded bg-slate-100">Tutup</button>
                </div>
              </div>
              <div className="w-full h-full">
                <iframe src={iframeUrl} className="w-full h-full" />
              </div>
            </div>
          </div>
        )}

        {/* Quiz Modal */}
        {isQuizOpen && quizQuestions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-white w-[95%] md:w-[85%] lg:w-2/3 max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-sky-500 to-sky-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Pre Test</h2>
                  <button onClick={closeQuiz} className="text-white hover:bg-white/20 p-2 rounded">✕</button>
                </div>
                {!showQuizResult && (
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full" style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
                  </div>
                )}
                {!showQuizResult && <p className="mt-2 text-sm">Soalan {currentQuestionIndex + 1} daripada {quizQuestions.length}</p>}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {!showQuizResult ? (
                  <div>
                    <h3 className="text-xl font-semibold mb-8 text-slate-900">{quizQuestions[currentQuestionIndex]?.soalan}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['pilihanA', 'pilihanB', 'pilihanC', 'pilihanD'].map((pilihan) => {
                        const label = pilihan.replace('pilihan', '');
                        const text = quizQuestions[currentQuestionIndex]?.[pilihan];
                        return (
                          <button
                            key={pilihan}
                            onClick={() => handleAnswerSubmit(label)}
                            className="p-4 rounded-lg border-2 border-slate-300 hover:border-sky-500 hover:bg-sky-50 transition text-left font-medium text-slate-900"
                          >
                            <span className="inline-block w-8 h-8 rounded-full bg-sky-100 text-sky-700 text-center mr-3">{label}</span>
                            {text}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-100">
                        <span className="text-4xl font-bold text-emerald-600">{Math.round((quizScore / quizQuestions.length) * 100)}%</span>
                      </div>
                    </div>
                    <h4 className="text-2xl font-bold text-slate-900 mb-4">
                      {(simulasiSkor ?? 0) >= 70 ? '🎉 Tahniah! Anda Cemerlang & Kuasai Bab Ini!' : (simulasiSkor ?? 0) >= 50 ? '👍 Pencapaian Sederhana. Mari kita gilap lagi!' : '💪 Jangan putus asa! Mari mulakan bimbingan RAG.'}
                    </h4>
                    <p className="text-slate-600 mb-8">Anda mendapat {quizScore} daripada {quizQuestions.length} soalan</p>
                    <button
                      onClick={closeQuiz}
                      className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition"
                    >
                      Tutup & Terus Pembelajaran
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white ${
                toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-sky-500'
              }`}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
