"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, Gamepad2, AlertTriangle, Clock
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 

type Subtopic = { id: string; title: string; };
type ChapterDef = { id: number; title: string; desc: string; subtopics?: Subtopic[]; };

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

// 🌟 INTERFACE DIKEMAS KINI UNTUK MARKAH PECAHAN & RALAT
interface BabProgress { 
  preSkor?: number; 
  preObjektif?: number;
  preStruktur?: number;
  prePenuh?: number;
  adaRalatSemakanPre?: boolean;
  postSkor?: number; 
  postObjektif?: number;
  postStruktur?: number;
  postPenuh?: number;
  adaRalatSemakanPost?: boolean;
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
        const qSkor = query(collection(db, "skor_murid"), where("idMurid", "==", userPenuh.id), where("tingkatan", "==", tSemasa));
        const snapSkor = await getDocs(qSkor);
        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", userPenuh.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const chatSelesaiArray = snapChat.docs.map(d => d.data().chapterId);
        setAiSelesaiList(chatSelesaiArray);
        const gameSelesaiList = JSON.parse(localStorage.getItem("completedGames") || "[]");

        let tempProgress: Record<number, BabProgress> = {};
        
        snapSkor.forEach((docSnap) => {
          const data = docSnap.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          if (!tempProgress[babNum]) tempProgress[babNum] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
          
          // 🌟 LOGIK KESAN RALAT AI (GAGAL SEMAK)
          let adaRalat = false;
          if (data.ulasanAI && data.statusPermarkahanEsei !== "disemak_oleh_guru") {
             for (const key in data.ulasanAI) {
                if (typeof data.ulasanAI[key].komenAI === 'string' && data.ulasanAI[key].komenAI.includes("GAGAL")) {
                   adaRalat = true;
                   break;
                }
             }
          }

          if (data.jenisUjian === "pre_test" || !data.jenisUjian) { 
             tempProgress[babNum].preSkor = data.skor; 
             tempProgress[babNum].preObjektif = data.skorObjektif;
             tempProgress[babNum].preStruktur = data.markahStruktur;
             tempProgress[babNum].prePenuh = data.markahPenuhUjian;
             tempProgress[babNum].docIdPre = docSnap.id; 
             tempProgress[babNum].adaRalatSemakanPre = adaRalat;
          } 
          else if (data.jenisUjian === "post_test") { 
             tempProgress[babNum].postSkor = data.skor; 
             tempProgress[babNum].postObjektif = data.skorObjektif;
             tempProgress[babNum].postStruktur = data.markahStruktur;
             tempProgress[babNum].postPenuh = data.markahPenuhUjian;
             tempProgress[babNum].jumlahCubaanPost = data.percubaan || 1; 
             tempProgress[babNum].adaRalatSemakanPost = adaRalat;
          }
        });

        const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
        currentChapters.forEach(ch => {
            if(!tempProgress[ch.id]) tempProgress[ch.id] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
            if (ch.subtopics && ch.subtopics.length > 0) {
              let siapCount = 0;
              ch.subtopics.forEach(sub => { if (chatSelesaiArray.includes(`tingkatan${tSemasa}_bab${ch.id}_sub${sub.id}`)) siapCount++; });
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

  const handleLogout = () => { localStorage.removeItem("currentUser"); localStorage.removeItem("completedModules"); window.location.href = "/login"; };
  
  const getCurrentSubtopic = (chapterId: number, chapterData: any) => {
    if (!chapterData.subtopics || chapterData.subtopics.length === 0) return "sub1.1";
    for (const sub of chapterData.subtopics) {
      if (!aiSelesaiList.includes(`tingkatan${activeLevel === "t4" ? "4" : "5"}_bab${chapterId}_sub${sub.id}`)) return `sub${sub.id}`; 
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
    const pre = prog.preSkor; const post = prog.postSkor; const attempt = prog.jumlahCubaanPost;
    
    let aras = "rendah"; let targetLulus = 50;
    if (pre !== undefined && pre >= 50 && pre < 70) { aras = "sederhana"; targetLulus = 70; }
    
    const preLulusTerus = pre !== undefined && pre >= 70;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus;
    const limitReached = attempt >= 2 && !postLulus; 

    return { 
        aras, pre, post, attempt, targetLulus, isLulus, limitReached, 
        aiSelesai: prog.aiSelesai, gameSelesai: prog.gameSelesai, docIdPre: prog.docIdPre,
        preObjektif: prog.preObjektif, preStruktur: prog.preStruktur, prePenuh: prog.prePenuh, adaRalatSemakanPre: prog.adaRalatSemakanPre,
        postObjektif: prog.postObjektif, postStruktur: prog.postStruktur, postPenuh: prog.postPenuh, adaRalatSemakanPost: prog.adaRalatSemakanPost
    };
  };

  const getChapterStatusUI = (chapterId: number) => {
    const logic = getChapterLogic(chapterId);
    if (userData?.kumpulan === "Kawalan") return { label: "Standard", color: "bg-slate-100", bar: "w-1/2 bg-slate-500", icon: "⚪" };
    if (logic.pre === undefined) return { label: "Sedia Mula", color: "bg-slate-100 border-slate-200 text-slate-500", bar: "w-0", icon: "🚀" };
    if (logic.adaRalatSemakanPre || logic.adaRalatSemakanPost) return { label: "Semakan Guru", color: "bg-rose-50 border-rose-200 text-rose-700", bar: "w-1/4 bg-rose-500 animate-pulse", icon: "⏳" };
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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-8 shadow-lg text-white mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
             <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl font-extrabold text-sky-600 shadow-md border-4 border-sky-100">
                {(userData?.nama || userData?.name) ? (userData.nama || userData.name).charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <p className="text-sky-100 text-sm mb-1">Selamat datang kembali,</p>
                <h1 className="text-3xl font-extrabold uppercase">{userData?.nama || userData?.name}</h1>
              </div>
            </div>
            <button onClick={handleLogout} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 flex gap-2"><LogOut className="w-5 h-5"/> Log Keluar</button>
          </div>
        </motion.div>

        <div className="mb-6 flex gap-3">
          {(userData?.tingkatan?.toString() === "5" ? ["t4", "t5"] : ["t4"]).map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-8 py-3 rounded-full font-bold shadow-sm ${activeLevel === level ? "bg-sky-600 text-white" : "bg-white text-slate-600"}`}>
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

        <div className="space-y-4">
          {currentChapters.map((chapter: any) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";
            const subSemasa = getCurrentSubtopic(chapter.id, chapter);
            
            // Tentukan adakah ralat menghalang Bimbingan AI
            const ralatMenghalangBimbingan = logic.attempt === 0 ? logic.adaRalatSemakanPre : logic.adaRalatSemakanPost;

            return (
              <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${statusUI.color}`}>{statusUI.icon}</div>
                    <div className="text-left"><h3 className="font-bold text-lg">{chapter.title}</h3></div>
                  </div>
                  <div className="flex items-center gap-4">
                    {logic.pre !== undefined && <div className="text-right"><span className="text-xs text-slate-500">Skor Diagnostik</span><p className="font-bold text-sky-700">{logic.pre}%</p></div>}
                    <ChevronDown className={`w-6 h-6 text-slate-400 ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t bg-slate-50/50 p-6 overflow-hidden">
                      {logic.limitReached && !isKawalan && <div className="mb-6 bg-red-50 p-4 rounded-xl text-red-700">Lulus Bersyarat: Anda telah cuba 2 kali. Sila rujuk Guru.</div>}
                      {logic.isLulus && !isKawalan && <div className="mb-6 bg-emerald-50 p-4 rounded-xl text-emerald-700">Tahniah! Anda menguasai bab ini.</div>}

                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* KAD 1: UJIAN DIAGNOSTIK */}
                        <div className={`p-5 rounded-2xl border ${logic.pre !== undefined ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-sky-200 shadow-sm'} flex flex-col justify-between gap-4`}>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}><Zap className="w-5 h-5" /></div>
                              <h4 className="font-bold">Ujian Diagnostik</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">Penentuan aras kefahaman awal anda.</p>
                            
                            {/* 🌟 PAPARAN MARKAH PECAHAN */}
                            {logic.pre !== undefined && logic.prePenuh !== undefined && (
                              <div className={`p-3 rounded-xl text-xs font-medium border ${logic.adaRalatSemakanPre ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white/60 border-emerald-100 text-slate-700'}`}>
                                <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Objektif:</span> <span className="font-bold">{logic.preObjektif} markah</span></p>
                                <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Struktur/Esei:</span> <span className="font-bold">{logic.adaRalatSemakanPre ? '??' : logic.preStruktur} markah</span></p>
                                <p className={`flex justify-between font-bold ${logic.adaRalatSemakanPre ? 'text-rose-700' : 'text-emerald-700'}`}><span>Jumlah Keseluruhan:</span> <span>{logic.adaRalatSemakanPre ? '??' : (logic.preObjektif! + logic.preStruktur!)} / {logic.prePenuh}</span></p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            {logic.pre !== undefined ? (
                                logic.adaRalatSemakanPre ? <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Dalam Semakan Guru</span>
                                : <span className="text-sm font-bold text-emerald-600">Selesai ({logic.pre}%)</span>
                            ) : (
                              <button onClick={() => openModule(chapter.id, "pre", "", "")} className="w-full px-5 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700">Mula Ujian</button>
                            )}
                          </div>
                        </div>

                        {/* KAD 2: BIMBINGAN AI / PERMAINAN */}
                        {!isKawalan && (
                          <div className={`p-5 rounded-2xl border ${
                              logic.pre === undefined ? 'bg-slate-100 border-slate-200 opacity-60' : 
                              logic.isLulus || logic.limitReached ? 'hidden' : 
                              logic.aiSelesai || logic.gameSelesai ? 'bg-emerald-50 border-emerald-200' : 
                              ralatMenghalangBimbingan ? 'bg-rose-50 border-rose-200' : 'bg-white border-amber-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.pre === undefined ? 'bg-slate-200 text-slate-400' : ralatMenghalangBimbingan ? 'bg-rose-100 text-rose-600' : logic.attempt === 1 ? 'bg-purple-100 text-purple-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {logic.pre === undefined ? <Lock className="w-5 h-5" /> : ralatMenghalangBimbingan ? <AlertTriangle className="w-5 h-5" /> : logic.attempt === 1 ? <Gamepad2 className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">{ralatMenghalangBimbingan ? "Menunggu Semakan" : logic.attempt === 1 ? "Permainan Interaktif" : `Bimbingan AI (${logic.aras})`}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {logic.pre === undefined ? "Siapkan Ujian Diagnostik dahulu." :
                                 ralatMenghalangBimbingan ? "Sila check sebentar lagi. Status tahap penguasaan anda pada bab ini sedang dikemas kini oleh guru (Ralat AI)." :
                                 logic.attempt === 1 ? "Ulang kaji seronok secara santai." : "Bimbingan Inkuiri bersama Tutor AI."}
                              </p>
                            </div>
                            
                            <div className="mt-2">
                              {logic.pre !== undefined && (
                                ralatMenghalangBimbingan ? (
                                    <button disabled className="w-full px-5 py-2 text-rose-400 bg-rose-100/50 text-sm font-bold rounded-xl cursor-not-allowed border border-rose-200">Menunggu Guru...</button>
                                ) :
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

                        {/* KAD 3: UJIAN PASCA */}
                        {!isKawalan && (
                          <div className={`p-5 rounded-2xl border ${
                              logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-100 border-slate-200 opacity-60' : 
                              logic.isLulus || logic.limitReached ? 'hidden' : 
                              'bg-white border-blue-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? 'bg-slate-200 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                  {logic.pre === undefined || ((logic.attempt === 0 && !logic.aiSelesai) || (logic.attempt === 1 && !logic.gameSelesai)) ? <Lock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">Ujian Pasca {logic.attempt === 1 ? "(Ulangan)" : ""}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed mb-3">Sasaran Lulus: {logic.targetLulus}%</p>
                              
                              {/* 🌟 PAPARAN MARKAH PECAHAN (POST TEST) */}
                              {logic.post !== undefined && logic.postPenuh !== undefined && (
                                <div className={`p-3 rounded-xl text-xs font-medium border ${logic.adaRalatSemakanPost ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50/60 border-blue-100 text-slate-700'}`}>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Objektif:</span> <span className="font-bold">{logic.postObjektif} markah</span></p>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Struktur/Esei:</span> <span className="font-bold">{logic.adaRalatSemakanPost ? '??' : logic.postStruktur} markah</span></p>
                                  <p className={`flex justify-between font-bold ${logic.adaRalatSemakanPost ? 'text-rose-700' : 'text-blue-700'}`}><span>Jumlah Keseluruhan:</span> <span>{logic.adaRalatSemakanPost ? '??' : (logic.postObjektif! + logic.postStruktur!)} / {logic.postPenuh}</span></p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              {logic.post !== undefined && !logic.isLulus && !logic.adaRalatSemakanPost && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Skor Terakhir: {logic.post}%</span>}
                              
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