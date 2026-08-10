"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, AlertTriangle, Clock, FileSearch, Award, MessageSquare, Send, X, Loader2, Palette, Brain, Compass, UsersRound, Medal, RefreshCw, ClipboardList, ArrowRight, ArrowLeft
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 

type Subtopic = { id: string; title: string; };
type ChapterDef = { id: number; title: string; desc: string; subtopics?: Subtopic[]; };

const chapters: { t4: ChapterDef[]; t5: ChapterDef[] } = {
  t4: [
    { id: 1, title: "Bab 1: Warisan Negara Bangsa", desc: "Mengenal identiti dan nilai kebangsaan", subtopics: [
      { id: "1.1", title: "Warisan Negara Bangsa" }, { id: "1.2", title: "Ciri-ciri Negara Bangsa" }, { id: "1.3", title: "Keunggulan Sistem Pentadbiran" }, { id: "1.4", title: "Peranan Pemerintah dan Rakyat" }
    ]},
    { id: 2, title: "Bab 2: Kebangkitan Nasionalisme", desc: "Asas kebangkitan dan semangat kebangsaan", subtopics: [
      { id: "2.1", title: "Maksud Nasionalisme" }, { id: "2.2", title: "Nasionalisme di Barat" }, { id: "2.3", title: "Nasionalisme di Asia" }, { id: "2.4", title: "Nasionalisme di Asia Tenggara" }, { id: "2.5", title: "Kesedaran Nasionalisme di Negara Kita" }, { id: "2.6", title: "Faktor Kemunculan Gerakan Nasionalisme" }, { id: "2.7", title: "Perkembangan Nasionalisme" }, { id: "2.8", title: "Kesan Perkembangan Nasionalisme" }
    ]},
    { id: 3, title: "Bab 3: Konflik Dunia & Pendudukan Jepun", desc: "Perang Dunia dan pendudukan Jepun di negara kita", subtopics: [
      { id: "3.1", title: "Nasionalisme di Negara Kita Sebelum Perang Dunia" }, { id: "3.2", title: "Latar Belakang Perang Dunia" }, { id: "3.3", title: "Perang Dunia Kedua" }, { id: "3.4", title: "Perang Dunia Kedua di Asia Pasifik" }, { id: "3.5", title: "Faktor Kedatangan Jepun ke Negara Kita" }, { id: "3.6", title: "Dasar Pendudukan Jepun di Negara Kita" }, { id: "3.7", title: "Perjuangan Rakyat Menentang Pendudukan Jepun" }, { id: "3.8", title: "Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun" }, { id: "3.9", title: "Keadaan Negara Kita Selepas Kekalahan Jepun" }
    ]},
    { id: 4, title: "Bab 4: Era Peralihan Kuasa British", desc: "Perubahan kuasa British dan kesannya", subtopics: [
      { id: "4.1", title: "British Military Administration" }, { id: "4.2", title: "Gagasan Malayan Union" }, { id: "4.3", title: "Reaksi Penduduk Tempatan terhadap Malayan Union" }, { id: "4.4", title: "Penyerahan Sarawak kepada Kerajaan British" }, { id: "4.5", title: "Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak" }, { id: "4.6", title: "Penyerahan Sabah kepada Kerajaan British" }, { id: "4.7", title: "Reaksi Penduduk Tempatan terhadap Penyerahan Sabah" }
    ]},
    { id: 5, title: "Bab 5: Persekutuan Tanah Melayu 1948", desc: "Pembentukan PTM 1948", subtopics: [
      { id: "5.1", title: "Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948" }, { id: "5.2", title: "Faktor Penubuhan Persekutuan Tanah Melayu 1948" }, { id: "5.3", title: "Ciri-ciri Persekutuan Tanah Melayu 1948" }, { id: "5.4", title: "Kesan Penubuhan Persekutuan Tanah Melayu 1948" }
    ]},
    { id: 6, title: "Bab 6: Ancaman Komunis & Darurat", desc: "Perjuangan menentang ancaman komunis", subtopics: [
      { id: "6.1", title: "Kemasukan Pengaruh Komunis di Negara Kita" }, { id: "6.2", title: "Ancaman Komunis di Negara Kita" }, { id: "6.3", title: "Usaha Menangani Ancaman Komunis" }, { id: "6.4", title: "Kesan Zaman Darurat terhadap Negara Kita" }
    ]},
    { id: 7, title: "Bab 7: Usaha Ke Arah Kemerdekaan", desc: "Gerakan dan rundingan ke arah merdeka", subtopics: [
      { id: "7.1", title: "Latar Belakang Idea Negara Merdeka" }, { id: "7.2", title: "Jawatankuasa Hubungan Antara Kaum" }, { id: "7.3", title: "Sistem Ahli" }, { id: "7.4", title: "Sistem Pendidikan Kebangsaan" }, { id: "7.5", title: "Penubuhan Parti Politik" }
    ]},
    { id: 8, title: "Bab 8: Pilihan Raya", desc: "Proses pilihan raya awal dan impaknya", subtopics: [
      { id: "8.1", title: "Perkembangan Pilihan Raya di Persekutuan Tanah Melayu" }, { id: "8.2", title: "Proses Pilihan Raya Umum Pertama" }, { id: "8.3", title: "Penubuhan Majlis Perundangan Persekutuan" }, { id: "8.4", title: "Peranan Kabinet Pertama Persekutuan Tanah Melayu" }
    ]},
    { id: 9, title: "Bab 9: PTM 1957", desc: "Peristiwa penting PTM 1957", subtopics: [
      { id: "9.1", title: "Usaha Rundingan Kemerdekaan" }, { id: "9.2", title: "Peranan Suruhanjaya Perlembagaan Persekutuan Tanah Melayu" }, { id: "9.3", title: "Langkah Penggubalan Perlembagaan Persekutuan Tanah Melayu yang Merdeka" }, { id: "9.4", title: "Perjanjian Persekutuan Tanah Melayu" }
    ]},
    { id: 10, title: "Bab 10: Permasyuran Kemerdekaan", desc: "Upacara dan simbol permasyuran kemerdekaan", subtopics: [
      { id: "10.1", title: "Pengertian Kemerdekaan" }, { id: "10.2", title: "Persediaan Menyambut Pemasyhuran Kemerdekaan Negara" }, { id: "10.3", title: "Detik Pemasyhuran Kemerdekaan Negara" }, { id: "10.4", title: "Kesan Kemerdekaan terhadap Negara Kita" }, { id: "10.5", title: "Prinsip Kedaulatan Persekutuan Tanah Melayu" }
    ]}
  ],
  t5: [
    { id: 1, title: "Bab 1: Kedaulatan Negara", desc: "Konsep dan kepentingan kedaulatan", subtopics: [
      { id: "1.1", title: "Konsep Kedaulatan" }, { id: "1.2", title: "Ciri Negara yang Berdaulat" }, { id: "1.3", title: "Kepentingan Mewujudkan Negara Berdaulat" }, { id: "1.4", title: "Langkah Mempertahankan Kedaulatan" }
    ]},
    { id: 2, title: "Bab 2: Perlembagaan Persekutuan", desc: "Rangka perlembagaan dan hak", subtopics: [
      { id: "2.1", title: "Latar Belakang Perlembagaan" }, { id: "2.2", title: "Sejarah Penggubalan Perlembagaan Persekutuan" }, { id: "2.3", title: "Ciri utama Perlembagaan Persekutuan" }, { id: "2.4", title: "Pindaan Perlembagaan Persekutuan 1963 dan 1965" }
    ]},
    { id: 3, title: "Bab 3: Raja berperlembagaan & Demokrasi Berparlimen", desc: "Peranan Raja dan Parlimen", subtopics: [
      { id: "3.1", title: "Latar Belakang Pemerintahan Beraja dan Demokrasi Berparlimen" }, { id: "3.2", title: "Sejarah dan Kedudukan Institusi Majlis Raja-Raja" }, { id: "3.3", title: "Yang di-Pertuan Agong dan Raja dalam Perlembagaan Persekutuan" }, { id: "3.4", title: "Amalan Demokrasi dan Pengasingan Kuasa" }, { id: "3.5", title: "Keunikan amalan Demokrasi Berparlimen di negara kita" }
    ]},
    { id: 4, title: "Bab 4: Sistem Persekutuan", desc: "Susunan dan fungsi kerajaan persekutuan", subtopics: [
      { id: "4.1", title: "Latar Belakang Sistem Persekutuan di Negara Kita" }, { id: "4.2", title: "Kuasa Kerajaan Persekutuan dan Kerajaan Negeri" }, { id: "4.3", title: "Kerjasama Kerajaan Persekutuan dan Kerajaan Negeri" }, { id: "4.4", title: "Faktor yang Mengukuhkan Sistem Persekutuan" }
    ]},
    { id: 5, title: "Bab 5: Pembentukan Malaysia", desc: "Proses dan isu pembentukan Malaysia", subtopics: [
      { id: "5.1", title: "Konsep Gagasan Malaysia" }, { id: "5.2", title: "Perkembangan Idea dan Usaha Pembentukan Malaysia" }, { id: "5.3", title: "Reaksi Tempatan dan Negara Jiran terhadap Pembentukan Malaysia" }, { id: "5.4", title: "Langkah Pembentukan Malaysia" }, { id: "5.5", title: "Perjanjian Julai 1963 dan Peristiwa Pengisytiharan Malaysia" }, { id: "5.6", title: "Konfrontasi dan Usaha Menangani" }
    ]},
    { id: 6, title: "Bab 6: Cabaran Selepas Pembentukaan Malaysia", desc: "Isu sosial dan politik pasca pembentukan", subtopics: [
      { id: "6.1", title: "Cabaran Dalaman Malaysia" }, { id: "6.2", title: "Pemisahan Singapura" }, { id: "6.3", title: "Menangani Ancaman Komunis" }, { id: "6.4", title: "Isu Pembangunan dan Ekonomi" }, { id: "6.5", title: "Tragedi Hubungan Antara Kaum" }
    ]},
    { id: 7, title: "Bab 7: Membina Kesejahteraan Negara", desc: "Dasar dan program membina kesejahteraan", subtopics: [
      { id: "7.1", title: "Perpaduan dan Integrasi Nasional" }, { id: "7.2", title: "Dasar Pendidikan Kebangsaan" }, { id: "7.3", title: "Bahasa Melayu sebagai Bahasa Ilmu dan Bahasa Perpaduan" }, { id: "7.4", title: "Dasar Kebudayaan Kebangsaan" }, { id: "7.5", title: "Sukan sebagai Alat Perpaduan" }, { id: "7.6", title: "Rukun Negara sebagai Tonggak Kesejahteraan Negara" }
    ]},
    { id: 8, title: "Bab 8: Membina Kemakmuran Negara", desc: "Strategi pembangunan ekonomi", subtopics: [
      { id: "8.1", title: "Pembentukan Dasar Ekonomi Baru (DEB)" }, { id: "8.2", title: "Pelaksanaan Dasar Ekonomi Baru (DEB)" }, { id: "8.3", title: "Pembentukan Dasar Pembangunan Nasional (DPN)" }, { id: "8.4", title: "Pelaksanaan Dasar Pembangunan Nasional (DPN)" }, { id: "8.5", title: "Pencapaian Dasar Ekonomi Baru (DEB) dan Dasar Pembangunan Nasional (DPN)" }
    ]},
    { id: 9, title: "Bab 9: Dasar Luar Malaysia", desc: "Pendekatan dan kepentingan dasar luar", subtopics: [
      { id: "9.1", title: "Latar Belakang Dasar Luar" }, { id: "9.2", title: "Asas Penggubalan Dasar Luar" }, { id: "9.3", title: "Malaysia dalam Pertubuhan Bangsa-Bangsa Bersatu (PBB)" }, { id: "9.4", title: "Malaysia dalam Komanwel" }, { id: "9.5", title: "Cabaran Mengukuhkan Dasar Luar" }, { id: "9.6", title: "Malaysia dalam Persatuan Negara-Negara Asia Tenggara (ASEAN)" }, { id: "9.7", title: "Malaysia dalam Pergerakan Negara-Negara Tanpa Pihak (NAM)" }, { id: "9.8", title: "Malaysia dalam Pertubuhan Kerjasama Islam (OIC)" }
    ]},
    { id: 10, title: "Bab 10: Kecemerlangan Malaysia di Persada Dunia", desc: "Peranan Malaysia di pentas antarabangsa", subtopics: [
      { id: "10.1", title: "Malaysia dalam Isu Global Kontemporari" }, { id: "10.2", title: "Peranan Malaysia dalam Hubungan Ekonomi Antarabangsa" }, { id: "10.3", title: "Pelibatan Rakyat dalam Isu Kemanusiaan dan Keamanan" }, { id: "10.4", title: "Usaha Mengekalkan Kelestarian Global" }, { id: "10.5", title: "Wawasan Malaysia Menuju Masa Hadapan" }
    ]}
  ]
};

interface BabProgress { 
  preSkor?: number; preObjektif?: number; preStruktur?: number; prePenuh?: number; adaRalatSemakanPre?: boolean; docIdPre?: string;
  postSkor?: number; postObjektif?: number; postStruktur?: number; postPenuh?: number; adaRalatSemakanPost?: boolean; docIdPost?: string;
  aiSelesai: boolean; 
}

export default function MuridDashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [activeLevel, setActiveLevel] = useState<"t4" | "t5">("t4");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [progressBab, setProgressBab] = useState<Record<number, BabProgress>>({});
  const [aiSelesaiList, setAiSelesaiList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // STATE MAKLUM BALAS
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackJenis, setFeedbackJenis] = useState("Pujian");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE SOAL SELIDIK (FORCE POPUP)
  const [showSurvey, setShowSurvey] = useState(false);
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
  const [currentSurveyCategoryIndex, setCurrentSurveyCategoryIndex] = useState(-1);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);

  // TEMA
  const senaraiTheme = [
    { id: 'default', nama: '🌞 Cerah (Asal)', class: 'bg-slate-50' },
    { id: 'gelap', nama: '🌙 Mod Gelap', class: 'bg-slate-900' },
    { id: 'angkasa', nama: '🌌 Angkasa', class: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black' },
    { id: 'senja', nama: '🌅 Senja', class: 'bg-gradient-to-br from-orange-50 to-rose-200' },
  ];
  const [selectedTheme, setSelectedTheme] = useState(senaraiTheme[0].class);

  // LOAD USER & THEME
  useEffect(() => {
    const savedTheme = localStorage.getItem('userTheme');
    if (savedTheme) setSelectedTheme(savedTheme);
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) {
      const userLokal = JSON.parse(rawUser);
      if (userLokal.tingkatan?.toString() === "5") setActiveLevel("t5");
    }
  }, []);

  const tarikDataFirebase = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const rawUser = localStorage.getItem("currentUser");
    if (!rawUser) { window.location.href = "/login"; return; }
    const userLokal = JSON.parse(rawUser);

    try {
      const docRef = doc(db, "users", userLokal.id);
      const docSnap = await getDoc(docRef);
      const userPenuh = docSnap.exists() ? { ...userLokal, ...docSnap.data() } : userLokal;
      setUserData(userPenuh);
      
      const tSemasa = activeLevel === "t4" ? "4" : "5";
      const targetIds = [userPenuh.id, userPenuh.idPengguna].filter(Boolean);
      const uniqueIds = [...new Set(targetIds)];

      // SEMAK STATUS SOAL SELIDIK AWAL
      const qSurvey = query(collection(db, "soal_selidik_murid"), where("idMurid", "in", uniqueIds), where("jenisSurvey", "==", "pre"));
      const snapSurvey = await getDocs(qSurvey);
      if (!snapSurvey.empty) {
        setHasPreSurvey(true);
        setShowSurvey(false);
      } else {
        setHasPreSurvey(false);
        // Popup survey akan dipacu oleh useEffect selepas loading selesai
      }

      // TARIK SKOR & CHAT
      const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
      const snapSkor = await getDocs(qSkor);
      const qChat = query(collection(db, "chat_sessions"), where("studentId", "in", uniqueIds), where("status", "==", "completed"));
      const snapChat = await getDocs(qChat);
      const chatArray: string[] = [];
      snapChat.forEach(d => chatArray.push(d.data().chapterId));
      setAiSelesaiList(chatArray);

      let tempProgress: Record<number, BabProgress> = {};
      snapSkor.forEach((dDoc) => {
        const data = dDoc.data();
        if (String(data.tingkatan) !== tSemasa) return;
        const babMatch = String(data.bab).match(/\d+/);
        if (!babMatch) return;
        const babNum = parseInt(babMatch[0]);
        if (!tempProgress[babNum]) tempProgress[babNum] = { aiSelesai: false };
        
        if (data.jenisUjian === "pre_test") {
           tempProgress[babNum].preSkor = data.skor;
           tempProgress[babNum].docIdPre = dDoc.id;
        } else if (data.jenisUjian === "post_test") {
           tempProgress[babNum].postSkor = data.skor;
           tempProgress[babNum].docIdPost = dDoc.id;
        }
      });

      const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
      currentChapters.forEach(ch => {
          if(!tempProgress[ch.id]) tempProgress[ch.id] = { aiSelesai: false };
          const siapSub = ch.subtopics?.filter(s => chatArray.includes(`tingkatan${tSemasa}_bab${ch.id}_sub${s.id}`)).length || 0;
          tempProgress[ch.id].aiSelesai = (siapSub === (ch.subtopics?.length || 0));
      });
      setProgressBab(tempProgress);
    } catch (e) { console.error(e); } finally { if (!isSilent) setLoading(false); }
  };

  useEffect(() => { tarikDataFirebase(); }, [activeLevel]);

  // LOGIK POPUP SURVEY WAJIB
  useEffect(() => {
    if (!loading && !hasPreSurvey && userData?.kumpulan === "Eksperimen") {
      tarikSoalanSelidik();
      setShowSurvey(true);
    }
  }, [loading, hasPreSurvey, userData]);

  const tarikSoalanSelidik = async () => {
    setLoadingSurvey(true);
    try {
      const q = query(collection(db, "bank_soalan_selidik"), where("aktif", "==", true), where("fasa", "==", "Pra"));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.susunan || 0) - (b.susunan || 0));
      setSurveyQuestions(data);
    } catch (e) { console.error(e); } finally { setLoadingSurvey(false); }
  };

  const hantarSoalSelidik = async () => {
    if (Object.keys(surveyAnswers).length < surveyQuestions.length) { alert("Sila jawab semua soalan."); return; }
    setIsSubmittingSurvey(true);
    try {
      await addDoc(collection(db, "soal_selidik_murid"), {
        idMurid: userData?.idPengguna || userData?.id,
        namaMurid: userData?.nama || userData?.name,
        jenisSurvey: "pre",
        tarikh: new Date().toISOString(),
        jawapan: surveyAnswers
      });
      setHasPreSurvey(true);
      setShowSurvey(false);
      alert("Terima kasih! Sila gunakan HUB I-RAGs sekarang.");
    } catch (e) { alert("Ralat sistem."); } finally { setIsSubmittingSurvey(false); }
  };

  // LOGIK BAB (LULUS VS RUJUK GURU)
  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { aiSelesai: false };
    const pre = prog.preSkor; const post = prog.postSkor;
    const isLulus = (pre !== undefined && pre >= 70) || (post !== undefined && post >= 50);
    const perluRujukGuru = post !== undefined && post < 50;
    const isCleared = isLulus || (perluRujukGuru && userData?.babCleared?.[chapterId]);
    
    let lencana = "";
    if (isLulus) lencana = Math.max(pre || 0, post || 0) >= 70 ? "🥇 Emas" : "🥈 Perak";
    else if (perluRujukGuru) lencana = "🥉 Rujuk Guru";

    return { isLulus, perluRujukGuru, isCleared, lencana, pre, post, aiSelesai: prog.aiSelesai };
  };

  const getStatusUI = (chapterId: number) => {
    const logic = getChapterLogic(chapterId);
    if (logic.pre === undefined) return { label: "Sedia", color: "bg-slate-100", icon: "🚀" };
    if (logic.isLulus) return { label: "Kuasai", color: "bg-emerald-50 text-emerald-700", icon: "🏆" };
    if (logic.perluRujukGuru) return { label: "Rujukan", color: "bg-fuchsia-50 text-fuchsia-700", icon: "💌" };
    return { label: "Bimbingan", color: "bg-amber-50 text-amber-700", icon: "🤖" };
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className={`min-h-screen px-4 py-8 transition-all duration-500 ${selectedTheme}`}>
      <div className="mx-auto max-w-5xl">
        
        {/* HEADER */}
        <div className="bg-sky-600 rounded-3xl p-6 text-white mb-8 shadow-xl flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black uppercase">{userData?.nama || "Murid"}</h1>
            <p className="text-sky-100 text-sm">Selamat datang ke HUB I-RAGs</p>
          </div>
          <button onClick={() => { localStorage.removeItem("currentUser"); window.location.href="/login"; }} className="bg-rose-500 p-3 rounded-xl hover:bg-rose-600"><LogOut size={20}/></button>
        </div>

        {/* SENARAI BAB */}
        <div className="space-y-4">
          {currentChapters.map((ch, idx) => {
            const logic = getChapterLogic(ch.id);
            const ui = getStatusUI(ch.id);
            let isLocked = idx > 0 && !getChapterLogic(currentChapters[idx-1].id).isCleared;

            return (
              <div key={ch.id} className={`rounded-2xl border overflow-hidden ${isLocked ? 'opacity-50 grayscale' : 'bg-white shadow-sm'}`}>
                <button onClick={() => !isLocked && setExpandedChapter(expandedChapter === ch.id ? null : ch.id)} className="w-full p-5 flex justify-between items-center">
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${ui.color}`}>{isLocked ? <Lock/> : ui.icon}</div>
                    <div>
                        <h3 className="font-bold text-slate-800">{ch.title}</h3>
                        {!isLocked && logic.lencana && <span className="text-[10px] font-bold uppercase">{logic.lencana}</span>}
                    </div>
                  </div>
                  {!isLocked && <ChevronDown className={expandedChapter === ch.id ? "rotate-180" : ""} />}
                </button>

                <AnimatePresence>
                  {expandedChapter === ch.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="p-6 bg-slate-50 border-t grid gap-4 md:grid-cols-3">
                      
                      {/* CAWANGAN LULUS */}
                      {logic.isLulus && (
                        <div className="col-span-full bg-emerald-100 p-4 rounded-xl flex justify-between items-center border border-emerald-200">
                          <p className="font-bold text-emerald-800">Syabas! Anda lulus bab ini.</p>
                          <button onClick={() => window.open(`/sijil?bab=${ch.id}&nama=${userData.nama}`, '_blank')} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Award size={14}/> Sijil</button>
                        </div>
                      )}

                      {/* CAWANGAN GAGAL (RUJUK GURU) */}
                      {logic.perluRujukGuru && (
                        <div className="col-span-full bg-fuchsia-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                          <UsersRound className="absolute -right-4 -top-4 w-32 h-32 opacity-10" />
                          <h3 className="text-xl font-black flex items-center gap-2"><AlertTriangle/> Rujukan Guru Diperlukan</h3>
                          <p className="text-sm mt-2 opacity-90 leading-relaxed">Sila tunjukkan paparan ini kepada guru untuk sesi bimbingan bersemuka. Bab seterusnya akan dibuka setelah guru memberikan pengesahan.</p>
                          <div className="mt-4 flex gap-4">
                             <div className="bg-white/20 px-3 py-1 rounded-lg text-xs font-bold">Skor: {logic.post}%</div>
                             <button onClick={() => alert("Guru telah dimaklumkan.")} className="bg-white text-fuchsia-700 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"><Send size={14}/> Ping Cikgu</button>
                          </div>
                        </div>
                      )}

                      {!logic.perluRujukGuru && (
                        <>
                          {/* PRE-TEST */}
                          <div className="bg-white p-4 rounded-xl border border-sky-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Langkah 1</h4>
                            {logic.pre !== undefined ? <span className="text-emerald-600 font-bold">Siap ({logic.pre}%)</span> : 
                            <button onClick={() => window.location.href=`/jawab?bab=Bab ${ch.id}&jenisUjian=pre_test`} className="w-full py-2 bg-sky-600 text-white rounded-lg text-xs font-bold">Ujian Diagnostik</button>}
                          </div>

                          {/* BIMBINGAN AI */}
                          {logic.pre !== undefined && logic.pre < 70 && (
                            <div className="bg-white p-4 rounded-xl border border-amber-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Langkah 2</h4>
                              {logic.aiSelesai ? <span className="text-emerald-600 font-bold">Bimbingan Selesai</span> :
                              <button onClick={() => window.location.href=`/pembelajaran?bab=bab${ch.id}&aras=${logic.aras}`} className="w-full py-2 bg-amber-500 text-white rounded-lg text-xs font-bold">Bimbingan AI</button>}
                            </div>
                          )}

                          {/* POST-TEST */}
                          {logic.pre !== undefined && logic.pre < 70 && (logic.aiSelesai || userData?.kumpulan === "Kawalan") && (
                            <div className="bg-white p-4 rounded-xl border border-blue-100">
                              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Langkah 3</h4>
                              {logic.post !== undefined ? <span className="text-emerald-600 font-bold">Post-Test Siap ({logic.post}%)</span> :
                              <button onClick={() => window.location.href=`/jawab?bab=Bab ${ch.id}&jenisUjian=post_test`} className="w-full py-2 bg-blue-600 text-white rounded-lg text-xs font-bold">Ujian Pasca</button>}
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* POPUP SURVEY WAJIB */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-purple-600 p-6 text-white">
                <h2 className="text-xl font-black flex items-center gap-2"><ClipboardList/> Soal Selidik Awal</h2>
                <p className="text-purple-100 text-xs mt-1">Sila lengkapkan ini sebelum menggunakan HUB I-RAGs.</p>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {surveyQuestions.map((q, idx) => (
                  <div key={q.id} className="mb-6 border-b pb-4">
                    <p className="text-sm font-bold text-slate-700 mb-3">{idx+1}. {q.soalan}</p>
                    <div className="grid grid-cols-5 gap-2">
                      {[1,2,3,4,5].map(v => (
                        <button key={v} onClick={() => setSurveyAnswers({...surveyAnswers, [q.id]: v})} className={`py-2 rounded-lg text-xs font-bold border transition-all ${surveyAnswers[q.id] === v ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{v}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-slate-50">
                <button onClick={hantarSoalSelidik} disabled={isSubmittingSurvey} className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 shadow-lg flex items-center justify-center gap-2">
                  {isSubmittingSurvey ? <Loader2 className="animate-spin" /> : <><Send size={18}/> Hantar Maklum Balas</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEEDBACK BUTTON */}
      <button onClick={() => setShowFeedback(true)} className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:scale-110 z-50 transition-all"><MessageSquare/></button>

    </div>
  );
}