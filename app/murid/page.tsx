"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, Gamepad2, AlertTriangle, Clock, FileSearch, Award, MessageSquare, Send, X, Loader2, Palette, Brain, Compass, UsersRound, RefreshCw
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
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

interface BabProgress { 
  preSkor?: number; preObjektif?: number; preStruktur?: number; prePenuh?: number; adaRalatSemakanPre?: boolean; docIdPre?: string;
  postSkor?: number; postObjektif?: number; postStruktur?: number; postPenuh?: number; adaRalatSemakanPost?: boolean; docIdPost?: string;
  jumlahCubaanPost: number; aiSelesai: boolean; gameSelesai: boolean; 
}

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [progressBab, setProgressBab] = useState<Record<number, BabProgress>>({});
  const [aiSelesaiList, setAiSelesaiList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackJenis, setFeedbackJenis] = useState("Pujian");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🌟 STATE UNTUK TEMA (GLOBAL)
  const senaraiTheme = [
    { id: 'default', nama: '🌞 Cerah (Asal)', class: 'bg-slate-50' },
    { id: 'gelap', nama: '🌙 Mod Gelap', class: 'bg-slate-900' },
    { id: 'angkasa', nama: '🌌 Angkasa', class: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black' },
    { id: 'senja', nama: '🌅 Senja', class: 'bg-gradient-to-br from-orange-50 to-rose-200' },
  ];
  const [selectedTheme, setSelectedTheme] = useState(senaraiTheme[0].class);

  useEffect(() => {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) setSelectedTheme(savedTheme);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSelectedTheme(newVal);
    localStorage.setItem('userTheme', newVal);
  };

  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) {
      const userLokal = JSON.parse(rawUser);
      if (userLokal.tingkatan?.toString() === "5") {
        setActiveLevel("t5");
      }
    }
  }, []);

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
        
        const tSemasa = activeLevel === "t4" ? "4" : "5";
        const qSkor = query(collection(db, "skor_murid"), where("idMurid", "==", userPenuh.id), where("tingkatan", "==", tSemasa));
        const snapSkor = await getDocs(qSkor);
        const qChat = query(collection(db, "chat_sessions"), where("studentId", "==", userPenuh.id), where("status", "==", "completed"));
        const snapChat = await getDocs(qChat);
        const chatSelesaiArray = snapChat.docs.map(d => d.data().chapterId);
        setAiSelesaiList(chatSelesaiArray);

        let tempProgress: Record<number, BabProgress> = {};
        
        snapSkor.forEach((docSnap) => {
          const data = docSnap.data();
          const babNum = parseInt(data.bab.replace("Bab ", ""));
          if (!tempProgress[babNum]) tempProgress[babNum] = { jumlahCubaanPost: 0, aiSelesai: false, gameSelesai: false };
          
          let adaRalat = false;
          if (data.ulasanAI && data.statusPermarkahanEsei !== "disemak_oleh_guru") {
             for (const key in data.ulasanAI) {
                if (typeof data.ulasanAI[key].komenAI === 'string' && data.ulasanAI[key].komenAI.includes("GAGAL")) { adaRalat = true; break; }
             }
          }

          if (data.jenisUjian === "pre_test" || !data.jenisUjian) { 
             tempProgress[babNum].preSkor = data.skor; tempProgress[babNum].preObjektif = data.skorObjektif;
             tempProgress[babNum].preStruktur = data.markahStruktur; tempProgress[babNum].prePenuh = data.markahPenuhUjian;
             tempProgress[babNum].docIdPre = docSnap.id; tempProgress[babNum].adaRalatSemakanPre = adaRalat;
          } 
          else if (data.jenisUjian === "post_test") { 
             tempProgress[babNum].postSkor = data.skor; tempProgress[babNum].postObjektif = data.skorObjektif;
             tempProgress[babNum].postStruktur = data.markahStruktur; tempProgress[babNum].postPenuh = data.markahPenuhUjian;
             tempProgress[babNum].jumlahCubaanPost = data.percubaan || 1; tempProgress[babNum].adaRalatSemakanPost = adaRalat;
             tempProgress[babNum].docIdPost = docSnap.id;
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

  const hantarMaklumBalas = async () => {
    if (!feedbackMsg.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "maklum_balas_murid"), {
        muridId: userData?.idPengguna || userData?.id || "Tiada ID",
        namaMurid: userData?.nama || userData?.name || "Pelajar",
        tingkatan: userData?.tingkatan || "Tiada Maklumat",
        kelas: userData?.kelas || "Tiada Maklumat",
        jenis: feedbackJenis,
        mesej: feedbackMsg,
        tarikh: new Date().toISOString()
      });
      setFeedbackMsg("");
      setFeedbackJenis("Pujian"); 
      setShowFeedback(false);
      alert("Terima kasih! Maklum balas anda telah dihantar kepada guru.");
    } catch (error) {
      console.error("Gagal hantar maklum balas:", error);
      alert("Ralat sistem. Gagal menghantar maklum balas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mulaUlanganBimbingan = async (chapterId: number, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    const fullSubId = `tingkatan${t}_bab${chapterId}_${subSemasa}`;
    const sessId = `${userData?.idPengguna || userData?.id}_${fullSubId}`;
    
    try {
      const docRef = doc(db, "chat_sessions", sessId);
      const dSnap = await getDoc(docRef);
      if(dSnap.exists()){
         await updateDoc(docRef, { status: "in_progress", currentPhase: 1 });
      }
    } catch(e) { console.log(e); }
    
    window.location.href = `/pembelajaran?bab=${fullSubId}&aras=${aras}`;
  };

  const openModule = (chapterId: number, type: string, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    if (type === "pre") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=pre_test`;
    if (type === "ai") window.location.href = `/pembelajaran?bab=tingkatan${t}_bab${chapterId}_${subSemasa}&aras=${aras}`;
    if (type === "post") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=post_test`;
  };

  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { jumlahCubaanPost: 0, aiSelesai: false };
    const pre = prog.preSkor; const post = prog.postSkor; const attempt = prog.jumlahCubaanPost;
    
    let aras = "rendah"; let targetLulus = 50;
    if (pre !== undefined && pre >= 50 && pre < 70) { aras = "sederhana"; targetLulus = 70; }
    
    const preLulusTerus = pre !== undefined && pre >= 70;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus;
    const limitReached = attempt >= 2 && !postLulus; 

    return { 
        aras, pre, post, attempt, targetLulus, isLulus, limitReached, preLulusTerus,
        aiSelesai: prog.aiSelesai, docIdPre: prog.docIdPre, docIdPost: prog.docIdPost,
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
    if (logic.limitReached) return { label: "Rujukan Guru", color: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700", bar: "w-full bg-fuchsia-500 animate-pulse", icon: "💌" };
    if (logic.attempt === 1) return { label: "Ulang Bimbingan", color: "bg-orange-50 border-orange-200 text-orange-700", bar: "w-2/3 bg-orange-500 animate-pulse", icon: "🔄" };
    return { label: "Bimbingan", color: "bg-amber-50 border-amber-200 text-amber-700", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "⏳" };
  };

  if (loading) return ( <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div></div> );
  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-6 font-sans text-slate-900 relative transition-colors duration-700 ${selectedTheme}`}>
      <div className="mx-auto max-w-6xl">
        
        {/* HEADER TOP (Welcome Banner) */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-linear-to-r from-sky-600 to-indigo-700 p-6 md:p-8 shadow-lg text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
             <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white text-2xl md:text-3xl font-extrabold text-sky-600 shadow-md border-4 border-sky-100 shrink-0">
                {(userData?.nama || userData?.name) ? (userData.nama || userData.name).charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <p className="text-sky-100 text-xs md:text-sm mb-1">Selamat datang kembali,</p>
                <h1 className="text-xl md:text-3xl font-extrabold uppercase line-clamp-2">{userData?.nama || userData?.name}</h1>
                <p className="text-sky-50 flex items-center gap-2 mt-1 md:mt-2 text-xs md:text-sm font-medium opacity-90">
                  ID: <span className="font-bold tracking-wider">{userData?.idPengguna || userData?.id}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white/10 p-1.5 rounded-xl border border-white/20 shadow-sm backdrop-blur-md">
                <Palette size={16} className="text-white ml-2" />
                <select 
                  value={selectedTheme}
                  onChange={handleThemeChange}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer py-1.5 pl-1 pr-2 hover:text-sky-200 transition-colors appearance-none"
                >
                  {senaraiTheme.map(theme => (
                    <option key={theme.id} value={theme.class} className="text-slate-800">{theme.nama}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleLogout} className="px-4 md:px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 flex items-center gap-2 text-sm md:text-base">
                <LogOut className="w-4 h-4 md:w-5 md:h-5"/> <span className="hidden md:inline">Log Keluar</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* 🌟 KAD 3 TUNJANG UTAMA I-RAGS (DITAMBAH DI SINI) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
              <Brain className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Belajar Ikut Keupayaan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sistem disesuaikan dengan rentak anda.</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Compass className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Bimbingan Ikut Keperluan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Bantuan AI tepat pada sasaran.</p>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <UsersRound className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Kejayaan Untuk Semua</h3>
              <p className="text-xs text-slate-500 mt-0.5">Mencapai potensi tanpa ada yang tertinggal.</p>
            </div>
          </div>

        </motion.div>

        {/* ANALISIS PENGUASAAN BAB (TOP BAR) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-md border border-white/40 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analisis Penguasaan Bab</h2>
              <p className="text-sm text-slate-500">Kenal pasti tahap penguasaan anda bagi setiap bab.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentChapters.map((ch) => {
              const statusUI = getChapterStatusUI(ch.id);
              return (
                <div key={ch.id} className={`p-4 rounded-2xl border ${statusUI.color} flex flex-col gap-3 shadow-sm transition-all hover:shadow-md bg-white/50 backdrop-blur-md`}>
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

        <div className="mb-6 flex gap-3">
          {(userData?.tingkatan?.toString() === "5" ? ["t4", "t5"] : ["t4"]).map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-8 py-3 rounded-full font-bold shadow-sm transition-all ${activeLevel === level ? "bg-sky-600 text-white" : "bg-white/90 backdrop-blur-sm text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {userData?.kumpulan === "Kawalan" && (
           <div className="mb-6 bg-slate-100/90 backdrop-blur-sm border border-slate-300 p-4 rounded-xl flex gap-3 items-center text-slate-600 shadow-sm">
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
            
            const ralatMenghalangBimbingan = logic.attempt === 0 ? logic.adaRalatSemakanPre : logic.adaRalatSemakanPost;
            const skorTertinggi = logic.post !== undefined && logic.post > (logic.pre || 0) ? logic.post : logic.pre;
            const preTelahDinilai = logic.pre !== undefined && !logic.adaRalatSemakanPre;

            return (
              <div key={chapter.id} className="bg-white/95 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm overflow-hidden">
                <button onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${statusUI.color}`}>{statusUI.icon}</div>
                    <div className="text-left"><h3 className="font-bold text-lg text-slate-900">{chapter.title}</h3></div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    {skorTertinggi !== undefined && (
                      <span className={`px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${
                        logic.isLulus ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                        ralatMenghalangBimbingan ? 'bg-rose-50 border-rose-200 text-rose-700' :
                        skorTertinggi >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        {ralatMenghalangBimbingan ? 'Semakan Guru' : `Markah: ${skorTertinggi}%`}
                      </span>
                    )}
                    <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                  </div>
                  
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-200/50 bg-slate-50/50 p-6 overflow-hidden">
                      
                      {logic.isLulus && !isKawalan && (
                        <div className="mb-6 bg-emerald-50/80 backdrop-blur-sm p-5 rounded-xl text-emerald-800 shadow-sm border border-emerald-200 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-emerald-600 shrink-0" />
                            <div>
                              <h4 className="font-bold text-lg">Tahniah! Anda telah menguasai bab ini.</h4>
                              <p className="text-sm opacity-90">Prestasi anda sangat cemerlang.</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => window.open(`/sijil?tingkatan=${activeLevel === 't4' ? '4' : '5'}&bab=${chapter.id}&skor=${skorTertinggi}&nama=${encodeURIComponent(userData?.nama || userData?.name || 'Pelajar Cemerlang')}`, '_blank')} 
                            className="shrink-0 bg-linear-to-r from-amber-400 to-yellow-500 text-amber-950 font-bold px-6 py-2.5 rounded-xl shadow-md hover:scale-105 transition-transform flex items-center gap-2"
                          >
                            <Award className="w-5 h-5"/> Buka Sijil Pencapaian
                          </button>
                        </div>
                      )}

                      {/* SURAT RUJUKAN GURU */}
                      {logic.limitReached && !isKawalan && (
                        <div className="col-span-full mb-6 bg-fuchsia-50/90 backdrop-blur-md rounded-2xl border border-fuchsia-200 p-6 md:p-8 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><Award className="w-32 h-32 text-fuchsia-600" /></div>
                          
                          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="bg-white p-4 rounded-full shadow-sm shrink-0">
                               <span className="text-4xl">💌</span>
                            </div>
                            <div className="flex-1">
                               <div className="inline-block bg-fuchsia-200 text-fuchsia-800 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border border-fuchsia-300">
                                 Surat Rujukan Guru
                               </div>
                               <h3 className="text-xl font-bold text-fuchsia-900 mb-2">Usaha Anda Sangat Hebat, {userData?.nama?.split(' ')[0] || "Pelajar"}!</h3>
                               <p className="text-fuchsia-800 text-sm leading-relaxed max-w-3xl mb-4">
                                 Anda telah menunjukkan dedikasi luar biasa dengan mencuba Ujian Diagnostik, melalui Bimbingan AI, dan menjawab Ujian Pasca sebanyak 2 kali. Walaupun belum mencapai sasaran lulus, kegigihan anda adalah satu <strong>kejayaan besar</strong>!
                               </p>
                               <div className="bg-white/60 p-4 rounded-xl border border-fuchsia-100 flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4 max-w-lg">
                                  <div><span className="block text-xs text-fuchsia-600 font-bold uppercase">Skor Diagnostik</span><span className="text-lg font-black text-fuchsia-900">{logic.pre}%</span></div>
                                  <div><span className="block text-xs text-fuchsia-600 font-bold uppercase">Skor Pasca Tertinggi</span><span className="text-lg font-black text-fuchsia-900">{logic.post}%</span></div>
                               </div>
                               <p className="text-fuchsia-800 text-sm font-medium">
                                 Sistem kini menyarankan anda untuk <strong>berjumpa dengan guru mata pelajaran</strong>. Tunjukkan kad laporan ini kepada guru anda untuk mendapatkan bimbingan bersemuka dan "sentuhan magis" mereka. Anda pasti boleh! 💪
                               </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* KAD 1: UJIAN DIAGNOSTIK */}
                        <div className={`p-5 rounded-2xl border ${logic.pre !== undefined ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white/80 border-sky-200 shadow-sm'} flex flex-col justify-between gap-4 backdrop-blur-sm`}>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}><Zap className="w-5 h-5" /></div>
                              <h4 className="font-bold">Ujian Diagnostik</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">Penentuan aras kefahaman awal anda.</p>
                            
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
                                logic.adaRalatSemakanPre ? <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Semakan Guru</span>
                                : <span className="text-sm font-bold text-emerald-600">Selesai ({logic.pre}%)</span>
                            ) : (
                              <button onClick={() => openModule(chapter.id, "pre", "", "")} className="w-full px-5 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700">Mula Ujian</button>
                            )}
                            
                            {logic.pre !== undefined && logic.docIdPre && !logic.adaRalatSemakanPre && (
                               <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPre}`} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1 shadow-sm">
                                 <FileSearch className="w-4 h-4"/> Semak
                               </button>
                            )}
                          </div>
                        </div>

                        {/* KAD 2: BIMBINGAN AI */}
                        {preTelahDinilai && !isKawalan && !logic.preLulusTerus && !logic.limitReached && (
                          <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
                              (logic.attempt === 0 && logic.aiSelesai) ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white/80 border-amber-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${ralatMenghalangBimbingan ? 'bg-rose-100 text-rose-600' : logic.attempt === 1 ? 'bg-orange-100 text-orange-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {ralatMenghalangBimbingan ? <AlertTriangle className="w-5 h-5" /> : logic.attempt === 1 ? <RefreshCw className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">{ralatMenghalangBimbingan ? "Menunggu Semakan" : logic.attempt === 1 ? `Ulangan Bimbingan (${logic.aras})` : `Bimbingan AI (${logic.aras})`}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {ralatMenghalangBimbingan ? "Status tahap penguasaan anda sedang dikemas kini oleh guru." :
                                 logic.attempt === 1 ? "Disyorkan: Sila ulang kaji semula nota, video & AI Tutor sebelum mencuba Ujian Pasca sekali lagi." : "Bimbingan Inkuiri bersama Tutor AI, Nota & Video."}
                              </p>
                            </div>
                            
                            <div className="mt-2">
                              {ralatMenghalangBimbingan ? (
                                  <button disabled className="w-full px-5 py-2 text-rose-400 bg-rose-100/50 text-sm font-bold rounded-xl cursor-not-allowed border border-rose-200">Menunggu Guru...</button>
                              ) :
                              (logic.attempt === 0 && logic.aiSelesai) ? (
                                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Selesai</span>
                              ) : (
                                <button onClick={() => {
                                          if (logic.attempt === 1) mulaUlanganBimbingan(chapter.id, logic.aras, subSemasa);
                                          else openModule(chapter.id, "ai", logic.aras, subSemasa);
                                        }} 
                                        className={`w-full px-5 py-2 text-white text-sm font-bold rounded-xl shadow-sm ${logic.attempt === 1 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                                  {logic.attempt === 1 ? "Mula Ulangan" : "Mula Bimbingan"}
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* KAD 3: UJIAN PASCA */}
                        {preTelahDinilai && !isKawalan && !logic.preLulusTerus && !logic.limitReached && (logic.aiSelesai || logic.attempt === 1) && (
                          <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
                              logic.isLulus ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white/80 border-blue-200 shadow-sm'
                            } flex flex-col justify-between gap-4 animate-in zoom-in duration-300`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.isLulus ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold">Ujian Pasca {logic.attempt === 1 ? "(Cubaan 2)" : ""}</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed mb-3">Sasaran Lulus: {logic.targetLulus}%</p>
                              
                              {logic.post !== undefined && logic.postPenuh !== undefined && (
                                <div className={`p-3 rounded-xl text-xs font-medium border ${logic.adaRalatSemakanPost ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50/60 border-blue-100 text-slate-700'}`}>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Objektif:</span> <span className="font-bold">{logic.postObjektif} markah</span></p>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Struktur/Esei:</span> <span className="font-bold">{logic.adaRalatSemakanPost ? '??' : logic.postStruktur} markah</span></p>
                                  <p className={`flex justify-between font-bold ${logic.adaRalatSemakanPost ? 'text-rose-700' : 'text-blue-700'}`}><span>Jumlah Keseluruhan:</span> <span>{logic.adaRalatSemakanPost ? '??' : (logic.postObjektif! + logic.postStruktur!)} / {logic.postPenuh}</span></p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              {logic.post !== undefined && logic.attempt > 0 && logic.isLulus ? (
                                 <span className={`text-sm font-bold text-emerald-600`}>Selesai ({logic.post}%)</span>
                              ) : logic.adaRalatSemakanPost ? (
                                 <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Semakan Guru</span>
                              ) : (
                                <button 
                                  onClick={() => openModule(chapter.id, "post", "", "")}
                                  className="px-5 py-2 text-sm font-bold rounded-xl transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full"
                                >
                                  Mula Ujian
                                </button>
                              )}

                              {logic.post !== undefined && logic.docIdPost && !logic.adaRalatSemakanPost && (
                                 <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPost}`} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1 shadow-sm ml-2">
                                   <FileSearch className="w-4 h-4"/> Semak
                                 </button>
                              )}
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

      {/* 🌟 BUTANG TERAPUNG FEEDBACK */}
      <button 
        onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center border-2 border-white/20 group"
        title="Beri Maklum Balas"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-14 bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-slate-700 whitespace-nowrap pointer-events-none">
          Suara Pelajar
        </span>
      </button>

      {/* 🌟 MODAL FEEDBACK */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
              
              <div className="bg-slate-800 p-5 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-amber-400"/> Suara Pelajar</h3>
                <button onClick={() => setShowFeedback(false)} className="text-slate-400 hover:text-rose-400 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-6">
                <p className="text-sm text-slate-600 mb-6">Kongsi pandangan, aduan masalah, atau pujian tentang Hub I-RAGs. Cikgu akan membaca dan mengambil maklum!</p>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Kategori</label>
                  <select 
                    value={feedbackJenis} 
                    onChange={(e) => setFeedbackJenis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-700 text-sm focus:border-sky-500 outline-none font-medium"
                  >
                    <option value="Pujian">🌟 Pujian / Berpuas Hati</option>
                    <option value="Cadangan">💡 Cadangan Penambahbaikan</option>
                    <option value="Masalah">⚠️ Masalah Sistem / Ralat</option>
                    <option value="Lain-lain">💬 Lain-lain</option>
                  </select>
                </div>

                <div className="mb-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Mesej Anda</label>
                   <textarea
                     value={feedbackMsg}
                     onChange={(e) => setFeedbackMsg(e.target.value)}
                     placeholder="Contoh: Saya suka main game tadi! Tapi kadang-kadang AI lambat sikit balas..."
                     className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:border-sky-500 outline-none resize-y min-h-30 text-sm text-slate-800"
                   ></textarea>
                </div>

                <button 
                  onClick={hantarMaklumBalas}
                  disabled={isSubmitting || !feedbackMsg.trim()}
                  className={`w-full mt-4 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${isSubmitting || !feedbackMsg.trim() ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-slate-800 hover:bg-slate-700 shadow-md'}`}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isSubmitting ? 'Menghantar...' : 'Hantar Maklum Balas'}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}