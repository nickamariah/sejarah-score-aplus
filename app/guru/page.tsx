"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, HelpCircle, Save, Zap, Sparkles, Activity, UploadCloud, RefreshCw, CheckSquare, Filter, Menu, X, Search, MessageSquare, Eye, Rocket, AlertTriangle } from "lucide-react";
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
  const [statistik, setStatistik] = useState({ jumlah: 0, tinggi: 0, sederhana: 0, rendah: 0 });

  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [loadingSoalan, setLoadingSoalan] = useState(true);
  const [isCreatingSoalan, setIsCreatingSoalan] = useState(false);
  const [isEditingSoalan, setIsEditingSoalan] = useState(false);
  const [editSoalanId, setEditSoalanId] = useState<string | null>(null);
  
  // STATE CARIAN & FILTER
  const [searchMurid, setSearchMurid] = useState("");
  const [searchPemantauan, setSearchPemantauan] = useState("");
  const [searchSoalan, setSearchSoalan] = useState("");
  const [searchBahan, setSearchBahan] = useState("");
  const [searchSemakan, setSearchSemakan] = useState("");
  
  const [filterTingkatan, setFilterTingkatan] = useState("Semua");
  const [filterBab, setFilterBab] = useState("Semua");
  const [filterJenis, setFilterJenis] = useState("Semua");
  // 🌟 TAMBAHAN: Filter Kegunaan Ujian
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

  // STATE MAKLUM BALAS & MODAL DETAIL
  const [senaraiMaklumBalas, setSenaraiMaklumBalas] = useState<any[]>([]);
  const [loadingMaklumBalas, setLoadingMaklumBalas] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);
  
  // 🌟 TAMBAHAN: State Untuk Progress Setiap Bab Murid
  const [studentProgressData, setStudentProgressData] = useState<{skor: any[], chat: any[]}>({skor: [], chat: []});
  const [loadingStudentProgress, setLoadingStudentProgress] = useState(false);

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
      // Letak bab 3-10 Tingkatan 5 di sini...
    }
  };

  const subtopikPilihan = senaraiSubtopik[qTingkatan]?.[qBab] || [`Subtopik Umum ${qBab}`];

  useEffect(() => {
    if (!isEditingSoalan) setQTopik(subtopikPilihan[0] || "");
  }, [qTingkatan, qBab, isEditingSoalan]);

  // 🌟 TAMBAHAN: Tarik Progress Murid Secara Detail Apabila Modal Dibuka
  useEffect(() => {
    const tarikDetailMurid = async () => {
      if (selectedStudentDetail) {
        setLoadingStudentProgress(true);
        try {
          const targetIds = [selectedStudentDetail.id];
          if (selectedStudentDetail.idPengguna) targetIds.push(selectedStudentDetail.idPengguna);
          const uniqueIds = [...new Set(targetIds)];

          // Tarik semua rekod peperiksaan murid ini
          const qSkor = query(collection(db, "skor_murid"), where("idMurid", "in", uniqueIds));
          const snapSkor = await getDocs(qSkor);
          const skorData = snapSkor.docs.map(d => d.data());

          // Tarik rekod perbualan AI murid ini
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
      let tinggi = 0, sederhana = 0, rendah = 0, jumlahMurid = 0;
      querySnapshot.forEach((doc) => {
        const user = { id: doc.id, ...doc.data() } as any;
        data.push(user);
        if (user.role === "murid") {
          jumlahMurid++;
          const tahap = user.tahapInkuiri || "Rendah";
          if (tahap === "Tinggi") tinggi++;
          else if (tahap === "Sederhana") sederhana++;
          else rendah++;
        }
      });
      setSenaraiPengguna(data); setStatistik({ jumlah: jumlahMurid, tinggi, sederhana, rendah });
    } catch (error) { console.error(error); } finally { setLoadingPengguna(false); }
  };

  const tarikSoalanFirebase = async () => {
    setLoadingSoalan(true);
    try {
      const q = query(collection(db, "questionBank"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      
      querySnapshot.forEach((doc) => { 
        data.push({ id: doc.id, ...doc.data() }); 
      });

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
    tarikSoalanFirebase(); 
    tarikDataPenggunaFirebase(); 
    tarikBahanFirebase(); 
    tarikDataSemakan();
    tarikDataMaklumBalas();
  }, []);

  const handleSimpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uKataLaluan.length < 6) return showToastMessage("Kata laluan sekurang-kurangnya 6 aksara!", "error");
    setUIsSubmitting(true);
    
    try {
      if (isEditingUser && editUserId) {
        const updateData: any = { nama: uNama, kataLaluan: uKataLaluan, role: uRole };
        if (uRole === "murid") {
          updateData.tingkatan = String(uTingkatan);
          updateData.kelas = uKelas;
          updateData.tahapInkuiri = uTahapInkuiri;
          updateData.kumpulan = uKumpulan;
        }
        await updateDoc(doc(db, "users", editUserId), updateData);
        showToastMessage("Akaun berjaya dikemas kini!", "success");
      } else {
        let awalan = "M"; 
        if (uRole === "murid") {
          const numTing = String(uTingkatan).replace(/\D/g, "") || "4"; 
          const hurufK = uKumpulan === "Eksperimen" ? "E" : "K";
          awalan = `M${hurufK}${numTing}`; 
        } else if (uRole === "guru") awalan = "G"; 
        else if (uRole === "admin") awalan = "A";

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
          showToastMessage("Ralat mendaftar di Firebase Auth.", "error"); 
          setUIsSubmitting(false); 
          return; 
        }

        const newUserData: any = { 
          nama: uNama, email: emailMaya, kataLaluan: uKataLaluan, role: uRole, idPengguna: newId, tarikhDaftar: new Date().toISOString()
        };
        
        if (uRole === "murid") {
           newUserData.tingkatan = String(uTingkatan);
           newUserData.kelas = uKelas;
           newUserData.tahapInkuiri = uTahapInkuiri;
           newUserData.kumpulan = uKumpulan;
           newUserData.markahTerkini = 0; 
        }

        await setDoc(doc(db, "users", newId), newUserData); 
        showToastMessage("Akaun baru didaftar!", "success");
      }
      
      resetFormPengguna(); 
      tarikDataPenggunaFirebase();
      
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
      const dataSoalan: any = { 
        tingkatan: qTingkatan, bab: qBab, topik: qTopik, jenis: qJenis, kegunaan: qKegunaan, soalan: qSoalan, markah: parseInt(qMarkah) || 1, urutan: qUrutan ? parseInt(qUrutan) : 999, imageUrl: qImageUrl 
      };

      if (qJenis === "objektif") { 
        if (!qPilihanA || !qPilihanB) return showToastMessage("Isi pilihan!", "error"); 
        dataSoalan.pilihan = { A: qPilihanA, B: qPilihanB, C: qPilihanC, D: qPilihanD }; dataSoalan.jawapan = qJawapanBetul; 
      } else { 
        if (!qSkema) return showToastMessage("Isi Skema!", "error"); 
        dataSoalan.skemaJawapan = qSkema; 
      }

      if (isEditingSoalan && editSoalanId) { 
        dataSoalan.updatedAt = serverTimestamp(); 
        await updateDoc(doc(db, "questionBank", editSoalanId), dataSoalan); showToastMessage(`Dikemas kini!`, "success"); 
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
    setIsCreatingSoalan(true); 
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      showToastMessage(`Berjaya daftar Nota untuk ${bBab}!`, "success");
      setBJudul(""); setBLinkNota(""); tarikBahanFirebase(); setActiveTab("kandungan"); 
    } catch (error) { showToastMessage("Gagal menyimpan data.", "error"); } finally { setIsUploadingBahan(false); }
  };

  const handlePadamBahan = async (bahanId: string) => {
    if (confirm(`Pasti padam modul (${bahanId})? Tindakan ini kekal.`)) {
      try { await deleteDoc(doc(db, "chapters", bahanId)); showToastMessage("Bahan nota berjaya dipadam.", "success"); tarikBahanFirebase(); } catch (error) { showToastMessage("Ralat memadam nota.", "error"); }
    }
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

  const handleSimpanMukaSurat = async (bahanId: string) => {
    try { await updateDoc(doc(db, "chapters", bahanId), { subtopics: tempSubtopik, updatedAt: serverTimestamp() }); showToastMessage("Maklumat Subtopik berjaya disimpan!", "success"); setEditSubtopikId(null); tarikBahanFirebase(); } catch(error) { showToastMessage("Ralat menyimpan maklumat.", "error"); }
  };

  const showToastMessage = (msg: string, type: 'success'|'error'|'info'='info') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const handleLogout = () => { window.location.href = '/login'; };

  // FILTERING LOGICS
  const filteredPengguna = senaraiPengguna.filter(u => 
    u.nama?.toLowerCase().includes(searchMurid.toLowerCase()) || 
    u.idPengguna?.toLowerCase().includes(searchMurid.toLowerCase()) ||
    u.kelas?.toLowerCase().includes(searchMurid.toLowerCase())
  );

  const filteredPemantauan = senaraiPengguna.filter(u => u.role === "murid" && (
    u.nama?.toLowerCase().includes(searchPemantauan.toLowerCase()) || 
    u.idPengguna?.toLowerCase().includes(searchPemantauan.toLowerCase())
  ));

  const soalanListFiltered = soalanList.filter((q) => {
    const matchTingkatan = filterTingkatan === "Semua" || q.tingkatan === filterTingkatan;
    const matchBab = filterBab === "Semua" || q.bab === filterBab;
    const matchJenis = filterJenis === "Semua" || q.jenis === filterJenis;
    
    // 🌟 TAMBAHAN: Filter Mengikut Kegunaan Soalan
    const matchKegunaan = filterKegunaan === "Semua" || 
                         (filterKegunaan === "pre_post" && (q.kegunaan === "semua" || !q.kegunaan)) ||
                         q.kegunaan === filterKegunaan;
                         
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
    return paparNama.toLowerCase().includes(searchSemakan.toLowerCase()) || 
           s.bab?.toLowerCase().includes(searchSemakan.toLowerCase());
  });

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col justify-between z-50 transform transition-transform duration-300 md:relative md:translate-x-0 shrink-0 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="overflow-y-auto pr-2 no-scrollbar">
          <div className="mb-8 flex justify-between items-center">
            <div>
               <h1 className="text-2xl font-bold text-white mb-1">Makmal Kajian</h1>
               <p className="text-xs text-slate-400">Panel Admin I-RAGs Tutor</p>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X size={24}/></button>
          </div>
          <nav className="space-y-2">
            <button onClick={() => {setActiveTab("murid"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "murid" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Users size={18} /> Pengurusan Pengguna</button>
            <button onClick={() => {setActiveTab("pemantauan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "pemantauan" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50 font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Activity size={18} /> Pemantauan Murid</button>
            <button onClick={() => {setActiveTab("semakan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "semakan" ? "bg-rose-900/40 text-rose-400 border border-rose-800/50 font-bold shadow-md" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><CheckSquare size={18} /> Semakan Esei Ujian</button>
            <button onClick={() => {setActiveTab("soalan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "soalan" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50 font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><HelpCircle size={18} /> Bank Soalan</button>
            <button onClick={() => {setActiveTab("kandungan"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "kandungan" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><BookOpen size={18} /> Senarai Nota & Modul</button>
            <button onClick={() => {setActiveTab("upload"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "upload" ? "bg-slate-800 text-white font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><FileText size={18} /> Tambah Nota Baru</button>
            <button onClick={() => {setActiveTab("maklumbalas"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "maklumbalas" ? "bg-amber-900/40 text-amber-400 border border-amber-800/50 font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><MessageSquare size={18} /> Rekod Maklum Balas</button>
            <button onClick={() => {setActiveTab("analitik"); setIsMobileMenuOpen(false);}} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm ${activeTab === "analitik" ? "bg-indigo-900/40 text-indigo-400 border border-indigo-800/50 font-bold" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><ChartBar size={18} /> Analitik / SPSS (Data)</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-4 text-sm font-bold"><LogOut size={18} /> Log Keluar</button>
      </div>

      {/* KANDUNGAN UTAMA */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 relative w-full">
        
        {/* HEADER MUDAH ALIH */}
        <div className="md:hidden flex justify-between items-center mb-6 bg-[#1e293b] p-4 rounded-xl border border-slate-800">
          <h2 className="text-xl font-bold text-white tracking-wide">I-RAGS<span className="text-cyan-500">.Admin</span></h2>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:text-white"><Menu size={22}/></button>
        </div>

        <header className="hidden md:block mb-8 border-b border-slate-800 pb-6"><p className="text-cyan-500 text-sm font-bold tracking-wider uppercase mb-1">Makmal Penyelidikan Utama</p><h2 className="text-3xl font-extrabold text-white">Dashboard Guru & Penyelidik</h2></header>

       <main>
          {/* TAB 1: PENGURUSAN PENGGUNA */}
          {activeTab === "murid" && (
             <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4 shadow-lg">
                <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><Users className="text-blue-400"/> Pengurusan Pengguna</h3><p className="text-slate-400 text-sm">Daftar, kemas kini, dan urus akaun sistem.</p></div>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                   <input type="text" placeholder="Cari nama / ID pengguna..." value={searchMurid} onChange={(e) => setSearchMurid(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 lg:col-span-1 h-fit shadow-lg order-last lg:order-first">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><Users className="text-blue-400" size={20}/> {isEditingUser ? "Kemas Kini Akaun" : "Daftar Akaun Baru"}</h4>
                  <form onSubmit={handleSimpanPengguna} className="space-y-4">
                    <div><label className="block text-sm text-slate-400 mb-1">Peranan (Role)</label><select value={uRole} onChange={e => setURole(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="murid">Murid</option><option value="guru">Guru</option><option value="admin">Admin</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-1">Nama Penuh</label><input type="text" value={uNama} onChange={e => setUNama(e.target.value)} required placeholder="Contoh: Ahmad" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                    <div><label className="block text-sm text-slate-400 mb-1">Kata Laluan</label><input type="text" value={uKataLaluan} onChange={e => setUKataLaluan(e.target.value)} required placeholder="123456" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                    {uRole === "murid" && (
                      <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-900/50 mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm text-slate-400 mb-1">Tingkatan</label><select value={uTingkatan} onChange={e => setUTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option></select></div>
                          <div><label className="block text-sm text-slate-400 mb-1">Kelas</label><input type="text" value={uKelas} onChange={e => setUKelas(e.target.value)} required placeholder="Cth: Sains" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="block text-sm text-slate-400 mb-1">Tahap Inkuiri Awal</label><select value={uTahapInkuiri} onChange={e => setUTahapInkuiri(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="Rendah">Rendah</option><option value="Sederhana">Sederhana</option><option value="Tinggi">Tinggi</option></select></div>
                          <div><label className="block text-sm text-slate-400 mb-1">Kumpulan</label><select value={uKumpulan} onChange={e => setUKumpulan(e.target.value)} className="w-full bg-[#0f172a] border border-cyan-800/50 rounded-lg p-3 text-cyan-400 font-bold"><option value="Eksperimen">Eksperimen</option><option value="Kawalan">Kawalan</option></select></div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 pt-4">
                      {isEditingUser && ( <button type="button" onClick={resetFormPengguna} className="flex-1 bg-slate-800 text-slate-300 font-semibold py-3 rounded-lg hover:bg-slate-700 text-sm">Batal</button> )}
                      <button type="submit" disabled={uIsSubmitting} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 shadow-lg text-sm">{uIsSubmitting ? "Menyimpan..." : isEditingUser ? "Simpan Perubahan" : "Daftar Akaun"}</button>
                    </div>
                  </form>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2 shadow-lg">
                  {loadingPengguna ? ( <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data pengguna... ⏳</div> ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-4 font-semibold text-sm text-slate-300">Pengguna</th><th className="p-4 font-semibold text-sm text-slate-300">Peranan</th><th className="p-4 font-semibold text-sm text-slate-300">Kelas/Tahap</th><th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                        <tbody>
                          {filteredPengguna.length > 0 ? filteredPengguna.map((u, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4"><div className="font-bold text-slate-200">{u.nama}</div><div className="text-slate-500 text-xs mt-1">ID: <span className="text-amber-400">{u.idPengguna || u.id}</span></div></td>
                              <td className="p-4"><span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : u.role === 'guru' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-blue-900/30 text-blue-400'}`}>{u.role}</span></td>
                              <td className="p-4 text-slate-400 text-sm">{u.role === "murid" ? (<div className="flex flex-col items-start gap-1"><div className="font-medium text-slate-300">Tg. {u.tingkatan} {u.kelas}</div><span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-400">{u.kumpulan || "Eksperimen"}</span></div>) : <span>- N/A -</span>}</td>
                              <td className="p-4 text-right align-middle">
                                 <div className="flex items-center justify-end gap-2">
                                   <button onClick={() => setEditPengguna(u)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-amber-400" title="Edit Pengguna"><Edit3 size={16} /></button>
                                   <button onClick={() => handlePadamPengguna(u.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-red-400" title="Padam Pengguna"><Trash2 size={16} /></button>
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4 shadow-lg">
                 <div><h3 className="text-xl font-bold text-white mb-2 flex items-center gap-3"><Activity className="text-emerald-400" size={24}/> Pemantauan Status Murid</h3><p className="text-slate-400 text-sm">Pantau tahap inkuiri dan akses profil pembelajaran murid.</p></div>
                 <div className="relative w-full md:w-72">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                   <input type="text" placeholder="Cari nama murid..." value={searchPemantauan} onChange={(e) => setSearchPemantauan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:border-emerald-500 outline-none" />
                 </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-4 md:p-6 flex flex-col items-center shadow-lg"><span className="text-slate-400 text-[10px] md:text-xs font-bold uppercase mb-2 text-center">Jumlah Murid</span><span className="text-2xl md:text-4xl font-bold text-blue-400">{statistik.jumlah}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-emerald-900/30 p-4 md:p-6 flex flex-col items-center shadow-lg"><span className="text-emerald-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center">Inkuiri Tinggi</span><span className="text-2xl md:text-4xl font-bold text-emerald-400">{statistik.tinggi}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-amber-900/30 p-4 md:p-6 flex flex-col items-center shadow-lg"><span className="text-amber-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center">Inkuiri Sederhana</span><span className="text-2xl md:text-4xl font-bold text-amber-400">{statistik.sederhana}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-red-900/30 p-4 md:p-6 flex flex-col items-center shadow-lg"><span className="text-red-500 text-[10px] md:text-xs font-bold uppercase mb-2 text-center">Inkuiri Rendah</span><span className="text-2xl md:text-4xl font-bold text-red-400">{statistik.rendah}</span></div>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Tahap Inkuiri Semasa</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Status / Indikator</th><th className="p-5 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                    <tbody>
                      {filteredPemantauan.map((murid, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-5"><div className="font-bold text-slate-200">{murid.nama}</div><div className="text-slate-500 text-xs mt-1">Tg. {murid.tingkatan} {murid.kelas}</div></td>
                          <td className="p-5 text-center"><span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase border ${murid.tahapInkuiri === 'Tinggi' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : murid.tahapInkuiri === 'Sederhana' ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}`}>{murid.tahapInkuiri || 'Rendah'}</span></td>
                          <td className="p-5 text-center">{murid.tahapInkuiri === 'Tinggi' ? <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1"><Zap size={14}/> Cemerlang</span> : murid.tahapInkuiri === 'Sederhana' ? <span className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1"><Activity size={14}/> Berkembang</span> : <span className="text-red-400 text-xs font-bold flex items-center justify-center gap-1">⚠️ Perlu Bimbingan</span>}</td>
                          <td className="p-5 text-right"><button onClick={() => setSelectedStudentDetail(murid)} className="inline-flex items-center gap-2 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"><Eye size={14}/> Lihat Detail</button></td>
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-lg gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><CheckSquare className="text-rose-400" size={20}/> Dashboard Semakan Ujian</h3>
                  <p className="text-slate-400 text-sm">Semak dan sahkan markah struktur/esei (Human-in-the-Loop).</p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                    <input type="text" placeholder="Cari bab atau nama..." value={searchSemakan} onChange={(e) => setSearchSemakan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm focus:border-rose-500 outline-none" />
                  </div>
                  <button onClick={tarikDataSemakan} className="w-full md:w-auto bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-md transition-colors">
                    <RefreshCw size={16} className={loadingSemakan ? "animate-spin" : ""}/> Segar Semula
                  </button>
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                {loadingSemakan ? (
                   <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data jawapan murid... ⏳</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
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

                          if (status === "disemak_oleh_guru") { statusColor = "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"; statusText = "Selesai Disahkan Guru"; } 
                          else if (status === "disemak_oleh_AI") { statusColor = "bg-blue-900/30 text-blue-400 border border-blue-800/50"; statusText = "Selesai Ditanda AI"; }

                          let aiGagal = false;
                          if (rekod.ulasanAI) Object.values(rekod.ulasanAI).forEach((u: any) => { if (u.komenAI && (u.komenAI.includes("GAGAL") || u.komenAI.includes("Sistem Gagal"))) aiGagal = true; });
                          if (aiGagal && status !== "disemak_oleh_guru") { statusColor = "bg-rose-900/30 text-rose-400 border border-rose-800/50 animate-pulse ring-1 ring-rose-500/50"; statusText = "⚠️ AI Gagal - Sila Semak"; }

                          // CARIAN SILANG NAMA TERKINI
                          const realUser = senaraiPengguna.find(u => u.id === rekod.idMurid || u.idPengguna === rekod.idMurid);
                          const paparNama = realUser?.nama || realUser?.name || rekod.namaMurid || "Tanpa Nama";

                          return (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="p-5"><div className="font-bold text-slate-200">{paparNama}</div><div className="text-slate-500 text-[10px] mt-1 uppercase">ID: {rekod.idMurid || rekod.id}</div></td>
                              <td className="p-5 text-slate-400 text-sm"><span className="text-blue-400 font-bold">Ting. {rekod.tingkatan}</span> | {rekod.bab}</td>
                              <td className="p-5 text-center"><span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>{statusText}</span></td>
                              <td className="p-5 text-center text-sm"><div className="text-slate-400 mb-1">Objektif: <span className="font-bold text-blue-400 px-2 bg-blue-900/20 rounded">{rekod.skorObjektif || 0}</span></div><div className="text-slate-400">Esei: <span className="font-bold text-purple-400 px-2 bg-purple-900/20 rounded">{rekod.markahStruktur || 0}</span></div></td>
                              <td className="p-5 text-right"><a href={`/guru/semakan/${rekod.id}`} target="_blank" rel="noreferrer" className="inline-block bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105">Semak Jawapan</a></td>
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

          {/* TAB 4: BANK SOALAN UJIAN */}
          {activeTab === "soalan" && (
            <div className="space-y-6 animate-in fade-in">
              {!isCreatingSoalan ? (
                <>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4">
                    <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><HelpCircle className="text-cyan-400" /> Bank Soalan Ujian</h3><p className="text-slate-400 text-sm">Uruskan soalan dan tetapkan sasaran ujian (Pre / Post / Pemulihan).</p></div>
                    <button onClick={() => { resetFormSoalan(); setIsCreatingSoalan(true); }} className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center"><Plus size={18} className="mr-2" /> Bina Soalan Baru</button>
                  </div>
                  
                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row flex-wrap items-center gap-3 shadow-sm">
                     <div className="flex items-center gap-2 text-slate-300 font-bold text-sm shrink-0 w-full md:w-auto"><Filter size={18} className="text-cyan-400"/> Tapis & Cari:</div>
                     
                     <div className="relative w-full md:flex-1 min-w-50">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                       <input type="text" placeholder="Cari teks soalan / topik..." value={searchSoalan} onChange={(e) => setSearchSoalan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:border-cyan-500 outline-none" />
                     </div>

                     <div className="flex flex-wrap w-full md:w-auto gap-2">
                       <select value={filterTingkatan} onChange={(e) => setFilterTingkatan(e.target.value)} className="flex-1 min-w-30 bg-[#0f172a] text-sm text-slate-300 border border-slate-600 rounded-lg px-2 py-2 focus:border-cyan-500 outline-none">
                          <option value="Semua">Semua Tg.</option><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option>
                       </select>
                       <select value={filterBab} onChange={(e) => setFilterBab(e.target.value)} className="flex-1 min-w-25 bg-[#0f172a] text-sm text-slate-300 border border-slate-600 rounded-lg px-2 py-2 focus:border-cyan-500 outline-none">
                          <option value="Semua">Semua Bab</option>{[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                       </select>
                       <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="flex-1 min-w-27.5 bg-[#0f172a] text-sm text-slate-300 border border-slate-600 rounded-lg px-2 py-2 focus:border-cyan-500 outline-none">
                          <option value="Semua">Semua Jenis</option><option value="objektif">Objektif</option><option value="struktur">Struktur</option>
                       </select>
                       
                       {/* 🌟 TAMBAHAN: Filter Mengikut Sasaran Ujian */}
                       <select value={filterKegunaan} onChange={(e) => setFilterKegunaan(e.target.value)} className="flex-1 min-w-35 bg-cyan-900/20 text-sm text-cyan-300 font-bold border border-cyan-800 rounded-lg px-2 py-2 focus:border-cyan-500 outline-none">
                          <option value="Semua">Semua Sasaran</option>
                          <option value="pre_post">Pre & Post</option>
                          <option value="pre_test">Pre-Test Sahaja</option>
                          <option value="post_test">Post-Test Sahaja</option>
                          <option value="pemulihan">Pemulihan Sahaja</option>
                          <option value="simpanan">Simpanan / Draf</option>
                       </select>
                     </div>
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                    {loadingSoalan ? ( <div className="p-12 text-center text-slate-400 animate-pulse">Memuat turun Bank Soalan... ⏳</div> ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-max">
                          <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-4 font-semibold text-sm text-slate-300">ID</th><th className="p-4 font-semibold text-sm text-slate-300">Topik</th><th className="p-4 font-semibold text-sm text-slate-300">Kegunaan</th><th className="p-4 font-semibold text-sm text-slate-300">Jenis</th><th className="p-4 font-semibold text-sm text-slate-300 text-center">Susunan</th><th className="p-4 font-semibold text-sm text-slate-300 max-w-sm">Soalan</th><th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                          <tbody>
                            {soalanListFiltered.length > 0 ? soalanListFiltered.map((q, i) => (
                              <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                <td className="p-4 text-sm font-bold text-amber-500">{q.id}</td>
                                <td className="p-4 text-slate-200 text-sm">{q.topik}</td>
                                <td className="p-4">
                                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                    q.kegunaan === 'pre_test' ? 'bg-indigo-900/30 text-indigo-400' : 
                                    q.kegunaan === 'post_test' ? 'bg-emerald-900/30 text-emerald-400' : 
                                    q.kegunaan === 'pemulihan' ? 'bg-orange-900/40 text-orange-400 border border-orange-800/50' :
                                    q.kegunaan === 'simpanan' ? 'bg-slate-700/50 text-slate-400 border border-slate-600' : 
                                    'bg-blue-900/30 text-blue-400'
                                  }`}>
                                    {q.kegunaan === 'semua' || !q.kegunaan ? "PRE & POST" : q.kegunaan === 'pemulihan' ? "PEMULIHAN 🚀" : q.kegunaan === 'simpanan' ? "SIMPANAN" : q.kegunaan}
                                  </span>
                                </td>
                                <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded-md font-bold ${q.jenis === 'objektif' ? 'bg-amber-900/30 text-amber-400' : 'bg-purple-900/30 text-purple-400'}`}>{q.jenis?.toUpperCase()}</span></td>
                                <td className="p-4 text-slate-300 text-sm font-bold text-center bg-slate-800/30 rounded-lg">{q.urutan === 999 || !q.urutan ? "-" : q.urutan}</td>
                                <td className="p-4 text-slate-300 text-xs truncate max-w-xs" title={q.soalan}>{q.soalan}</td>
                                <td className="p-4 text-right align-middle">
                                   <div className="flex items-center justify-end gap-2">
                                     <button onClick={() => handleEditSoalan(q)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-amber-400" title="Edit Soalan"><Edit3 size={16} /></button>
                                     <button onClick={() => handlePadamSoalan(q.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-red-400" title="Padam Soalan"><Trash2 size={16} /></button>
                                   </div>
                                </td>
                              </tr>
                            )) : <tr><td colSpan={7} className="p-8 text-center text-slate-500">Tiada soalan yang sepadan dengan tapisan ini.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-cyan-800/50 shadow-lg max-w-4xl relative overflow-hidden">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-6 flex items-center gap-3"><HelpCircle className="text-cyan-400 w-6 h-6 md:w-8 md:h-8" /> {isEditingSoalan ? `Kemas Kini Soalan (${editSoalanId})` : "Cipta Soalan Baharu"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div><label className="block text-sm text-slate-400 mb-2">Tingkatan</label><select value={qTingkatan} onChange={e => setQTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Bab</label><select value={qBab} onChange={e => setQBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">{[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}</select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Topik</label><select value={qTopik} onChange={e => setQTopik(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">{subtopikPilihan.map((sub: string, index: number) => (<option key={index} value={sub}>{sub}</option>))}</select></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-emerald-400 font-bold mb-2">Sasaran Ujian</label>
                      <select value={qKegunaan} onChange={e => setQKegunaan(e.target.value)} className="w-full bg-emerald-900/20 border-2 border-emerald-800/50 rounded-lg p-3 text-emerald-300 font-bold outline-none text-sm">
                        <option value="semua">Pre-Test & Post-Test</option>
                        <option value="pre_test">Khas Pre-Test Sahaja</option>
                        <option value="post_test">Khas Post-Test Sahaja</option>
                        {/* 🌟 TAMBAHAN: Mod Pemulihan */}
                        <option value="pemulihan">Khas Pemulihan Sahaja</option>
                        <option value="simpanan">Simpanan Sahaja (Draf)</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-slate-400 mb-2">Jenis Soalan</label><select value={qJenis} onChange={e => setQJenis(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg p-3 text-white font-bold"><option value="objektif">Objektif</option><option value="struktur">Struktur / Esei</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Markah</label><input type="number" value={qMarkah} onChange={e => setQMarkah(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                    <div><label className="block text-sm text-blue-400 font-bold mb-2">No. Susunan</label><input type="number" value={qUrutan} onChange={e => setQUrutan(e.target.value)} placeholder="Cth: 1, 2, 3..." className="w-full bg-[#0f172a] border border-blue-800/50 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"/></div>
                  </div>
                  <div className="mb-6"><label className="block text-sm text-slate-400 mb-2">Soalan</label><textarea rows={4} value={qSoalan} onChange={e => setQSoalan(e.target.value)} placeholder="Taip soalan..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 text-white resize-none text-base"></textarea></div>
                  <div className="mb-6"><label className="block text-sm text-slate-400 mb-2">Pautan URL Gambar Rujukan (Pilihan)</label><input type="url" value={qImageUrl} onChange={e => setQImageUrl(e.target.value)} placeholder="Tampal link gambar..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"/>
                    {qImageUrl && qImageUrl.trim() !== "" && ( <div className="mt-3 border border-slate-700 p-2 rounded-lg inline-block bg-slate-800/50"><img src={qImageUrl} alt="Pratonton Soalan" className="max-h-32 object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div> )}
                  </div>
                  {qJenis === "objektif" ? (
                    <div className="bg-slate-800/50 p-4 md:p-6 rounded-xl border border-slate-700 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">A</span><input type="text" value={qPilihanA} onChange={e => setQPilihanA(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white text-sm"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">B</span><input type="text" value={qPilihanB} onChange={e => setQPilihanB(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white text-sm"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">C</span><input type="text" value={qPilihanC} onChange={e => setQPilihanC(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white text-sm"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">D</span><input type="text" value={qPilihanD} onChange={e => setQPilihanD(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white text-sm"/></div>
                      </div>
                      <div><label className="block text-sm text-emerald-400 font-bold mb-2">Jawapan Betul</label><select value={qJawapanBetul} onChange={e => setQJawapanBetul(e.target.value)} className="w-full md:w-1/2 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-emerald-300 font-bold"><option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option></select></div>
                    </div>
                  ) : (
                    <div className="bg-purple-900/20 p-4 md:p-6 rounded-xl border border-purple-800/50 mb-8"><h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2 text-sm"><Sparkles size={18}/> Skema Jawapan (Untuk Semakan AI)</h4><textarea rows={5} value={qSkema} onChange={e => setQSkema(e.target.value)} className="w-full bg-[#0f172a] border border-purple-700/50 rounded-lg p-4 text-white resize-none"></textarea></div>
                  )}
                  <div className="flex flex-col md:flex-row justify-end gap-3 md:gap-4 pt-4 border-t border-slate-800">
                    <button onClick={resetFormSoalan} className="w-full md:w-auto px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700">Batal</button>
                    <button onClick={handleSimpanSoalan} disabled={uIsSubmitting} className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center shadow-lg">{uIsSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18}/>}{isEditingSoalan ? "Simpan Perubahan" : "Simpan Soalan"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SENARAI BAHAN NOTA */}
          {activeTab === "kandungan" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 gap-4">
                <div><h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><BookOpen className="text-blue-400" size={20}/> Senarai Bahan Rujukan & Nota</h3><p className="text-slate-400 text-sm">Urus modul dan Pautan URL mengikut subtopik khusus.</p></div>
                <button onClick={() => setActiveTab("upload")} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center"><Plus size={18} className="mr-2" /> Tambah Nota Baru</button>
              </div>

              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row items-center gap-3 shadow-sm">
                <div className="relative w-full md:flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
                   <input type="text" placeholder="Cari tajuk bahan nota..." value={searchBahan} onChange={(e) => setSearchBahan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-600 text-white pl-9 pr-3 py-2 rounded-lg text-sm focus:border-blue-500 outline-none" />
                </div>
                <select value={filterTingkatanBahan} onChange={(e) => setFilterTingkatanBahan(e.target.value)} className="w-full md:w-auto bg-[#0f172a] text-sm text-slate-300 border border-slate-600 rounded-lg px-4 py-2 focus:border-blue-500 outline-none">
                   <option value="Semua">Semua Tingkatan</option><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option>
                </select>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loadingBahan ? ( <p className="text-slate-400 animate-pulse col-span-2 text-center p-8">Memuat turun data nota...</p> ) : filteredBahan.length > 0 ? (
                  filteredBahan.map((bahan, idx) => (
                    <div key={idx} className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors shadow-lg flex flex-col h-full overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-900/30 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-blue-800/50 mt-1">Tingkatan {bahan.form}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditSubtopikId(bahan.id); setTempSubtopik(bahan.subtopics || []); }} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-amber-600 transition-colors" title="Edit Subtopik & Link"><Edit3 size={16}/></button>
                          <button onClick={() => handleKemaskiniSubtopik(bahan)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-600 transition-colors" title="Auto-Sync Subtopik"><RefreshCw size={16}/></button>
                          <a href={bahan.chapterUrl} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600 transition-colors" title="Lihat Pautan Induk"><FileText size={16}/></a>
                          <button onClick={() => handlePadamBahan(bahan.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-600 transition-colors" title="Padam Nota"><Trash2 size={16}/></button>
                        </div>
                      </div>

                      <h4 className="text-lg md:text-xl font-bold text-white mb-2 line-clamp-2">{bahan.title}</h4>
                      <p className="text-sm font-bold text-amber-500">ID: {bahan.id}</p>
                      
                      {editSubtopikId === bahan.id ? (
                        <div className="mt-3 bg-slate-900/50 p-4 rounded-lg border border-amber-600/50">
                          <p className="text-xs text-amber-400 font-bold mb-3 uppercase flex items-center gap-2"><Edit3 size={14}/> Tetapkan Link Khas & Teks AI:</p>
                          <div className="space-y-4 mb-4 max-h-80 overflow-y-auto pr-2">
                            {tempSubtopik.map((sub, i) => (
                               <div key={i} className="flex flex-col gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                 <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2"><span className="text-sm font-extrabold text-blue-400 shrink-0">{sub.id}</span><span className="text-xs md:text-sm text-slate-200 font-medium">{sub.title}</span></div>
                                 <div className="flex flex-col md:flex-row md:items-center gap-2 mt-1">
                                   <span className="text-[10px] text-blue-400 font-bold uppercase shrink-0 md:w-16 md:text-right">🔗 Nota:</span>
                                   <input type="text" value={sub.notaUrl || ""} placeholder="Link Canva/Drive Subtopik..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].notaUrl = e.target.value; setTempSubtopik(newSubs); }} className="flex-1 bg-[#0f172a] text-slate-300 font-mono text-[10px] p-2 rounded border border-slate-700 focus:border-blue-500 outline-none" />
                                 </div>
                                 <div className="flex flex-col md:flex-row md:items-center gap-2">
                                   <span className="text-[10px] text-red-400 font-bold uppercase shrink-0 md:w-16 md:text-right">📺 Video:</span>
                                   <input type="text" value={sub.videoUrl || ""} placeholder="Link YouTube Subtopik..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].videoUrl = e.target.value; setTempSubtopik(newSubs); }} className="flex-1 bg-[#0f172a] text-slate-300 font-mono text-[10px] p-2 rounded border border-slate-700 focus:border-red-500 outline-none" />
                                 </div>
                                 <div className="flex flex-col gap-1 mt-2">
                                   <span className="text-[10px] text-emerald-400 font-bold uppercase">🧠 Teks Rujukan Khusus (Fakta AI):</span>
                                   <textarea rows={3} value={sub.teksAI || ""} placeholder="Copy & Paste perenggan fakta rujukan mutlak AI di sini..." onChange={(e) => { const newSubs = [...tempSubtopik]; newSubs[i].teksAI = e.target.value; setTempSubtopik(newSubs); }} className="w-full bg-[#0f172a] text-emerald-100 font-sans text-xs p-3 rounded-lg border border-emerald-800/50 focus:border-emerald-500 outline-none resize-y" />
                                 </div>
                               </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                            <button onClick={() => setEditSubtopikId(null)} className="flex-1 bg-slate-800 text-slate-400 text-xs md:text-sm font-bold py-2.5 rounded-lg hover:bg-slate-700 border border-slate-700">Batal</button>
                            <button onClick={() => handleSimpanMukaSurat(bahan.id)} className="flex-1 bg-amber-600 text-white font-bold text-xs md:text-sm py-2.5 rounded-lg hover:bg-amber-500 shadow-lg">Simpan Tetapan</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex-1 overflow-y-auto max-h-60 mt-3">
                           <p className="text-[11px] text-slate-500 font-bold uppercase mb-3">Pautan Khusus Subtopik:</p>
                           <ul className="text-sm text-slate-300 space-y-3">
                             {bahan.subtopics?.map((sub: any, i: number) => (
                               <li key={i} className="flex flex-col gap-1 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                 <div className="flex items-center gap-2"><span className="text-blue-400 font-bold shrink-0">{sub.id}</span> <span className="truncate text-[11px] md:text-xs font-medium">{sub.title}</span></div>
                                 <div className="flex flex-wrap items-center gap-2 ml-7 text-[9px] md:text-[10px]">
                                   {sub.notaUrl ? <span className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800/50">🔗 Khas</span> : <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">🔗 Ikut Induk Bab</span>}
                                   {sub.videoUrl ? <span className="text-red-300 bg-red-900/30 px-2 py-0.5 rounded border border-red-800/50">📺 Ada Video</span> : null}
                                   {sub.teksAI ? <span className="text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded border border-emerald-800/50">🧠 Teks AI Disuap</span> : null}
                                 </div>
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : <p className="text-slate-500 col-span-2 text-center p-8 bg-slate-800/20 rounded-xl border border-slate-700 border-dashed">Belum ada nota yang padan didaftarkan.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: MUAT NAIK BAHAN BAHARU */}
          {activeTab === "upload" && (
             <div className="bg-[#1e293b] p-6 md:p-8 rounded-2xl border border-slate-800 max-w-2xl shadow-lg relative overflow-hidden animate-in fade-in">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-3"><UploadCloud className="text-blue-400 w-6 h-6 md:w-8 md:h-8"/> Daftar Bahan Rujukan Baru</h3>
                <p className="text-slate-400 text-sm mb-6 border-b border-slate-800 pb-6">Sistem akan menyusun nota ini mengikut subtopik silibus yang diprogramkan.</p>
                <form onSubmit={handleSimpanBahan} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div><label className="block text-sm text-slate-400 mb-2">Tingkatan</label><select value={bTingkatan} onChange={e => setBTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm"><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Pilih Bab</label><select value={bBab} onChange={e => setBBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm">{[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}</select></div>
                  </div>
                  <div><label className="block text-sm text-slate-400 mb-2">Tajuk Buku / Nota Induk</label><input type="text" value={bJudul} onChange={e => setBJudul(e.target.value)} placeholder="Contoh: Warisan Negara Bangsa" required className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm"/></div>
                  <div className="bg-blue-900/20 p-4 md:p-6 rounded-xl border border-blue-800/50 border-dashed text-center">
                    <label className="block text-sm text-blue-300 font-bold mb-2">Pautan Utama (Google Drive / Canva)</label>
                    <p className="text-xs text-blue-400 mb-4 font-normal">Pastikan pautan diset kepada "Anyone with the link can view".</p>
                    <input type="url" value={bLinkNota} onChange={e => setBLinkNota(e.target.value)} placeholder="https://..." required className="w-full bg-[#0f172a] border border-blue-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-400 text-sm"/>
                  </div>
                  <div className="flex justify-end pt-2"><button type="submit" disabled={isUploadingBahan} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center justify-center shadow-lg disabled:opacity-50 text-sm">{isUploadingBahan ? <Loader2 className="animate-spin mr-2" size={18} /> : <UploadCloud className="mr-2" size={18}/>}{isUploadingBahan ? "Menyimpan..." : "Simpan & Proses Automatik"}</button></div>
                </form>
             </div>
          )}

          {/* TAB 7: MAKLUM BALAS MURID */}
          {activeTab === "maklumbalas" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#1e293b] p-6 rounded-2xl border border-amber-800/50 gap-4 shadow-lg">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><MessageSquare className="text-amber-400" size={20}/> Suara Pelajar & Maklum Balas</h3>
                  <p className="text-slate-400 text-sm">Lihat pengalaman, masalah, atau cadangan yang dihantar oleh murid terhadap I-RAGs.</p>
                </div>
                <button onClick={tarikDataMaklumBalas} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold border border-slate-700">
                  <RefreshCw size={16} className={loadingMaklumBalas ? "animate-spin" : ""}/> Segar Semula
                </button>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                {loadingMaklumBalas ? (
                  <div className="p-12 text-center text-slate-400 animate-pulse">Menarik rekod maklum balas... ⏳</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-max">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/50">
                          <th className="p-5 font-semibold text-sm text-slate-300 w-48">Tarikh</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Jenis</th>
                          <th className="p-5 font-semibold text-sm text-slate-300">Komen / Mesej</th>
                        </tr>
                      </thead>
                      <tbody>
                        {senaraiMaklumBalas.length > 0 ? senaraiMaklumBalas.map((mb, i) => {
                          const realUser = senaraiPengguna.find(u => u.id === mb.muridId || u.idPengguna === mb.muridId);
                          const paparNama = realUser?.nama || realUser?.name || mb.namaMurid || "Tanpa Nama";

                          return (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-5 text-slate-400 text-xs">
                                {mb.tarikh ? new Date(mb.tarikh).toLocaleString('ms-MY') : "Tiada Rekod Tarikh"}
                              </td>
                              <td className="p-5 font-bold text-slate-200 text-sm">
                                {paparNama}
                                <br/>
                                <span className="text-[10px] text-slate-500 font-normal">ID: {mb.muridId}</span>
                              </td>
                              <td className="p-5">
                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                                  mb.jenis === 'Pujian' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/50' :
                                  mb.jenis === 'Masalah' ? 'bg-rose-900/30 text-rose-400 border border-rose-800/50' :
                                  'bg-amber-900/30 text-amber-400 border border-amber-800/50'
                                }`}>{mb.jenis || "Umum"}</span>
                              </td>
                              <td className="p-5 text-slate-300 text-sm max-w-md whitespace-normal">{mb.mesej}</td>
                            </tr>
                          )
                        }) : (
                          <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tiada maklum balas direkodkan lagi.</td></tr>
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

      {/* 🌟 MODAL TERPERINCI MURID DENGAN PROGRESS SETIAP BAB (DIKEMAS KINI) */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#1e293b] p-6 rounded-2xl w-full max-w-5xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">Profil & Prestasi: <span className="text-blue-400">{selectedStudentDetail.nama}</span></h3>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Tingkatan {selectedStudentDetail.tingkatan} {selectedStudentDetail.kelas}</span> 
                      <span className={`px-2 py-0.5 rounded border ${selectedStudentDetail.kumpulan === 'Kawalan' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-cyan-900/30 border-cyan-800 text-cyan-400'}`}>Kumpulan: {selectedStudentDetail.kumpulan || 'Eksperimen'}</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedStudentDetail(null)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 transition-colors"><X size={24}/></button>
                </div>

                <div className="overflow-y-auto pr-2 no-scrollbar">
                   <h4 className="text-slate-300 font-bold mb-3 flex items-center gap-2"><CheckSquare size={18} className="text-emerald-400"/> Kad Kemajuan Bab Berstruktur</h4>
                   
                   {loadingStudentProgress ? (
                      <div className="p-12 text-center text-slate-400 animate-pulse bg-slate-900/50 rounded-xl border border-slate-800">Menyusun data progress pelajar... ⏳</div>
                   ) : (
                     <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                       <table className="w-full text-left border-collapse min-w-max">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-800/50">
                              <th className="p-4 font-semibold text-xs text-slate-300">Bab Sejarah</th>
                              <th className="p-4 font-semibold text-xs text-slate-300 text-center">Ujian Diagnostik (Pre)</th>
                              <th className="p-4 font-semibold text-xs text-slate-300 text-center">Bimbingan AI</th>
                              <th className="p-4 font-semibold text-xs text-slate-300 text-center">Ujian Pasca (Post)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Paparkan senarai Bab 1 - 10 untuk Tingkatan Murid */}
                            {[1,2,3,4,5,6,7,8,9,10].map((num) => {
                              const babName = `Bab ${num}`;
                              
                              // Cari Pre-Test Score (Jenis Ujian = pre_test atau undefined)
                              const preTestRecord = studentProgressData.skor.find(s => s.bab === babName && (s.jenisUjian === "pre_test" || !s.jenisUjian));
                              const preSkor = preTestRecord ? preTestRecord.skor : null;
                              
                              // Cari Post-Test Score / Pemulihan (Jenis Ujian = post_test)
                              const postTestRecord = studentProgressData.skor.find(s => s.bab === babName && s.jenisUjian === "post_test");
                              const postSkor = postTestRecord ? postTestRecord.skor : null;
                              const attempt = postTestRecord ? (postTestRecord.percubaan || 1) : 0;
                              
                              // Semak Bimbingan AI (Berapa subtopik dalam bab ini selesai)
                              const aiSelesaiCount = studentProgressData.chat.filter(c => c.chapterId?.includes(`bab${num}_sub`) && c.status === "completed").length;
                              const aiInProgress = studentProgressData.chat.some(c => c.chapterId?.includes(`bab${num}_sub`) && c.status === "in_progress");

                              return (
                                <tr key={num} className="border-b border-slate-800/30 hover:bg-slate-800/50 transition-colors">
                                  <td className="p-4 text-sm text-slate-200 font-bold w-1/4 whitespace-nowrap">
                                    {babName}
                                  </td>
                                  
                                  {/* KOLOM 1: PRE-TEST */}
                                  <td className="p-4 text-center">
                                    {preSkor !== null ? (
                                      <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold ${preSkor >= 70 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-800 text-slate-300 border border-slate-700'}`}>
                                        Selesai: {preSkor}%
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-600 font-medium italic">Belum Mula</span>
                                    )}
                                  </td>
                                  
                                  {/* KOLOM 2: BIMBINGAN AI */}
                                  <td className="p-4 text-center">
                                    {selectedStudentDetail.kumpulan === 'Kawalan' ? (
                                       <span className="text-[11px] text-slate-600 font-medium">Bukan Kumpulan AI</span>
                                    ) : aiSelesaiCount > 0 ? (
                                      <span className="text-[11px] px-3 py-1.5 rounded-full font-bold bg-amber-900/30 text-amber-400 border border-amber-800/50 flex items-center justify-center w-max mx-auto gap-1">
                                        <Sparkles size={12}/> {aiSelesaiCount} Subtopik Lulus
                                      </span>
                                    ) : aiInProgress ? (
                                      <span className="text-[11px] px-3 py-1.5 rounded-full font-bold bg-blue-900/30 text-blue-400 animate-pulse border border-blue-800/50">
                                        Sedang Dibimbing
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-600 font-medium italic">Belum Akses AI</span>
                                    )}
                                  </td>
                                  
                                  {/* KOLOM 3: POST-TEST / PEMULIHAN */}
                                  <td className="p-4 text-center">
                                    {postSkor !== null ? (
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold flex items-center gap-1 ${
                                          postSkor >= 50 ? 'bg-emerald-900/40 text-emerald-400' : 'bg-rose-900/30 text-rose-400 border border-rose-800/50'
                                        }`}>
                                          Skor: {postSkor}% 
                                          {postSkor < 50 && <AlertTriangle size={12}/>}
                                        </span>
                                        {attempt > 1 && (
                                           <span className="text-[9px] font-bold text-orange-400 bg-orange-900/20 px-2 rounded-md">🚀 Tgk. Pemulihan</span>
                                        )}
                                      </div>
                                    ) : preSkor !== null && preSkor >= 70 ? (
                                      <span className="text-[11px] px-3 py-1 rounded-full font-bold bg-emerald-900/20 text-emerald-500 border border-emerald-800/50">Dikecualikan (Cemerlang)</span>
                                    ) : (
                                      <span className="text-[11px] text-slate-600 font-medium italic">Belum Diambil</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                       </table>
                     </div>
                   )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end">
                  <button onClick={() => setSelectedStudentDetail(null)} className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm">Tutup Paparan</button>
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