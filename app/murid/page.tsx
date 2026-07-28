"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, Gamepad2, AlertTriangle
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 

type Subtopic = { id: string; title: string; };
type ChapterDef = { id: number; title: string; desc: string; subtopics?: Subtopic[]; };

// 🌟 SENARAI BAB KEKAL SEPERTI ASAL
const chapters: { t4: ChapterDef[]; t5: ChapterDef[] } = {
  t4: [
    { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan", subtopics: [{ id: "1.1", title: "Konsep Alam Melayu" }, { id: "1.2", title: "Ciri Kesultanan Melayu Melaka" }, { id: "1.3", title: "Keunggulan Sistem Pentadbiran" }, { id: "1.4", title: "Peranan Pemerintah & Rakyat" }] },
    { id: 2, title: "Bab 2: Kebangkitan Nasionalisme", desc: "Asas kebangkitan dan semangat kebangsaan", subtopics: [{ id: "2.1", title: "Maksud Nasionalisme" }, { id: "2.2", title: "Perkembangan Idea Nasionalisme" }, { id: "2.3", title: "Nasionalisme di Asia Tenggara" }] },
    { id: 3, title: "Bab 3: Konflik Dunia & Pendudukan Jepun", desc: "Perang Dunia dan pendudukan Jepun di negara kita" },
    { id: 4, title: "Bab 4: Era Peralihan Kuasa British", desc: "Perubahan kuasa British dan kesannya" },
    { id: 5, title: "Bab 5: Persekutuan Tanah Melayu 1948", desc: "Pembentukan PTM 1948" },
    { id: 6, title: "Bab 6: Ancaman Komunis & Darurat", desc: "Perjuangan menentang ancaman komunis" },
    { id: 7, title: "Bab 7: Usaha Ke Arah Kemerdekaan", desc: "Gerakan dan rundingan ke arah merdeka" },
    { id: 8, title: "Bab 8: Pilihan Raya", desc: "Proses pilihan raya awal dan impaknya" },
    { id: 9, title: "Bab 9: PTM 1957", desc: "Peristiwa penting PTM 1957" },
    { id: 10, title: "Bab 10: Permasyuran Kemerdekaan", desc: "Upacara dan simbol permasyuran kemerdekaan" },
  ],
  t5: [
    { id: 1, title: "Bab 1: Kedaulatan Negara", desc: "Konsep dan kepentingan kedaulatan", subtopics: [] },
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

// 🌟 INTERFACE BAHARU UNTUK JEJAK MASTERY LEARNING
interface BabProgress {
  preSkor?: number;
  postSkor?: number;
  jumlahCubaanPost: number;
  aiSelesai: boolean;
  gameSelesai: boolean;
  docIdPre?: string;
}

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  
  const [progressBab, setProgressBab] = useState<Record<number, BabProgress>>({});
  const [aiSelesaiList, setAiSelesaiList] = useState<string[]>([]);
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
        
        // Tarik Skor Pre & Post
        const qSkor = query(collection(db, "skor_murid"), where("idMurid", "==", userPenuh.id), where("tingkatan", "==", tSemasa));
        const snapSkor = await getDocs(qSkor);
        
        // Tarik Data Chat AI
        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", userPenuh.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const chatSelesaiArray = snapChat.docs.map(d => d.data().chapterId);
        setAiSelesaiList(chatSelesaiArray);

        // Tarik Data Game (Dari LocalStorage)
        const gameSelesaiList = JSON.parse(localStorage.getItem("completedGames") || "[]");

        let tempProgress: Record<number, BabProgress> = {};

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
             tempProgress[babNum].postSkor = data.skor;
             tempProgress[babNum].jumlahCubaanPost = data.percubaan || 1; 
          }
        });

        // Semak kelengkapan Bimbingan & Game
        const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
        currentChapters.forEach(ch => {
            if(!tempProgress[ch.id]) tempProgress[ch.id] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
            
            // Logik Subtopik AI
            if (ch.subtopics && ch.subtopics.length > 0) {
              let siapCount = 0;
              ch.subtopics.forEach(sub => {
                if (chatSelesaiArray.includes(`tingkatan${tSemasa}_bab${ch.id}_sub${sub.id}`)) siapCount++;
              });
              tempProgress[ch.id].aiSelesai = (siapCount === ch.subtopics.length);
            } else {
              tempProgress[ch.id].aiSelesai = chatSelesaiArray.some(id => id && id.includes(`bab${ch.id}`));
            }

            tempProgress[ch.id].gameSelesai = gameSelesaiList.includes(`t${tSemasa}-bab${ch.id}`);
        });

        setProgressBab(tempProgress);

      } catch (error) { console.error("Ralat tarik data:", error); } 
      finally { setLoading(false); }
    };
    tarikDataFirebase();
  }, [activeLevel]);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("completedModules"); 
    window.location.href = "/login";
  };

  const getCurrentSubtopic = (chapterId: number, chapterData: any) => {
    if (!chapterData.subtopics || chapterData.subtopics.length === 0) return "sub1.1";
    for (const sub of chapterData.subtopics) {
      const formatBabSub = `tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}_sub${sub.id}`;
      if (!aiSelesaiList.includes(formatBabSub)) return `sub${sub.id}`; 
    }
    return `sub${chapterData.subtopics[chapterData.subtopics.length - 1].id}`;
  };

  const openModule = (chapterId: number, type: string, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    if (type === "pre") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=pre_test`;
    if (type === "ai") window.location.href = `/pembelajaran?bab=tingkatan${t}_bab${chapterId}_${subSemasa}&aras=${aras}`;
    if (type === "game") window.location.href = `/permainan?tingkatan=${t}&bab=Bab ${chapterId}&aras=${aras}`;
    if (type === "post") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=post_test`;
  };

  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
    const pre = prog.preSkor;
    const post = prog.postSkor;
    const attempt = prog.jumlahCubaanPost;
    
    let aras = "rendah"; let targetLulus = 50;
    if (pre !== undefined && pre >= 50 && pre < 80) { aras = "sederhana"; targetLulus = 80; }
    
    const preLulusTerus = pre !== undefined && pre >= 80;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus;
    const limitReached = attempt >= 2 && !postLulus; 

    return {
      aras, pre, post, attempt, targetLulus, isLulus, limitReached,
      aiSelesai: prog.aiSelesai, gameSelesai: prog.gameSelesai, docIdPre: prog.docIdPre
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
        
        {/* HEADER PROFIL */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-8 shadow-lg text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-sky-600 shadow-md border-4 border-sky-100">
                {(userData?.nama || userData?.name) ? (userData.nama || userData.name).charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <p className="text-sky-100 font-medium tracking-wide uppercase text-sm mb-1">Selamat datang kembali,</p>
                <h1 className="text-3xl font-extrabold tracking-tight uppercase">{userData?.nama || userData?.name || "Memuatkan..."}</h1>
                <p className="text-sky-50 flex items-center gap-3 mt-2 font-medium opacity-90">ID Pengguna: <span className="font-bold tracking-wider">{userData?.idPengguna || userData?.id}</span></p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold backdrop-blur-sm border border-white/20 transition-all">
              <LogOut className="w-5 h-5" /> Log Keluar
            </button>
          </div>
        </motion.div>

        {/* ANALISIS BAR PRESTASI */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Status Pembelajaran</h2>
              <p className="text-sm text-slate-500">Kenal pasti tahap dan tugasan semasa anda.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentChapters.map((ch) => {
              const statusUI = getChapterStatusUI(ch.id);
              return (
                <div key={ch.id} className={`p-4 rounded-2xl border ${statusUI.color} flex flex-col gap-3 shadow-sm`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-lg opacity-80">B{ch.id}</span>
                    <span className="text-xl">{statusUI.icon}</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-1 opacity-75">{statusUI.label}</p>
                    <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden"><div className={`h-full ${statusUI.bar} rounded-full`}></div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* PILIHAN TINGKATAN */}
        <div className="mb-6 flex gap-3">
          {(userData?.tingkatan?.toString() === "5" ? ["t4", "t5"] : ["t4"]).map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-8 py-3 rounded-full font-bold transition-all shadow-sm ${activeLevel === level ? "bg-sky-600 text-white shadow-sky-200" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {userData?.kumpulan === "Kawalan" && (
           <div className="mb-6 bg-slate-100 border border-slate-300 p-4 rounded-xl flex gap-3 items-center text-slate-600 shadow-sm">
             <Info className="shrink-0 text-slate-500" />
             <p className="text-sm font-medium">Anda adalah murid kumpulan Konvensional. Sila lengkapkan Ujian Diagnostik dan Ujian Pasca mengikut arahan guru.</p>
           </div>
        )}

        {/* SENARAI BAB & KAD MODUL */}
        <div className="space-y-4">
          {currentChapters.map((chapter: any) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";
            const subSemasa = getCurrentSubtopic(chapter.id, chapter);

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
                      
                      {/* AMARAN GAGAL 2 KALI */}
                      {logic.limitReached && !isKawalan && (
                        <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3 items-start text-red-700 shadow-sm">
                          <AlertTriangle className="w-6 h-6 shrink-0" />
                          <div>
                            <h4 className="font-bold">Lulus Bersyarat</h4>
                            <p className="text-sm mt-1">Anda telah mencuba 2 kali tetapi masih belum melepasi sasaran. Sistem telah merekodkan pencapaian anda. Sila rujuk Guru Sejarah anda untuk bimbingan bersemuka sebelum meneruskan.</p>
                          </div>
                        </div>
                      )}

                      {/* TAHNIAH LULUS */}
                      {logic.isLulus && !isKawalan && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex gap-3 items-start text-emerald-700 shadow-sm">
                          <Trophy className="w-6 h-6 shrink-0" />
                          <div>
                            <h4 className="font-bold">Tahniah! Anda telah Menguasai Bab Ini.</h4>
                            <p className="text-sm mt-1">Anda boleh meneruskan pembelajaran ke bab yang seterusnya.</p>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* 1. KAD UJIAN DIAGNOSTIK */}
                        <div className={`p-5 rounded-2xl border ${logic.pre !== undefined ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex flex-col justify-between gap-4`}>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}><Zap className="w-5 h-5" /></div>
                              <h4 className="font-bold">Ujian Diagnostik</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">Penentuan aras kefahaman awal anda.</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            {logic.pre !== undefined ? (
                                <span className="text-sm font-bold text-emerald-600">Selesai ({logic.pre}%)</span>
                            ) : <div/>}
                            
                            {!logic.pre && (
                              <button onClick={() => openModule(chapter.id, "pre", "", "")} className="px-5 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 w-full">Mula Ujian</button>
                            )}
                            
                            {/* Butang Semakan untuk murid Cemerlang terus (Opsional) */}
                            {logic.pre !== undefined && logic.pre >= 80 && logic.docIdPre && (
                               <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPre}`} className="px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200">🔍 Semak</button>
                            )}
                          </div>
                        </div>

                        {/* 2. KAD BIMBINGAN AI / PERMAINAN */}
                        {!isKawalan && (
                          <div className={`p-5 rounded-2xl border ${
                              logic.pre === undefined ? 'bg-slate-100 border-slate-200 opacity-60' : // Dikunci sebab belum Pre-Test
                              logic.isLulus || logic.limitReached ? 'hidden' : // Disorok kalau dah lulus/give up
                              logic.aiSelesai || logic.gameSelesai ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-amber-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.pre === undefined ? 'bg-slate-200 text-slate-400' : logic.attempt === 1 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {logic.pre === undefined ? <Lock className="w-5 h-5" /> : logic.attempt === 1 ? <Gamepad2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">{logic.attempt === 1 ? "Permainan Interaktif" : `Bimbingan AI (${logic.aras})`}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {logic.pre === undefined ? "Siapkan Ujian Diagnostik dahulu." :
                                 logic.attempt === 1 ? "Ulang kaji seronok secara santai." : "Bimbingan Inkuiri bersama Tutor AI."}
                              </p>
                            </div>
                            
                            <div className="mt-2">
                              {logic.pre !== undefined && (
                                (logic.attempt === 0 && logic.aiSelesai) || (logic.attempt === 1 && logic.gameSelesai) ? (
                                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Selesai</span>
                                ) : (
                                  <button onClick={() => openModule(chapter.id, logic.attempt === 1 ? "game" : "ai", logic.aras, subSemasa)} 
                                          className={`w-full px-5 py-2 text-white text-sm font-bold rounded-xl ${logic.attempt === 1 ? 'bg-purple-600 hover:bg-purple-700' : 'bg-amber-500 hover:bg-amber-600'}`}>
                                    {logic.attempt === 1 ? "Main Sekarang" : "Mula Bimbingan"}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. KAD UJIAN PASCA */}
                        {!isKawalan && (
                          <div className={`p-5 rounded-2xl border ${
                              logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-100 border-slate-200 opacity-60' : 
                              logic.isLulus || logic.limitReached ? 'hidden' : // Disorok kalau dah lulus/give up
                              'bg-white border-blue-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                  {logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? <Lock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">Ujian Pasca {logic.attempt === 1 ? "(Ulangan)" : ""}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {logic.pre === undefined ? "Dikunci." : `Sasaran Lulus: ${logic.targetLulus}%`}
                              </p>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              {logic.post !== undefined && !logic.isLulus ? <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Skor Terakhir: {logic.post}%</span> : <div/>}
                              
                              <button 
                                onClick={() => openModule(chapter.id, "post", "", "")}
                                disabled={logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai))}
                                className={`px-5 py-2 text-sm font-bold rounded-xl transition-all ${
                                  logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai))
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed w-full' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full'
                                }`}
                              >
                                {logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'Terkunci' : 'Mula Ujian'}
                              </button>
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