"use client";

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

const chapters = {
  t4: [
    { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan" },
    { id: 2, title: "Bab 2: Kebangkitan Nasionalisme", desc: "Asas kebangkitan dan semangat kebangsaan" },
    { id: 3, title: "Bab 3: Konflik Dunia & Jepun", desc: "Perang Dunia dan pendudukan Jepun" },
    { id: 4, title: "Bab 4: Kemerdekaan Malaya", desc: "Perjalanan menuju kemerdekaan" },
    { id: 5, title: "Bab 5: Pembentukan Malaysia", desc: "Ekspansi dan perluasan negara" },
    { id: 6, title: "Bab 6: Politik & Ekonomi Awal", desc: "Dasar-dasar awal kemerdekaan" },
    { id: 7, title: "Bab 7: Perkembangan Sosial", desc: "Aspek sosial negara baru" },
    { id: 8, title: "Bab 8: Krisis & Perubahan", desc: "Peristiwa penting tahun 1960s-1970s" },
    { id: 9, title: "Bab 9: Era Pembangunan", desc: "Pembangunan ekonomi dan infrastruktur" },
    { id: 10, title: "Bab 10: Malaysia Moden", desc: "Perkembangan terkini dan masa depan" },
  ],
  t5: [
    { id: 1, title: "Bab 1: Peradaban Awal Dunia", desc: "Sejarah peradaban manusia purba" },
    { id: 2, title: "Bab 2: Empayar & Kerajaan", desc: "Perkembangan sistem kerajaan" },
    { id: 3, title: "Bab 3: Perdagangan & Pertukaran", desc: "Rute perdagangan dunia kuno" },
    { id: 4, title: "Bab 4: Zaman Pencerahan", desc: "Periode pemikiran dan sains" },
    { id: 5, title: "Bab 5: Revolusi Industri", desc: "Transformasi ekonomi dunia" },
    { id: 6, title: "Bab 6: Imperialisme & Kolonialisme", desc: "Ekspansi kuasa Eropah" },
    { id: 7, title: "Bab 7: Perang Dunia I", desc: "Konflik global pertama" },
    { id: 8, title: "Bab 8: Perang Dunia II & Kesan", desc: "Perang kedua dan dampaknya" },
    { id: 9, title: "Bab 9: Perang Dingin", desc: "Ketegangan antara blok" },
    { id: 10, title: "Bab 10: Dunia Kontemporari", desc: "Sejarah masa kini dan trend global" },
  ]
};

const modules = [
  { id: 1, name: "Bahan Bacaan", icon: BookOpen, color: "sky", note: "" },
  { id: 2, name: "Pre Test", icon: Zap, color: "amber", note: "Skor cemerlang akan melangkau Pengukuhan & Post Test" },
  { id: 3, name: "Modul Pengukuhan", icon: Sparkles, color: "purple", note: "Latihan RAG & Scaffolding AI" },
  { id: 4, name: "Post Test", icon: CheckCircle2, color: "emerald", note: "" },
  { id: 5, name: "Games", icon: Gamepad2, color: "pink", note: "" },
  { id: 6, name: "Status Kuasai", icon: Trophy, color: "amber", note: "" },
];

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);

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

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  const toggleChapter = (chapterId: number) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId);
  };

  const toggleModule = (moduleKey: string) => {
    setCompletedModules((prev) =>
      prev.includes(moduleKey)
        ? prev.filter((m) => m !== moduleKey)
        : [...prev, moduleKey]
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
    // First module is always unlocked, subsequent modules lock based on previous completion
    if (moduleId === 1) return false;
    const prevKey = `${activeLevel}-ch${chapterId}-mod${moduleId - 1}`;
    return !completedModules.includes(prevKey);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    window.location.href = '/';
  };

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
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition"
            >
              <LogOut className="w-5 h-5" />
              Log Keluar
            </button>
          </div>
        </motion.div>

        {/* Level Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 flex gap-3"
        >
          {["t4", "t5"].map((level) => (
            <button
              key={level}
              onClick={() => {
                setActiveLevel(level as "t4" | "t5");
                setExpandedChapter(null);
              }}
              className={`px-6 py-3 rounded-xl font-semibold transition ${
                activeLevel === level
                  ? "bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg"
                  : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </motion.div>

        {/* Chapters List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {currentChapters.map((chapter, index) => (
            <motion.div
              key={chapter.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
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
                <motion.div
                  animate={{ rotate: expandedChapter === chapter.id ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-4 flex-shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                </motion.div>
              </button>

              {/* Modules Accordion */}
              <AnimatePresence>
                {expandedChapter === chapter.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6"
                  >
                    <div className="space-y-3">
                      {modules.map((module, idx) => {
                        const Icon = module.icon;
                        const isLocked = isModuleLocked(chapter.id, module.id);
                        const isCompleted = getModuleStatus(chapter.id, module.id);

                        return (
                          <motion.button
                            key={module.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              if (!isLocked) markModuleComplete(chapter.id, module.id);
                            }}
                            disabled={isLocked}
                            className={`w-full px-4 py-4 rounded-lg flex items-start gap-4 transition ${
                              isLocked
                                ? "bg-slate-100 opacity-50 cursor-not-allowed"
                                : isCompleted
                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200"
                                : "bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50"
                            }`}
                          >
                            <div className={`flex-shrink-0 p-2 rounded-lg ${
                              isLocked
                                ? "bg-slate-300 text-slate-500"
                                : isCompleted
                                ? `bg-emerald-100 text-emerald-600`
                                : `bg-${module.color}-100 text-${module.color}-600`
                            }`}>
                              {isLocked ? (
                                <Lock className="w-5 h-5" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-slate-900">{module.name}</h4>
                                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                              </div>
                              {module.note && <p className="text-xs text-slate-600 mt-1">{module.note}</p>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 md:p-8 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-3">
            <Medal className="w-6 h-6" />
            <h3 className="text-xl font-bold">Teruskan Pembelajaran!</h3>
          </div>
          <p className="text-amber-50 text-sm md:text-base">
            Siapkan semua modul untuk mendapatkan lencana penguasaan dan naik ke tahap berikutnya. Kecilkan modul untuk melihat laluan lengkap anda.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
