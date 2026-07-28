"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, Medal, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, Gamepad2, AlertTriangle
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 
import Link from "next/link"; 

// ... (Bahagian Type & data chapters T4/T5 kekal sama seperti kod asal anda) ...
type Subtopic = { id: string; title: string; };
type ChapterDef = { id: number; title: string; desc: string; subtopics?: Subtopic[]; };

const chapters: { t4: ChapterDef[]; t5: ChapterDef[] } = {
    // Sila salin data chapters t4 dan t5 dari kod asal anda di sini...
    t4: [ { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan", subtopics: [ { id: "1.1", title: "Konsep Alam Melayu" } ] } ], // Dipendekkan untuk contoh
    t5: []
};

interface BabProgress {
  preSkor?: number;
  postSkor?: number;
  jumlahCubaanPost: number; // Berapa kali ambil Post-Test
  aiSelesai: boolean; // Selesai semua subtopik Bimbingan AI?
  gameSelesai: boolean; // Selesai main game? (Untuk pusingan 2)
  docIdPre?: string;
}

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  
  // 🌟 KEMAS KINI: State baharu yang lebih komprehensif untuk jejak progres Mastery Learning
  const [progressBab, setProgressBab] = useState<Record<number, BabProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tarikDataFirebase = async () => {
      const rawUser = localStorage.getItem("currentUser");
      if (!rawUser) { window.location.href = "/login"; return; }
      const userLokal = JSON.parse(rawUser);

      try {
        const docRef = doc(db, "users", userLokal.id);
        const docSnap = await getDoc(docRef);
        const userPenuh = docSnap.exists() ? { ...userLokal, ...docSnap.data() } : userLokal;
        setUserData(userPenuh);
        if (userPenuh.tingkatan?.toString() === "5") setActiveLevel("t5");
        
        const tSemasa = activeLevel === "t4" ? "4" : "5";
        
        // 1. Tarik Data Skor Ujian (Pre dan Post)
        const qSkor = query(collection(db, "skor_murid"), where("idMurid", "==", userPenuh.id), where("tingkatan", "==", tSemasa));
        const snapSkor = await getDocs(qSkor);
        
        // 2. Tarik Data Chat AI Selesai
        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", userPenuh.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const aiSelesaiList = snapChat.docs.map(d => d.data().chapterId);

        // 3. Tarik Rekod Game Selesai (Jika anda guna LocalStorage sementara, atau boleh buat collection 'game_sessions' nanti)
        const gameSelesaiList = JSON.parse(localStorage.getItem("completedGames") || "[]");

        let tempProgress: Record<number, BabProgress> = {};

        // Inisialisasi data
        snapSkor.forEach((docSnap) => {
          const data = docSnap.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          
          if (!tempProgress[babNum]) {
            tempProgress[babNum] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
          }

          if (data.jenisUjian === "pre_test" || !data.jenisUjian) {
             tempProgress[babNum].preSkor = data.skor;
             tempProgress[babNum].docIdPre = docSnap.id;
          } else if (data.jenisUjian === "post_test") {
             // Simpan skor pasca tertinggi atau terkini
             tempProgress[babNum].postSkor = data.skor;
             tempProgress[babNum].jumlahCubaanPost = data.percubaan || 1; // Anda perlu set "percubaan" masa simpan di fail jawab
          }
        });

        // Semak AI Selesai untuk setiap bab
        const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
        currentChapters.forEach(ch => {
            if(!tempProgress[ch.id]) tempProgress[ch.id] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
            
            // Logic mudah: Anggap selesai jika ada 1 sesi selesai untuk bab tersebut (Boleh ubah suai untuk check semua subtopik)
            tempProgress[ch.id].aiSelesai = aiSelesaiList.some(id => id && id.includes(`bab${ch.id}`));
            tempProgress[ch.id].gameSelesai = gameSelesaiList.includes(`t${tSemasa}-bab${ch.id}`);
        });

        setProgressBab(tempProgress);

      } catch (error) { console.error("Ralat tarik data:", error); } 
      finally { setLoading(false); }
    };
    tarikDataFirebase();
  }, [activeLevel]);

  const handleLogout = () => { /* Kekal sama */ };
  const getCurrentSubtopic = (chapterId: number, chapterData: any) => { /* Kekal sama */ return "sub1.1"; };

  // 🌟 KEMAS KINI: Hala tuju Modul ditambah dengan Game
  const openModule = (chapterId: number, type: string, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    if (type === "pre") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=pre_test`;
    if (type === "ai") window.location.href = `/pembelajaran?bab=tingkatan${t}_bab${chapterId}_${subSemasa}&aras=${aras}`;
    if (type === "game") window.location.href = `/permainan?tingkatan=${t}&bab=Bab ${chapterId}&aras=${aras}`; // Fail baharu
    if (type === "post") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=post_test`;
  };

  // 🌟 KEMAS KINI: Core Logic untuk Adaptif & Mastery Learning
  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
    const pre = prog.preSkor;
    const post = prog.postSkor;
    const attempt = prog.jumlahCubaanPost;
    
    // Tentukan Aras
    let aras = "rendah";
    let targetLulus = 50;
    if (pre !== undefined && pre >= 50 && pre < 80) { aras = "sederhana"; targetLulus = 80; }
    
    // Status Kelulusan
    const preLulusTerus = pre !== undefined && pre >= 80;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus;
    const limitReached = attempt >= 2 && !postLulus; // Gagal 2 kali

    return {
      aras, pre, post, attempt, targetLulus, isLulus, limitReached,
      aiSelesai: prog.aiSelesai, gameSelesai: prog.gameSelesai
    };
  };

  const getChapterStatusUI = (chapterId: number) => {
    const logic = getChapterLogic(chapterId);
    if (userData?.kumpulan === "Kawalan") return { label: "Standard", color: "bg-slate-100", bar: "w-1/2 bg-slate-500", icon: "⚪" };

    if (logic.pre === undefined) return { label: "Sedia Mula", color: "bg-slate-100 border-slate-200 text-slate-500", bar: "w-0", icon: "🚀" };
    if (logic.isLulus) return { label: "Dikuasai", color: "bg-emerald-50 border-emerald-200 text-emerald-700", bar: "w-full bg-emerald-500", icon: "🏆" };
    if (logic.limitReached) return { label: "Perlu Bantuan", color: "bg-red-50 border-red-200 text-red-700", bar: "w-full bg-red-500", icon: "🚩" };
    
    if (logic.attempt === 1 && !logic.gameSelesai) return { label: "Main Game", color: "bg-purple-50 border-purple-200 text-purple-700", bar: "w-2/3 bg-purple-500 animate-pulse", icon: "🎮" };
    return { label: "Bimbingan", color: "bg-amber-50 border-amber-200 text-amber-700", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "⏳" };
  };

  if (loading) return ( <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div></div> );

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-6 font-sans text-slate-900">
      <div className="mx-auto max-w-6xl">
        {/* ... (Header Profile dan Analisis Bab Kekal Sama seperti Kod Anda) ... */}
        
        <div className="space-y-4 mt-8">
          {currentChapters.map((chapter: any) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";

            return (
              <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="text-left flex-1 flex items-center gap-4">
                    <div className={`hidden sm:flex w-12 h-12 rounded-xl items-center justify-center font-bold text-lg ${statusUI.color}`}>
                      {statusUI.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{chapter.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {logic.pre !== undefined && (
                      <div className="flex flex-col text-right">
                        <span className="text-xs text-slate-500">Skor Diagnostik</span>
                        <span className="font-bold text-sky-700">{logic.pre}%</span>
                      </div>
                    )}
                    <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-100 bg-slate-50/50 p-6 overflow-hidden">
                      
                      {/* 🚩 MESEJ BANTUAN JIKA GAGAL 2 KALI */}
                      {logic.limitReached && !isKawalan && (
                        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start text-red-700 shadow-sm">
                          <AlertTriangle className="w-6 h-6 shrink-0" />
                          <div>
                            <h4 className="font-bold">Lulus Bersyarat</h4>
                            <p className="text-sm mt-1">Anda telah mencuba 2 kali tetapi masih belum melepasi sasaran. Sistem telah merekodkan pencapaian anda. Sila rujuk Guru Sejarah anda untuk bimbingan bersemuka.</p>
                          </div>
                        </div>
                      )}

                      {/* 🏆 MESEJ LULUS */}
                      {logic.isLulus && !isKawalan && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 items-start text-emerald-700 shadow-sm">
                          <Trophy className="w-6 h-6 shrink-0" />
                          <div>
                            <h4 className="font-bold">Tahniah! Anda telah Menguasai Bab Ini.</h4>
                            <p className="text-sm mt-1">Anda boleh meneruskan pembelajaran ke bab yang seterusnya.</p>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                        
                        {/* KAD 1: UJIAN DIAGNOSTIK */}
                        <div className={`p-5 rounded-2xl border ${logic.pre !== undefined ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex items-start gap-4`}>
                          <div className={`p-3 rounded-xl shrink-0 ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}>
                            <Zap className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold">Ujian Diagnostik (Pre-Test)</h4>
                            <p className="text-xs text-slate-500 mt-1 mb-4">Penentuan aras awal anda.</p>
                            <div className="flex justify-between items-center">
                              {logic.pre !== undefined ? <span className="text-sm font-bold text-emerald-600">Selesai (Skor: {logic.pre}%)</span> : <div/>}
                              {!logic.pre && (
                                <button onClick={() => openModule(chapter.id, "pre", "", "")} className="px-5 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700">Mula Ujian</button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* KAD 2: BIMBINGAN / PERMAINAN (Disembunyikan jika Cemerlang terus atau Kawalan) */}
                        {!isKawalan && logic.pre !== undefined && !logic.isLulus && !logic.limitReached && (
                          <div className={`p-5 rounded-2xl border ${logic.aiSelesai || logic.gameSelesai ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-amber-200 shadow-sm'} flex items-start gap-4`}>
                            <div className={`p-3 rounded-xl shrink-0 ${logic.attempt === 1 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                               {logic.attempt === 1 ? <Gamepad2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold">
                                {logic.attempt === 1 ? "Permainan Interaktif" : `Bimbingan AI (Aras ${logic.aras})`}
                              </h4>
                              <p className="text-xs text-slate-500 mt-1 mb-4">
                                {logic.attempt === 1 
                                  ? "Mari ulang kaji dengan cara yang menyeronokkan!" 
                                  : "Bimbingan Inkuiri bersama Tutor AI."}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                {(logic.attempt === 0 && logic.aiSelesai) || (logic.attempt === 1 && logic.gameSelesai) ? (
                                    <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Selesai</span>
                                ) : (
                                  <button onClick={() => openModule(chapter.id, logic.attempt === 1 ? "game" : "ai", logic.aras, getCurrentSubtopic(chapter.id, chapter))} 
                                          className="px-5 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600">
                                    {logic.attempt === 1 ? "Main Sekarang" : "Mula Sembang"}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* KAD 3: UJIAN PASCA */}
                        {!isKawalan && logic.pre !== undefined && (!logic.isLulus || logic.post !== undefined) && !logic.limitReached && (
                          <div className={`p-5 rounded-2xl border ${
                            ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-100 border-slate-200 opacity-60' : 
                            (logic.post !== undefined && logic.post >= logic.targetLulus ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm')
                          } flex items-start gap-4`}>
                            <div className={`p-3 rounded-xl shrink-0 ${((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                              {((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? <Lock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold">Ujian Pasca {logic.attempt === 1 ? "(Ulangan)" : ""}</h4>
                              <p className="text-xs text-slate-500 mt-1 mb-4">Sasaran Lulus: {logic.targetLulus}%</p>
                              <div className="flex justify-between items-center">
                                {logic.post !== undefined ? <span className="text-sm font-bold text-blue-700">Skor Terakhir: {logic.post}%</span> : <div/>}
                                
                                <button 
                                  onClick={() => openModule(chapter.id, "post", "", "")}
                                  disabled={((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai))}
                                  className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                                    ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai))
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                                  }`}
                                >
                                  Jawab Ujian
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}