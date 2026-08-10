"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, CheckCircle2, Trophy, ChevronDown, Lock, Sparkles, LogOut, BarChart3, Info, AlertTriangle, Clock, FileSearch, Award, MessageSquare, Send, X, Loader2, Palette, Brain, Compass, ClipboardList, ArrowRight, ArrowLeft, RefreshCw, Medal
} from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
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

  // 🌟 STATE UNTUK SOAL SELIDIK KAJIAN
  const [showSurvey, setShowSurvey] = useState(false);
  const [loadingSurvey, setLoadingSurvey] = useState(false);
  const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, number>>({});
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [currentSurveyCategoryIndex, setCurrentSurveyCategoryIndex] = useState(-1);
  
  const [hasPreSurvey, setHasPreSurvey] = useState(false);
  const [hasPostSurvey, setHasPostSurvey] = useState(false);
  const [surveyType, setSurveyType] = useState<"pre" | "post">("pre");

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

      const targetIds = [];
      if (userPenuh.id) targetIds.push(userPenuh.id);
      if (userPenuh.idPengguna) targetIds.push(userPenuh.idPengguna);
      const uniqueIds = [...new Set(targetIds)];
      if (uniqueIds.length === 0) uniqueIds.push("kosong");

      // Tarik Status Soal Selidik (Pre/Post)
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

      // Tarik Rekod Markah & Sesi Chat
      const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
      const snapSkor = await getDocs(qSkor);
      
      const qChat = query(collection(db, "chat_sessions"), where("studentId", "in", uniqueIds), where("status", "==", "completed"));
      const snapChat = await getDocs(qChat);
      
      const chatSelesaiArrayNormal: string[] = [];
      snapChat.forEach(d => {
         const data = d.data();
         chatSelesaiArrayNormal.push(data.chapterId);
      });
      setAiSelesaiList(chatSelesaiArrayNormal);

      let tempProgress: Record<number, BabProgress> = {};
      
      snapSkor.forEach((docSnap) => {
        const data = docSnap.data();
        if (String(data.tingkatan) !== tSemasa) return;

        let babNum = NaN;
        const babStr = String(data.bab);
        const babMatch = babStr.match(/bab\s*(\d+)/i); 
        
        if (babMatch) {
            babNum = parseInt(babMatch[1]);
        } else {
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
            let siapCountNormal = 0;
            ch.subtopics.forEach(sub => { 
               const targetId = `tingkatan${tSemasa}_bab${ch.id}_sub${sub.id}`;
               if (chatSelesaiArrayNormal.includes(targetId)) siapCountNormal++; 
            });
            tempProgress[ch.id].aiSelesai = (siapCountNormal === ch.subtopics.length);
          } else { 
            tempProgress[ch.id].aiSelesai = chatSelesaiArrayNormal.some(id => id && id.includes(`bab${ch.id}`)); 
          }
      });

      setProgressBab(tempProgress);
    } catch (error) { console.error("Ralat tarik data:", error); } 
    finally { 
      if (!isSilent) setLoading(false); 
    }
  };

  useEffect(() => {
    tarikDataFirebase();
  }, [activeLevel]);

  useEffect(() => {
    const adaMenungguSemakan = Object.values(progressBab).some(p => p.adaRalatSemakanPre || p.adaRalatSemakanPost);
    let intervalId: NodeJS.Timeout;
    if (adaMenungguSemakan) {
      intervalId = setInterval(() => { tarikDataFirebase(true); }, 5000); 
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [progressBab, activeLevel]);

  // 🌟 LOGIK POP-UP AWAL (Mesti Jawab Sebelum Guna Sistem)
  useEffect(() => {
    if (!loading && userData?.kumpulan === 'Eksperimen' && !hasPreSurvey) {
      setSurveyType("pre");
      tarikSoalanSelidik("Pra");
      setShowSurvey(true);
    }
  }, [loading, userData, hasPreSurvey]);

  const tarikSoalanSelidik = async (fasa: "Pra" | "Pasca") => {
    setLoadingSurvey(true);
    try {
      const q = query(
        collection(db, "bank_soalan_selidik"), 
        where("aktif", "==", true),
        where("fasa", "==", fasa)
      );
      const snap = await getDocs(q);
      const data: any[] = [];
      snap.forEach(d => data.push({ id: d.id, ...d.data() }));
      
      data.sort((a, b) => (a.susunan || 0) - (b.susunan || 0));
      setSurveyQuestions(data);
      setCurrentSurveyCategoryIndex(-1);
    } catch (error) {
      console.error("Gagal menarik soalan kajian:", error);
    } finally {
      setLoadingSurvey(false);
    }
  };

  const hantarSoalSelidik = async () => {
    if (Object.keys(surveyAnswers).length < surveyQuestions.length) {
      alert("Sila jawab semua soalan yang disediakan sebelum menghantar.");
      return;
    }

    setIsSubmittingSurvey(true);
    try {
      const skorKeseluruhan: Record<string, { total: number, count: number }> = {};
      const jawapanTerperinci: any[] = [];

      surveyQuestions.forEach(q => {
        const score = surveyAnswers[q.id];
        if (!skorKeseluruhan[q.kategori]) skorKeseluruhan[q.kategori] = { total: 0, count: 0 };
        skorKeseluruhan[q.kategori].total += score;
        skorKeseluruhan[q.kategori].count += 1;

        jawapanTerperinci.push({
          soalanId: q.id,
          kategori: q.kategori,
          subKategori: q.subKategori || "Umum",
          soalan: q.soalan,
          skor: score
        });
      });

      const purataKategori: Record<string, number> = {};
      Object.keys(skorKeseluruhan).forEach(k => {
        purataKategori[k] = parseFloat((skorKeseluruhan[k].total / skorKeseluruhan[k].count).toFixed(2));
      });

      await addDoc(collection(db, "soal_selidik_murid"), {
        idMurid: userData?.idPengguna || userData?.id || "Tiada ID",
        namaMurid: userData?.nama || userData?.name || "Pelajar",
        kumpulan: userData?.kumpulan || "Eksperimen",
        sekolah: userData?.sekolah || "Tiada Maklumat",
        tarikhJawab: new Date().toISOString(),
        skorKeseluruhan: purataKategori,
        jawapanTerperinci: jawapanTerperinci,
        jenisSurvey: surveyType,
        fasa: surveyType === "pre" ? "Pra" : "Pasca"
      });

      alert("Terima kasih! Maklum balas soal selidik anda telah berjaya direkodkan.");
      setShowSurvey(false);
      setSurveyAnswers({});
      setCurrentSurveyCategoryIndex(-1);
      
      if (surveyType === "pre") setHasPreSurvey(true);
      if (surveyType === "post") setHasPostSurvey(true);
      
    } catch (e) {
      console.error("Ralat menyimpan soal selidik:", e);
      alert("Ralat sistem. Gagal menghantar borang soal selidik.");
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

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

  const openModule = (chapterId: number, type: string, aras: string, subSemasa: string) => {
    const t = activeLevel === "t4" ? "4" : "5";
    if (type === "pre") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=pre_test`;
    if (type === "ai") window.location.href = `/pembelajaran?bab=tingkatan${t}_bab${chapterId}_${subSemasa}&aras=${aras}`;
    if (type === "post") window.location.href = `/jawab?tingkatan=${t}&bab=Bab ${chapterId}&jenisUjian=post_test`;
  };

  // 🌟 LOGIK KATEGORI UJIAN & RUJUKAN GURU
  const getChapterLogic = (chapterId: number) => {
    const prog = progressBab[chapterId] || { aiSelesai: false, gameSelesai: false };
    const pre = prog.preSkor; const post = prog.postSkor;
    
    let aras = "rendah"; let targetLulus = 50;

    if (pre !== undefined) {
      if (pre >= 70) { aras = "tinggi"; targetLulus = 70; }
      else if (pre >= 50 && pre <= 69) { aras = "sederhana"; targetLulus = 70; }
      else { aras = "rendah"; targetLulus = 50; }
    }
    
    const preLulusTerus = pre !== undefined && pre >= 70;
    const postLulus = post !== undefined && post >= targetLulus;
    const isLulus = preLulusTerus || postLulus; 
    
    let isClearedForNext = false;
    let gagalKategori: string | null = null;
    let rujukGuru = false;

    // 🌟 KUNCI: Sesiapa sahaja yang telah menduduki Ujian Pasca, bab seterusnya akan terbuka!
    if (preLulusTerus) {
       isClearedForNext = true;
    } else if (post !== undefined) {
       isClearedForNext = true; 
       
       if (!isLulus) {
          // MURID TIDAK LULUS UJIAN PASCA
          rujukGuru = true;
          if (post < 40) {
             gagalKategori = "Kritikal";
          } else if (post < pre!) {
             gagalKategori = "Sederhana"; // Merosot
          } else {
             gagalKategori = "Rendah"; // Tidak capai target
          }
       }
    }

    const skorTertinggi = Math.max(pre || 0, post || 0);
    let lencana = null;
    let namaLencana = "";
    
    if (preLulusTerus || post !== undefined) {
      if (skorTertinggi >= 70) { lencana = "emas"; namaLencana = "🥇 Cemerlang"; }
      else if (skorTertinggi >= 50) { lencana = "perak"; namaLencana = "🥈 Lulus"; }
      else { lencana = "gangsa"; namaLencana = "🥉 Usaha Baik"; }
    }

    return { 
        aras, pre, post, targetLulus, isLulus, preLulusTerus,
        isClearedForNext, rujukGuru, gagalKategori,
        skorTertinggi, lencana, namaLencana,
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
    if (logic.rujukGuru) return { label: "Rujuk Guru", color: "bg-rose-50 border-rose-200 text-rose-700", bar: "w-full bg-rose-500 animate-pulse", icon: "💌" };
    return { label: "Bimbingan AI", color: "bg-amber-50 border-amber-200 text-amber-700", bar: "w-1/2 bg-amber-400 animate-pulse", icon: "⏳" };
  };

  // 🌟 LOGIK KELAYAKAN SOAL SELIDIK PASCA (Hanya jika Pre-test < 50, dan dah siap Pasca)
  const qualifiesForPostSurvey = Object.values(progressBab).some(p => p.preSkor !== undefined && p.preSkor < 50 && p.postSkor !== undefined); 
  const showPostSurveyBanner = userData?.kumpulan === 'Eksperimen' && hasPreSurvey && qualifiesForPostSurvey && !hasPostSurvey;

  const surveyCategories = Array.from(new Set(surveyQuestions.map(q => q.kategori)));
  const currentSurveyCategory = surveyCategories[currentSurveyCategoryIndex] || "";
  const questionsInCurrentCategory = surveyQuestions.filter(q => q.kategori === currentSurveyCategory);

  if (loading) return ( <div className="flex h-screen items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full"></div></div> );
  const currentChapters = activeLevel === "t4" ? chapters.t4 : chapters.t5;

  return (
    <div className={`min-h-screen px-4 py-8 md:px-6 font-sans text-slate-900 relative transition-colors duration-700 ${selectedTheme}`}>
      
      {/* CORAK BINTANG UNTUK MOD ANGKASA */}
      {selectedTheme.includes('indigo-950') && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(2px 2px at 20px 30px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 50px 160px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 130px 80px, #fff, rgba(0,0,0,0)), radial-gradient(2px 2px at 160px 120px, #fff, rgba(0,0,0,0))', backgroundSize: '200px 200px' }}></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(1px 1px at 10px 10px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 30px 50px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 120px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 120px 20px, #fff, rgba(0,0,0,0))', backgroundSize: '150px 150px' }}></div>
        </div>
      )}

      <div className="mx-auto max-w-6xl relative z-10">
        
        {/* HEADER TOP (Welcome Banner) */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-gradient-to-r from-sky-600 to-indigo-700 p-6 md:p-8 shadow-lg text-white mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
            <div className="flex items-center gap-5">
             <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-white text-2xl md:text-3xl font-extrabold text-sky-600 shadow-md border-4 border-sky-100 shrink-0">
                {(userData?.nama || userData?.name) ? (userData.nama || userData.name).charAt(0).toUpperCase() : "P"}
              </div>
              <div>
                <p className="text-sky-100 text-xs md:text-sm mb-1">Selamat datang ke Hub I-RAGs,</p>
                <h1 className="text-xl md:text-3xl font-extrabold uppercase line-clamp-2">{userData?.nama || userData?.name}</h1>
                <p className="text-sky-50 flex items-center gap-2 mt-1 md:mt-2 text-xs md:text-sm font-medium opacity-90">
                  ID: <span className="font-bold tracking-wider">{userData?.idPengguna || userData?.id}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <button 
                onClick={() => tarikDataFirebase(false)} 
                className="px-4 md:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 font-bold border border-white/20 flex items-center gap-2 text-sm transition-all shadow-md"
                title="Segar Semula Data"
              >
                <RefreshCw className="w-4 h-4"/> <span className="hidden sm:inline">Segar Semula</span>
              </button>
              <div className="hidden sm:flex items-center bg-white/10 p-1.5 rounded-xl border border-white/20 shadow-sm backdrop-blur-md">
                <Palette size={16} className="text-white ml-2" />
                <select value={selectedTheme} onChange={handleThemeChange} className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer py-1.5 pl-1 pr-2 hover:text-sky-200 transition-colors appearance-none">
                  {senaraiTheme.map(theme => ( <option key={theme.id} value={theme.class} className="text-slate-800">{theme.nama}</option> ))}
                </select>
              </div>
              <button onClick={handleLogout} className="px-4 md:px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold border border-rose-400 flex items-center gap-2 text-sm transition-all shadow-md shadow-rose-900/20">
                <LogOut className="w-4 h-4"/> <span className="hidden md:inline">Log Keluar</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* KAD 3 TUNJANG UTAMA */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0"><Brain className="w-6 h-6" strokeWidth={2.5} /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Belajar Ikut Keupayaan</h3><p className="text-xs text-slate-500 mt-0.5">Tiada tekanan, ikuti laluan anda.</p></div>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0"><Compass className="w-6 h-6" strokeWidth={2.5} /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Bimbingan Pintar AI</h3><p className="text-xs text-slate-500 mt-0.5">Selesaikan kitaran & kumpul lencana.</p></div>
          </div>
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0"><Medal className="w-6 h-6" strokeWidth={2.5} /></div>
            <div><h3 className="font-bold text-slate-800 text-sm">Sijil Penghargaan</h3><p className="text-xs text-slate-500 mt-0.5">Tebus sijil cemerlang atau lulus.</p></div>
          </div>
        </motion.div>

        {/* ANALISIS PENGUASAAN BAB */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-md border border-white/40 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><BarChart3 className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analisis Kemajuan Bab</h2>
              <p className="text-sm text-slate-500">Maju selangkah demi selangkah. Bab baharu akan terbuka apabila kitaran selesai.</p>
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

        {/* 🌟 BANNER SOAL SELIDIK KAJIAN (DYNAMIK UNTUK PASCA) 🌟 */}
        {showPostSurveyBanner && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="mb-8 rounded-3xl bg-gradient-to-r from-purple-600 to-fuchsia-600 p-1 flex flex-col md:flex-row items-center justify-between shadow-xl shadow-purple-900/20">
            <div className="p-5 md:p-6 flex items-center gap-4 text-white w-full">
              <div className="bg-white/20 p-3 rounded-2xl shrink-0"><ClipboardList className="w-8 h-8" /></div>
              <div className="flex-1">
                <h3 className="font-bold text-lg md:text-xl flex items-center gap-2">
                  Tugasan Kajian: Soal Selidik Akhir (Post-Survey) <Sparkles className="w-5 h-5 text-yellow-300"/>
                </h3>
                <p className="text-purple-100 text-xs md:text-sm mt-1 leading-relaxed">
                  Terima kasih atas dedikasi anda. Sila lengkapkan soal selidik akhir ini sebagai tanda maklum balas keberkesanan sistem.
                </p>
              </div>
              <button 
                onClick={() => { setSurveyType("post"); tarikSoalanSelidik("Pasca"); setShowSurvey(true); }} 
                className="hidden md:flex px-6 py-3 bg-white text-purple-700 hover:bg-purple-50 font-bold rounded-xl items-center gap-2 shadow-md transition-transform hover:scale-105 shrink-0"
              >
                Mula Jawab <ArrowRight className="w-5 h-5"/>
              </button>
            </div>
            <button 
              onClick={() => { setSurveyType("post"); tarikSoalanSelidik("Pasca"); setShowSurvey(true); }} 
              className="md:hidden w-full px-6 py-4 bg-white text-purple-700 font-bold rounded-b-3xl flex items-center justify-center gap-2 shadow-inner"
            >
              Mula Jawab Sekarang <ArrowRight className="w-5 h-5"/>
            </button>
          </motion.div>
        )}

        {/* TAB TINGKATAN */}
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
             <p className="text-sm font-medium">Anda adalah murid kumpulan Konvensional. Sila lengkapkan Ujian Diagnostik dan Ujian Pasca mengikut arahan guru. Jangan lupa tekan <strong>Segar Semula</strong> jika arahan bertukar.</p>
           </div>
        )}

        {/* SENARAI BAB (SEQUENTIAL UNLOCKING) */}
        <div className="space-y-4">
          {currentChapters.map((chapter: any, index: number) => {
            const logic = getChapterLogic(chapter.id);
            const statusUI = getChapterStatusUI(chapter.id);
            const isKawalan = userData?.kumpulan === "Kawalan";
            
            // LOGIK KUNCI BERURUTAN
            let isLocked = false;
            if (index > 0 && !isKawalan) {
                const prevChapterId = currentChapters[index - 1].id;
                const prevLogic = getChapterLogic(prevChapterId);
                if (!prevLogic.isClearedForNext) isLocked = true;
            }
            
            const subSemasa = getCurrentSubtopic(chapter.id, chapter);
            const ralatMenghalangBimbingan = logic.post === undefined ? logic.adaRalatSemakanPre : logic.adaRalatSemakanPost;
            const preTelahDinilai = logic.pre !== undefined && !logic.adaRalatSemakanPre;

            return (
              <div key={chapter.id} className={`rounded-2xl border overflow-hidden transition-all duration-300 ${
                  isLocked ? 'bg-slate-100/60 border-slate-200 opacity-80 shadow-none' : 'bg-white/95 backdrop-blur-md border-white/40 shadow-sm'
              }`}>
                
                <button 
                  onClick={() => {
                    if (isLocked) {
                       alert(`KUNCI AKTIF: Sila selesaikan kitaran ujian untuk Bab ${currentChapters[index-1].id} terlebih dahulu.`);
                       return;
                    }
                    setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)
                  }} 
                  className={`w-full px-6 py-5 flex items-center justify-between ${isLocked ? 'cursor-not-allowed grayscale' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${isLocked ? 'bg-slate-200 text-slate-400' : statusUI.color}`}>
                        {isLocked ? <Lock className="w-5 h-5"/> : statusUI.icon}
                    </div>
                    <div className="text-left">
                       <h3 className={`font-bold text-lg ${isLocked ? 'text-slate-500' : 'text-slate-900'}`}>{chapter.title}</h3>
                       {isLocked && <p className="text-xs text-rose-500 mt-1 font-bold italic">Terkunci: Lengkapkan syarat Bab {currentChapters[index-1].id}.</p>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    {!isLocked && logic.lencana ? (
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1.5 ${
                          logic.lencana === "emas" ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                          logic.lencana === "perak" ? 'bg-slate-100 border-slate-300 text-slate-700' :
                          'bg-orange-50 border-orange-300 text-orange-800'
                      }`}>
                        {logic.namaLencana} <span className="font-black">({logic.skorTertinggi}%)</span>
                      </span>
                    ) : !isLocked && logic.skorTertinggi !== undefined && logic.skorTertinggi > 0 ? (
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1.5 ${
                          ralatMenghalangBimbingan ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-100 border-slate-300 text-slate-700'
                      }`}>
                        {ralatMenghalangBimbingan ? '⏳ Semakan Guru' : `Skor: ${logic.skorTertinggi}%`}
                      </span>
                    ) : !isLocked && logic.pre !== undefined && logic.pre === 0 ? (
                      <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-sm flex items-center gap-1.5 bg-slate-100 border-slate-300 text-slate-700`}>
                        Skor: 0%
                      </span>
                    ) : null}
                    
                    {!isLocked && (
                      <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${expandedChapter === chapter.id ? "rotate-180" : ""}`} />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedChapter === chapter.id && !isLocked && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t border-slate-200/50 bg-slate-50/50 p-6 overflow-hidden">
                      
                      {/* TAHNIAH BERSAMA LENCANA & SIJIL (GAMIFIKASI) */}
                      {(logic.isLulus || logic.post !== undefined) && !isKawalan && (
                        <div className={`mb-6 p-5 rounded-xl shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4 ${
                          logic.lencana === 'emas' ? 'bg-yellow-50/80 border-yellow-200 text-yellow-800' :
                          logic.lencana === 'perak' ? 'bg-slate-100/80 border-slate-300 text-slate-800' :
                          'bg-orange-50/80 border-orange-200 text-orange-800'
                        }`}>
                          <div className="flex items-center gap-4">
                            <Trophy className={`w-10 h-10 shrink-0 ${logic.lencana === 'emas' ? 'text-yellow-500' : logic.lencana === 'perak' ? 'text-slate-400' : 'text-orange-500'}`} />
                            <div>
                              <h4 className="font-black text-lg">
                                {logic.lencana === 'emas' ? 'Luar Biasa! Anda mendapat Lencana Emas.' : 
                                 logic.lencana === 'perak' ? 'Syabas! Anda mendapat Lencana Perak.' : 
                                 'Tahniah! Lencana Gangsa atas usaha gigih anda.'}
                              </h4>
                              <p className="text-sm font-medium mt-0.5 opacity-90">
                                {logic.lencana === 'emas' ? 'Penguasaan bab yang sangat cemerlang.' : 
                                 logic.lencana === 'perak' ? 'Pemahaman yang memuaskan. Kelulusan dicapai.' : 
                                 'Sistem menghargai komitmen anda menyelesaikan kitaran. Teruskan mencuba!'}
                              </p>
                            </div>
                          </div>
                          
                          {logic.isLulus && (
                            <button 
                              onClick={() => window.open(`/sijil?tingkatan=${activeLevel === 't4' ? '4' : '5'}&bab=${chapter.id}&skor=${logic.skorTertinggi}&nama=${encodeURIComponent(userData?.nama || userData?.name || 'Pelajar Cemerlang')}`, '_blank')} 
                              className="shrink-0 bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:scale-105 hover:bg-slate-800 transition-all flex items-center gap-2"
                            >
                              <Award className="w-5 h-5 text-yellow-400"/> Muat Turun Sijil
                            </button>
                          )}
                        </div>
                      )}

                      {/* 🌟 KAD RUJUKAN GURU JIKA MURID GAGAL UJIAN PASCA 🌟 */}
                      {logic.rujukGuru && !isKawalan && (
                        <div className="col-span-full mb-6 bg-rose-50/90 backdrop-blur-md rounded-2xl border border-rose-200 p-6 md:p-8 shadow-md relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-10"><AlertTriangle className="w-32 h-32 text-rose-600" /></div>
                          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="bg-white p-4 rounded-full shadow-sm shrink-0"><span className="text-4xl">💌</span></div>
                            <div className="flex-1">
                               <div className="inline-block bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider border border-rose-300">Kad Rujukan Guru</div>
                               <h3 className="text-xl font-bold text-rose-900 mb-2">Perhatian, {userData?.nama?.split(' ')[0] || "Pelajar"}!</h3>
                               <p className="text-rose-800 text-sm leading-relaxed max-w-3xl mb-3">
                                 {logic.gagalKategori === "Kritikal" && "Markah Ujian Pasca anda berada di bawah 40 (Kritikal). Anda perlu merujuk guru untuk bimbingan bersemuka dengan kadar segera."}
                                 {logic.gagalKategori === "Sederhana" && "Markah Ujian Pasca anda lebih rendah daripada Ujian Diagnostik. Berlaku kemerosotan kefahaman. Sila rujuk guru untuk mengenal pasti kesilapan anda."}
                                 {logic.gagalKategori === "Rendah" && "Anda masih belum mencapai sasaran minimum. Sila berjumpa dengan guru untuk mendapatkan tip dan latihan tambahan."}
                               </p>
                               <p className="text-rose-700 text-xs font-bold italic mb-4 bg-white/50 p-2 rounded-lg border border-rose-100 inline-block">Nota: Anda boleh menduduki semula ujian ini selepas guru menetapkan semula (reset) markah anda di dalam sistem.</p>
                               <div className="bg-white/60 p-4 rounded-xl border border-rose-100 flex flex-col sm:flex-row gap-4 sm:gap-8 max-w-lg">
                                  <div><span className="block text-xs text-rose-600 font-bold uppercase">Skor Diagnostik</span><span className="text-lg font-black text-rose-900">{logic.pre}%</span></div>
                                  <div><span className="block text-xs text-rose-600 font-bold uppercase">Skor Pasca</span><span className="text-lg font-black text-rose-900">{logic.post}%</span></div>
                               </div>
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
                              <button onClick={() => openModule(chapter.id, "pre", "", "")} className="w-full px-5 py-2 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 shadow-sm">Mula Ujian</button>
                            )}
                            
                            {logic.pre !== undefined && logic.docIdPre && !logic.adaRalatSemakanPre && (
                               <button onClick={() => window.location.href = `/student/semakan-ujian/${logic.docIdPre}`} className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 flex items-center gap-1 shadow-sm">
                                 <FileSearch className="w-4 h-4"/> Semak
                               </button>
                            )}
                          </div>
                        </div>

                        {/* 🌟 KAD 2: BIMBINGAN AI (BEBAS KUNCI) 🌟 */}
                        {preTelahDinilai && !isKawalan && !logic.preLulusTerus && (
                          <div className={`p-5 rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                              logic.aiSelesai ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white/80 border-amber-200 shadow-sm'
                            } flex flex-col justify-between gap-4`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.adaRalatSemakanPre ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {logic.adaRalatSemakanPre ? <AlertTriangle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                                </div>
                                <h4 className="font-bold">
                                  {logic.adaRalatSemakanPre ? "Menunggu Semakan" : `Bimbingan AI (${logic.aras})`}
                               </h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                {logic.adaRalatSemakanPre ? "Status tahap penguasaan anda sedang dikemas kini oleh guru." :
                                 "Bimbingan Inkuiri bersama Tutor AI, Nota & Video."}
                              </p>
                            </div>
                            
                            <div className="mt-2">
                              {logic.adaRalatSemakanPre ? (
                                  <button disabled className="w-full px-5 py-2 text-rose-400 bg-rose-100/50 text-sm font-bold rounded-xl cursor-not-allowed border border-rose-200">Menunggu Guru...</button>
                              ) : logic.aiSelesai ? (
                                <button onClick={() => openModule(chapter.id, "ai", logic.aras, subSemasa)} 
                                        className="w-full px-5 py-2.5 text-emerald-700 text-sm font-bold rounded-xl border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 shadow-sm transition-all flex items-center justify-center gap-2">
                                  <CheckCircle2 className="w-4 h-4"/> Selesai (Ulang Kaji)
                                </button>
                              ) : (
                                <button onClick={() => openModule(chapter.id, "ai", logic.aras, subSemasa)} 
                                        className="w-full px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-md transition-all bg-amber-500 hover:bg-amber-600 hover:scale-[1.02]">
                                  Mula Bimbingan
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        {/* KAD 3: UJIAN PASCA */}
                        {preTelahDinilai && !logic.preLulusTerus && (logic.post !== undefined || (!isKawalan && logic.aiSelesai) || isKawalan) && (
                          <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
                              logic.isLulus ? 'bg-emerald-50/80 border-emerald-200' : 'bg-white/80 border-blue-200 shadow-sm'
                            } flex flex-col justify-between gap-4 animate-in zoom-in duration-300`}>
                            
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${logic.isLulus ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h4 className="font-bold">Ujian Pasca</h4>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed mb-3">Sasaran Sijil: {logic.targetLulus}%</p>
                              
                              {logic.post !== undefined && logic.postPenuh !== undefined && (
                                <div className={`p-3 rounded-xl text-xs font-medium border ${logic.adaRalatSemakanPost ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-blue-50/60 border-blue-100 text-slate-700'}`}>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Objektif:</span> <span className="font-bold">{logic.postObjektif} markah</span></p>
                                  <p className="flex justify-between border-b border-black/5 pb-1 mb-1"><span>Struktur/Esei:</span> <span className="font-bold">{logic.adaRalatSemakanPost ? '??' : logic.postStruktur} markah</span></p>
                                  <p className={`flex justify-between font-bold ${logic.adaRalatSemakanPost ? 'text-rose-700' : 'text-blue-700'}`}><span>Jumlah Keseluruhan:</span> <span>{logic.adaRalatSemakanPost ? '??' : (logic.postObjektif! + logic.postStruktur!)} / {logic.postPenuh}</span></p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              {logic.post !== undefined && (logic.isLulus || (isKawalan && !logic.rujukGuru)) ? (
                                 <span className={`text-sm font-bold ${logic.isLulus ? 'text-emerald-600' : 'text-amber-600'}`}>Selesai ({logic.post}%)</span>
                              ) : logic.adaRalatSemakanPost ? (
                                 <span className="text-sm font-bold text-rose-600 flex items-center gap-1"><Clock className="w-4 h-4"/> Semakan Guru</span>
                              ) : logic.rujukGuru ? (
                                 <button disabled className="px-4 py-2.5 text-xs font-bold rounded-xl bg-rose-100 text-rose-500 border border-rose-200 w-full flex items-center justify-center gap-1.5 cursor-not-allowed">
                                   <span className="text-sm font-bold text-emerald-600">Selesai ({logic.post}%)</span>
                                 </button>
                              ) : isKawalan && !userData?.bukaPostTest ? (
                                 <button disabled className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-400 border border-slate-200 w-full flex items-center justify-center gap-1.5 cursor-not-allowed shadow-inner">
                                   <Lock className="w-4 h-4"/> Arahan Guru
                                 </button>
                              ) : (
                                <button 
                                  onClick={() => openModule(chapter.id, "post", "", "")}
                                  className="px-5 py-2.5 text-sm font-bold rounded-xl transition-all bg-blue-600 text-white hover:bg-blue-700 shadow-sm w-full"
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

      {/* BUTANG TERAPUNG FEEDBACK */}
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

      {/* 🌟 MODAL SOAL SELIDIK KAJIAN 🌟 */}
      <AnimatePresence>
        {showSurvey && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
              
              {/* Header Modal */}
              <div className="bg-gradient-to-r from-purple-700 to-fuchsia-700 p-5 md:p-6 text-white flex justify-between items-center shrink-0 shadow-md relative z-10">
                <div>
                  <h3 className="font-bold text-lg md:text-xl flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-fuchsia-200"/> 
                    {surveyType === "pre" ? "Soal Selidik Penilaian Sistem (Awalan)" : "Soal Selidik Penilaian Sistem (Akhir)"}
                  </h3>
                  <p className="text-purple-100 text-xs md:text-sm mt-1">Borang Kaji Selidik Murid (Skala 1 - 5)</p>
                </div>
                {/* TUTUP BUTTON HANYA JIKA BUKAN PRE-SURVEY WAJIB */}
                {(surveyType === "post" || hasPreSurvey) && (
                   <button onClick={() => setShowSurvey(false)} className="bg-white/10 p-2 rounded-xl text-purple-100 hover:text-white hover:bg-rose-500 transition-colors"><X className="w-6 h-6" /></button>
                )}
              </div>

              {/* Kandungan Soalan */}
              <div className="p-4 md:p-8 overflow-y-auto flex-1 bg-slate-50 custom-scrollbar">
                 {loadingSurvey ? (
                    <div className="text-center text-slate-500 py-20 flex flex-col items-center">
                       <Loader2 className="animate-spin w-10 h-10 mb-4 text-purple-500" />
                       <p className="font-bold">Memuat turun instrumen soal selidik...</p>
                    </div>
                 ) : surveyQuestions.length === 0 ? (
                    <div className="text-center text-slate-500 py-20">
                       <ClipboardList className="w-16 h-16 mx-auto mb-4 text-slate-300"/>
                       <h4 className="text-lg font-bold text-slate-700 mb-2">Tiada Soal Selidik Aktif</h4>
                       <p>Penyelidik belum memuat naik atau mengaktifkan set soalan buat masa ini.</p>
                    </div>
                 ) : currentSurveyCategoryIndex === -1 ? (
                    // 🌟 PAPARAN PANDUAN RINGKAS SEBELUM MULA MENJAWAB 🌟
                    <div className="space-y-6">
                      <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200 shadow-sm">
                         <h4 className="text-xl font-black text-purple-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                           <Info className="w-6 h-6" /> Panduan Ringkas
                         </h4>
                         <ul className="list-disc ml-5 space-y-3 text-slate-700 text-sm md:text-base leading-relaxed">
                           <li>Soal selidik ini menggunakan bahasa yang mudah dan terus merujuk kepada <strong>pengalaman sebenar</strong> anda menggunakan sistem ini.</li>
                           <li>Setiap item hanya menanyakan satu perkara utama. <strong>Tiada jawapan yang betul atau salah.</strong></li>
                           <li>Sila jawab dengan jujur untuk membantu guru menambah baik laman web pembelajaran ini.</li>
                         </ul>
                      </div>
                      
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-800 mb-4">Petunjuk Skala Jawapan:</h4>
                         <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"><span className="block text-2xl font-black text-purple-600 mb-1">1</span><span className="text-[10px] font-bold uppercase text-slate-600">Sangat Tidak Setuju</span></div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"><span className="block text-2xl font-black text-purple-600 mb-1">2</span><span className="text-[10px] font-bold uppercase text-slate-600">Tidak Setuju</span></div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"><span className="block text-2xl font-black text-purple-600 mb-1">3</span><span className="text-[10px] font-bold uppercase text-slate-600">Tidak Pasti</span></div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center"><span className="block text-2xl font-black text-purple-600 mb-1">4</span><span className="text-[10px] font-bold uppercase text-slate-600">Setuju</span></div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center col-span-2 sm:col-span-1"><span className="block text-2xl font-black text-purple-600 mb-1">5</span><span className="text-[10px] font-bold uppercase text-slate-600">Sangat Setuju</span></div>
                         </div>
                      </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                      
                      {/* Sub-Header Kategori (Pagination) */}
                      <div className="mb-6 border-b border-slate-200 pb-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-extrabold text-purple-800 uppercase tracking-wide">
                            Bahagian {currentSurveyCategoryIndex + 1}
                          </h4>
                          <span className="text-xs font-bold text-slate-400 bg-slate-200 px-3 py-1 rounded-full">
                             {currentSurveyCategoryIndex + 1} / {surveyCategories.length}
                          </span>
                        </div>
                        {/* Progress Bar Halaman */}
                        <div className="h-2 bg-slate-200 rounded-full w-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${((currentSurveyCategoryIndex + 1) / surveyCategories.length) * 100}%` }}></div>
                        </div>
                      </div>

                      {/* Senarai Soalan Untuk Kategori Semasa */}
                      {questionsInCurrentCategory.map((q, idx) => {
                        // Kenal pasti indeks keseluruhan untuk paparan nombor
                        const globalIndex = surveyQuestions.findIndex(sq => sq.id === q.id) + 1;

                        return (
                           <div key={q.id} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-purple-300 transition-colors">
                              <p className="font-semibold text-slate-800 mb-5 leading-relaxed text-sm md:text-base">
                                <span className="text-purple-600 font-black mr-2 text-lg">{globalIndex}.</span> {q.soalan}
                              </p>
                              
                              <div className="grid grid-cols-5 gap-2 md:gap-4">
                                 {[1,2,3,4,5].map(score => {
                                    const isSelected = surveyAnswers[q.id] === score;
                                    let label = "";
                                    if(score === 1) label = "Sangat Tidak Setuju";
                                    else if(score === 2) label = "Tidak Setuju";
                                    else if(score === 3) label = "Tidak Pasti"; // 🌟 Ditukar ke Tidak Pasti
                                    else if(score === 4) label = "Setuju";
                                    else label = "Sangat Setuju";

                                    return (
                                      <button 
                                        key={score} 
                                        onClick={() => setSurveyAnswers({...surveyAnswers, [q.id]: score})}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                                          isSelected 
                                          ? 'bg-purple-100 border-purple-500 text-purple-800 shadow-md transform scale-105' 
                                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                      >
                                         <span className={`text-xl md:text-2xl font-black mb-1.5 ${isSelected ? 'text-purple-700' : 'text-slate-400'}`}>{score}</span>
                                         <span className="text-[9px] md:text-[10px] text-center font-bold leading-tight h-6 flex items-center justify-center uppercase">{label}</span>
                                      </button>
                                    )
                                 })}
                              </div>
                           </div>
                        )
                      })}
                    </div>
                 )}
              </div>

              {/* Footer Modal (Butang Navigasi / Hantar) */}
              {surveyQuestions.length > 0 && !loadingSurvey && (
                <div className="bg-white p-5 border-t border-slate-200 flex justify-between items-center shrink-0">
                  {currentSurveyCategoryIndex === -1 ? (
                    // Butang Mula Menjawab (Di halaman Panduan)
                    <button 
                      onClick={() => setCurrentSurveyCategoryIndex(0)}
                      className="w-full py-3.5 bg-purple-600 text-white hover:bg-purple-700 font-bold rounded-xl shadow-md transition-all text-center flex items-center justify-center gap-2"
                    >
                      Faham & Mula Menjawab <ArrowRight className="w-5 h-5"/>
                    </button>
                  ) : (
                    <>
                      {/* Butang Kembali */}
                      <button 
                        onClick={() => setCurrentSurveyCategoryIndex(prev => prev - 1)}
                        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all bg-slate-100 text-slate-600 hover:bg-slate-200"
                      >
                        <ArrowLeft className="w-4 h-4"/> Kembali
                      </button>
                      
                      {/* Butang Seterusnya / Hantar */}
                      {currentSurveyCategoryIndex === surveyCategories.length - 1 ? (
                        <button 
                          onClick={hantarSoalSelidik} 
                          disabled={isSubmittingSurvey}
                          className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md ${isSubmittingSurvey ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
                        >
                          {isSubmittingSurvey ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5"/>}
                          {isSubmittingSurvey ? 'Menyimpan...' : 'Hantar Kaji Selidik'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            const unanswered = questionsInCurrentCategory.filter(q => !surveyAnswers[q.id]);
                            if(unanswered.length > 0) {
                               alert(`Sila jawab baki ${unanswered.length} soalan dalam bahagian ini sebelum ke halaman seterusnya.`);
                               return;
                            }
                            setCurrentSurveyCategoryIndex(prev => prev + 1);
                          }}
                          className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
                        >
                          Seterusnya <ArrowRight className="w-4 h-4"/>
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL FEEDBACK (Sedia Ada) */}
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
                    value={feedbackJenis} onChange={(e) => setFeedbackJenis(e.target.value)}
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
                     value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)}
                     placeholder="Contoh: Saya suka main game tadi! Tapi kadang-kadang AI lambat sikit balas..."
                     className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:border-sky-500 outline-none resize-y min-h-30 text-sm text-slate-800"
                   ></textarea>
                </div>
                <button 
                  onClick={hantarMaklumBalas} disabled={isSubmitting || !feedbackMsg.trim()}
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