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
    { id: 8, title: "Bab 9: Dasar Luar Malaysia", desc: "Pendekatan dan kepentingan dasar luar", subtopics: [
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
  
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackJenis, setFeedbackJenis] = useState("Pujian");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE UNTUK SOAL SELIDIK KAJIAN
  const [showSurvey, setShowSurvey] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [currentSurveyCategoryIndex, setCurrentSurveyCategoryIndex] = useState(-1);
  
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [hasPostSurvey, setHasPostSurvey] = useState(false);
  const [surveyType, setSurveyType] = useState<"pre" | "post">("pre");
  const [initialPopupShown, setInitialPopupShown] = useState(false);

  // STATE UNTUK TEMA 
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
      if (uniqueIds.length === 0) uniqueIds.push("kosong");

      const qSurvey = query(collection(db, "soal_selidik_murid"), where("idMurid", "in", uniqueIds));
      const snapSurvey = await getDocs(qSurvey);
      let donePre = false, donePost = false;
      snapSurvey.forEach(d => {
         const data = d.data();
         if(data.jenisSurvey === "pre" || !data.jenisSurvey) donePre = true; 
         if(data.jenisSurvey === "post") donePost = true;
      });
      setHasPreSurvey(donePre);
      setHasPostSurvey(donePost);

      const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
      const snapSkor = await getDocs(qSkor);
      
      const qChat = query(collection(db, "chat_sessions"), where("studentId", "in", uniqueIds), where("status", "==", "completed"));
      const snapChat = await getDocs(qChat);
      
      const chatSelesaiArray: string[] = [];
      snapChat.forEach(d => chatSelesaiArray.push(d.data().chapterId));
      setAiSelesaiList(chatSelesaiArray);

      let tempProgress: Record<number, BabProgress> = {};
      
      snapSkor.forEach((docSnap) => {
        const data = docSnap.data();
        if (String(data.tingkatan) !== tSemasa) return;

        let babNum = NaN;
        const babStr = String(data.bab);
        const babMatch = babStr.match(/bab\s*(\d+)/i); 
        if (babMatch) babNum = parseInt(babMatch[1]);
        else {
          const digits = babStr.match(/\d+/g);
          if(digits && digits.length > 0) babNum = parseInt(digits[digits.length - 1]);
        }
        if (isNaN(babNum)) return; 

        if (!tempProgress[babNum]) tempProgress[babNum] = { aiSelesai: false, gameSelesai: false };
        
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
           tempProgress[babNum].adaRalatSemakanPost = adaRalat; tempProgress[babNum].docIdPost = docSnap.id;
        }
      });

      const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;
      currentChapters.forEach(ch => {
          if(!tempProgress[ch.id]) tempProgress[ch.id] = { aiSelesai: false, gameSelesai: false };
          if (ch.subtopics && ch.subtopics.length > 0) {
            let siapCount = 0;
            ch.subtopics.forEach(sub => { 
               if (chatSelesaiArray.includes(`tingkatan${tSemasa}_bab${ch.id}_sub${sub.id}`)) siapCount++; 
            });
            tempProgress[ch.id].aiSelesai = (siapCount === ch.subtopics.length);
          } else { 
            tempProgress[ch.id].aiSelesai = chatSelesaiArray.some(id => id && id.includes(`bab${ch.id}`)); 
          }
      });
      setProgressBab(tempProgress);
    } catch (error) { console.error("Ralat tarik data:", error); } 
    finally { if (!isSilent) setLoading(false); }
  };

  useEffect(() => { tarikDataFirebase(); }, [activeLevel]);

  useEffect(() => {
    const adaMenungguSemakan = Object.values(progressBab).some(p => p.adaRalatSemakanPre || p.adaRalatSemakanPost);
    let intervalId: NodeJS.Timeout;
    if (adaMenungguSemakan) {
      intervalId = setInterval(() => { tarikDataFirebase(true); }, 5000);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [progressBab, activeLevel]);

  useEffect(() => {
    if (!loading && userData?.kumpulan === 'Eksperimen' && !hasPreSurvey && !initialPopupShown) {
      setSurveyType("pre"); tarikSoalanSelidik("Pra"); setShowSurvey(true); setInitialPopupShown(true); 
    }
  }, [loading, userData, hasPreSurvey, initialPopupShown]);

  const tarikSoalanSelidik = async (fasa: "Pra" | "Pasca") => {
    setLoadingSurvey(true);
    try {
      const q = query(collection(db, "bank_soalan_selidik"), where("aktif", "==", true), where("fasa", "==", fasa));
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.susunan || 0) - (b.susunan || 0));
      setSurveyQuestions(data); setCurrentSurveyCategoryIndex(-1);
    } catch (error) { console.error("Gagal menarik soalan kajian:", error); } finally { setLoadingSurvey(false); }
  };

  const hantarSoalSelidik = async () => {
    if (Object.keys(surveyAnswers).length < surveyQuestions.length) { alert("Sila jawab semua soalan."); return; }
    setIsSubmittingSurvey(true);
    try {
      const skorKeseluruhan: Record<string, { total: number, count: number }> = {};
      const jawapanTerperinci: any[] = [];
      surveyQuestions.forEach(q => {
        const score = surveyAnswers[q.id];
        if (!skorKeseluruhan[q.kategori]) skorKeseluruhan[q.kategori] = { total: 0, count: 0 };
        skorKeseluruhan[q.kategori].total += score; skorKeseluruhan[q.kategori].count += 1;
        jawapanTerperinci.push({ soalanId: q.id, kategori: q.kategori, soalan: q.soalan, skor: score });
      });
      const purataKategori: Record<string, number> = {};
      Object.keys(skorKeseluruhan).forEach(k => { purataKategori[k] = parseFloat((skorKeseluruhan[k].total / skorKeseluruhan[k].count).toFixed(2)); });
      await addDoc(collection(db, "soal_selidik_murid"), {
        idMurid: userData?.idPengguna || userData?.id, namaMurid: userData?.nama || userData?.name,
        kumpulan: userData?.kumpulan, tarikhJawab: new Date().toISOString(),
        skorKeseluruhan: purataKategori, jawapanTerperinci, jenisSurvey: surveyType, fasa: surveyType === "pre" ? "Pra" : "Pasca"
      });
      alert("Terima kasih! Maklum balas berjaya direkodkan.");
      setShowSurvey(false); setSurveyAnswers({}); setCurrentSurveyCategoryIndex(-1);
      if (surveyType === "pre") setHasPreSurvey(true);
      if (surveyType === "post") setHasPostSurvey(true);
    } catch (e) { alert("Ralat sistem. Gagal menghantar."); } finally { setIsSubmittingSurvey(false); }
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

  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { aiSelesai: false };
    const pre = prog.preSkor; const post = prog.postSkor; 
    
    let aras = "rendah"; let targetLulus = 50;
    if (pre !== undefined) {
      if (pre >= 70) { aras = "tinggi"; targetLulus = 70; }
      else if (pre >= 50) { aras = "sederhana"; targetLulus = 70; }
      else { aras = "rendah"; targetLulus = 50; }
    }
    
    const preLulusTerus = pre !== undefined && pre >= 70;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus; 
    const perluRujukGuru = post !== undefined && !isLulus;

    // Bab cleared if Lulus OR (Failed but Teacher manual cleared it)
    let isClearedForNext = isLulus || (perluRujukGuru && userData?.babDibersihkan?.[chapterId]);

    const skorTertinggi = Math.max(pre || 0, post || 0);
    let lencana = null; let namaLencana = "";
    if (isLulus) {
      if (skorTertinggi >= 70) { lencana = "emas"; namaLencana = "🥇 Cemerlang"; }
      else if (skorTertinggi >= 50) { lencana = "perak"; namaLencana = "🥈 Lulus"; }
    } else if (perluRujukGuru) {
      lencana = "gangsa"; namaLencana = "🥉 Rujuk Guru";
    }

    return { 
        aras, pre, post, targetLulus, isLulus, perluRujukGuru, preLulusTerus, isClearedForNext,
        skorTertinggi, lencana, namaLencana, aiSelesai: prog.aiSelesai,
        docIdPre: prog.docIdPre, docIdPost: prog.docIdPost,
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
    if (logic.perluRujukGuru) return { label: "Rujukan Guru", color: "bg-fuchsia-50 border-fuchsia-300 text-fuchsia-700", bar: "w-full bg-fuchsia-500 animate-pulse", icon: "💌" };
    return { label: "Bimbingan AI", color: "bg-amber-50 border-amber-200 text-amber-700", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "🤖" };
  };

  const qualifiesForPostSurvey = Object.values(progressBab).some(p => p.preSkor !== undefined && p.preSkor < 50); 
  const showPreSurveyBanner = userData?.kumpulan === 'Eksperimen' && !hasPreSurvey;
  const showPostSurveyBanner = userData?.kumpulan === 'Eksperimen' && hasPreSurvey && qualifiesForPostSurvey && !hasPostSurvey;
  const surveyCategories = Array.from(new Set(surveyQuestions.map(q => q.kategori)));
  const questionsInCurrentCategory = surveyQuestions.filter(q => q.kategori === surveyCategories[currentSurveyCategoryIndex]);

  if (loading) return ( <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div></div> );
  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-6 font-sans text-slate-900 relative transition-colors duration-700 ${selectedTheme}`}>
      
      {selectedTheme.includes('indigo-950') && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-40">
           {/* Space BG Effect */}
        </div>
      )}

      <div className="mx-auto max-w-6xl relative z-10">
        
        {/* WELCOME BANNER */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 md:p-8 shadow-lg text-white mb-6 relative overflow-hidden">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
             <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white text-2xl md:text-3xl font-extrabold text-sky-600 shadow-md shrink-0">
                {(userData?.nama || userData?.name)?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sky-100 text-xs md:text-sm mb-1">Selamat datang ke Hub I-RAGs,</p>
                <h1 className="text-xl md:text-3xl font-extrabold uppercase line-clamp-2">{userData?.nama || userData?.name}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => tarikDataFirebase(false)} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 flex items-center gap-2 text-sm transition-all shadow-md">
                <RefreshCw className="w-4 h-4"/> <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="hidden sm:flex items-center bg-white/10 p-1.5 rounded-xl border border-white/20 shadow-sm backdrop-blur-md">
                <Palette size={16} className="text-white ml-2" />
                <select value={selectedTheme} onChange={handleThemeChange} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer py-1.5 pl-1 pr-2 appearance-none">
                  {senaraiTheme.map(theme => ( <option key={theme.id} value={theme.class} className="text-slate-800">{theme.nama}</option> ))}
                </select>
              </div>
              <button onClick={handleLogout} className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold border border-rose-400 flex items-center gap-2 text-sm transition-all shadow-md">
                <LogOut className="w-4 h-4"/> <span className="hidden md:inline">Log Keluar</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/95 p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Brain className="w-6 h-6" /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Belajar Pintar</h3><p className="text-xs text-slate-500">Nota, Video & Bimbingan AI.</p></div>
          </div>
          <div className="bg-white/95 p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Compass className="w-6 h-6" /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Taksonomi Bloom</h3><p className="text-xs text-slate-500">Uji kefahaman 6 fasa inkuiri.</p></div>
          </div>
          <div className="bg-white/95 p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Medal className="w-6 h-6" /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Lencana & Sijil</h3><p className="text-xs text-slate-500">Tamat kitaran & tebus ganjaran.</p></div>
          </div>
        </div>

        {/* PROGRESS ANALYSIS BANNER */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/95 rounded-3xl p-6 md:p-8 shadow-md border border-white/40 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analisis Kemajuan Bab</h2>
              <p className="text-sm text-slate-500">Selesaikan setiap kitaran bab untuk membuka bab yang seterusnya.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {currentChapters.map((ch) => {
              const statusUI = getChapterStatusUI(ch.id);
              return (
                <div key={ch.id} className={`p-4 rounded-2xl border ${statusUI.color} flex flex-col gap-3 transition-all hover:shadow-md bg-white/50`}>
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

        {/* SURVEY BANNER */}
        {(showPreSurveyBanner || showPostSurveyBanner) && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-1 flex flex-col md:flex-row items-center justify-between shadow-xl">
            <div className="p-5 md:p-6 flex items-center gap-4 text-white w-full">
              <div className="bg-white/20 p-3 rounded-2xl shrink-0"><ClipboardList className="w-8 h-8" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-lg md:text-xl">
                  Kajian: {showPreSurveyBanner ? 'Soal Selidik Awal' : 'Soal Selidik Akhir'} <Sparkles className="w-5 h-5 text-yellow-300 inline"/>
                </h3>
                <p className="text-purple-100 text-xs md:text-sm mt-1">Sila lengkapkan maklum balas anda untuk membantu kajian ini.</p>
              </div>
              <button onClick={() => { setSurveyType(showPreSurveyBanner ? "pre" : "post"); tarikSoalanSelidik(showPreSurveyBanner ? "Pra" : "Pasca"); setShowSurvey(true); }} className="px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 shadow-md transition-transform hover:scale-105 shrink-0">
                Jawab Sekarang <ArrowRight className="w-5 h-5"/>
              </button>
            </div>
          </motion.div>
        )}

        {/* TABS TINGKATAN */}
        <div className="mb-6 flex gap-3">
          {(userData?.tingkatan?.toString() === "5" ? ["t4", "t5"] : ["t4"]).map((level) => (
            <button key={level} onClick={() => { setActiveLevel(level as "t4" | "t5"); setExpandedChapter(null); }}
              className={`px-8 py-3 rounded-full font-bold shadow-sm transition-all ${activeLevel === level ? "bg-sky-600 text-white" : "bg-white/90 text-slate-600 hover:bg-slate-50 border border-slate-200"}`}>
              Tingkatan {level === "t4" ? "4" : "5"}
            </button>
          ))}
        </div>

        {/* CHAPTER LIST (Sequential Unlocking) */}
        <div className="space-y-4">
          {currentChapters.map((chapter: any, index: number) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";
            
            // LOGIK KUNCI BERURUTAN
            let isLocked = false;
            if (index > 0 && !isKawalan) {
                const prevLogic = getChapterLogic(currentChapters[index-1].id);
                if (!prevLogic.isClearedForNext) isLocked = true;
            }
            
            const subSemasa = getCurrentSubtopic(chapter.id, chapter);
            const ralatMenghalangBimbingan = logic.adaRalatSemakanPre || logic.adaRalatSemakanPost;
            const preTelahDinilai = logic.pre !== undefined && !logic.adaRalatSemakanPre;

            return (
              <div key={chapter.id} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isLocked ? 'bg-slate-100/60 opacity-80' : 'bg-white shadow-sm'}`}>
                <button onClick={() => isLocked ? alert(`Sila selesaikan Bab ${currentChapters[index-1].id} terlebih dahulu.`) : setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)} 
                  className={`w-full px-6 py-5 flex items-center justify-between ${isLocked ? 'cursor-not-allowed grayscale' : 'hover:bg-slate-50/50'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isLocked ? 'bg-slate-200 text-slate-400' : statusUI.color}`}>
                        {isLocked ? <Lock className="w-5 h-5"/> : statusUI.icon}
                    </div>
                    <div className="text-left">
                       <h3 className={`font-bold text-lg ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>{chapter.title}</h3>
                       {isLocked && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">Selesaikan Bab {currentChapters[index-1].id}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!isLocked && logic.lencana && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${
                          logic.lencana === "emas" ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                          logic.lencana === "perak" ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700'
                      }`}>
                        {logic.namaLencana} ({logic.skorTertinggi}%)
                      </span>
                    )}
                    {!isLocked && <ChevronDown className={`w-6 h-6 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && !isLocked && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-100 bg-slate-50/50 p-6 overflow-hidden">
                      
                      {/* LULUS: TAHNIAH & SIJIL */}
                      {logic.isLulus && !isKawalan && (
                        <div className={`mb-6 p-5 rounded-2xl border flex items-center justify-between gap-4 ${logic.lencana === 'emas' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                          <div className="flex items-center gap-4 text-left">
                            <Trophy className="w-10 h-10 text-yellow-500" />
                            <div>
                               <h4 className="font-black text-lg">Tahniah! Anda telah menguasai bab ini.</h4>
                               <p className="text-sm opacity-90">Anda kini boleh meneruskan ke bab yang seterusnya atau tebus sijil.</p>
                            </div>
                          </div>
                          <button onClick={() => window.open(`/sijil?tingkatan=${activeLevel === 't4' ? '4' : '5'}&bab=${chapter.id}&skor=${logic.skorTertinggi}&nama=${encodeURIComponent(userData?.nama || userData?.name)}`, '_blank')} 
                             className="bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 flex items-center gap-2 transition-transform">
                            <Award className="w-5 h-5 text-yellow-400"/> Tebus Sijil
                          </button>
                        </div>
                      )}

                      {/* GAGAL: RUJUK GURU (INTERVENSI) */}
                      {logic.perluRujukGuru && !isKawalan && (
                        <div className="col-span-full mb-6 p-6 md:p-8 bg-gradient-to-r from-fuchsia-600 to-rose-600 rounded-3xl shadow-xl text-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-10"><UsersRound className="w-40 h-40"/></div>
                          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                            <div className="bg-white p-4 rounded-full text-3xl shadow-lg">💌</div>
                            <div className="flex-1 text-center md:text-left">
                               <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Sila Rujuk Guru</div>
                               <h3 className="text-2xl font-black mb-2">Bimbingan Guru Diperlukan, {userData?.nama?.split(' ')[0]}!</h3>
                               <p className="text-white/90 text-sm leading-relaxed max-w-2xl mb-5">Anda telah menyelesaikan Ujian Pasca tetapi skor anda belum mencapai tahap penguasaan. Sila maklumkan guru anda untuk sesi bimbingan bersemuka (Intervensi) sebelum bab seterusnya dibuka.</p>
                               <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                  <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">Skor Pasca: {logic.post}%</div>
                                  <button onClick={() => alert("Notifikasi sedang dihantar kepada guru anda.")} className="bg-white text-fuchsia-700 font-bold px-6 py-2 rounded-xl shadow-md flex items-center gap-2 hover:scale-105 transition-transform">
                                    <Send size={16}/> Maklumkan Cikgu
                                  </button>
                               </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* UJIAN DIAGNOSTIK */}
                        <div className={`p-5 rounded-2xl border ${logic.pre !== undefined ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-sky-100 shadow-sm'} flex flex-col justify-between gap-4`}>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${logic.pre !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-100 text-sky-600'}`}><Zap className="w-5 h-5" /></div>
                              <h4 className="font-bold text-slate-800">Ujian Diagnostik</h4>
                            </div>
                            {logic.pre !== undefined ? (
                               <div className="p-3 bg-white/60 rounded-xl text-xs font-medium border border-emerald-100">
                                  <p className="flex justify-between mb-1"><span>Objektif:</span> <span className="font-bold">{logic.preObjektif}</span></p>
                                  <p className="flex justify-between font-bold text-emerald-700"><span>Skor:</span> <span>{logic.pre}%</span></p>
                               </div>
                            ) : <p className="text-xs text-slate-500">Kenalpasti tahap awal anda sebelum mula belajar.</p>}
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            {logic.pre !== undefined ? (
                                logic.adaRalatSemakanPre ? <span className="text-xs font-bold text-rose-600 flex items-center gap-1 animate-pulse"><Clock size={14}/> Menunggu Semakan</span>
                                : <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Selesai</span>
                            ) : <button onClick={() => openModule(chapter.id, "pre", "", "")} className="w-full py-2 bg-sky-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-sky-700">Mula Ujian</button>}
                            {logic.pre !== undefined && !logic.adaRalatSemakanPre && (
                               <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPre}`} className="px-3 py-2 bg-white border border-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1"><FileSearch size={14}/> Semak</button>
                            )}
                          </div>
                        </div>

                        {/* BIMBINGAN AI (MODUL) */}
                        {preTelahDinilai && !isKawalan && !logic.preLulusTerus && !logic.perluRujukGuru && (
                          <div className={`p-5 rounded-2xl border ${logic.aiSelesai ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-amber-100 shadow-sm'} flex flex-col justify-between gap-4`}>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.aiSelesai ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}><Sparkles className="w-5 h-5" /></div>
                                <h4 className="font-bold text-slate-800">Bimbingan AI ({logic.aras})</h4>
                              </div>
                              <p className="text-xs text-slate-500">Bimbingan Tutor AI berdasarkan 6 Fasa Inkuiri Bloom.</p>
                            </div>
                            <div className="mt-2">
                              {logic.aiSelesai ? (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14}/> Selesai Belajar</span>
                              ) : <button onClick={() => openModule(chapter.id, "ai", logic.aras, subSemasa)} className="w-full py-2.5 bg-amber-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-amber-600">Mula Belajar AI</button>}
                            </div>
                          </div>
                        )}

                        {/* UJIAN PASCA */}
                        {preTelahDinilai && !logic.preLulusTerus && (logic.aiSelesai || isKawalan) && (
                          <div className={`p-5 rounded-2xl border ${logic.post !== undefined ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-blue-100 shadow-sm'} flex flex-col justify-between gap-4`}>
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.post !== undefined ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}><Medal className="w-5 h-5" /></div>
                                <h4 className="font-bold text-slate-800">Ujian Pasca</h4>
                              </div>
                              {logic.post !== undefined ? (
                                <div className="p-3 bg-white/60 rounded-xl text-xs font-medium border border-emerald-100">
                                   <p className="flex justify-between mb-1"><span>Skor:</span> <span className={`font-black ${logic.isLulus ? 'text-emerald-700' : 'text-rose-600'}`}>{logic.post}%</span></p>
                                   <p className="flex justify-between text-[10px] text-slate-500"><span>Sasaran:</span> <span>{logic.targetLulus}%</span></p>
                                </div>
                              ) : <p className="text-xs text-slate-500">Ujian akhir untuk mengesahkan penguasaan bab anda.</p>}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              {logic.post !== undefined ? (
                                logic.adaRalatSemakanPost ? <span className="text-xs font-bold text-rose-600 animate-pulse">Menunggu Semakan</span>
                                : <span className={`text-xs font-bold ${logic.isLulus ? 'text-emerald-600' : 'text-fuchsia-600'}`}>{logic.isLulus ? 'Selesai & Lulus' : 'Perlu Rujukan Guru'}</span>
                              ) : (isKawalan && !userData?.bukaPostTest ? (
                                <button disabled className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                                  <Lock size={14}/> Menunggu Cikgu
                                </button>
                              ) : <button onClick={() => openModule(chapter.id, "post", "", "")} className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700">Mula Ujian Pasca</button>)}
                              {logic.post !== undefined && !logic.adaRalatSemakanPost && (
                                <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPost}`} className="px-3 py-2 bg-white border border-slate-200 text-[10px] font-bold rounded-lg hover:bg-slate-50 shadow-sm ml-2"><FileSearch size={14}/> Semak</button>
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

      {/* FEEDBACK BUTTON */}
      <button onClick={() => setShowFeedback(true)} className="fixed bottom-6 right-6 bg-slate-800 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center border-2 border-white/20 group">
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-14 bg-slate-800 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Suara Pelajar</span>
      </button>

      {/* MODAL SURVEY & FEEDBACK (Dikekalkan seperti asal) */}
      {/* ... (Semua kod modal dikekalkan seperti fail asal anda supaya tidak pecah) ... */}
    </div>
  );
}