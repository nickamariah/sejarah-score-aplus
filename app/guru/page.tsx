"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, HelpCircle, Save, Zap, Sparkles, Activity, UploadCloud, RefreshCw, CheckSquare, Filter, Menu, X, Search, MessageSquare, Eye, AlertTriangle, Rocket, Palette, Volume2, VolumeX, Music, TrendingUp, TrendingDown, BrainCircuit, ChevronDown, Check } from "lucide-react";

// IMPORT KOMPONEN MAKMAL DATA KAJIAN
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// IMPORT FIREBASE 
import { collection, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp, updateDoc, setDoc, where } from "firebase/firestore";
import { db, app } from "../../lib/firebase"; 
import { initializeApp, getApps } from "firebase/app"; 
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

type TabKey = "murid" | "pemantauan" | "kandungan" | "upload" | "soalan" | "analitik" | "semakan" | "maklumbalas";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [senaraiPengguna, setSenaraiPengguna] = useState<any[]>([]);
  const [loadingPengguna, setLoadingPengguna] = useState(true);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [uRole, setURole] = useState("murid");
  const [uNama, setUNama] = useState("");
  const [uKataLaluan, setUKataLaluan] = useState("");
  const [uTingkatan, setUTingkatan] = useState("4");
  const [uKelas, setUKelas] = useState("");
  const [uTahapInkuiri, setUTahapInkuiri] = useState("Rendah");
  const [uKumpulan, setUKumpulan] = useState("Eksperimen");
  const [uIsSubmitting, setUIsSubmitting] = useState(false);

  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [loadingSoalan, setLoadingSoalan] = useState(true);
  const [isCreatingSoalan, setIsCreatingSoalan] = useState(false);
  const [isEditingSoalan, setIsEditingSoalan] = useState(false);
  const [editSoalanId, setEditSoalanId] = useState<string | null>(null);
  
  // STATE CARIAN & FILTER
  const [searchMurid, setSearchMurid] = useState("");
  const [searchPemantauan, setSearchPemantauan] = useState("");
  
  // 🌟 TAMBAHAN: Filter Baru Untuk Tab Pemantauan
  const [filterTingkatanPemantauan, setFilterTingkatanPemantauan] = useState("Semua");
  const [filterKelasPemantauan, setFilterKelasPemantauan] = useState("Semua");

  const [searchSoalan, setSearchSoalan] = useState("");
  const [searchBahan, setSearchBahan] = useState("");
  const [searchSemakan, setSearchSemakan] = useState("");
  
  const [filterTingkatan, setFilterTingkatan] = useState("Semua");
  const [filterBab, setFilterBab] = useState("Semua");
  const [filterJenis, setFilterJenis] = useState("Semua");
  const [filterKegunaan, setFilterKegunaan] = useState("Semua");
  const [filterTingkatanBahan, setFilterTingkatanBahan] = useState("Semua");

  const [qTingkatan, setQTingkatan] = useState("4");
  const [qBab, setQBab] = useState("Bab 1");
  const [qTopik, setQTopik] = useState("");
  const [qJenis, setQJenis] = useState("objektif"); 
  const [qKegunaan, setQKegunaan] = useState("semua");

  const [qSoalan, setQSoalan] = useState("");
  const [qMarkah, setQMarkah] = useState("1");
  const [qUrutan, setQUrutan] = useState("");
  const [qImageUrl, setQImageUrl] = useState("");
  const [qPilihanA, setQPilihanA] = useState("");
  const [qPilihanB, setQPilihanB] = useState("");
  const [qPilihanC, setQPilihanC] = useState("");
  const [qPilihanD, setQPilihanD] = useState("");
  const [qJawapanBetul, setQJawapanBetul] = useState("A");
  const [qSkema, setQSkema] = useState("");

  const [bTingkatan, setBTingkatan] = useState("4");
  const [bBab, setBBab] = useState("Bab 1");
  const [bJudul, setBJudul] = useState("");
  const [bLinkNota, setBLinkNota] = useState(""); 
  const [isUploadingBahan, setIsUploadingBahan] = useState(false);
  const [senaraiBahan, setSenaraiBahan] = useState<any[]>([]);
  const [loadingBahan, setLoadingBahan] = useState(false);
  
  const [editSubtopikId, setEditSubtopikId] = useState<string | null>(null);
  const [tempSubtopik, setTempSubtopik] = useState<any[]>([]);

  const [senaraiSemakan, setSenaraiSemakan] = useState<any[]>([]);
  const [loadingSemakan, setLoadingSemakan] = useState(false);

  const [senaraiMaklumBalas, setSenaraiMaklumBalas] = useState<any[]>([]);
  const [loadingMaklumBalas, setLoadingMaklumBalas] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  const [expandedBabDetail, setExpandedBabDetail] = useState<number | null>(null); 
  
  const [studentProgressData, setStudentProgressData] = useState<{skor: any[], chat: any[]}>({skor: [], chat: []});
  const [loadingStudentProgress, setLoadingStudentProgress] = useState(false);

  // STATE TEMA & MUZIK
  const senaraiTheme = [
    { id: 'gelap', nama: '🌙 Makmal Gelap', class: 'bg-[#0f172a]' },
    { id: 'angkasa', nama: '🌌 Kosmos', class: 'bg-gradient-to-br from-indigo-950 via-purple-900 to-black' },
    { id: 'cerah', nama: '🌞 Makmal Cerah', class: 'bg-slate-100 text-slate-800' },
    { id: 'senja', nama: '🌅 Senja Merah', class: 'bg-gradient-to-br from-rose-900 via-orange-900 to-black' },
  ];
  const [selectedTheme, setSelectedTheme] = useState(senaraiTheme[0].class);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('guruTheme');
    if (savedTheme) setSelectedTheme(savedTheme);
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSelectedTheme(newVal);
    localStorage.setItem('guruTheme', newVal);
  };

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  const senaraiSubtopik: any = {
    "4": {
      "Bab 1": ["1.1 Warisan Negara Bangsa", "1.2 Ciri-ciri Negara Bangsa", "1.3 Keunggulan Sistem Pentadbiran", "1.4 Peranan Pemerintah dan Rakyat"],
      "Bab 2": ["2.1 Maksud Nasionalisme", "2.2 Nasionalisme di Barat", "2.3 Nasionalisme di Asia", "2.4 Nasionalisme di Asia Tenggara", "2.5 Kesedaran Nasionalisme di Negara Kita", "2.6 Faktor Kemunculan Gerakan Nasionalisme", "2.7 Perkembangan Nasionalisme", "2.8 Kesan Perkembangan Nasionalisme"],
      "Bab 3": ["3.1 Nasionalisme di Negara Kita Sebelum Perang Dunia", "3.2 Latar Belakang Perang Dunia", "3.3 Perang Dunia Kedua", "3.4 Perang Dunia Kedua di Asia Pasifik", "3.5 Faktor Kedatangan Jepun ke Negara Kita", "3.6 Dasar Pendudukan Jepun di Negara Kita", "3.7 Perjuangan Rakyat Menentang Pendudukan Jepun", "3.8 Perkembangan Gerakan Nasionalisme Tempatan dan Pendudukan Jepun", "3.9 Keadaan Negara Kita Selepas Kekalahan Jepun"],
      "Bab 4": ["4.1 British Military Administration ", "4.2 Gagasan Malayan Union ", "4.3 Reaksi Penduduk Tempatan terhadap Malayan Union","4.4  Penyerahan Sarawak kepada Kerajaan British ","4.5  Reaksi Penduduk Tempatan terhadap Penyerahan Sarawak ","4.6  Penyerahan Sabah kepada Kerajaan British ","4.7  Reaksi Penduduk Tempatan terhadap Penyerahan Sabah "],
      "Bab 5": ["5.1 Latar Belakang Penubuhan Persekutuan Tanah Melayu 1948 ", "5.2 Faktor Penubuhan Persekutuan Tanah Melayu 1948 ", "5.3 Ciri-ciri Persekutuan Tanah Melayu 1948 ","5.4  Kesan Penubuhan Persekutuan Tanah Melayu 1948 "],
      "Bab 6": ["6.1 Kemasukan Pengaruh Komunis di Negara Kita ", "6.2 Ancaman Komunis di Negara Kita ", "6.3 Usaha Menangani Ancaman Komunis ","6.4  Kesan Zaman Darurat terhadap Negara Kita "],
      "Bab 7": ["7.1 Latar Belakang Idea Negara Merdeka ", "7.2 Jawatankuasa Hubungan Antara Kaum ", "7.3 Sistem Ahli ","7.4  Sistem Pendidikan Kebangsaan ","7.5  Penubuhan Parti Politik "],
      "Bab 8": ["8.1 Perkembangan Pilihan Raya di Persekutuan Tanah Melayu ", "8.2 Proses Pilihan Raya Umum Pertama ", "8.3 Penubuhan Majlis Perundangan Persekutuan ","8.4  Peranan Kabinet Pertama Persekutuan Tanah Melayu "],
      "Bab 9": ["9.1 Usaha Rundingan Kemerdekaan ", "9.2 Peranan Suruhanjaya Perlembagaan Persekutuan Tanah Melayu ", "9.3 Langkah Penggubalan Perlembagaan Persekutuan Tanah Melayu yang Merdeka ","9.4  Perjanjian Persekutuan Tanah Melayu "],
      "Bab 10": ["10.1 Pengertian Kemerdekaan ", "10.2 Persediaan Menyambut Pemasyhuran Kemerdekaan Negara ", "10.3 Detik Pemasyhuran Kemerdekaan Negara ","10.4  Kesan Kemerdekaan terhadap Negara Kita ","10.5  Prinsip Kedaulatan Persekutuan Tanah Melayu "],
    },
    "5": {
      "Bab 1": ["1.1 Konsep Kedaulatan", "1.2 Ciri Negara yang Berdaulat", "1.3 Kepentingan Mewujudkan Negara Berdaulat", "1.4 Langkah Mempertahankan Kedaulatan"],
      "Bab 2": ["2.1 Latar Belakang Perlembagaan", "2.2 Sejarah Penggubalan Perlembagaan Persekutuan"],
      "Bab 3": ["3.1 Latar Belakang Pemerintahan Beraja dan Demokrasi Berparlimen", "3.2 Sejarah dan Kedudukan Institusi Majlis Raja-Raja", "3.3 Yang di-Pertuan Agong dan Raja dalam Perlembagaan Persekutuan", "3.4 Amalan Demokrasi dan Pengasingan Kuasa"],
      "Bab 4": ["4.1 Latar Belakang Sistem Persekutuan di Negara Kita", "4.2 Kuasa Kerajaan Persekutuan dan Kerajaan Negeri", "4.3 Kerjasama Kerajaan Persekutuan dan Kerajaan Negeri", "4.4 Faktor yang Mengukuhkan Sistem Persekutuan"],
      "Bab 5": ["5.1 Konsep Gagasan Malaysia", "5.2 Perkembangan Idea dan Usaha Pembentukan Malaysia", "5.3 Reaksi Tempatan dan Negara Jiran terhadap Pembentukan Malaysia", "5.4 Langkah Pembentukan Malaysia", "5.5 Perjanjian Julai 1963 dan Peristiwa Pengisytiharan Malaysia", "5.6 Konfrontasi dan Usaha Menangani"],
      "Bab 6": ["6.1 Cabaran Dalaman Malaysia", "6.2 Pemisahan Singapura", "6.3 Menangani Ancaman Komunis", "6.4 Isu Pembangunan dan Ekonomi", "6.5 Tragedi Hubungan Antara Kaum"],
      "Bab 7": ["7.1 Perpaduan dan Integrasi Nasional", "7.2 Dasar Pendidikan Kebangsaan", "7.3 Bahasa Melayu sebagai Bahasa Ilmu dan Bahasa Perpaduan", "7.4 Dasar Kebudayaan Kebangsaan", "7.5 Sukan sebagai Alat Perpaduan", "7.6 Rukun Negara sebagai Tonggak Kesejahteraan Negara"],
      "Bab 8": ["8.1 Pembentukan Dasar Ekonomi Baru (DEB)", "8.2 Pelaksanaan Dasar Ekonomi Baru (DEB)", "8.3 Pembentukan Dasar Pembangunan Nasional (DPN)", "8.4 Pelaksanaan Dasar Pembangunan Nasional (DPN)", "8.5 Pencapaian Dasar Ekonomi Baru (DEB) dan Dasar Pembangunan Nasional (DPN)"],
      "Bab 9": ["9.1 Latar Belakang Dasar Luar", "9.2 Asas Penggubalan Dasar Luar", "9.3 Malaysia dalam Pertubuhan Bangsa-Bangsa Bersatu (PBB)", "9.4 Malaysia dalam Komanwel", "9.5 Cabaran Mengukuhkan Dasar Luar", "9.6 Malaysia dalam Persatuan Negara-Negara Asia Tenggara (ASEAN)", "9.7 Malaysia dalam Pergerakan Negara-Negara Tanpa Pihak (NAM)", "9.8 Malaysia dalam Pertubuhan Kerjasama Islam (OIC)"],
      "Bab 10": ["10.1 Malaysia dalam Isu Global Kontemporari", "10.2 Peranan Malaysia dalam Hubungan Ekonomi Antarabangsa", "10.3 Pelibatan Rakyat dalam Isu Kemanusiaan dan Keamanan", "10.4 Usaha Mengekalkan Kelestarian Global", "10.5 Wawasan Malaysia Menuju Masa Hadapan"]
    }
  };

  const subtopikPilihan = senaraiSubtopik[qTingkatan]?.[qBab] || [`Subtopik Umum ${qBab}`];

  useEffect(() => {
    if (!isEditingSoalan) setQTopik(subtopikPilihan[0] || "");
  }, [qTingkatan, qBab, isEditingSoalan]);

  useEffect(() => {
    const tarikDetailMurid = async () => {
      if (selectedStudentDetail) {
        setLoadingStudentProgress(true);
        setExpandedBabDetail(null); 
        try {
          const targetIds = [selectedStudentDetail.id];
          if (selectedStudentDetail.idPengguna) targetIds.push(selectedStudentDetail.idPengguna);
          const uniqueIds = [...new Set(targetIds)];

          const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
          const snapSkor = await getDocs(qSkor);
          const skorData = snapSkor.docs.map(d => d.data());

          const qChat = query(collection(db, "chat_sessions"), where("studentId", "in", uniqueIds));
          const snapChat = await getDocs(qChat);
          const chatData = snapChat.docs.map(d => d.data());

          setStudentProgressData({ skor: skorData, chat: chatData });
        } catch (error) {
          console.error("Gagal tarik progress murid", error);
        } finally {
          setLoadingStudentProgress(false);
        }
      }
    };
    tarikDetailMurid();
  }, [selectedStudentDetail]);

  const tarikDataPenggunaFirebase = async () => {
    setLoadingPengguna(true);
    try {
      const q = query(collection(db, "users"), orderBy("tarikhDaftar", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() } as any;
        data.push(user);
      });
      setSenaraiPengguna(data); 
    } catch (error) { console.error(error); } finally { setLoadingPengguna(false); }
  };

  const tarikSoalanFirebase = async () => {
    setLoadingSoalan(true);
    try {
      const q = query(collection(db, "questionBank"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => { data.push({ id: doc.id, ...doc.data() }); });
      data.sort((a, b) => {
        const masaA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const masaB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return masaB - masaA;
      });
      setSoalanList(data);
    } catch (error) { console.error(error); } finally { setLoadingSoalan(false); }
  };

  const tarikBahanFirebase = async () => {
    setLoadingBahan(true);
    try {
      const q = query(collection(db, "chapters"), orderBy("pdfFileName", "asc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => { data.push({ id: doc.id, ...doc.data() }); });
      setSenaraiBahan(data);
    } catch (error) { console.error(error); } finally { setLoadingBahan(false); }
  };

  const tarikDataSemakan = async () => {
    setLoadingSemakan(true);
    try {
      const q = query(collection(db, "skor_murid"), orderBy("tarikh", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => { 
        const docData = doc.data();
        if (docData.statusPermarkahanEsei && docData.statusPermarkahanEsei !== "tiada_esei") {
           data.push({ id: doc.id, ...docData }); 
        }
      });
      setSenaraiSemakan(data);
    } catch (error) { console.error(error); } finally { setLoadingSemakan(false); }
  };

  const tarikDataMaklumBalas = async () => {
    setLoadingMaklumBalas(true);
    try {
      const q = query(collection(db, "maklum_balas_murid"), orderBy("tarikh", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      setSenaraiMaklumBalas(data);
    } catch(error) { console.error(error); } finally { setLoadingMaklumBalas(false); }
  };

  useEffect(() => { 
    tarikSoalanFirebase(); tarikDataPenggunaFirebase(); tarikBahanFirebase(); tarikDataSemakan(); tarikDataMaklumBalas();
  }, []);

  const handleSimpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uKataLaluan.length < 6) return showToastMessage("Kata laluan sekurang-kurangnya 6 aksara!", "error");
    setUIsSubmitting(true);
    
    try {
      if (isEditingUser && editUserId) {
        const updateData: any = { nama: uNama, kataLaluan: uKataLaluan, role: uRole };
        if (uRole === "murid") { updateData.tingkatan = String(uTingkatan); updateData.kelas = uKelas; updateData.tahapInkuiri = uTahapInkuiri; updateData.kumpulan = uKumpulan; }
        await updateDoc(doc(db, "users", editUserId), updateData);
        showToastMessage("Akaun berjaya dikemas kini!", "success");
      } else {
        let awalan = "M"; 
        if (uRole === "murid") {
          const numTing = String(uTingkatan).replace(/\D/g, "") || "4"; 
          const hurufK = uKumpulan === "Eksperimen" ? "E" : "K";
          awalan = `M${hurufK}${numTing}`; 
        } else if (uRole === "guru") awalan = "G"; else if (uRole === "admin") awalan = "A";

        const penggunaSamaRole = senaraiPengguna.filter(u => u.id && u.id.startsWith(awalan));
        let maxNumber = 0;
        penggunaSamaRole.forEach(u => {
          const numPart = parseInt(u.id.substring(awalan.length)); 
          if (!isNaN(numPart) && numPart > maxNumber) maxNumber = numPart;
        });
        
        const newId = `${awalan}${String(maxNumber + 1).padStart(3, '0')}`;
        const emailMaya = `${newId.toLowerCase()}@irags.edu`;

        try {
          const apps = getApps();
          let secondaryApp = apps.find(a => a.name === "AppPendaftaranRahsia");
          if (!secondaryApp) secondaryApp = initializeApp(app.options, "AppPendaftaranRahsia");
          const secondaryAuth = getAuth(secondaryApp);
          await createUserWithEmailAndPassword(secondaryAuth, emailMaya, uKataLaluan);
          await signOut(secondaryAuth); 
        } catch (error: any) { 
          console.error("Firebase Auth Error Sebenar:", error);
          if (error.code === 'auth/email-already-in-use') {
             showToastMessage(`Ralat: E-mel ${emailMaya} sudah wujud di Firebase. Sila padam di Firebase Console.`, "error");
          } else {
             showToastMessage(`Ralat Pendaftaran: ${error.code || error.message}`, "error"); 
          }
          setUIsSubmitting(false); 
          return; 
        }

        const newUserData: any = { nama: uNama, email: emailMaya, kataLaluan: uKataLaluan, role: uRole, idPengguna: newId, tarikhDaftar: new Date().toISOString() };
        if (uRole === "murid") { newUserData.tingkatan = String(uTingkatan); newUserData.kelas = uKelas; newUserData.tahapInkuiri = uTahapInkuiri; newUserData.kumpulan = uKumpulan; newUserData.markahTerkini = 0; }
        await setDoc(doc(db, "users", newId), newUserData); showToastMessage("Akaun baru didaftar!", "success");
      }
      resetFormPengguna(); tarikDataPenggunaFirebase();
    } catch (error) { showToastMessage("Ralat sistem. Sila cuba lagi.", "error"); } finally { setUIsSubmitting(false); }
  };

  const handlePadamPengguna = async (id: string) => { if (confirm("Pasti mahu memadam akaun ini?")) { try { await deleteDoc(doc(db, "users", id)); showToastMessage("Berjaya dipadam.", "success"); tarikDataPenggunaFirebase(); } catch (error) { showToastMessage("Ralat.", "error"); } } };
  
  const setEditPengguna = (u: any) => { 
    setIsEditingUser(true); setEditUserId(u.id); setURole(u.role || "murid"); setUNama(u.nama || ""); setUKataLaluan(u.kataLaluan || ""); setUTingkatan(String(u.tingkatan || "4")); setUKelas(u.kelas || ""); setUTahapInkuiri(u.tahapInkuiri || "Rendah"); setUKumpulan(u.kumpulan || "Eksperimen"); 
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  
  const resetFormPengguna = () => { setIsEditingUser(false); setEditUserId(null); setURole("murid"); setUNama(""); setUKataLaluan(""); setUTingkatan("4"); setUKelas(""); setUTahapInkuiri("Rendah"); setUKumpulan("Eksperimen"); };

  const handleSimpanSoalan = async () => {
    if (!qSoalan || !qTopik) return showToastMessage("Isi Soalan & Subtopik!", "error");
    setUIsSubmitting(true);
    try {
      const dataSoalan: any = { tingkatan: qTingkatan, bab: qBab, topik: qTopik, jenis: qJenis, kegunaan: qKegunaan, soalan: qSoalan, markah: parseInt(qMarkah) || 1, urutan: qUrutan ? parseInt(qUrutan) : 999, imageUrl: qImageUrl };
      if (qJenis === "objektif") { 
        if (!qPilihanA || !qPilihanB) return showToastMessage("Isi pilihan!", "error"); 
        dataSoalan.pilihan = { A: qPilihanA, B: qPilihanB, C: qPilihanC, D: qPilihanD }; dataSoalan.jawapan = qJawapanBetul; 
      } else { 
        if (!qSkema) return showToastMessage("Isi Skema!", "error"); 
        dataSoalan.skemaJawapan = qSkema; 
      }

      if (isEditingSoalan && editSoalanId) { 
        dataSoalan.updatedAt = serverTimestamp(); await updateDoc(doc(db, "questionBank", editSoalanId), dataSoalan); showToastMessage(`Dikemas kini!`, "success"); 
      } else {
        dataSoalan.createdAt = serverTimestamp();
        const babNum = qBab.replace(/\D/g, ""); const typeChar = qJenis === "objektif" ? "Q" : "S"; const awalanSoalan = `B${babNum}${typeChar}`; 
        const soalanSamaAwalan = soalanList.filter(s => s.id && s.id.startsWith(awalanSoalan));
        let maxNum = 0; soalanSamaAwalan.forEach(s => { const numPart = parseInt(s.id.substring(awalanSoalan.length)); if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart; });
        const customIdSoalan = `${awalanSoalan}${String(maxNum + 1).padStart(3, '0')}`;
        await setDoc(doc(db, "questionBank", customIdSoalan), dataSoalan); showToastMessage(`Ditambah!`, "success");
      }
      resetFormSoalan(); tarikSoalanFirebase();
    } catch (error) { showToastMessage("Ralat.", "error"); } finally { setUIsSubmitting(false); }
  };

  const handleEditSoalan = (q: any) => { 
    setIsEditingSoalan(true); setEditSoalanId(q.id); setQTingkatan(q.tingkatan || "4"); setQBab(q.bab || "Bab 1"); setQTopik(q.topik || ""); setQJenis(q.jenis || "objektif"); setQKegunaan(q.kegunaan || "semua"); setQSoalan(q.soalan || ""); setQMarkah(q.markah?.toString() || "1"); setQUrutan(q.urutan === 999 ? "" : q.urutan?.toString() || ""); setQImageUrl(q.imageUrl || ""); 
    if (q.jenis === "objektif" && q.pilihan) { setQPilihanA(q.pilihan.A || ""); setQPilihanB(q.pilihan.B || ""); setQPilihanC(q.pilihan.C || ""); setQPilihanD(q.pilihan.D || ""); setQJawapanBetul(q.jawapan || "A"); } else { setQSkema(q.skemaJawapan || ""); } 
    setIsCreatingSoalan(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetFormSoalan = () => { setIsCreatingSoalan(false); setIsEditingSoalan(false); setEditSoalanId(null); setQSoalan(""); setQTopik(""); setQKegunaan("semua"); setQSkema(""); setQImageUrl(""); setQMarkah("1"); setQUrutan(""); setQPilihanA(""); setQPilihanB(""); setQPilihanC(""); setQPilihanD(""); setQJawapanBetul("A"); };
  const handlePadamSoalan = async (id: string) => { if (confirm("Padam soalan?")) { try { await deleteDoc(doc(db, "questionBank", id)); showToastMessage("Berjaya dipadam.", "success"); tarikSoalanFirebase(); } catch (error) { showToastMessage("Ralat.", "error"); } } };

  const handleSimpanBahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bJudul || !bLinkNota) return showToastMessage("Isi tajuk & masukkan pautan nota!", "error");
    setIsUploadingBahan(true);
    const babNumber = bBab.replace(/\D/g, ""); const documentId = `tingkatan${bTingkatan}_bab${babNumber}`;
    try {
      const listSub = senaraiSubtopik[bTingkatan]?.[bBab] || [];
      const subtopicsArray = listSub.map((sub: string) => { const parts = sub.split(" "); return { id: parts[0], title: parts.slice(1).join(" "), startPage: 1 }; });
      await setDoc(doc(db, "chapters", documentId), { title: bJudul, subject: "Sejarah", form: parseInt(bTingkatan), chapterUrl: bLinkNota, pdfFileName: documentId, subtopics: subtopicsArray, updatedAt: serverTimestamp() });
      showToastMessage(`Berjaya daftar Nota untuk ${bBab}!`, "success"); setBJudul(""); setBLinkNota(""); tarikBahanFirebase(); setActiveTab("kandungan"); 
    } catch (error) { showToastMessage("Gagal menyimpan data.", "error"); } finally { setIsUploadingBahan(false); }
  };

  const handlePadamBahan = async (bahanId: string) => {
    if (confirm(`Pasti padam modul (${bahanId})? Tindakan ini kekal.`)) { try { await deleteDoc(doc(db, "chapters", bahanId)); showToastMessage("Bahan nota berjaya dipadam.", "success"); tarikBahanFirebase(); } catch (error) { showToastMessage("Ralat memadam nota.", "error"); } }
  };

  const handleKemaskiniSubtopik = async (bahan: any) => {
    const tingkatanStr = bahan.form.toString(); const babNum = bahan.id.split('_bab')[1]; const babKey = `Bab ${babNum}`;             
    const listSub = senaraiSubtopik[tingkatanStr]?.[babKey] || []; const existingSubs = bahan.subtopics || [];
    const subtopicsArray = listSub.map((sub: string) => {
      const parts = sub.split(" "); const id = parts[0]; const title = parts.slice(1).join(" "); const wujud = existingSubs.find((e: any) => e.id === id);
      return { id, title, startPage: wujud ? wujud.startPage : 1, videoUrl: wujud?.videoUrl || "", notaUrl: wujud?.notaUrl || "", teksAI: wujud?.teksAI || "" };
    });
    if(subtopicsArray.length === 0) return showToastMessage(`Tiada senarai subtopik dalam memori untuk ${babKey}.`, "error");
    try { await updateDoc(doc(db, "chapters", bahan.id), { subtopics: subtopicsArray, updatedAt: serverTimestamp() }); showToastMessage(`Senarai subtopik diselaraskan!`, "success"); tarikBahanFirebase(); } catch (error) { showToastMessage("Ralat sync subtopik.", "error"); }
  };

  const handleSimpanMukaSurat = async (bahanId: string) => { try { await updateDoc(doc(db, "chapters", bahanId), { subtopics: tempSubtopik, updatedAt: serverTimestamp() }); showToastMessage("Maklumat Subtopik berjaya disimpan!", "success"); setEditSubtopikId(null); tarikBahanFirebase(); } catch(error) { showToastMessage("Ralat menyimpan maklumat.", "error"); } };
  const showToastMessage = (msg: string, type: 'success'|'error'|'info'='info') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const handleLogout = () => { window.location.href = '/login'; };

  // 🌟 FILTERING LOGICS (Dikemas kini)
  const filteredPengguna = senaraiPengguna.filter(u => u.nama?.toLowerCase().includes(searchMurid.toLowerCase()) || u.idPengguna?.toLowerCase().includes(searchMurid.toLowerCase()) || u.kelas?.toLowerCase().includes(searchMurid.toLowerCase()));
  
  // 🌟 Filter Baru untuk Pemantauan
  const filteredPemantauan = senaraiPengguna.filter(u => {
    if (u.role !== "murid") return false;
    const matchSearch = u.nama?.toLowerCase().includes(searchPemantauan.toLowerCase()) || u.idPengguna?.toLowerCase().includes(searchPemantauan.toLowerCase());
    const matchTingkatan = filterTingkatanPemantauan === "Semua" || String(u.tingkatan) === filterTingkatanPemantauan;
    const matchKelas = filterKelasPemantauan === "Semua" || u.kelas === filterKelasPemantauan;
    return matchSearch && matchTingkatan && matchKelas;
  });

  // 🌟 PENGIRAAN STATISTIK PEMANTAUAN (Dinamik)
  const statPemantauan = {
    jumlah: filteredPemantauan.length,
    tinggi: filteredPemantauan.filter(u => u.tahapInkuiri === 'Tinggi').length,
    sederhana: filteredPemantauan.filter(u => u.tahapInkuiri === 'Sederhana').length,
    rendah: filteredPemantauan.filter(u => u.tahapInkuiri === 'Rendah').length,
  };

  const soalanListFiltered = soalanList.filter((q) => {
    const matchTingkatan = filterTingkatan === "Semua" || q.tingkatan === filterTingkatan;
    const matchBab = filterBab === "Semua" || q.bab === filterBab;
    const matchJenis = filterJenis === "Semua" || q.jenis === filterJenis;
    const matchKegunaan = filterKegunaan === "Semua" || (filterKegunaan === "pre_post" && (q.kegunaan === "semua" || !q.kegunaan)) || (filterKegunaan === "semua_ujian" && q.kegunaan === "semua_ujian") || q.kegunaan === filterKegunaan;
    const matchSearch = searchSoalan === "" || q.soalan?.toLowerCase().includes(searchSoalan.toLowerCase()) || q.topik?.toLowerCase().includes(searchSoalan.toLowerCase());
    return matchTingkatan && matchBab && matchJenis && matchKegunaan && matchSearch;
  });

  const filteredBahan = senaraiBahan.filter(b => {
    const matchTingkatan = filterTingkatanBahan === "Semua" || b.form?.toString() === filterTingkatanBahan;
    const matchSearch = searchBahan === "" || b.title?.toLowerCase().includes(searchBahan.toLowerCase());
    return matchTingkatan && matchSearch;
  });

  const filteredSemakan = senaraiSemakan.filter(s => {
    const realUser = senaraiPengguna.find(u => u.id === s.idMurid || u.idPengguna === s.idMurid);
    const paparNama = realUser?.nama || realUser?.name || s.namaMurid || "Pelajar";
    return paparNama.toLowerCase().includes(searchSemakan.toLowerCase()) || s.bab?.toLowerCase().includes(searchSemakan.toLowerCase());
  });

  return (
    <div className={`flex h-screen text-slate-200 font-sans overflow-hidden transition-colors duration-700 ${selectedTheme}`}>
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && ( <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} /> )}

      {/* SIDEBAR (Glassmorphism) */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-700 p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 md:relative md:translate-x-0 shrink-0 shadow-2xl ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="overflow-y-auto pr-2 no-scrollbar">
          <div className="mb-8 flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">I-RAGs<span className="text-cyan-400">.Admin</span></h1>
               <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Makmal Penyelidikan</p>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white bg-white/10 p-1.5 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
          </div>
          <nav className="space-y-1.5">
            <button onClick={() => {setActiveTab("murid"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "murid" ? "bg-blue-600/90 text-white shadow-lg shadow-blue-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><Users size={18} /> Pengurusan Pengguna</button>
            <button onClick={() => {setActiveTab("pemantauan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "pemantauan" ? "bg-emerald-600/90 text-white shadow-lg shadow-emerald-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><Activity size={18} /> Pemantauan Murid</button>
            <button onClick={() => {setActiveTab("semakan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "semakan" ? "bg-rose-600/90 text-white shadow-lg shadow-rose-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><CheckSquare size={18} /> Semakan Esei Ujian</button>
            <button onClick={() => {setActiveTab("soalan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "soalan" ? "bg-cyan-600/90 text-white shadow-lg shadow-cyan-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><HelpCircle size={18} /> Bank Soalan</button>
            <button onClick={() => {setActiveTab("kandungan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "kandungan" ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><BookOpen size={18} /> Senarai Nota & Modul</button>
            <button onClick={() => {setActiveTab("upload"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "upload" ? "bg-amber-600/90 text-white shadow-lg shadow-amber-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><FileText size={18} /> Tambah Nota Baru</button>
            <button onClick={() => {setActiveTab("maklumbalas"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "maklumbalas" ? "bg-fuchsia-600/90 text-white shadow-lg shadow-fuchsia-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><MessageSquare size={18} /> Rekod Maklum Balas</button>
            <button onClick={() => {setActiveTab("analitik"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === "analitik" ? "bg-purple-600/90 text-white shadow-lg shadow-purple-900/50" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}><ChartBar size={18} /> Analitik / SPSS (Data)</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors mt-4 text-sm font-bold shadow-sm"><LogOut size={18} /> Log Keluar</button>
      </div>

      {/* KANDUNGAN UTAMA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full bg-slate-900/40 backdrop-blur-sm">
        
        {/* HEADER MUDAH ALIH */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-md">
          <h2 className="text-xl font-bold text-white tracking-wide">I-RAGS<span className="text-cyan-500">.Admin</span></h2>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-700 text-slate-200 rounded-lg hover:bg-slate-600"><Menu size={22}/></button>
        </div>

        {/* HEADER TOP (Tema & Muzik) */}
        <header className="hidden md:flex mb-8 pb-6 border-b border-slate-700/50 justify-between items-end">
          <div>
            <p className="text-cyan-400 text-xs font-bold tracking-widest uppercase mb-1 flex items-center gap-2"><Sparkles size={14}/> Sistem Pengurusan Maklumat</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Dashboard Guru & Penyelidik</h2>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shadow-sm backdrop-blur-md">
                <Palette size={16} className="text-slate-300 ml-2" />
                <select value={selectedTheme} onChange={handleThemeChange} className="bg-transparent text-xs font-bold text-slate-200 outline-none cursor-pointer py-1.5 pl-2 pr-2 hover:text-white transition-colors appearance-none">
                  {senaraiTheme.map(theme => (<option className="bg-slate-800 text-white" key={theme.id} value={theme.class}>{theme.nama}</option>))}
                </select>
             </div>
             <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 shadow-sm backdrop-blur-md">
                <button onClick={toggleMusic} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white" title={isMusicPlaying ? "Hentikan Muzik" : "Mainkan Muzik"}>
                  {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <div className="w-px h-5 bg-slate-600 mx-1.5"></div>
                <div className="flex items-center gap-1.5 px-2 pr-3 text-xs font-bold text-slate-200">
                  <Music size={14} className="opacity-80" /><span>📖 Selawat</span>
                </div>
                <audio ref={audioRef} loop src="/selawat.mp3" /> 
             </div>
          </div>
        </header>

       <main>
          {/* TAB 1: PENGURUSAN PENGGUNA */}
          {activeTab === "murid" && (
             <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 gap-4 shadow-xl">
                <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Users className="text-blue-400"/> Pengurusan Pengguna</h3><p className="text-slate-400 text-sm">Daftar, kemas kini, dan urus akaun sistem.</p></div>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                   <input type="text" placeholder="Cari nama / ID pengguna..." value={searchMurid} onChange={(e) => setSearchMurid(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none shadow-inner" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 lg:col-span-1 h-fit shadow-xl order-last lg:order-first">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Users className="text-blue-400" size={20}/> {isEditingUser ? "Kemas Kini Akaun" : "Daftar Akaun Baru"}</h4>
                  <form onSubmit={handleSimpanPengguna} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5 font-medium">Peranan (Role)</label>
                      <select value={uRole} onChange={e => setURole(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-blue-500 shadow-inner">
                        <option className="bg-slate-900 text-white" value="murid">Murid</option>
                        <option className="bg-slate-900 text-white" value="guru">Guru</option>
                        <option className="bg-slate-900 text-white" value="admin">Admin</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-slate-400 mb-1.5 font-medium">Nama Penuh</label><input type="text" value={uNama} onChange={e => setUNama(e.target.value)} required placeholder="Contoh: Ahmad" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none shadow-inner"/></div>
                    <div><label className="block text-sm text-slate-400 mb-1.5 font-medium">Kata Laluan</label><input type="text" value={uKataLaluan} onChange={e => setUKataLaluan(e.target.value)} required placeholder="123456" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none shadow-inner"/></div>
                    {uRole === "murid" && (
                      <div className="p-4 bg-blue-900/20 rounded-xl border border-blue-800/50 mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">Tingkatan</label>
                            <select value={uTingkatan} onChange={e => setUTingkatan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500">
                              <option className="bg-slate-900 text-white" value="4">Tingkatan 4</option>
                              <option className="bg-slate-900 text-white" value="5">Tingkatan 5</option>
                            </select>
                          </div>
                          <div><label className="block text-sm text-slate-400 mb-1.5">Kelas</label><input type="text" value={uKelas} onChange={e => setUKelas(e.target.value)} required placeholder="Cth: Sains" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:border-blue-500 outline-none"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">Inkuiri Awal</label>
                            <select value={uTahapInkuiri} onChange={e => setUTahapInkuiri(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500">
                              <option className="bg-slate-900 text-white" value="Rendah">Rendah</option>
                              <option className="bg-slate-900 text-white" value="Sederhana">Sederhana</option>
                              <option className="bg-slate-900 text-white" value="Tinggi">Tinggi</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1.5">Kumpulan</label>
                            <select value={uKumpulan} onChange={e => setUKumpulan(e.target.value)} className="w-full bg-slate-900 border border-cyan-800/50 rounded-xl p-2.5 text-cyan-400 font-bold outline-none focus:border-cyan-500">
                              <option className="bg-slate-900 text-cyan-400" value="Eksperimen">Eksperimen</option>
                              <option className="bg-slate-900 text-cyan-400" value="Kawalan">Kawalan</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      {isEditingUser && ( <button type="button" onClick={resetFormPengguna} className="flex-1 bg-slate-700 text-white font-semibold py-3 rounded-xl hover:bg-slate-600 text-sm shadow-md transition-colors">Batal</button> )}
                      <button type="submit" disabled={uIsSubmitting} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-500 shadow-md shadow-blue-900/50 text-sm transition-all">{uIsSubmitting ? "Menyimpan..." : isEditingUser ? "Simpan Perubahan" : "Daftar Akaun"}</button>
                    </div>
                  </form>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden lg:col-span-2 shadow-xl">
                  {loadingPengguna ? ( <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data pengguna... ⏳</div> ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead><tr className="border-b border-slate-700 bg-slate-900/50"><th className="p-4 font-semibold text-sm text-slate-300">Pengguna</th><th className="p-4 font-semibold text-sm text-slate-300">Peranan</th><th className="p-4 font-semibold text-sm text-slate-300">Kelas/Tahap</th><th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                        <tbody>
                          {filteredPengguna.length > 0 ? filteredPengguna.map((u, i) => (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="p-4"><div className="font-bold text-slate-200">{u.nama}</div><div className="text-slate-500 text-xs mt-1">ID: <span className="text-amber-400 font-mono">{u.idPengguna || u.id}</span></div></td>
                              <td className="p-4"><span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-purple-900/40 text-purple-400 border border-purple-800/50' : u.role === 'guru' ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800/50' : 'bg-blue-900/40 text-blue-400 border border-blue-800/50'}`}>{u.role}</span></td>
                              <td className="p-4 text-slate-400 text-sm">{u.role === "murid" ? (<div className="flex flex-col items-start gap-1.5"><div className="font-medium text-slate-200">Tg. {u.tingkatan} {u.kelas}</div><span className="text-[9px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-300 font-bold uppercase tracking-wider shadow-sm">{u.kumpulan || "Eksperimen"}</span></div>) : <span>- N/A -</span>}</td>
                              <td className="p-4 text-right align-middle">
                                 <div className="flex items-center justify-end gap-2">
                                   <button onClick={() => setEditPengguna(u)} className="bg-slate-700/50 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-amber-600 transition-colors shadow-sm" title="Edit Pengguna"><Edit3 size={16} /></button>
                                   <button onClick={() => handlePadamPengguna(u.id)} className="bg-slate-700/50 p-2 rounded-lg text-slate-300 hover:text-white hover:bg-red-600 transition-colors shadow-sm" title="Padam Pengguna"><Trash2 size={16} /></button>
                                 </div>
                              </td>
                            </tr>
                          )) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tiada rekod padanan ditemui.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEMANTAUAN I-RAGS & DETAIL MURID */}
          {activeTab === "pemantauan" && ( 
             <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 gap-4 shadow-xl">
                 <div>
                   <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3"><Activity className="text-emerald-400" size={24}/> Pemantauan Status Murid</h3>
                   <p className="text-slate-400 text-sm">Pantau tahap inkuiri dan akses profil pembelajaran murid.</p>
                 </div>
                 
                 {/* 🌟 KEMAS KINI: FILTER TINGKATAN, KELAS & CARIAN */}
                 <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                   <select value={filterTingkatanPemantauan} onChange={(e) => {setFilterTingkatanPemantauan(e.target.value); setFilterKelasPemantauan("Semua");}} className="w-full sm:w-auto bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:border-emerald-500 outline-none shadow-inner">
                      <option className="bg-slate-900" value="Semua">Semua Tingkatan</option>
                      <option className="bg-slate-900" value="4">Tingkatan 4</option>
                      <option className="bg-slate-900" value="5">Tingkatan 5</option>
                   </select>
                   <select value={filterKelasPemantauan} onChange={(e) => setFilterKelasPemantauan(e.target.value)} className="w-full sm:w-auto bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-sm focus:border-emerald-500 outline-none shadow-inner">
                      <option className="bg-slate-900" value="Semua">Semua Kelas</option>
                      {Array.from(new Set(senaraiPengguna.filter(u => u.role === "murid" && (filterTingkatanPemantauan === "Semua" || String(u.tingkatan) === filterTingkatanPemantauan)).map(u => u.kelas))).filter(Boolean).sort().map((k, idx) => (
                        <option className="bg-slate-900" key={idx} value={k}>{k}</option>
                      ))}
                   </select>
                   <div className="relative w-full sm:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                     <input type="text" placeholder="Cari nama murid..." value={searchPemantauan} onChange={(e) => setSearchPemantauan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-emerald-500 outline-none shadow-inner" />
                   </div>
                 </div>
              </div>
              
              {/* 🌟 KEMAS KINI: STATISTIK MENGGUNAKAN DATA YANG DITAPIS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-4 md:p-6 flex flex-col items-center shadow-xl"><span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase mb-2 text-center tracking-wider">Jumlah Murid</span><span className="text-3xl md:text-5xl font-black text-blue-400 drop-shadow-md">{statPemantauan.jumlah}</span></div>
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-emerald-900/50 p-4 md:p-6 flex flex-col items-center shadow-xl"><span className="text-emerald-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center tracking-wider">Inkuiri Tinggi</span><span className="text-3xl md:text-5xl font-black text-emerald-400 drop-shadow-md">{statPemantauan.tinggi}</span></div>
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-amber-900/50 p-4 md:p-6 flex flex-col items-center shadow-xl"><span className="text-amber-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center tracking-wider">Inkuiri Sederhana</span><span className="text-3xl md:text-5xl font-black text-amber-400 drop-shadow-md">{statPemantauan.sederhana}</span></div>
                <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-rose-900/50 p-4 md:p-6 flex flex-col items-center shadow-xl"><span className="text-rose-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center tracking-wider">Inkuiri Rendah</span><span className="text-3xl md:text-5xl font-black text-rose-400 drop-shadow-md">{statPemantauan.rendah}</span></div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead><tr className="border-b border-slate-700 bg-slate-900/50"><th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Tahap Inkuiri Semasa</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Status / Indikator</th><th className="p-5 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                    <tbody>
                      {filteredPemantauan.map((murid, i) => (
                        <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                          <td className="p-5"><div className="font-bold text-slate-200">{murid.nama}</div><div className="text-slate-400 text-xs mt-1">Tg. {murid.tingkatan} {murid.kelas}</div></td>
                          <td className="p-5 text-center"><span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${murid.tahapInkuiri === 'Tinggi' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : murid.tahapInkuiri === 'Sederhana' ? 'bg-amber-900/40 text-amber-400 border-amber-800/50' : 'bg-rose-900/40 text-rose-400 border-rose-800/50'}`}>{murid.tahapInkuiri || 'Rendah'}</span></td>
                          <td className="p-5 text-center">{murid.tahapInkuiri === 'Tinggi' ? <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5"><Zap size={14}/> Cemerlang</span> : murid.tahapInkuiri === 'Sederhana' ? <span className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5"><Activity size={14}/> Berkembang</span> : <span className="text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5"><AlertTriangle size={14}/> Perlu Bimbingan</span>}</td>
                          <td className="p-5 text-right"><button onClick={() => setSelectedStudentDetail(murid)} className="inline-flex items-center gap-2 bg-slate-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-105 hover:shadow-emerald-900/50"><Eye size={16}/> Analisis Penuh</button></td>
                        </tr>
                      ))}
                      {filteredPemantauan.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tiada murid ditemui.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB SEMAKAN ESEI MURID */}
          {activeTab === "semakan" && ( 
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><CheckSquare className="text-rose-400" size={20}/> Dashboard Semakan Ujian</h3>
                  <p className="text-slate-400 text-sm">Semak dan sahkan markah struktur/esei (Human-in-the-Loop).</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input type="text" placeholder="Cari bab atau nama..." value={searchSemakan} onChange={(e) => setSearchSemakan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-rose-500 outline-none shadow-inner" />
                  </div>
                  <button onClick={tarikDataSemakan} className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md transition-colors">
                    <RefreshCw size={16} className={loadingSemakan ? "animate-spin" : ""}/> Segar Semula
                  </button>
                </div>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                {loadingSemakan ? (
                   <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data jawapan murid... ⏳</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50">
                          <th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Topik Ujian</th>
                          <th className="p-5 font-semibold text-sm text-slate-300 text-center">Status Pemarkahan</th>
                          <th className="p-5 font-semibold text-sm text-slate-300 text-center">Markah Semasa</th>
                          <th className="p-5 font-semibold text-sm text-slate-300 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSemakan.length > 0 ? filteredSemakan.map((rekod, i) => {
                          const status = rekod.statusPermarkahanEsei || "tiada_esei";
                          let statusColor = "bg-slate-800 text-slate-400 border border-slate-700";
                          let statusText = status.replace(/_/g, " ");

                          if (status === "disemak_oleh_guru") { statusColor = "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 shadow-sm shadow-emerald-900/50"; statusText = "Selesai Disahkan Guru"; } 
                          else if (status === "disemak_oleh_AI") { statusColor = "bg-blue-900/40 text-blue-400 border border-blue-800/50 shadow-sm shadow-blue-900/50"; statusText = "Selesai Ditanda AI"; }

                          let aiGagal = false;
                          if (rekod.ulasanAI) Object.values(rekod.ulasanAI).forEach((u: any) => { if (u.komenAI && (u.komenAI.includes("GAGAL") || u.komenAI.includes("Sistem Gagal"))) aiGagal = true; });
                          if (aiGagal && status !== "disemak_oleh_guru") { statusColor = "bg-rose-900/40 text-rose-400 border border-rose-800/50 animate-pulse ring-1 ring-rose-500/50 shadow-md shadow-rose-900/50"; statusText = "⚠️ AI Gagal - Sila Semak"; }

                          const realUser = senaraiPengguna.find(u => u.id === rekod.idMurid || u.idPengguna === rekod.idMurid);
                          const paparNama = realUser?.nama || realUser?.name || rekod.namaMurid || "Tanpa Nama";

                          return (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="p-5"><div className="font-bold text-slate-200">{paparNama}</div><div className="text-slate-500 text-[10px] mt-1 font-mono">ID: {rekod.idMurid || rekod.id}</div></td>
                              <td className="p-5 text-slate-300 text-sm font-medium"><span className="text-blue-400 font-bold bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/50 mr-2">Ting. {rekod.tingkatan}</span>{rekod.bab}</td>
                              <td className="p-5 text-center"><span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{statusText}</span></td>
                              <td className="p-5 text-center text-sm"><div className="text-slate-400 mb-1.5 flex justify-center gap-2 items-center">Objektif: <span className="font-bold text-blue-400 px-2 py-0.5 bg-blue-900/30 rounded border border-blue-800/50">{rekod.skorObjektif || 0}</span></div><div className="text-slate-400 flex justify-center gap-2 items-center">Struktur: <span className="font-bold text-purple-400 px-2 py-0.5 bg-purple-900/30 rounded border border-purple-800/50">{rekod.markahStruktur || 0}</span></div></td>
                              <td className="p-5 text-right"><a href={`/guru/semakan/${rekod.id}`} target="_blank" rel="noreferrer" className="inline-block bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105 shadow-sky-900/50">Semak Jawapan</a></td>
                            </tr>
                          )
                        }) : <tr><td colSpan={5} className="p-12 text-center text-slate-500">Tiada kertas jawapan yang padan ditemui.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BANK SOALAN UJIAN (DIKEMAS KINI - FULL VIEW) */}
          {activeTab === "soalan" && (
            <div className="space-y-6 animate-in fade-in">
              {!isCreatingSoalan ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 gap-4 shadow-xl">
                    <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><HelpCircle className="text-cyan-400" /> Bank Soalan Ujian</h3><p className="text-slate-400 text-sm">Uruskan soalan dan tetapkan sasaran ujian (Pre / Post / Pemulihan).</p></div>
                    <button onClick={() => { resetFormSoalan(); setIsCreatingSoalan(true); }} className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-cyan-900/50 transition-all hover:scale-105"><Plus size={18} className="mr-2" /> Bina Soalan Baru</button>
                  </div>
                  
                  <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row flex-wrap items-center gap-3 shadow-md">
                     <div className="flex items-center gap-2 text-slate-200 font-bold text-sm shrink-0 w-full md:w-auto"><Filter size={18} className="text-cyan-400"/> Tapis & Cari:</div>
                     
                     <div className="relative w-full md:flex-1 min-w-[200px]">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                       <input type="text" placeholder="Cari teks soalan / topik..." value={searchSoalan} onChange={(e) => setSearchSoalan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white pl-10 pr-3 py-2.5 rounded-xl text-sm focus:border-cyan-500 outline-none shadow-inner" />
                     </div>

                     <div className="flex flex-wrap w-full md:w-auto gap-3">
                       <select value={filterTingkatan} onChange={(e) => setFilterTingkatan(e.target.value)} className="flex-1 min-w-[120px] bg-slate-900 text-sm text-slate-200 border border-slate-700 rounded-xl px-3 py-2.5 focus:border-cyan-500 outline-none shadow-inner">
                          <option className="bg-slate-900 text-white" value="Semua">Semua Tg.</option><option className="bg-slate-900 text-white" value="4">Tingkatan 4</option><option className="bg-slate-900 text-white" value="5">Tingkatan 5</option>
                       </select>
                       <select value={filterBab} onChange={(e) => setFilterBab(e.target.value)} className="flex-1 min-w-[100px] bg-slate-900 text-sm text-slate-200 border border-slate-700 rounded-xl px-3 py-2.5 focus:border-cyan-500 outline-none shadow-inner">
                          <option className="bg-slate-900 text-white" value="Semua">Semua Bab</option>{[1,2,3,4,5,6,7,8,9,10].map(num => (<option className="bg-slate-900 text-white" key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                       </select>
                       <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="flex-1 min-w-[110px] bg-slate-900 text-sm text-slate-200 border border-slate-700 rounded-xl px-3 py-2.5 focus:border-cyan-500 outline-none shadow-inner">
                          <option className="bg-slate-900 text-white" value="Semua">Semua Jenis</option><option className="bg-slate-900 text-white" value="objektif">Objektif</option><option className="bg-slate-900 text-white" value="struktur">Struktur</option>
                       </select>
                       
                       <select value={filterKegunaan} onChange={(e) => setFilterKegunaan(e.target.value)} className="flex-1 min-w-[140px] bg-cyan-900/20 text-sm text-cyan-300 font-bold border border-cyan-800/50 rounded-xl px-3 py-2.5 focus:border-cyan-500 outline-none shadow-inner">
                          <option className="bg-slate-900 text-white font-normal" value="Semua">Semua Sasaran</option>
                          <option className="bg-slate-900 text-white font-normal" value="semua_ujian">Semua Ujian</option>
                          <option className="bg-slate-900 text-white font-normal" value="pre_post">Pre & Post</option>
                          <option className="bg-slate-900 text-white font-normal" value="pre_test">Pre-Test Sahaja</option>
                          <option className="bg-slate-900 text-white font-normal" value="post_test">Post-Test Sahaja</option>
                          <option className="bg-slate-900 text-white font-normal" value="pemulihan">Pemulihan Sahaja</option>
                          <option className="bg-slate-900 text-slate-400 font-normal" value="simpanan">Simpanan / Draf</option>
                       </select>
                     </div>
                  </div>

                  {loadingSoalan ? ( 
                    <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-12 text-center text-slate-400 animate-pulse shadow-xl">Memuat turun Bank Soalan... ⏳</div> 
                  ) : (
                    <div className="flex flex-col gap-6 pb-12">
                      {soalanListFiltered.length > 0 ? soalanListFiltered.map((q, i) => {
                        let kegunaanBadge = <></>;
                        if (q.kegunaan === 'pre_test') kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-indigo-900/40 text-indigo-400 font-bold uppercase tracking-wider border border-indigo-800/50">PRE_TEST</span>;
                        else if (q.kegunaan === 'post_test') kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-emerald-900/40 text-emerald-400 font-bold uppercase tracking-wider border border-emerald-800/50">POST_TEST</span>;
                        else if (q.kegunaan === 'pemulihan') kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-orange-900/40 text-orange-400 font-bold uppercase tracking-wider border border-orange-800/50">PEMULIHAN</span>;
                        else if (q.kegunaan === 'semua_ujian') kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-cyan-900/40 text-cyan-400 font-bold uppercase tracking-wider border border-cyan-800/50">SEMUA UJIAN</span>;
                        else if (q.kegunaan === 'simpanan') kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-700/40 text-slate-400 border border-slate-600 font-bold uppercase tracking-wider">SIMPANAN</span>;
                        else kegunaanBadge = <span className="text-[10px] px-2.5 py-1 rounded-md bg-blue-900/40 text-blue-400 font-bold uppercase tracking-wider border border-blue-800/50">PRE & POST</span>;
                        
                        let jenisBadge = q.jenis === 'objektif' 
                          ? <span className="text-[10px] px-2.5 py-1 rounded-md bg-amber-900/40 text-amber-400 font-bold uppercase tracking-wider border border-amber-800/50">OBJEKTIF</span>
                          : <span className="text-[10px] px-2.5 py-1 rounded-md bg-fuchsia-900/40 text-fuchsia-400 font-bold uppercase tracking-wider border border-fuchsia-800/50">STRUKTUR</span>;
                        
                        return (
                          <div key={i} className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-700 shadow-xl relative group transition-all hover:border-slate-500">
                            
                            {/* HEADER CARD SOALAN */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700/50 pb-4 gap-4">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-amber-500 font-bold text-sm bg-slate-900 px-2 py-1 rounded-md">{q.id}</span>
                                    <span className="text-slate-200 text-sm font-bold">{q.topik}</span>
                                  </div>
                               </div>
                               <div className="flex items-center gap-2 flex-wrap">
                                  {kegunaanBadge}
                                  {jenisBadge}
                                  {q.urutan !== 999 && q.urutan && <span className="text-[10px] px-2 py-1 rounded-md bg-slate-700 text-slate-300 font-bold">SUSUNAN: {q.urutan}</span>}
                                  <div className="hidden md:block w-px h-6 bg-slate-600 mx-2"></div>
                                  <button onClick={() => handleEditSoalan(q)} className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-amber-600 transition-colors shadow-sm" title="Edit Soalan"><Edit3 size={16} /></button>
                                  <button onClick={() => handlePadamSoalan(q.id)} className="p-2 rounded-lg bg-slate-700/50 text-slate-300 hover:text-white hover:bg-red-600 transition-colors shadow-sm" title="Padam Soalan"><Trash2 size={16} /></button>
                               </div>
                            </div>

                            {/* BODY SOALAN */}
                            <div className="flex gap-4">
                               <div className="text-slate-400 font-bold mt-0.5">{q.urutan !== 999 && q.urutan ? `${q.urutan}.` : "-"}</div>
                               <div className="flex-1">
                                  <div className="text-slate-200 text-[15px] whitespace-pre-wrap leading-relaxed mb-6 font-medium">
                                    {q.soalan}
                                  </div>

                                  {/* GAMBAR SOALAN */}
                                  {q.imageUrl && q.imageUrl.trim() !== "" && (
                                    <div className="mb-6 p-2 bg-slate-900/50 inline-block rounded-xl border border-slate-700">
                                      <img src={q.imageUrl} alt="Rajah Soalan" className="max-w-md w-full object-contain rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                    </div>
                                  )}

                                  {/* PILIHAN JAWAPAN / SKEMA */}
                                  {q.jenis === 'objektif' ? (
                                     <div className="flex flex-col gap-3">
                                        {['A', 'B', 'C', 'D'].map(opt => {
                                           const isCorrect = q.jawapan === opt;
                                           const optText = q.pilihan?.[opt] || "";
                                           return (
                                             <div key={opt} className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${isCorrect ? 'bg-yellow-400 border-yellow-500 shadow-md shadow-yellow-500/20' : 'bg-slate-900 border-slate-700'} border`}>
                                                <span className={`font-black w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${isCorrect ? 'text-yellow-900 bg-yellow-500/20' : 'text-slate-500 bg-slate-800'}`}>{opt}</span>
                                                <span className={`${isCorrect ? 'text-yellow-900 font-bold' : 'text-slate-300'} text-sm leading-relaxed`}>{optText}</span>
                                                {isCorrect && <span className="ml-auto flex items-center justify-center shrink-0 w-6 h-6 bg-yellow-500 text-yellow-900 rounded-full"><Check size={14} strokeWidth={3}/></span>}
                                             </div>
                                           )
                                        })}
                                     </div>
                                  ) : (
                                     <div className="mt-2">
                                        <p className="text-xs text-purple-400 font-bold mb-2 uppercase tracking-wider flex items-center gap-1.5"><Sparkles size={14}/> Skema Jawapan ({q.markah} Markah)</p>
                                        <div className="bg-purple-900/20 border border-purple-800/30 p-5 rounded-xl text-purple-200 text-sm whitespace-pre-wrap leading-relaxed shadow-inner">
                                           {q.skemaJawapan}
                                        </div>
                                     </div>
                                  )}
                               </div>
                            </div>
                          </div>
                        )
                      }) : (
                        <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 p-12 text-center text-slate-500 shadow-xl">
                          Tiada soalan yang sepadan dengan tapisan ini.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-800/90 backdrop-blur-xl p-6 md:p-8 rounded-3xl border border-cyan-800/50 shadow-2xl max-w-5xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5"><HelpCircle size={100} className="text-cyan-400"/></div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-8 flex items-center gap-3 relative z-10"><HelpCircle className="text-cyan-400 w-8 h-8 md:w-10 md:h-10" /> {isEditingSoalan ? `Kemas Kini Soalan (${editSoalanId})` : "Cipta Soalan Baharu"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Tingkatan</label>
                      <select value={qTingkatan} onChange={e => setQTingkatan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-cyan-500 shadow-inner">
                        <option className="bg-slate-900 text-white" value="4">Tingkatan 4</option>
                        <option className="bg-slate-900 text-white" value="5">Tingkatan 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Bab</label>
                      <select value={qBab} onChange={e => setQBab(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-cyan-500 shadow-inner">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (<option className="bg-slate-900 text-white" key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Topik</label>
                      <select value={qTopik} onChange={e => setQTopik(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-cyan-500 shadow-inner">
                        {subtopikPilihan.map((sub: string, index: number) => (<option className="bg-slate-900 text-white" key={index} value={sub}>{sub}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 relative z-10">
                    <div>
                      <label className="block text-sm text-emerald-400 font-bold mb-2">Sasaran Ujian</label>
                      <select value={qKegunaan} onChange={e => setQKegunaan(e.target.value)} className="w-full bg-slate-900 border-2 border-emerald-800/50 rounded-xl p-3.5 text-emerald-400 font-bold outline-none text-sm focus:border-emerald-400 shadow-inner">
                        <option className="bg-slate-900 text-white font-normal" value="semua_ujian">Semua (Pre, Post & Pemulihan)</option>
                        <option className="bg-slate-900 text-white font-normal" value="semua">Pre-Test & Post-Test</option>
                        <option className="bg-slate-900 text-white font-normal" value="pre_test">Khas Pre-Test Sahaja</option>
                        <option className="bg-slate-900 text-white font-normal" value="post_test">Khas Post-Test Sahaja</option>
                        <option className="bg-slate-900 text-white font-normal" value="pemulihan">Khas Pemulihan Sahaja</option>
                        <option className="bg-slate-900 text-slate-400 font-normal" value="simpanan">Simpanan Sahaja (Draf)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Jenis Soalan</label>
                      <select value={qJenis} onChange={e => setQJenis(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white font-bold text-sm outline-none focus:border-cyan-500 shadow-inner">
                        <option className="bg-slate-900 text-white font-normal" value="objektif">Objektif</option>
                        <option className="bg-slate-900 text-white font-normal" value="struktur">Struktur / Esei</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-slate-400 mb-2 font-medium">Markah</label><input type="number" value={qMarkah} onChange={e => setQMarkah(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-cyan-500 shadow-inner"/></div>
                    <div><label className="block text-sm text-blue-400 font-bold mb-2">No. Susunan</label><input type="number" value={qUrutan} onChange={e => setQUrutan(e.target.value)} placeholder="Cth: 1, 2, 3..." className="w-full bg-slate-900 border border-blue-800/50 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-blue-500 shadow-inner"/></div>
                  </div>
                  <div className="mb-6 relative z-10"><label className="block text-sm text-slate-400 mb-2 font-medium">Soalan</label><textarea rows={5} value={qSoalan} onChange={e => setQSoalan(e.target.value)} placeholder="Taip soalan penuh di sini..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-5 text-white resize-none text-base focus:outline-none focus:border-cyan-500 shadow-inner leading-relaxed"></textarea></div>
                  <div className="mb-8 relative z-10"><label className="block text-sm text-slate-400 mb-2 font-medium">Pautan URL Gambar Rujukan (Pilihan)</label><input type="url" value={qImageUrl} onChange={e => setQImageUrl(e.target.value)} placeholder="Tampal link gambar jika soalan berasaskan rajah..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white focus:outline-none focus:border-cyan-500 text-sm shadow-inner"/>
                    {qImageUrl && qImageUrl.trim() !== "" && ( <div className="mt-4 border border-slate-700 p-3 rounded-xl inline-block bg-slate-900/50 shadow-md"><img src={qImageUrl} alt="Pratonton Soalan" className="max-h-40 object-contain rounded-lg" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div> )}
                  </div>
                  
                  {qJenis === "objektif" ? (
                    <div className="bg-slate-900/40 p-6 md:p-8 rounded-2xl border border-slate-700 mb-8 relative z-10 shadow-inner">
                      <h4 className="text-slate-300 font-bold mb-6 flex items-center gap-2 text-sm"><CheckSquare size={18}/> Pilihan Jawapan Objektif</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 mb-8">
                        <div className="flex items-center gap-4"><span className="font-black text-amber-400 bg-amber-900/30 px-4 py-3 rounded-xl border border-amber-800/50 shadow-sm">A</span><input type="text" value={qPilihanA} onChange={e => setQPilihanA(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors"/></div>
                        <div className="flex items-center gap-4"><span className="font-black text-amber-400 bg-amber-900/30 px-4 py-3 rounded-xl border border-amber-800/50 shadow-sm">B</span><input type="text" value={qPilihanB} onChange={e => setQPilihanB(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors"/></div>
                        <div className="flex items-center gap-4"><span className="font-black text-amber-400 bg-amber-900/30 px-4 py-3 rounded-xl border border-amber-800/50 shadow-sm">C</span><input type="text" value={qPilihanC} onChange={e => setQPilihanC(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors"/></div>
                        <div className="flex items-center gap-4"><span className="font-black text-amber-400 bg-amber-900/30 px-4 py-3 rounded-xl border border-amber-800/50 shadow-sm">D</span><input type="text" value={qPilihanD} onChange={e => setQPilihanD(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-amber-500 shadow-inner transition-colors"/></div>
                      </div>
                      <div>
                        <label className="block text-sm text-emerald-400 font-bold mb-3">Jawapan Betul (Kunci)</label>
                        <select value={qJawapanBetul} onChange={e => setQJawapanBetul(e.target.value)} className="w-full md:w-1/2 bg-slate-900 border-2 border-emerald-500/50 rounded-xl p-3.5 text-emerald-400 font-bold outline-none focus:border-emerald-400 text-sm shadow-inner">
                          <option className="bg-slate-900 text-white font-normal" value="A">Pilihan A</option>
                          <option className="bg-slate-900 text-white font-normal" value="B">Pilihan B</option>
                          <option className="bg-slate-900 text-white font-normal" value="C">Pilihan C</option>
                          <option className="bg-slate-900 text-white font-normal" value="D">Pilihan D</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-900/10 p-6 md:p-8 rounded-2xl border border-purple-800/30 mb-8 relative z-10 shadow-inner">
                       <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2"><Sparkles size={20}/> Skema Jawapan (Untuk Panduan AI)</h4>
                       <p className="text-slate-400 text-xs mb-4">Sila masukkan jawapan dalam bentuk *point form* berserta kata kunci utama yang wajib dijawab oleh murid.</p>
                       <textarea rows={6} value={qSkema} onChange={e => setQSkema(e.target.value)} placeholder="1. Kerana...\n2. Faktor utamanya ialah..." className="w-full bg-slate-900 border border-purple-700/50 rounded-xl p-5 text-white resize-none focus:outline-none focus:border-purple-500 shadow-inner leading-relaxed"></textarea>
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 pt-6 border-t border-slate-700/50 relative z-10">
                    <button onClick={resetFormSoalan} className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600 transition-colors shadow-sm">Batal Penyuntingan</button>
                    <button onClick={handleSimpanSoalan} disabled={uIsSubmitting} className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white px-10 py-3.5 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-cyan-900/50 transition-transform hover:scale-105">{uIsSubmitting ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20}/>}{isEditingSoalan ? "Simpan Perubahan" : "Simpan Soalan Ke Bank"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SENARAI BAHAN NOTA */}
          {activeTab === "kandungan" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 gap-4 shadow-xl">
                <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><BookOpen className="text-blue-400" size={20}/> Senarai Bahan Rujukan & Nota</h3><p className="text-slate-400 text-sm">Urus modul dan Pautan URL mengikut subtopik khusus.</p></div>
                <button onClick={() => setActiveTab("upload")} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-900/50 transition-transform hover:scale-105"><Plus size={18} className="mr-2" /> Tambah Nota Baru</button>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center gap-3 shadow-md">
                <div className="relative w-full md:flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                   <input type="text" placeholder="Cari tajuk bahan nota..." value={searchBahan} onChange={(e) => setSearchBahan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-sm focus:border-blue-500 outline-none shadow-inner" />
                </div>
                <select value={filterTingkatanBahan} onChange={(e) => setFilterTingkatanBahan(e.target.value)} className="w-full md:w-auto bg-slate-900 text-sm text-slate-200 border border-slate-700 rounded-xl px-4 py-2.5 focus:border-blue-500 outline-none shadow-inner">
                   <option className="bg-slate-900 text-white" value="Semua">Semua Tingkatan</option><option className="bg-slate-900 text-white" value="4">Tingkatan 4</option><option className="bg-slate-900 text-white" value="5">Tingkatan 5</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loadingBahan ? ( <p className="text-slate-400 animate-pulse col-span-2 text-center p-8 bg-slate-800/50 rounded-2xl">Memuat turun data nota...</p> ) : filteredBahan.length > 0 ? (
                  filteredBahan.map((bahan, idx) => (
                    <div key={idx} className="bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700 hover:border-blue-500/50 transition-all shadow-xl flex flex-col h-full overflow-hidden">
                      <div className="flex justify-between items-start mb-5">
                        <span className="bg-blue-900/40 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-blue-800/50 shadow-sm mt-1">Tingkatan {bahan.form}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditSubtopikId(bahan.id); setTempSubtopik(bahan.subtopics || []); }} className="bg-slate-700/50 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-amber-600 transition-colors shadow-sm" title="Edit Subtopik & Link"><Edit3 size={16}/></button>
                          <button onClick={() => handleKemaskiniSubtopik(bahan)} className="bg-slate-700/50 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-600 transition-colors shadow-sm" title="Auto-Sync Subtopik"><RefreshCw size={16}/></button>
                          <a href={bahan.chapterUrl} target="_blank" rel="noreferrer" className="bg-slate-700/50 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-blue-600 transition-colors shadow-sm" title="Lihat Pautan Induk"><FileText size={16}/></a>
                          <button onClick={() => handlePadamBahan(bahan.id)} className="bg-slate-700/50 p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-red-600 transition-colors shadow-sm" title="Padam Nota"><Trash2 size={16}/></button>
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">{bahan.title}</h4>
                      <p className="text-sm font-bold text-amber-500 font-mono mb-2">ID: {bahan.id}</p>
                      
                      {editSubtopikId === bahan.id ? (
                        <div className="mt-4 bg-slate-900/60 p-5 rounded-2xl border border-amber-600/30 shadow-inner">
                          <p className="text-xs text-amber-400 font-bold mb-4 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14}/> Tetapkan Link Khas & Teks AI:</p>
                          <div className="space-y-4 mb-5 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                            {tempSubtopik.map((sub, i) => (
                               <div key={i} className="flex flex-col gap-3 bg-slate-800/80 p-5 rounded-xl border border-slate-700/50 shadow-sm">
                                 <div className="flex items-center gap-3 border-b border-slate-700/50 pb-3"><span className="text-sm font-black text-blue-400 shrink-0 bg-blue-900/30 px-2 py-1 rounded">{sub.id}</span><span className="text-sm text-slate-200 font-bold">{sub.title}</span></div>
                                 <div className="flex flex-col md:flex-row md:items-center gap-3 mt-2">
                                   <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider shrink-0 md:w-16 md:text-right">🔗 Nota:</span>
                                   <input type="text" value={sub.notaUrl || ""} placeholder="Link Canva/Drive Subtopik..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].notaUrl = e.target.value; setTempSubtopik(newSubs); }} className="flex-1 bg-slate-900 text-slate-300 font-mono text-xs p-2.5 rounded-lg border border-slate-700 focus:border-blue-500 outline-none shadow-inner" />
                                 </div>
                                 <div className="flex flex-col md:flex-row md:items-center gap-3">
                                   <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider shrink-0 md:w-16 md:text-right">📺 Video:</span>
                                   <input type="text" value={sub.videoUrl || ""} placeholder="Link YouTube Subtopik..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].videoUrl = e.target.value; setTempSubtopik(newSubs); }} className="flex-1 bg-slate-900 text-slate-300 font-mono text-xs p-2.5 rounded-lg border border-slate-700 focus:border-red-500 outline-none shadow-inner" />
                                 </div>
                                 <div className="flex flex-col gap-1.5 mt-3">
                                   <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🧠 Teks Rujukan Khusus (Fakta Mutlak AI):</span>
                                   <textarea rows={4} value={sub.teksAI || ""} placeholder="Copy & Paste perenggan fakta rujukan mutlak AI di sini..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].teksAI = e.target.value; setTempSubtopik(newSubs); }} className="w-full bg-slate-900 text-emerald-300 font-sans text-xs p-3 rounded-xl border border-emerald-800/50 focus:border-emerald-500 outline-none resize-y shadow-inner leading-relaxed" />
                                 </div>
                               </div>
                            ))}
                          </div>
                          <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                            <button onClick={() => setEditSubtopikId(null)} className="flex-1 bg-slate-700 text-slate-300 text-sm font-bold py-3 rounded-xl hover:bg-slate-600 transition-colors shadow-sm">Batal</button>
                            <button onClick={() => handleSimpanMukaSurat(bahan.id)} className="flex-1 bg-amber-600 text-white font-bold text-sm py-3 rounded-xl hover:bg-amber-500 shadow-lg shadow-amber-900/50 transition-colors">Simpan Tetapan Khas</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-700/50 flex-1 overflow-y-auto max-h-[300px] mt-4 shadow-inner custom-scrollbar">
                           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-4">Pemetaan Pautan Subtopik:</p>
                           <ul className="text-sm text-slate-300 space-y-3.5">
                             {bahan.subtopics?.map((sub: any, i: number) => (
                               <li key={i} className="flex flex-col gap-1.5 border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                                 <div className="flex items-center gap-2"><span className="text-blue-400 font-black shrink-0 bg-blue-900/20 px-2 py-0.5 rounded text-xs">{sub.id}</span> <span className="truncate text-xs md:text-sm font-bold text-slate-200">{sub.title}</span></div>
                                 <div className="flex flex-wrap items-center gap-2 text-[10px] pl-1">
                                   {sub.notaUrl ? <span className="text-blue-300 bg-blue-900/30 px-2 py-1 rounded-md border border-blue-800/50 shadow-sm flex items-center gap-1"><BookOpen size={10}/> Khas</span> : <span className="text-slate-400 bg-slate-800 px-2 py-1 rounded-md border border-slate-700 shadow-sm flex items-center gap-1"><BookOpen size={10}/> Induk Bab</span>}
                                   {sub.videoUrl ? <span className="text-red-300 bg-red-900/30 px-2 py-1 rounded-md border border-red-800/50 shadow-sm flex items-center gap-1"><Zap size={10}/> Video</span> : null}
                                   {sub.teksAI ? <span className="text-emerald-300 bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-800/50 shadow-sm flex items-center gap-1"><Sparkles size={10}/> Data AI</span> : null}
                                 </div>
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : <p className="text-slate-500 col-span-2 text-center p-12 bg-slate-800/40 rounded-3xl border border-slate-700 border-dashed text-lg">Belum ada nota yang padan didaftarkan.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: MUAT NAIK BAHAN BAHARU */}
          {activeTab === "upload" && (
             <div className="bg-slate-800/80 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-slate-700 max-w-3xl shadow-2xl relative overflow-hidden animate-in fade-in">
                <div className="absolute top-0 right-0 p-8 opacity-5"><UploadCloud size={120} className="text-blue-400"/></div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-3 flex items-center gap-3 relative z-10"><UploadCloud className="text-blue-400 w-8 h-8 md:w-10 md:h-10"/> Daftar Bahan Rujukan Baru</h3>
                <p className="text-slate-400 text-sm mb-8 border-b border-slate-700/50 pb-6 relative z-10">Sistem akan menyusun nota ini secara automatik mengikut struktur subtopik silibus KSSM yang diprogramkan.</p>
                <form onSubmit={handleSimpanBahan} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Tingkatan</label>
                      <select value={bTingkatan} onChange={e => setBTingkatan(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-blue-500 shadow-inner">
                        <option className="bg-slate-900 text-white" value="4">Tingkatan 4</option>
                        <option className="bg-slate-900 text-white" value="5">Tingkatan 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2 font-medium">Pilih Bab Induk</label>
                      <select value={bBab} onChange={e => setBBab(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-white text-sm outline-none focus:border-blue-500 shadow-inner">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (<option className="bg-slate-900 text-white" key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-sm text-slate-400 mb-2 font-medium">Tajuk Modul / Nama Fail Induk</label><input type="text" value={bJudul} onChange={e => setBJudul(e.target.value)} placeholder="Contoh: Modul Tuntas Warisan Negara Bangsa" required className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm focus:border-blue-500 outline-none shadow-inner"/></div>
                  <div className="bg-blue-900/10 p-6 md:p-8 rounded-2xl border-2 border-blue-800/30 border-dashed text-center">
                    <label className="block text-sm text-blue-400 font-bold mb-2 uppercase tracking-wider">Pautan Utama (Google Drive / Canva)</label>
                    <p className="text-xs text-blue-300/80 mb-5 font-medium">PENTING: Pastikan tahap privasi pautan diset kepada "Anyone with the link can view".</p>
                    <input type="url" value={bLinkNota} onChange={e => setBLinkNota(e.target.value)} placeholder="Tampal URL (https://...) di sini" required className="w-full bg-slate-900 border border-blue-700/50 rounded-xl p-4 text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm shadow-inner"/>
                  </div>
                  <div className="flex justify-end pt-4"><button type="submit" disabled={isUploadingBahan} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center shadow-lg shadow-blue-900/50 disabled:opacity-50 text-sm transition-transform hover:scale-105">{isUploadingBahan ? <Loader2 className="animate-spin mr-2" size={20} /> : <UploadCloud className="mr-2" size={20}/>}{isUploadingBahan ? "Menyimpan ke Pengkalan Data..." : "Simpan & Proses Automatik"}</button></div>
                </form>
             </div>
          )}

          {/* TAB 7: MAKLUM BALAS MURID */}
          {activeTab === "maklumbalas" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-amber-800/50 gap-4 shadow-xl">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><MessageSquare className="text-amber-400" size={20}/> Suara Pelajar & Maklum Balas</h3>
                  <p className="text-slate-400 text-sm">Lihat pengalaman, masalah, atau cadangan yang dihantar oleh murid terhadap I-RAGs.</p>
                </div>
                <button onClick={tarikDataMaklumBalas} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md transition-colors">
                  <RefreshCw size={16} className={loadingMaklumBalas ? "animate-spin" : ""}/> Segar Semula Laporan
                </button>
              </div>

              <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                {loadingMaklumBalas ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Menarik rekod maklum balas... ⏳</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-slate-700 bg-slate-900/50">
                          <th className="p-5 font-semibold text-sm text-slate-300 w-48">Tarikh (Timestamp)</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Identiti Pengguna</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Kategori Aduan</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Intipati Komen / Mesej</th>
                        </tr>
                      </thead>
                      <tbody>
                        {senaraiMaklumBalas.length > 0 ? senaraiMaklumBalas.map((mb, i) => {
                          const realUser = senaraiPengguna.find(u => u.id === mb.muridId || u.idPengguna === mb.muridId);
                          const paparNama = realUser?.nama || realUser?.name || mb.namaMurid || "Tanpa Nama";

                          return (
                            <tr key={i} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="p-5 text-slate-400 text-xs font-mono">
                                {mb.tarikh ? new Date(mb.tarikh).toLocaleString('ms-MY') : "Tiada Rekod Tarikh"}
                              </td>
                              <td className="p-5 font-bold text-slate-200 text-sm">
                                {paparNama}
                                <br/>
                                <span className="text-[10px] text-slate-500 font-mono font-normal">ID: {mb.muridId}</span>
                              </td>
                              <td className="p-5">
                                <span className={`text-[10px] px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider border shadow-sm ${
                                  mb.jenis === 'Pujian' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' :
                                  mb.jenis === 'Masalah' ? 'bg-rose-900/40 text-rose-400 border-rose-800/50' :
                                  'bg-amber-900/40 text-amber-400 border-amber-800/50'
                                }`}>{mb.jenis || "Umum"}</span>
                              </td>
                              <td className="p-5 text-slate-300 text-sm max-w-lg whitespace-normal leading-relaxed">{mb.mesej}</td>
                            </tr>
                          )
                        }) : (
                          <tr><td colSpan={4} className="p-12 text-center text-slate-500 text-lg">Tiada maklum balas direkodkan lagi.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 8: MAKMAL KAJIAN / ANALITIK SPSS */}
          {activeTab === "analitik" && ( <MakmalDataKajian /> )}
        </main>
      </div>

      {/* 🌟 MODAL TERPERINCI MURID DENGAN PROGRESS SETIAP BAB & DRILL-DOWN ANALYTICS */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-slate-800 p-0 rounded-3xl w-full max-w-6xl border border-slate-600 shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
                
                <div className="bg-slate-900/80 p-6 md:p-8 flex justify-between items-start border-b border-slate-700">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
                      Profil Akademik: <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">{selectedStudentDetail.nama}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-600 text-slate-300 text-xs font-bold uppercase tracking-widest shadow-sm">Tingkatan {selectedStudentDetail.tingkatan} {selectedStudentDetail.kelas}</span> 
                      <span className={`px-3 py-1 rounded-lg border text-xs font-bold uppercase tracking-widest shadow-sm ${selectedStudentDetail.kumpulan === 'Kawalan' ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-cyan-900/40 border-cyan-800 text-cyan-400'}`}>Kumpulan: {selectedStudentDetail.kumpulan || 'Eksperimen'}</span>
                      <span className="bg-slate-700/50 px-3 py-1 rounded-lg border border-slate-600 text-slate-400 text-[10px] font-mono shadow-sm">UID: {selectedStudentDetail.idPengguna || selectedStudentDetail.id}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedStudentDetail(null)} className="p-2.5 bg-slate-800 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-rose-600 hover:border-rose-500 transition-all shadow-md"><X size={24}/></button>
                </div>

                <div className="p-6 md:p-8 overflow-y-auto bg-slate-800 custom-scrollbar flex-1">
                   <h4 className="text-slate-200 font-extrabold text-lg mb-4 flex items-center gap-2 uppercase tracking-wide"><ChartBar size={20} className="text-emerald-400"/> Kad Kemajuan Bab Berstruktur (Drill-Down)</h4>
                   <p className="text-xs text-slate-400 mb-6">Klik pada mana-mana baris bab di bawah untuk melihat butiran skor terperinci dan Analisis Nilai Tambah (Learning Gain).</p>
                   
                   {loadingStudentProgress ? (
                      <div className="p-16 text-center text-slate-400 animate-pulse bg-slate-900/40 rounded-2xl border border-slate-700 font-medium">Memproses data pembelajaran raya... ⏳</div>
                   ) : (
                     <div className="bg-slate-900/60 rounded-2xl border border-slate-700 overflow-x-auto shadow-inner custom-scrollbar">
                       <table className="w-full text-left border-collapse min-w-max">
                          <thead>
                            <tr className="border-b border-slate-700 bg-slate-900/80">
                              <th className="p-5 font-bold text-xs text-slate-300 uppercase tracking-wider">Bab Sejarah</th>
                              <th className="p-5 font-bold text-xs text-slate-300 text-center uppercase tracking-wider">Ujian Diagnostik (Pre)</th>
                              <th className="p-5 font-bold text-xs text-slate-300 text-center uppercase tracking-wider">Bimbingan AI</th>
                              <th className="p-5 font-bold text-xs text-slate-300 text-center uppercase tracking-wider">Ujian Pasca (Post)</th>
                              <th className="p-5 font-bold text-xs text-slate-300 text-center uppercase tracking-wider"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1,2,3,4,5,6,7,8,9,10].map((num) => {
                              const babName = `Bab ${num}`;
                              
                              // Data Pre-Test
                              const preTestRecord = studentProgressData.skor.find(s => s.bab === babName && (s.jenisUjian === "pre_test" || !s.jenisUjian));
                              const preSkor = preTestRecord ? preTestRecord.skor : null;
                              const preSemakan = preTestRecord ? preTestRecord.statusPermarkahanEsei : null;
                              
                              // Data Post-Test
                              const postTestRecord = studentProgressData.skor.find(s => s.bab === babName && s.jenisUjian === "post_test");
                              const postSkor = postTestRecord ? postTestRecord.skor : null;
                              const attempt = postTestRecord ? (postTestRecord.percubaan || 1) : 0;
                              const postSemakan = postTestRecord ? postTestRecord.statusPermarkahanEsei : null;
                              
                              // Data AI Chat
                              const aiSelesaiCount = studentProgressData.chat.filter(c => c.chapterId?.includes(`bab${num}_sub`) && c.status === "completed").length;
                              const aiInProgress = studentProgressData.chat.some(c => c.chapterId?.includes(`bab${num}_sub`) && c.status === "in_progress");

                              // Pengiraan Analitik Guru (Learning Gain)
                              let learningGain = null;
                              let rumusanAI = "Belum ada data cukup untuk dianalisis.";
                              let rumusanColor = "text-slate-400";
                              let gainIcon = null;

                              if (preSkor !== null && postSkor !== null) {
                                learningGain = postSkor - preSkor;
                                if (learningGain > 0) {
                                  rumusanAI = `Peningkatan Kognitif dikesan (+${learningGain}%). Bimbingan AI / Modul menunjukkan kesan positif pada pemahaman murid.`;
                                  rumusanColor = "text-emerald-400";
                                  gainIcon = <TrendingUp size={16} className="text-emerald-400"/>;
                                } else if (learningGain === 0) {
                                  rumusanAI = `Prestasi mendatar. Murid memerlukan penekanan dan pendekatan pedagogi yang berbeza untuk topik ini.`;
                                  rumusanColor = "text-amber-400";
                                  gainIcon = <TrendingUp size={16} className="text-amber-400 rotate-45"/>; // Flat arrow illusion
                                } else {
                                  rumusanAI = `Kemerosotan prestasi (-${Math.abs(learningGain)}%). Murid sangat perlukan intervensi / pemulihan terus daripada guru.`;
                                  rumusanColor = "text-rose-400";
                                  gainIcon = <TrendingDown size={16} className="text-rose-400"/>;
                                }
                              } else if (preSkor !== null && preSkor >= 70) {
                                rumusanAI = "Murid menguasai topik ini di tahap Cemerlang sejak Ujian Diagnostik. Pintasan (Bypass) dibenarkan.";
                                rumusanColor = "text-blue-400";
                                gainIcon = <CheckSquare size={16} className="text-blue-400"/>;
                              }

                              const isExpanded = expandedBabDetail === num;

                              return (
                                <React.Fragment key={num}>
                                  <tr 
                                    onClick={() => setExpandedBabDetail(isExpanded ? null : num)} 
                                    className={`border-b border-slate-700/50 transition-all cursor-pointer ${isExpanded ? 'bg-slate-800/80 shadow-inner' : 'hover:bg-slate-800/40'}`}
                                  >
                                    <td className="p-5 text-sm text-slate-200 font-bold w-1/4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${preSkor !== null || postSkor !== null ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'bg-slate-600'}`}></div>
                                        {babName}
                                      </div>
                                    </td>
                                    
                                    {/* KOLOM 1: PRE-TEST */}
                                    <td className="p-5 text-center">
                                      {preSkor !== null ? (
                                        <span className={`text-[11px] px-3 py-1.5 rounded-lg font-bold border shadow-sm ${preSkor >= 70 ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-slate-800 text-slate-300 border-slate-600'}`}>
                                          {preSemakan === 'disemak_oleh_AI' && preTestRecord.markahStruktur === null ? '⏳ Semakan' : `${preSkor}%`}
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-600 font-medium italic">Belum Mula</span>
                                      )}
                                    </td>
                                    
                                    {/* KOLOM 2: BIMBINGAN AI */}
                                    <td className="p-5 text-center">
                                      {selectedStudentDetail.kumpulan === 'Kawalan' ? (
                                         <span className="text-[11px] text-slate-600 font-medium bg-slate-900 px-2 py-1 rounded">Bukan Kumpulan AI</span>
                                      ) : aiSelesaiCount > 0 ? (
                                        <span className="text-[11px] px-3 py-1.5 rounded-lg font-bold bg-amber-900/30 text-amber-400 border border-amber-800/50 shadow-sm flex items-center justify-center w-max mx-auto gap-1">
                                          <Sparkles size={12}/> {aiSelesaiCount} Sub Selesai
                                        </span>
                                      ) : aiInProgress ? (
                                        <span className="text-[11px] px-3 py-1.5 rounded-lg font-bold bg-blue-900/30 text-blue-400 border border-blue-800/50 shadow-sm animate-pulse flex items-center justify-center w-max mx-auto gap-1">
                                          <Loader2 size={12} className="animate-spin"/> Proses...
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-600 font-medium italic">Belum Akses</span>
                                      )}
                                    </td>
                                    
                                    {/* KOLOM 3: POST-TEST / PEMULIHAN */}
                                    <td className="p-5 text-center">
                                      {postSkor !== null ? (
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                          <span className={`text-[11px] px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border shadow-sm ${
                                            postSkor >= 50 ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/40 text-rose-400 border-rose-800/50'
                                          }`}>
                                            {postSemakan === 'disemak_oleh_AI' && postTestRecord.markahStruktur === null ? '⏳ Semakan' : `${postSkor}%`} 
                                            {postSkor < 50 && <AlertTriangle size={12}/>}
                                          </span>
                                          {attempt > 1 && (
                                             <span className="text-[9px] font-black text-orange-400 bg-orange-900/40 border border-orange-800/50 px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shadow-sm"><Rocket size={10}/> Pemulihan</span>
                                          )}
                                        </div>
                                      ) : preSkor !== null && preSkor >= 70 ? (
                                        <span className="text-[10px] px-2 py-1 rounded bg-blue-900/30 text-blue-400 border border-blue-800/50 font-bold uppercase tracking-wider shadow-sm">Dikecualikan</span>
                                      ) : (
                                        <span className="text-[11px] text-slate-600 font-medium italic">Belum Diambil</span>
                                      )}
                                    </td>

                                    {/* ICON DROPDOWN */}
                                    <td className="p-5 text-right">
                                       <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 inline-block ${isExpanded ? 'rotate-180 text-blue-400' : ''}`}/>
                                    </td>
                                  </tr>

                                  {/* EXPANDABLE DETAIL ROW */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={5} className="p-0 border-b border-slate-700/50 bg-slate-900/80">
                                          <motion.div 
                                            initial={{ height: 0, opacity: 0 }} 
                                            animate={{ height: "auto", opacity: 1 }} 
                                            exit={{ height: 0, opacity: 0 }} 
                                            className="overflow-hidden"
                                          >
                                            <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-6">
                                              
                                              {/* KOTAK METRIK SKOR */}
                                              <div className="flex-1 flex gap-4 min-w-0">
                                                <div className="flex-1 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner">
                                                   <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Metrik Diagnostik (Pre)</h5>
                                                   {preTestRecord ? (
                                                     <div className="space-y-1.5 text-sm">
                                                       <p className="flex justify-between text-slate-300"><span>Objektif:</span> <span className="font-bold text-blue-400">{preTestRecord.skorObjektif || 0}</span></p>
                                                       <p className="flex justify-between text-slate-300"><span>Struktur:</span> <span className="font-bold text-purple-400">{preSemakan === 'disemak_oleh_AI' && preTestRecord.markahStruktur === null ? 'Semakan' : preTestRecord.markahStruktur || 0}</span></p>
                                                       <p className="flex justify-between text-slate-200 mt-2 pt-2 border-t border-slate-700"><span>Jumlah Skor:</span> <span className="font-black text-white">{preSkor}%</span></p>
                                                     </div>
                                                   ) : <p className="text-xs text-slate-500 italic mt-4">Tiada rekod ujian.</p>}
                                                </div>

                                                <div className="flex-1 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-inner">
                                                   <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">Metrik Pasca (Post)</h5>
                                                   {postTestRecord ? (
                                                     <div className="space-y-1.5 text-sm">
                                                       <p className="flex justify-between text-slate-300"><span>Objektif:</span> <span className="font-bold text-blue-400">{postTestRecord.skorObjektif || 0}</span></p>
                                                       <p className="flex justify-between text-slate-300"><span>Struktur:</span> <span className="font-bold text-purple-400">{postSemakan === 'disemak_oleh_AI' && postTestRecord.markahStruktur === null ? 'Semakan' : postTestRecord.markahStruktur || 0}</span></p>
                                                       <p className="flex justify-between text-slate-200 mt-2 pt-2 border-t border-slate-700"><span>Jumlah Skor:</span> <span className={`font-black ${postSkor! >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>{postSkor}%</span></p>
                                                       <p className="flex justify-between text-slate-400 text-xs mt-1"><span>Bil. Cubaan:</span> <span>{attempt}</span></p>
                                                     </div>
                                                   ) : <p className="text-xs text-slate-500 italic mt-4">Tiada rekod ujian.</p>}
                                                </div>
                                              </div>

                                              {/* KOTAK ANALITIK GURU */}
                                              <div className="flex-1 min-w-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-5 rounded-xl border border-indigo-800/30 shadow-inner">
                                                 <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2"><BrainCircuit size={16}/> Laporan Analitik Pedagogi</h5>
                                                 
                                                 <div className="flex items-center gap-4 mb-4">
                                                   <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 shadow-md shrink-0">
                                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center mb-1">Learning Gain</p>
                                                     <div className="flex items-center justify-center gap-1.5">
                                                        {gainIcon}
                                                        <span className={`text-xl font-black ${rumusanColor}`}>{learningGain !== null ? `${learningGain > 0 ? '+' : ''}${learningGain}%` : 'N/A'}</span>
                                                     </div>
                                                   </div>
                                                   <p className="text-sm text-slate-300 leading-relaxed flex-1">
                                                     {rumusanAI}
                                                   </p>
                                                 </div>

                                                 {(preTestRecord?.docIdPre || postTestRecord?.docIdPost) && (
                                                    <div className="flex gap-2 border-t border-indigo-800/30 pt-3">
                                                       {preTestRecord && <a href={`/guru/semakan/${preTestRecord.id}`} target="_blank" rel="noreferrer" className="text-xs bg-indigo-600/80 hover:bg-indigo-500 text-white px-3 py-1.5 rounded shadow flex items-center gap-1 font-bold"><Eye size={12}/> Semak Esei Pre</a>}
                                                       {postTestRecord && <a href={`/guru/semakan/${postTestRecord.id}`} target="_blank" rel="noreferrer" className="text-xs bg-emerald-600/80 hover:bg-emerald-500 text-white px-3 py-1.5 rounded shadow flex items-center gap-1 font-bold"><Eye size={12}/> Semak Esei Post</a>}
                                                    </div>
                                                 )}
                                              </div>
                                              
                                            </div>
                                          </motion.div>
                                        </td>
                                      </tr>
                                    )}
                                  </AnimatePresence>
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                       </table>
                     </div>
                   )}
                </div>

             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-60 border border-slate-700 text-sm font-medium"><div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>{toast.message}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}