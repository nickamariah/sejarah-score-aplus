"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, AlertTriangle, Clock, FileSearch, Award, MessageSquare, Send, X, Loader2, Palette, Brain, Compass, UsersRound, Rocket, Medal, RefreshCw, ClipboardList, ArrowRight, ArrowLeft
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase"; 

type Subtopic = { id: string; title: string; };
type ChapterDef = { id: number; title: string; desc: string; subtopics?: Subtopic[]; };

// --- DATA BAB (KEKAL 100% SEPERTI ASAL ANDA) ---
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
  aiSelesai: boolean; gameSelesai: boolean; 
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

  // 🌟 STATE SOAL SELIDIK (FORCE POPUP)
  const [showSurvey, setShowSurvey] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [currentSurveyCategoryIndex, setCurrentSurveyCategoryIndex] = useState(-1);
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [initialPopupChecked, setInitialPopupChecked] = useState(false);

  // --- LOGIK TEMA (KEKAL POWER) ---
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

  // --- FUNGSI TARIK DATA (GABUNGAN SEMUA LOGIK) ---
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

      // SEMAK STATUS SURVEY
      const qSurvey = query(collection(db, "soal_selidik_murid"), where("idMurid", "in", uniqueIds), where("jenisSurvey", "==", "pre"));
      const snapSurvey = await getDocs(qSurvey);
      setHasPreSurvey(!snapSurvey.empty);

      // TARIK SKOR
      const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
      const snapSkor = await getDocs(qSkor);
      
      // TARIK CHAT SESSION
      const qChat = query(collection(db, "chat_sessions"), where("studentId", "in", uniqueIds), where("status", "==", "completed"));
      const snapChat = await getDocs(qChat);
      const chatArray: string[] = [];
      snapChat.forEach(d => chatArray.push(d.data().chapterId));
      setAiSelesaiList(chatArray);

      let tempProgress: Record<number, BabProgress> = {};
      snapSkor.forEach((docSnap) => {
        const data = docSnap.data();
        if (String(data.tingkatan) !== tSemasa) return;
        const babMatch = String(data.bab).match(/\d+/);
        if (!babMatch) return;
        const babNum = parseInt(babMatch[0]);
        if (!tempProgress[babNum]) tempProgress[babNum] = { aiSelesai: false, gameSelesai: false };
        
        let adaRalat = false;
        if (data.ulasanAI && data.statusPermarkahanEsei !== "disemak_oleh_guru") {
           for (const key in data.ulasanAI) {
              if (typeof data.ulasanAI[key].komenAI === 'string' && data.ulasanAI[key].komenAI.includes("GAGAL")) { adaRalat = true; break; }
           }
        }

        if (data.jenisUjian === "pre_test" || !data.jenisUjian) { 
           tempProgress[babNum].preSkor = data.skor; 
           tempProgress[babNum].preObjektif = data.skorObjektif;
           tempProgress[babNum].docIdPre = docSnap.id;
           tempProgress[babNum].adaRalatSemakanPre = adaRalat;
        } 
        else if (data.jenisUjian === "post_test") { 
           tempProgress[babNum].postSkor = data.skor; 
           tempProgress[babNum].postObjektif = data.skorObjektif;
           tempProgress[babNum].adaRalatSemakanPost = adaRalat;
           tempProgress[babNum].docIdPost = docSnap.id;
        }
      });

      const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
      currentChapters.forEach(ch => {
          if(!tempProgress[ch.id]) tempProgress[ch.id] = { aiSelesai: false, gameSelesai: false };
          const siapSub = ch.subtopics?.filter(s => chatArray.includes(`tingkatan${tSemasa}_bab${ch.id}_sub${s.id}`)).length || 0;
          tempProgress[ch.id].aiSelesai = (siapSub === (ch.subtopics?.length || 0));
      });
      setProgressBab(tempProgress);
    } catch (e) { console.error("Firebase Error:", e); } 
    finally { if (!isSilent) setLoading(false); }
  };

  useEffect(() => { tarikDataFirebase(); }, [activeLevel]);

  // 🌟 LOGIK POPUP SURVEY WAJIB
  useEffect(() => {
    if (!loading && !hasPreSurvey && userData?.kumpulan === "Eksperimen" && !initialPopupChecked) {
      tarikSoalanSelidik();
      setShowSurvey(true);
      setInitialPopupChecked(true);
    }
  }, [loading, hasPreSurvey, userData, initialPopupChecked]);

  const tarikSoalanSelidik = async () => {
    setLoadingSurvey(true);
    try {
      const q = query(collection(db, "bank_soalan_selidik"), where("aktif", "==", true), where("fasa", "==", "Pra"));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.susunan || 0) - (b.susunan || 0));
      setSurveyQuestions(data);
      setCurrentSurveyCategoryIndex(-1);
    } catch (error) { console.error("Survey Error:", error); } finally { setLoadingSurvey(false); }
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
      alert("Terima kasih! Sila teruskan.");
    } catch (e) { alert("Ralat hantar."); } finally { setIsSubmittingSurvey(false); }
  };

  // --- LOGIK MAKLUM BALAS (YANG HILANG TADI) ---
  const hantarMaklumBalas = async () => {
    if (!feedbackMsg.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "maklum_balas_murid"), {
        muridId: userData?.idPengguna || userData?.id,
        namaMurid: userData?.nama || userData?.name,
        tingkatan: userData?.tingkatan || "Tiada",
        jenis: feedbackJenis,
        mesej: feedbackMsg,
        tarikh: new Date().toISOString()
      });
      setFeedbackMsg("");
      setShowFeedback(false);
      alert("Maklum balas dihantar!");
    } catch (error) { alert("Gagal hantar maklum balas."); } finally { setIsSubmitting(false); }
  };

  const handleLogout = () => { localStorage.removeItem("currentUser"); window.location.href = "/login"; };
  
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
    if (type === "post") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=post_test`;
  };

  // 🌟 LOGIK BAB: LULUS VS RUJUK GURU
  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { aiSelesai: false };
    const pre = prog.preSkor; const post = prog.postSkor;
    
    let aras = "rendah"; let targetLulus = 50;
    if (pre !== undefined) {
      if (pre >= 70) { aras = "tinggi"; targetLulus = 70; }
      else if (pre >= 50) { aras = "sederhana"; targetLulus = 70; }
    }
    
    const preLulusTerus = pre !== undefined && pre >= 70;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus; 
    
    const perluRujukGuru = post !== undefined && !isLulus;
    const isClearedForNext = isLulus || (perluRujukGuru && userData?.babCleared?.[chapterId]);

    const skorTertinggi = Math.max(pre || 0, post || 0);
    let lencana = null; let namaLencana = "";
    if (isLulus) {
      if (skorTertinggi >= 70) { lencana = "emas"; namaLencana = "🥇 Emas"; }
      else if (skorTertinggi >= 50) { lencana = "perak"; namaLencana = "🥈 Perak"; }
    } else if (perluRujukGuru) {
      lencana = "gangsa"; namaLencana = "🥉 Rujuk Guru";
    }

    return { 
        aras, pre, post, targetLulus, isLulus, perluRujukGuru, preLulusTerus, isClearedForNext,
        skorTertinggi, lencana, namaLencana, aiSelesai: prog.aiSelesai,
        docIdPre: prog.docIdPre, docIdPost: prog.docIdPost,
        preObjektif: prog.preObjektif, postObjektif: prog.postObjektif,
        adaRalatSemakanPre: prog.adaRalatSemakanPre, adaRalatSemakanPost: prog.adaRalatSemakanPost
    };
  };

  const getChapterStatusUI = (chapterId: number) => {
    const logic = getChapterLogic(chapterId);
    if (userData?.kumpulan === "Kawalan") return { label: "Standard", color: "bg-slate-100", bar: "w-1/2 bg-slate-500", icon: "⚪" };
    if (logic.pre === undefined) return { label: "Sedia", color: "bg-slate-100", bar: "w-0", icon: "🚀" };
    if (logic.isLulus) return { label: "Dikuasai", color: "bg-emerald-50 text-emerald-700", bar: "w-full bg-emerald-500", icon: "🏆" };
    if (logic.perluRujukGuru) return { label: "Rujukan Guru", color: "bg-fuchsia-50 text-fuchsia-700 shadow-md", bar: "w-full bg-fuchsia-500 animate-pulse", icon: "💌" };
    return { label: "Bimbingan AI", color: "bg-amber-50 text-amber-700", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "🤖" };
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-sky-600"/></div>;

  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-6 font-sans text-slate-900 relative transition-colors duration-700 ${selectedTheme}`}>
      
      {/* MOD ANGKASA EFFECT (KEKAL) */}
      {selectedTheme.includes('indigo-950') && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
           <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0))', backgroundSize: '200px 200px' }}></div>
        </div>
      )}

      <div className="mx-auto max-w-6xl relative z-10">
        
        {/* HEADER WELCOME (KEKAL) */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-8 shadow-lg text-white mb-8 flex justify-between items-center relative overflow-hidden">
          <div className="flex items-center gap-5">
             <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-3xl font-black text-sky-600 shadow-md">
                {(userData?.nama || "P").charAt(0).toUpperCase()}
             </div>
             <div>
                <p className="text-sky-100 text-sm">Selamat kembali,</p>
                <h1 className="text-3xl font-black uppercase tracking-tight">{userData?.nama || "Pelajar"}</h1>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-md">
                <Palette size={16} className="text-white mr-2" />
                <select value={selectedTheme} onChange={handleThemeChange} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer">
                  {senaraiTheme.map(t => <option key={t.id} value={t.class} className="text-slate-800">{t.nama}</option>)}
                </select>
             </div>
             <button onClick={handleLogout} className="bg-rose-500 p-3 rounded-xl hover:bg-rose-600 shadow-lg transition-all"><LogOut size={20} className="text-white"/></button>
          </div>
        </motion.div>

        {/* 3 TUNJANG (KEKAL) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-slate-800 font-bold">
          <div className="bg-white/95 p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Brain /></div>
            <div><h3 className="text-sm">Belajar Pintar</h3><p className="text-[10px] text-slate-500 font-normal">Nota, Video & Bimbingan AI.</p></div>
          </div>
          <div className="bg-white/95 p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Compass /></div>
            <div><h3 className="text-sm">Bloom's Taxonomy</h3><p className="text-[10px] text-slate-500 font-normal">6 Fasa Inkuiri Intelek.</p></div>
          </div>
          <div className="bg-white/95 p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Medal /></div>
            <div><h3 className="text-sm">Sijil & Lencana</h3><p className="text-[10px] text-slate-500 font-normal">Ganjaran atas penguasaan.</p></div>
          </div>
        </div>

        {/* ANALISIS KEMAJUAN (KEKAL) */}
        <div className="bg-white/95 rounded-3xl p-8 shadow-md border border-white/40 mb-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3/></div>
              <h2 className="text-xl font-black text-slate-800 italic">Analisis Kemajuan Bab</h2>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {currentChapters.map(ch => {
                 const ui = getChapterStatusUI(ch.id);
                 return (
                    <div key={ch.id} className={`p-4 rounded-2xl border ${ui.color} flex flex-col gap-3 shadow-sm hover:shadow-md transition-all`}>
                       <div className="flex justify-between items-start">
                          <span className="font-black text-xs opacity-60">Bab {ch.id}</span>
                          <span className="text-xl">{ui.icon}</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{ui.label}</p>
                          <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden"><div className={`h-full ${ui.bar} rounded-full`}></div></div>
                       </div>
                    </div>
                 )
              })}
           </div>
        </div>

        {/* TAB TINGKATAN (KEKAL) */}
        <div className="mb-6 flex gap-3">
          {(userData?.tingkatan?.toString() === "5" ? ["t4", "t5"] : ["t4"]).map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-10 py-3 rounded-full font-black shadow-sm transition-all ${activeLevel === level ? "bg-sky-600 text-white" : "bg-white/90 text-slate-600 border border-slate-200"}`}>
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {/* SENARAI BAB (Sequential Unlocking) */}
        <div className="space-y-4">
          {currentChapters.map((chapter: any, index: number) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";
            
            // KUNCI BERURUTAN
            let isLocked = false;
            if (index > 0 && !isKawalan) {
                const prevLogic = getChapterLogic(currentChapters[index-1].id);
                if (!prevLogic.isClearedForNext) isLocked = true;
            }
            const subSemasa = getCurrentSubtopic(chapter.id, chapter);
            const preTelahDinilai = logic.pre !== undefined && !logic.adaRalatSemakanPre;

            return (
              <div key={chapter.id} className={`rounded-3xl border transition-all duration-300 ${isLocked ? 'bg-slate-100/60 opacity-80' : 'bg-white shadow-sm'}`}>
                <button 
                  onClick={() => isLocked ? alert(`Sila selesaikan Bab ${currentChapters[index-1].id} terlebih dahulu.`) : setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} 
                  className="w-full px-8 py-7 flex items-center justify-between"
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl ${isLocked ? 'bg-slate-200 text-slate-400' : statusUI.color}`}>
                        {isLocked ? <Lock /> : statusUI.icon}
                    </div>
                    <div className="text-left text-slate-800">
                       <h3 className={`font-black text-xl ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>{chapter.title}</h3>
                       {isLocked && <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">Selesaikan Bab {currentChapters[index-1].id}</p>}
                       {!isLocked && logic.lencana && <span className="text-[10px] font-black uppercase text-sky-600 mt-1 block">{logic.namaLencana} ({logic.skorTertinggi}%)</span>}
                    </div>
                  </div>
                  {!isLocked && <ChevronDown className={`w-6 h-6 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />}
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-100 bg-slate-50/50 p-8 overflow-hidden">
                      
                      {/* CAWANGAN LULUS (SIJIL) */}
                      {logic.isLulus && (
                        <div className="mb-8 p-6 bg-emerald-100 border border-emerald-200 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                           <div className="flex items-center gap-4 text-center md:text-left text-emerald-900">
                              <Trophy className="w-12 h-12 text-yellow-500" />
                              <div>
                                 <h4 className="font-black text-2xl">Tahniah! Penguasaan Bab.</h4>
                                 <p className="text-sm opacity-90">Sila tebus sijil digital anda sekarang!</p>
                              </div>
                           </div>
                           <button onClick={() => window.open(`/sijil?bab=${chapter.id}&skor=${logic.skorTertinggi}&nama=${encodeURIComponent(userData?.nama)}`, '_blank')}
                             className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                             <Award className="text-yellow-400"/> Muat Turun Sijil
                           </button>
                        </div>
                      )}

                      {/* 💌 CAWANGAN GAGAL (KAD RUJUK GURU) */}
                      {logic.perluRujukGuru && !isKawalan && (
                         <div className="col-span-full mb-8 relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-fuchsia-600 to-rose-600 rounded-[2.5rem] blur opacity-25"></div>
                            <div className="relative bg-white rounded-[2.5rem] border border-fuchsia-100 p-8 shadow-xl flex flex-col md:flex-row items-center gap-10 overflow-hidden">
                                <UsersRound className="absolute -right-4 -top-4 w-40 h-40 text-fuchsia-600 opacity-5" />
                                <div className="bg-fuchsia-100 p-6 rounded-full text-4xl shadow-inner text-fuchsia-600">💌</div>
                                <div className="flex-1 text-center md:text-left">
                                   <div className="bg-rose-500 text-white text-[10px] font-black px-5 py-2 rounded-full mb-4 inline-block uppercase tracking-[0.2em] shadow-lg animate-pulse">Rujukan Guru Diperlukan</div>
                                   <h3 className="text-3xl font-black text-slate-800 mb-3">Sila Berjumpa Guru Mata Pelajaran!</h3>
                                   <p className="text-slate-600 text-lg leading-relaxed mb-8">Anda telah berusaha sebaik mungkin bersama AI. Kini masanya untuk sesi pencerahan bersemuka bersama guru anda sebelum ke bab seterusnya. 💪</p>
                                   <div className="flex gap-4 justify-center md:justify-start">
                                      <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100 text-slate-700">
                                         <span className="text-xs block opacity-50 font-black uppercase">Skor Pasca</span>
                                         <span className="text-2xl font-black text-fuchsia-600">{logic.post}%</span>
                                      </div>
                                      <button onClick={() => alert("Cikgu anda telah dimaklumkan.")} className="bg-fuchsia-600 text-white font-black px-10 rounded-[2rem] shadow-xl flex items-center gap-3 hover:bg-fuchsia-700 transition-colors"><Send size={20}/> Maklumkan Cikgu</button>
                                   </div>
                                </div>
                            </div>
                         </div>
                      )}

                      {!logic.perluRujukGuru && (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {/* LANGKAH 1: PRE-TEST */}
                          <div className={`p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between gap-8 ${logic.pre !== undefined ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-sky-100'}`}>
                             <div>
                                <div className="flex items-center gap-3 mb-4">
                                   <div className={`p-3 rounded-xl ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}><Zap /></div>
                                   <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest">Langkah 1</h4>
                                </div>
                                <h3 className="font-black text-xl text-slate-800 italic">Ujian Diagnostik</h3>
                                {logic.pre !== undefined ? (
                                   <div className="p-4 bg-white/60 rounded-2xl text-sm font-black border border-emerald-100 mt-4">
                                      <div className="flex justify-between mb-1 opacity-50"><span>Skor Objektif:</span> <span>{logic.preObjektif}</span></div>
                                      <div className="flex justify-between text-emerald-700"><span>Skor Keseluruhan:</span> <span>{logic.pre}%</span></div>
                                   </div>
                                ) : <p className="text-sm text-slate-500 leading-relaxed mt-3">Uji tahap awal sebelum anda dibimbing oleh AI.</p>}
                             </div>
                             {logic.pre === undefined ? <button onClick={() => window.location.href=`/jawab?bab=Bab ${chapter.id}&jenisUjian=pre_test`} className="w-full py-4 bg-sky-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-sky-700 transition-all">Mula Diagnostik</button> :
                             <button onClick={() => window.location.href=`/student/semakan-ujian/${logic.docIdPre}`} className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-black text-sm rounded-2xl hover:bg-slate-100 flex items-center justify-center gap-3 transition-all"><FileSearch size={18}/> Semak Jawapan</button>}
                          </div>

                          {/* LANGKAH 2: BIMBINGAN AI */}
                          {logic.pre !== undefined && !logic.preLulusTerus && !isKawalan && (
                             <div className={`p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between gap-8 ${logic.aiSelesai ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-amber-100'}`}>
                                <div>
                                   <div className="flex items-center gap-3 mb-4">
                                      <div className={`p-3 rounded-xl ${logic.aiSelesai ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}><Sparkles /></div>
                                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest">Langkah 2</h4>
                                   </div>
                                   <h3 className="font-black text-xl text-slate-800 italic">Bimbingan Tutor AI</h3>
                                   <p className="text-sm text-slate-500 leading-relaxed mt-3">Interaksi 6 Fasa Bloom Inkuiri.</p>
                                </div>
                                {logic.aiSelesai ? <span className="text-sm font-black text-emerald-600 flex items-center gap-2 bg-emerald-50 w-fit px-4 py-2 rounded-full"><CheckCircle2 size={18}/> Selesai Belajar</span> :
                                <button onClick={() => window.location.href=`/pembelajaran?bab=bab${chapter.id}&aras=${logic.aras}`} className="w-full py-4 bg-amber-500 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-amber-600 transition-all">Mula Bimbingan</button>}
                             </div>
                          )}

                          {/* LANGKAH 3: POST-TEST */}
                          {logic.pre !== undefined && !logic.preLulusTerus && (logic.aiSelesai || isKawalan) && (
                             <div className={`p-8 rounded-[2rem] border shadow-sm flex flex-col justify-between gap-8 ${logic.post !== undefined ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-indigo-100'}`}>
                                <div>
                                   <div className="flex items-center gap-3 mb-4">
                                      <div className={`p-3 rounded-xl ${logic.post !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}><Medal /></div>
                                      <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest">Langkah 3</h4>
                                   </div>
                                   <h3 className="font-black text-xl text-slate-800 italic">Ujian Pasca</h3>
                                   {logic.post !== undefined ? (
                                      <div className="p-4 bg-white/60 rounded-2xl text-sm font-black border border-emerald-100 mt-4">
                                         <div className="flex justify-between text-indigo-700"><span>Skor Akhir:</span> <span>{logic.post}%</span></div>
                                         <div className="flex justify-between opacity-40 font-normal"><span>Sasaran:</span> <span>{logic.targetLulus}%</span></div>
                                      </div>
                                   ) : <p className="text-sm text-slate-500 leading-relaxed mt-3">Pengesahan tahap penguasaan bab.</p>}
                                </div>
                                <div className="flex gap-3">
                                   {logic.post === undefined ? <button onClick={() => window.location.href=`/jawab?bab=Bab ${chapter.id}&jenisUjian=post_test`} className="w-full py-4 bg-indigo-600 text-white font-black text-sm rounded-2xl shadow-lg hover:bg-indigo-700 transition-all">Ambil Pasca</button> :
                                   <button onClick={() => window.location.href=`/student/semakan-ujian/${logic.docIdPost}`} className="w-full py-4 bg-white border border-slate-200 text-slate-600 font-black text-sm rounded-2xl hover:bg-slate-100 flex items-center justify-center gap-3 transition-all"><FileSearch size={18}/> Semak Jawapan</button>}
                                </div>
                             </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🌟 MODAL SOAL SELIDIK AWAL (WAJIB JAWAB) */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[999] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
               <div className="bg-purple-600 p-10 text-white relative">
                  <ClipboardList className="absolute -right-4 -top-4 w-40 h-40 opacity-10" />
                  <h2 className="text-3xl font-black flex items-center gap-4 italic tracking-tighter">Soal Selidik Awalan <Sparkles className="text-yellow-300"/></h2>
                  <p className="text-purple-100 text-sm mt-2 font-medium">Lengkapkan maklum balas ini sebelum menggunakan HUB I-RAGs.</p>
               </div>
               
               <div className="p-8 overflow-y-auto flex-1 bg-slate-50 text-slate-800 custom-scrollbar">
                  {loadingSurvey ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto w-12 h-12 text-purple-600"/></div> : 
                   surveyQuestions.map((q, idx) => (
                     <div key={q.id} className="mb-8 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <p className="font-black text-slate-800 mb-5 leading-tight"><span className="text-purple-600 mr-2">{idx+1}.</span>{q.soalan}</p>
                        <div className="grid grid-cols-5 gap-3">
                           {[1,2,3,4,5].map(val => (
                              <button key={val} onClick={() => setSurveyAnswers({...surveyAnswers, [q.id]: val})} 
                                className={`py-4 rounded-2xl text-xs font-black border-2 transition-all ${surveyAnswers[q.id] === val ? 'bg-purple-600 border-purple-600 text-white shadow-xl scale-110' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-purple-200'}`}>
                                {val}
                              </button>
                           ))}
                        </div>
                     </div>
                   ))
                  }
               </div>

               <div className="p-10 bg-white border-t border-slate-100">
                  <button onClick={hantarSoalSelidik} disabled={isSubmittingSurvey} className="w-full py-5 bg-purple-600 text-white font-black rounded-[2rem] hover:bg-purple-700 shadow-2xl shadow-purple-900/40 flex items-center justify-center gap-4 transition-all active:scale-95">
                     {isSubmittingSurvey ? <Loader2 className="animate-spin"/> : <><Send size={22}/> Hantar & Mula Belajar</>}
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING FEEDBACK (KEKAL) */}
      <button onClick={() => setShowFeedback(true)} className="fixed bottom-8 right-8 bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all z-50 group border-4 border-white/20">
         <MessageSquare size={26}/>
         <span className="absolute right-20 bg-slate-900 px-5 py-3 rounded-2xl text-xs font-black text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-2xl border border-white/10 whitespace-nowrap">Suara Pelajar</span>
      </button>

      {/* MODAL FEEDBACK (KEKAL) */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 text-slate-800">
              <div className="bg-slate-800 p-8 text-white flex justify-between items-center">
                <h3 className="font-black text-xl flex items-center gap-3"><MessageSquare className="text-amber-400"/> Suara Pelajar</h3>
                <button onClick={() => setShowFeedback(false)} className="text-slate-400 hover:text-rose-400 transition-colors"><X size={24} /></button>
              </div>
              <div className="p-10">
                <div className="mb-6">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Kategori</label>
                  <select 
                    value={feedbackJenis} onChange={(e) => setFeedbackJenis(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-slate-700 text-sm font-black focus:border-sky-500 outline-none"
                  >
                    <option value="Pujian">🌟 Pujian / Berpuas Hati</option>
                    <option value="Cadangan">💡 Cadangan Penambahbaikan</option>
                    <option value="Masalah">⚠️ Masalah Sistem / Ralat</option>
                    <option value="Lain-lain">💬 Lain-lain</option>
                  </select>
                </div>
                <div className="mb-8">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Mesej Anda</label>
                   <textarea
                     value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)}
                     placeholder="Tulis di sini..."
                     className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-sky-500 outline-none resize-none min-h-[150px] text-sm text-slate-800 font-bold"
                   ></textarea>
                </div>
                <button 
                  onClick={hantarMaklumBalas} disabled={isSubmitting || !feedbackMsg.trim()}
                  className={`w-full py-5 rounded-[2rem] font-black text-white flex items-center justify-center gap-3 transition-all ${isSubmitting || !feedbackMsg.trim() ? 'bg-slate-200' : 'bg-slate-900 hover:bg-slate-800 shadow-2xl shadow-slate-900/30'}`}
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                  {isSubmitting ? 'Menghantar...' : 'Hantar Sekarang'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}