"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, HelpCircle, Save, Zap, Sparkles, Activity, UploadCloud, RefreshCw, CheckSquare } from "lucide-react";

// IMPORT KOMPONEN MAKMAL DATA KAJIAN
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// IMPORT FIREBASE 
import { collection, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { db, app } from "../../lib/firebase"; 
import { initializeApp, getApps } from "firebase/app"; 
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

type TabKey = "murid" | "pemantauan" | "kandungan" | "upload" | "soalan" | "analitik" | "semakan";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
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
  const [qTingkatan, setQTingkatan] = useState("4");
  const [qBab, setQBab] = useState("Bab 1");
  const [qTopik, setQTopik] = useState("");
  const [qJenis, setQJenis] = useState("objektif"); 
  
  // STATE UNTUK KEGUNAAN SOALAN
  const [qKegunaan, setQKegunaan] = useState("semua");

  const [qSoalan, setQSoalan] = useState("");
  const [qMarkah, setQMarkah] = useState("1");
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
    }
  };

  const subtopikPilihan = senaraiSubtopik[qTingkatan]?.[qBab] || [`Subtopik Umum ${qBab}`];

  useEffect(() => {
    if (!isEditingSoalan) setQTopik(subtopikPilihan[0] || "");
  }, [qTingkatan, qBab, isEditingSoalan]);

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
      const q = query(collection(db, "questionBank"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => { data.push({ id: doc.id, ...doc.data() }); });
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

  useEffect(() => { 
    tarikSoalanFirebase(); 
    tarikDataPenggunaFirebase(); 
    tarikBahanFirebase(); 
    tarikDataSemakan();
  }, []);

  const handleSimpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uKataLaluan.length < 6) return showToastMessage("Kata laluan sekurang-kurangnya 6 aksara!", "error");
    setUIsSubmitting(true);
    try {
      let customId = editUserId; let emailMaya = "";
      if (!isEditingUser) {
        let awalan = "M"; 
        if (uRole === "murid") {
          const numTing = uTingkatan.replace(/\D/g, "") || "4"; 
          const hurufK = uKumpulan === "Eksperimen" ? "E" : "K";
          awalan = `M${hurufK}${numTing}`; 
        } else if (uRole === "guru") awalan = "G"; else if (uRole === "admin") awalan = "A";

        const penggunaSamaRole = senaraiPengguna.filter(u => u.id && u.id.startsWith(awalan));
        let maxNumber = 0;
        penggunaSamaRole.forEach(u => {
          const numPart = parseInt(u.id.substring(awalan.length)); 
          if (!isNaN(numPart) && numPart > maxNumber) maxNumber = numPart;
        });
        customId = `${awalan}${String(maxNumber + 1).padStart(3, '0')}`;
        emailMaya = `${customId.toLowerCase()}@irags.edu`;

        try {
          const apps = getApps();
          let secondaryApp = apps.find(a => a.name === "AppPendaftaranRahsia");
          if (!secondaryApp) secondaryApp = initializeApp(app.options, "AppPendaftaranRahsia");
          const secondaryAuth = getAuth(secondaryApp);
          await createUserWithEmailAndPassword(secondaryAuth, emailMaya, uKataLaluan);
          await signOut(secondaryAuth); 
        } catch (error: any) {
          showToastMessage("Ralat Auth Firebase.", "error"); setUIsSubmitting(false); return; 
        }
      }

      const userData = { nama: uNama, email: emailMaya, kataLaluan: uKataLaluan, role: uRole, idPengguna: customId, ...(uRole === "murid" && { tingkatan: uTingkatan, kelas: uKelas, tahapInkuiri: uTahapInkuiri, kumpulan: uKumpulan, markahTerkini: 0 }) };
      if (isEditingUser && customId) { await updateDoc(doc(db, "users", customId), userData); showToastMessage(`Akaun dikemas kini!`, "success"); } 
      else if (customId) { await setDoc(doc(db, "users", customId), { ...userData, tarikhDaftar: new Date().toISOString() }); showToastMessage(`Akaun didaftar!`, "success"); }
      resetFormPengguna(); tarikDataPenggunaFirebase();
    } catch (error) { showToastMessage("Ralat sistem.", "error"); } finally { setUIsSubmitting(false); }
  };

  const handlePadamPengguna = async (id: string) => { if (confirm("Pasti mahu memadam akaun ini?")) { try { await deleteDoc(doc(db, "users", id)); showToastMessage("Berjaya dipadam.", "success"); tarikDataPenggunaFirebase(); } catch (error) { showToastMessage("Ralat.", "error"); } } };
  const setEditPengguna = (u: any) => { setIsEditingUser(true); setEditUserId(u.id); setURole(u.role || "murid"); setUNama(u.nama || ""); setUKataLaluan(u.kataLaluan || ""); setUTingkatan(u.tingkatan || "4"); setUKelas(u.kelas || ""); setUTahapInkuiri(u.tahapInkuiri || "Rendah"); setUKumpulan(u.kumpulan || "Eksperimen"); };
  const resetFormPengguna = () => { setIsEditingUser(false); setEditUserId(null); setURole("murid"); setUNama(""); setUKataLaluan(""); setUTingkatan("4"); setUKelas(""); setUTahapInkuiri("Rendah"); setUKumpulan("Eksperimen"); };

  const handleSimpanSoalan = async () => {
    if (!qSoalan || !qTopik) return showToastMessage("Isi Soalan & Subtopik!", "error");
    setUIsSubmitting(true);
    try {
      const dataSoalan: any = { 
        tingkatan: qTingkatan, 
        bab: qBab, 
        topik: qTopik, 
        jenis: qJenis, 
        kegunaan: qKegunaan, // <-- Simpan label ke DB
        soalan: qSoalan, 
        markah: parseInt(qMarkah), 
        imageUrl: qImageUrl 
      };
      
      if (qJenis === "objektif") { 
        if (!qPilihanA || !qPilihanB) return showToastMessage("Isi pilihan!", "error"); 
        dataSoalan.pilihan = { A: qPilihanA, B: qPilihanB, C: qPilihanC, D: qPilihanD }; 
        dataSoalan.jawapan = qJawapanBetul; 
      } 
      else { 
        if (!qSkema) return showToastMessage("Isi Skema!", "error"); 
        dataSoalan.skemaJawapan = qSkema; 
      }

      if (isEditingSoalan && editSoalanId) { 
        dataSoalan.updatedAt = serverTimestamp(); 
        await updateDoc(doc(db, "questionBank", editSoalanId), dataSoalan); 
        showToastMessage(`Dikemas kini!`, "success"); 
      } 
      else {
        dataSoalan.createdAt = serverTimestamp();
        const babNum = qBab.replace(/\D/g, ""); const typeChar = qJenis === "objektif" ? "Q" : "S"; const awalanSoalan = `B${babNum}${typeChar}`; 
        const soalanSamaAwalan = soalanList.filter(s => s.id && s.id.startsWith(awalanSoalan));
        let maxNum = 0; soalanSamaAwalan.forEach(s => { const numPart = parseInt(s.id.substring(awalanSoalan.length)); if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart; });
        const customIdSoalan = `${awalanSoalan}${String(maxNum + 1).padStart(3, '0')}`;
        await setDoc(doc(db, "questionBank", customIdSoalan), dataSoalan); 
        showToastMessage(`Ditambah!`, "success");
      }
      resetFormSoalan(); tarikSoalanFirebase();
    } catch (error) { showToastMessage("Ralat.", "error"); } finally { setUIsSubmitting(false); }
  };

  const handleEditSoalan = (q: any) => { 
    setIsEditingSoalan(true); 
    setEditSoalanId(q.id); 
    setQTingkatan(q.tingkatan || "4"); 
    setQBab(q.bab || "Bab 1"); 
    setQTopik(q.topik || ""); 
    setQJenis(q.jenis || "objektif"); 
    setQKegunaan(q.kegunaan || "semua"); // <-- Tarik label sedia ada
    setQSoalan(q.soalan || ""); 
    setQMarkah(q.markah?.toString() || "1"); 
    setQImageUrl(q.imageUrl || ""); 
    if (q.jenis === "objektif" && q.pilihan) { 
      setQPilihanA(q.pilihan.A || ""); setQPilihanB(q.pilihan.B || ""); setQPilihanC(q.pilihan.C || ""); setQPilihanD(q.pilihan.D || ""); setQJawapanBetul(q.jawapan || "A"); 
    } else { 
      setQSkema(q.skemaJawapan || ""); 
    } 
    setIsCreatingSoalan(true); 
  };
  
  const resetFormSoalan = () => { 
    setIsCreatingSoalan(false); 
    setIsEditingSoalan(false); 
    setEditSoalanId(null); 
    setQSoalan(""); 
    setQTopik(""); 
    setQKegunaan("semua"); // <-- Reset
    setQSkema(""); 
    setQImageUrl(""); 
    setQPilihanA(""); 
    setQPilihanB(""); 
    setQPilihanC(""); 
    setQPilihanD(""); 
    setQJawapanBetul("A"); 
  };
  
  const handlePadamSoalan = async (id: string) => { if (confirm("Padam soalan?")) { try { await deleteDoc(doc(db, "questionBank", id)); showToastMessage("Berjaya dipadam.", "success"); tarikSoalanFirebase(); } catch (error) { showToastMessage("Ralat.", "error"); } } };

  const handleSimpanBahan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bJudul || !bLinkNota) return showToastMessage("Isi tajuk & masukkan pautan nota!", "error");
    setIsUploadingBahan(true);
    
    const babNumber = bBab.replace(/\D/g, "");
    const documentId = `tingkatan${bTingkatan}_bab${babNumber}`;

    try {
      const listSub = senaraiSubtopik[bTingkatan]?.[bBab] || [];
      const subtopicsArray = listSub.map((sub: string, index: number) => {
        const parts = sub.split(" ");
        return { id: parts[0], title: parts.slice(1).join(" "), startPage: 1 };
      });

      await setDoc(doc(db, "chapters", documentId), { 
        title: bJudul, 
        subject: "Sejarah", 
        form: parseInt(bTingkatan), 
        chapterUrl: bLinkNota, 
        pdfFileName: documentId, 
        subtopics: subtopicsArray, 
        updatedAt: serverTimestamp() 
      });
      
      showToastMessage(`Berjaya daftar Nota untuk ${bBab}!`, "success");
      setBJudul(""); setBLinkNota(""); tarikBahanFirebase(); setActiveTab("kandungan"); 
    } catch (error) { 
      showToastMessage("Gagal menyimpan data.", "error"); 
    } finally { 
      setIsUploadingBahan(false); 
    }
  };

  const handlePadamBahan = async (bahanId: string) => {
    if (confirm(`Pasti padam modul (${bahanId})? Tindakan ini kekal.`)) {
      try {
        await deleteDoc(doc(db, "chapters", bahanId));
        showToastMessage("Bahan nota berjaya dipadam.", "success"); 
        tarikBahanFirebase(); 
      } catch (error) { showToastMessage("Ralat memadam nota.", "error"); }
    }
  };

  const handleKemaskiniSubtopik = async (bahan: any) => {
    const tingkatanStr = bahan.form.toString();
    const babNum = bahan.id.split('_bab')[1];   
    const babKey = `Bab ${babNum}`;             
    const listSub = senaraiSubtopik[tingkatanStr]?.[babKey] || [];
    const existingSubs = bahan.subtopics || [];

    const subtopicsArray = listSub.map((sub: string) => {
      const parts = sub.split(" ");
      const id = parts[0];
      const title = parts.slice(1).join(" ");
      const wujud = existingSubs.find((e: any) => e.id === id);
      
      return { 
        id, 
        title, 
        startPage: wujud ? wujud.startPage : 1,
        videoUrl: wujud?.videoUrl || "",
        notaUrl: wujud?.notaUrl || "",
        teksAI: wujud?.teksAI || "" 
      };
    });

    if(subtopicsArray.length === 0) return showToastMessage(`Tiada senarai subtopik dalam memori untuk ${babKey}.`, "error");

    try {
      await updateDoc(doc(db, "chapters", bahan.id), { subtopics: subtopicsArray, updatedAt: serverTimestamp() });
      showToastMessage(`Senarai subtopik diselaraskan!`, "success"); tarikBahanFirebase();
    } catch (error) { showToastMessage("Ralat sync subtopik.", "error"); }
  };

  const handleSimpanMukaSurat = async (bahanId: string) => {
    try {
      await updateDoc(doc(db, "chapters", bahanId), {
        subtopics: tempSubtopik,
        updatedAt: serverTimestamp()
      });
      showToastMessage("Maklumat Subtopik berjaya disimpan!", "success");
      setEditSubtopikId(null);
      tarikBahanFirebase(); 
    } catch(error) {
      showToastMessage("Ralat menyimpan maklumat.", "error");
    }
  };

  const showToastMessage = (msg: string, type: 'success'|'error'|'info'='info') => { setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000); };
  const handleLogout = () => { window.location.href = '/login'; };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col justify-between z-10 shrink-0">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white mb-2">Makmal Penyelidikan</h1>
            <p className="text-sm text-slate-400">Sistem admin bertaraf PhD untuk analisis dan kandungan.</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("murid")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "murid" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Users size={20} /> Pengurusan Pengguna</button>
            <button onClick={() => setActiveTab("pemantauan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "pemantauan" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><Activity size={20} /> Pemantauan I-RAGS</button>
            <button onClick={() => setActiveTab("semakan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "semakan" ? "bg-rose-900/40 text-rose-400 border border-rose-800/50 shadow-md" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><CheckSquare size={20} /> Semakan Esei Murid</button>
            <button onClick={() => setActiveTab("soalan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "soalan" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><HelpCircle size={20} /> Bank Soalan Ujian</button>
            <button onClick={() => setActiveTab("kandungan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "kandungan" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><BookOpen size={20} /> Senarai Bahan Nota</button>
            <button onClick={() => setActiveTab("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><FileText size={20} /> Tambah Bahan Baru</button>
            <button onClick={() => setActiveTab("analitik")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "analitik" ? "bg-indigo-900/40 text-indigo-400 border border-indigo-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}><ChartBar size={20} /> Makmal Data Kajian</button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-auto"><LogOut size={20} /> Log Keluar</button>
      </div>

      {/* KANDUNGAN UTAMA */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-slate-800 pb-6"><p className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-1">Makmal Penyelidikan</p><h2 className="text-3xl font-bold text-white mb-2">Dashboard Admin PhD</h2></header>

       <main>
          {/* TAB 1: PENGURUSAN PENGGUNA */}
          {activeTab === "murid" && (
             <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <div><h3 className="text-xl font-bold text-white mb-1">Pengurusan Pengguna (Firebase)</h3><p className="text-slate-400 text-sm">Daftar dan urus akaun Admin, Guru, dan Murid.</p></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 lg:col-span-1 h-fit shadow-lg">
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
                      {isEditingUser && ( <button type="button" onClick={resetFormPengguna} className="flex-1 bg-slate-800 text-slate-300 font-semibold py-3 rounded-lg hover:bg-slate-700">Batal</button> )}
                      <button type="submit" disabled={uIsSubmitting} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 shadow-lg">{uIsSubmitting ? "Menyimpan..." : isEditingUser ? "Simpan Perubahan" : "Daftar Akaun"}</button>
                    </div>
                  </form>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2 shadow-lg">
                  {loadingPengguna ? ( <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data... ⏳</div> ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-4 font-semibold text-sm text-slate-300">Pengguna</th><th className="p-4 font-semibold text-sm text-slate-300">Peranan</th><th className="p-4 font-semibold text-sm text-slate-300">Kelas/Tahap</th><th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                        <tbody>
                          {senaraiPengguna.length > 0 ? senaraiPengguna.map((u, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4"><div className="font-bold text-slate-200">{u.nama}</div><div className="text-slate-500 text-xs mt-1">ID: <span className="text-amber-400">{u.idPengguna || u.id}</span></div></td>
                              <td className="p-4"><span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : u.role === 'guru' ? 'bg-cyan-900/30 text-cyan-400' : 'bg-blue-900/30 text-blue-400'}`}>{u.role}</span></td>
                              <td className="p-4 text-slate-400 text-sm">{u.role === "murid" ? (<div className="flex flex-col items-start gap-1"><div className="font-medium text-slate-300">Tg. {u.tingkatan} {u.kelas}</div><span className="text-[10px] px-2 py-0.5 rounded border border-slate-600 bg-slate-800 text-slate-400">{u.kumpulan || "Eksperimen"}</span></div>) : <span>- N/A -</span>}</td>
                              <td className="p-4 flex gap-3 justify-end mt-2"><button onClick={() => setEditPengguna(u)} className="text-slate-400 hover:text-amber-400"><Edit3 size={18} /></button><button onClick={() => handlePadamPengguna(u.id)} className="text-slate-400 hover:text-red-400"><Trash2 size={18} /></button></td>
                            </tr>
                          )) : <tr><td colSpan={4} className="p-8 text-center text-slate-500">Tiada rekod pengguna.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PEMANTAUAN I-RAGS */}
          {activeTab === "pemantauan" && ( 
             <div className="space-y-6 animate-in fade-in">
              <div className="mb-6"><h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><Activity className="text-emerald-400" size={24}/> Analitik Prestasi Inkuiri Adaptif</h3><p className="text-slate-400 text-sm">Pantau tahap inkuiri semasa murid secara automasi.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col items-center shadow-lg"><span className="text-slate-400 text-xs font-bold uppercase mb-2">Jumlah Murid</span><span className="text-4xl font-bold text-blue-400">{statistik.jumlah}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-emerald-900/30 p-6 flex flex-col items-center shadow-lg"><span className="text-emerald-500 text-xs font-bold uppercase mb-2">Inkuiri Tinggi</span><span className="text-4xl font-bold text-emerald-400">{statistik.tinggi}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-amber-900/30 p-6 flex flex-col items-center shadow-lg"><span className="text-amber-500 text-xs font-bold uppercase mb-2">Inkuiri Sederhana</span><span className="text-4xl font-bold text-amber-400">{statistik.sederhana}</span></div>
                <div className="bg-[#1e293b] rounded-2xl border border-red-900/30 p-6 flex flex-col items-center shadow-lg"><span className="text-red-500 text-xs font-bold uppercase mb-2">Inkuiri Rendah</span><span className="text-4xl font-bold text-red-400">{statistik.rendah}</span></div>
              </div>
              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Tahap Inkuiri Semasa</th><th className="p-5 font-semibold text-sm text-slate-300 text-center">Status / Indikator</th></tr></thead>
                    <tbody>
                      {senaraiPengguna.filter(u => u.role === "murid").map((murid, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-5"><div className="font-bold text-slate-200">{murid.nama}</div><div className="text-slate-500 text-xs mt-1">Tg. {murid.tingkatan} {murid.kelas}</div></td>
                          <td className="p-5 text-center"><span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border ${murid.tahapInkuiri === 'Tinggi' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : murid.tahapInkuiri === 'Sederhana' ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}`}>{murid.tahapInkuiri || 'Rendah'}</span></td>
                          <td className="p-5 text-center">{murid.tahapInkuiri === 'Tinggi' ? <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1"><Zap size={14}/> Cemerlang</span> : murid.tahapInkuiri === 'Sederhana' ? <span className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1"><Activity size={14}/> Berkembang</span> : <span className="text-red-400 text-xs font-bold flex items-center justify-center gap-1">⚠️ Perlu Bimbingan</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB SEMAKAN ESEI MURID */}
          {activeTab === "semakan" && ( 
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800 shadow-lg">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><CheckSquare className="text-rose-400" size={20}/> Dashboard Semakan Guru</h3>
                  <p className="text-slate-400 text-sm">Pemantauan dan permarkahan jawapan murid secara Human-in-the-Loop.</p>
                </div>
                <button onClick={tarikDataSemakan} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-colors">
                  <RefreshCw size={16} className={loadingSemakan ? "animate-spin" : ""}/> Segar Semula
                </button>
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
                        {senaraiSemakan.length > 0 ? senaraiSemakan.map((rekod, i) => {
                          const status = rekod.statusPermarkahanEsei || "tiada_esei";
                          let statusColor = "bg-slate-800 text-slate-400 border border-slate-700";
                          let statusText = status.replace(/_/g, " ");

                          if (status === "disemak_oleh_guru") {
                            statusColor = "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50";
                            statusText = "Selesai Disahkan Guru";
                          } else if (status === "disemak_oleh_AI") {
                            statusColor = "bg-blue-900/30 text-blue-400 border border-blue-800/50";
                            statusText = "Selesai Ditanda AI";
                          }

                          let aiGagal = false;
                          if (rekod.ulasanAI) {
                            Object.values(rekod.ulasanAI).forEach((u: any) => {
                              if (u.komenAI && (u.komenAI.includes("GAGAL") || u.komenAI.includes("Sistem Gagal"))) {
                                aiGagal = true;
                              }
                            });
                          }

                          if (aiGagal && status !== "disemak_oleh_guru") {
                            statusColor = "bg-rose-900/30 text-rose-400 border border-rose-800/50 animate-pulse ring-1 ring-rose-500/50";
                            statusText = "⚠️ AI Gagal - Sila Semak";
                          }

                          return (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                              <td className="p-5">
                                <div className="font-bold text-slate-200">{rekod.namaMurid}</div>
                                <div className="text-slate-500 text-[10px] mt-1 uppercase">ID: {rekod.id}</div>
                              </td>
                              <td className="p-5 text-slate-400 text-sm">
                                <span className="text-blue-400 font-bold">Ting. {rekod.tingkatan}</span> | {rekod.bab}
                              </td>
                              <td className="p-5 text-center">
                                <span className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="p-5 text-center text-sm">
                                <div className="text-slate-400 mb-1">Objektif: <span className="font-bold text-blue-400 px-2 bg-blue-900/20 rounded">{rekod.skorObjektif || 0}</span></div>
                                <div className="text-slate-400">Esei: <span className="font-bold text-purple-400 px-2 bg-purple-900/20 rounded">{rekod.markahStruktur || 0}</span></div>
                              </td>
                              <td className="p-5 text-right">
                                <a href={`/guru/semakan/${rekod.id}`} target="_blank" rel="noreferrer" className="inline-block bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105">
                                  Semak Jawapan
                                </a>
                              </td>
                            </tr>
                          )
                        }) : (
                          <tr><td colSpan={5} className="p-12 text-center text-slate-500">Tiada kertas jawapan yang perlu disemak buat masa ini.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BANK SOALAN UJIAN (DIKEMAS KINI 🌟) */}
          {activeTab === "soalan" && (
            <div className="space-y-6 animate-in fade-in">
              {!isCreatingSoalan ? (
                <>
                  <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                    <div><h3 className="text-xl font-bold text-white mb-1">Bank Soalan Ujian</h3><p className="text-slate-400 text-sm">Uruskan soalan dan tetapkan sasaran ujian (Pre / Post).</p></div>
                    <button onClick={() => { resetFormSoalan(); setIsCreatingSoalan(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center"><Plus size={18} className="mr-2" /> Bina Soalan Baru</button>
                  </div>
                  <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                    {loadingSoalan ? ( <div className="p-12 text-center text-slate-400 animate-pulse">Memuat turun Bank Soalan... ⏳</div> ) : (
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead><tr className="border-b border-slate-800 bg-slate-900/50"><th className="p-4 font-semibold text-sm text-slate-300">ID</th><th className="p-4 font-semibold text-sm text-slate-300">Topik</th><th className="p-4 font-semibold text-sm text-slate-300">Kegunaan</th><th className="p-4 font-semibold text-sm text-slate-300">Jenis</th><th className="p-4 font-semibold text-sm text-slate-300">Soalan</th><th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th></tr></thead>
                        <tbody>
                          {soalanList.length > 0 ? soalanList.map((q, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4 text-slate-400 text-sm font-bold text-amber-500">{q.id}</td>
                              <td className="p-4 text-slate-200">{q.topik}</td>
                              <td className="p-4">
                                {/* 🌟 TAMBAHAN: Lencana untuk SIMPANAN */}
                                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                  q.kegunaan === 'pre_test' ? 'bg-indigo-900/30 text-indigo-400' : 
                                  q.kegunaan === 'post_test' ? 'bg-emerald-900/30 text-emerald-400' : 
                                  q.kegunaan === 'simpanan' ? 'bg-slate-700/50 text-slate-400 border border-slate-600' : 
                                  'bg-blue-900/30 text-blue-400'
                                }`}>
                                  {q.kegunaan === 'semua' || !q.kegunaan ? "PRE & POST" : q.kegunaan === 'simpanan' ? "SIMPANAN" : q.kegunaan}
                                </span>
                              </td>
                              <td className="p-4"><span className={`text-xs px-2 py-1 rounded-md font-bold ${q.jenis === 'objektif' ? 'bg-amber-900/30 text-amber-400' : 'bg-purple-900/30 text-purple-400'}`}>{q.jenis?.toUpperCase()}</span></td>
                              <td className="p-4 text-slate-300 text-sm truncate max-w-xs">{q.soalan}</td>
                              <td className="p-4 flex gap-3 justify-end"><button onClick={() => handleEditSoalan(q)} className="text-slate-500 hover:text-amber-400"><Edit3 size={18} /></button><button onClick={() => handlePadamSoalan(q.id)} className="text-slate-500 hover:text-red-400"><Trash2 size={18} /></button></td>
                            </tr>
                          )) : <tr><td colSpan={6} className="p-8 text-center text-slate-500">Belum ada soalan dicipta.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : (
                <div className="bg-[#1e293b] p-8 rounded-2xl border border-cyan-800/50 shadow-lg max-w-4xl relative overflow-hidden">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3"><HelpCircle className="text-cyan-400 w-8 h-8" /> {isEditingSoalan ? `Kemas Kini Soalan (${editSoalanId})` : "Cipta Soalan Baharu"}</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div><label className="block text-sm text-slate-400 mb-2">Tingkatan</label><select value={qTingkatan} onChange={e => setQTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Bab</label><select value={qBab} onChange={e => setQBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">{[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}</select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Topik</label><select value={qTopik} onChange={e => setQTopik(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">{subtopikPilihan.map((sub: string, index: number) => (<option key={index} value={sub}>{sub}</option>))}</select></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-emerald-400 font-bold mb-2">Sasaran Ujian</label>
                      <select value={qKegunaan} onChange={e => setQKegunaan(e.target.value)} className="w-full bg-emerald-900/20 border-2 border-emerald-800/50 rounded-lg p-3 text-emerald-300 font-bold outline-none">
                        <option value="semua">Pre-Test & Post-Test</option>
                        <option value="pre_test">Khas Pre-Test Sahaja</option>
                        <option value="post_test">Khas Post-Test Sahaja</option>
                        {/* 🌟 TAMBAHAN: Pilihan Simpanan Draf */}
                        <option value="simpanan">Simpanan Sahaja (Draf)</option>
                      </select>
                    </div>
                    <div><label className="block text-sm text-slate-400 mb-2">Jenis Soalan</label><select value={qJenis} onChange={e => setQJenis(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg p-3 text-white font-bold"><option value="objektif">Objektif</option><option value="struktur">Struktur / Esei</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Markah</label><input type="number" value={qMarkah} onChange={e => setQMarkah(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                  </div>

                  <div className="mb-6"><label className="block text-sm text-slate-400 mb-2">Soalan</label><textarea rows={4} value={qSoalan} onChange={e => setQSoalan(e.target.value)} placeholder="Taip soalan..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 text-white resize-none text-lg"></textarea></div>
                  
                  {qJenis === "objektif" ? (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">A</span><input type="text" value={qPilihanA} onChange={e => setQPilihanA(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">B</span><input type="text" value={qPilihanB} onChange={e => setQPilihanB(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">C</span><input type="text" value={qPilihanC} onChange={e => setQPilihanC(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white"/></div>
                        <div className="flex items-center gap-3"><span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">D</span><input type="text" value={qPilihanD} onChange={e => setQPilihanD(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white"/></div>
                      </div>
                      <div><label className="block text-sm text-emerald-400 font-bold mb-2">Jawapan Betul</label><select value={qJawapanBetul} onChange={e => setQJawapanBetul(e.target.value)} className="w-full md:w-1/2 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-emerald-300 font-bold"><option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option></select></div>
                    </div>
                  ) : (
                    <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-800/50 mb-8"><h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2"><Sparkles size={18}/> Skema Jawapan (Untuk AI / Skema Pemeriksa)</h4><textarea rows={5} value={qSkema} onChange={e => setQSkema(e.target.value)} className="w-full bg-[#0f172a] border border-purple-700/50 rounded-lg p-4 text-white resize-none"></textarea></div>
                  )}
                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                    <button onClick={resetFormSoalan} className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800">Batal</button>
                    <button onClick={handleSimpanSoalan} disabled={uIsSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg">{uIsSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18}/>}{isEditingSoalan ? "Simpan Perubahan" : "Simpan Soalan"}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SENARAI BAHAN NOTA */}
          {activeTab === "kandungan" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2"><BookOpen className="text-blue-400" size={20}/> Senarai Bahan Rujukan & Nota</h3>
                  <p className="text-slate-400 text-sm">Urus modul PDF dan letakkan Link Khas bagi setiap subtopik jika mahu pecahkan nota.</p>
                </div>
                <button onClick={() => setActiveTab("upload")} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium flex items-center">
                  <Plus size={18} className="mr-2" /> Tambah Nota
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {loadingBahan ? (
                  <p className="text-slate-400 animate-pulse col-span-2">Memuat turun data nota...</p>
                ) : senaraiBahan.length > 0 ? (
                  senaraiBahan.map((bahan, idx) => (
                    <div key={idx} className="bg-[#1e293b] p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-colors shadow-lg flex flex-col h-full">
                      
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-blue-900/30 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase border border-blue-800/50 mt-1">
                          Tingkatan {bahan.form}
                        </span>
                        
                        <div className="flex gap-2">
                          <button onClick={() => { setEditSubtopikId(bahan.id); setTempSubtopik(bahan.subtopics || []); }} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-amber-600 transition-colors" title="Edit Subtopik & Link">
                            <Edit3 size={16}/>
                          </button>
                          <button onClick={() => handleKemaskiniSubtopik(bahan)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-600 transition-colors" title="Auto-Sync Subtopik">
                            <RefreshCw size={16}/>
                          </button>
                          <a href={bahan.chapterUrl} target="_blank" rel="noreferrer" className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-600 transition-colors" title="Lihat Pautan Induk">
                            <FileText size={16}/>
                          </a>
                          <button onClick={() => handlePadamBahan(bahan.id)} className="bg-slate-800 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-red-600 transition-colors" title="Padam Nota">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2">{bahan.title}</h4>
                      <p className="text-sm text-slate-400 mb-2 font-mono text-amber-500/80">ID: {bahan.id}</p>
                      
                      {/* EDIT SUBTOPIK MODAL */}
                      {editSubtopikId === bahan.id ? (
                        <div className="mt-3 bg-slate-900/50 p-4 rounded-lg border border-amber-600/50">
                          <p className="text-xs text-amber-400 font-bold mb-3 uppercase flex items-center gap-2"><Edit3 size={14}/> Tetapkan Link Khas & Teks AI:</p>
                          
                          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
                            {tempSubtopik.map((sub, i) => (
                               <div key={i} className="flex flex-col gap-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                 
                                 <div className="flex items-center gap-3 border-b border-slate-700/50 pb-2">
                                   <span className="text-sm font-extrabold text-blue-400 shrink-0">{sub.id}</span>
                                   <span className="text-sm text-slate-200 font-medium">{sub.title}</span>
                                 </div>

                                 <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[10px] text-blue-400 font-bold uppercase shrink-0 w-16 text-right" title="Link Nota Bebas">🔗 Nota:</span>
                                   <input 
                                     type="text" 
                                     value={sub.notaUrl || ""} 
                                     placeholder="Link Canva/Drive Khas Subtopik ini (Untuk paparan Murid)" 
                                     onChange={(e) => {
                                       const newSubs = [...tempSubtopik];
                                       newSubs[i].notaUrl = e.target.value;
                                       setTempSubtopik(newSubs);
                                     }} 
                                     className="flex-1 bg-[#0f172a] text-slate-300 font-mono text-[10px] p-2 rounded border border-slate-700 focus:border-blue-500 outline-none" 
                                   />
                                 </div>

                                 <div className="flex items-center gap-2">
                                   <span className="text-[10px] text-red-400 font-bold uppercase shrink-0 w-16 text-right" title="Video YouTube">📺 Video:</span>
                                   <input 
                                     type="text" 
                                     value={sub.videoUrl || ""} 
                                     placeholder="Link YouTube Khas Subtopik" 
                                     onChange={(e) => {
                                       const newSubs = [...tempSubtopik];
                                       newSubs[i].videoUrl = e.target.value;
                                       setTempSubtopik(newSubs);
                                     }} 
                                     className="flex-1 bg-[#0f172a] text-slate-300 font-mono text-[10px] p-2 rounded border border-slate-700 focus:border-red-500 outline-none" 
                                   />
                                 </div>

                                 <div className="flex flex-col gap-1 mt-2">
                                   <span className="text-[10px] text-emerald-400 font-bold uppercase" title="Teks Buku Teks">🧠 Teks Rujukan Khusus (Untuk AI Baca):</span>
                                   <textarea 
                                     rows={3}
                                     value={sub.teksAI || ""} 
                                     placeholder="Copy & Paste perenggan fakta dari Buku Teks / Nota di sini supaya AI boleh baca dan jadikan rujukan mutlak..." 
                                     onChange={(e) => {
                                       const newSubs = [...tempSubtopik];
                                       newSubs[i].teksAI = e.target.value;
                                       setTempSubtopik(newSubs);
                                     }} 
                                     className="w-full bg-[#0f172a] text-emerald-100 font-sans text-xs p-3 rounded-lg border border-emerald-800/50 focus:border-emerald-500 outline-none resize-y" 
                                   />
                                 </div>

                               </div>
                            ))}
                          </div>

                          <div className="flex gap-2 pt-2 border-t border-slate-700/50">
                            <button onClick={() => setEditSubtopikId(null)} className="flex-1 bg-slate-800 text-slate-400 text-sm font-bold py-2.5 rounded-lg hover:bg-slate-700">Batal</button>
                            <button onClick={() => handleSimpanMukaSurat(bahan.id)} className="flex-1 bg-amber-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-amber-500 shadow-lg">Simpan Tetapan</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex-1 overflow-y-auto max-h-60 mt-3">
                           <p className="text-[11px] text-slate-500 font-bold uppercase mb-3">Pautan Khusus Subtopik:</p>
                           <ul className="text-sm text-slate-300 space-y-3">
                             {bahan.subtopics?.map((sub: any, i: number) => (
                               <li key={i} className="flex flex-col gap-1 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                 <div className="flex items-center gap-2">
                                    <span className="text-blue-400 font-bold shrink-0">{sub.id}</span> 
                                    <span className="truncate text-xs font-medium">{sub.title}</span>
                                 </div>
                                 <div className="flex items-center gap-2 ml-7 text-[10px]">
                                   {sub.notaUrl ? <span className="text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">🔗 Khas</span> : <span className="text-slate-500 bg-slate-800 px-2 py-0.5 rounded">🔗 Ikut Induk Bab</span>}
                                   {sub.videoUrl ? <span className="text-red-300 bg-red-900/30 px-2 py-0.5 rounded">📺 Ada Video</span> : null}
                                   {sub.teksAI ? <span className="text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded">🧠 Ada Teks AI</span> : null}
                                 </div>
                               </li>
                             ))}
                           </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : <p className="text-slate-500 col-span-2">Belum ada nota didaftarkan.</p>}
              </div>
            </div>
          )}

          {/* TAB 6: MUAT NAIK BAHAN BAHARU */}
          {activeTab === "upload" && (
             <div className="bg-[#1e293b] p-8 rounded-2xl border border-slate-800 max-w-2xl shadow-lg relative overflow-hidden animate-in fade-in">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3"><UploadCloud className="text-blue-400 w-8 h-8"/> Daftar Bahan Rujukan Baru</h3>
                <p className="text-slate-400 text-sm mb-8 border-b border-slate-800 pb-6">Sistem akan menyusun nota ini mengikut subtopik yang telah diprogramkan di dalam memori.</p>
                <form onSubmit={handleSimpanBahan} className="space-y-6 relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div><label className="block text-sm text-slate-400 mb-2">Tingkatan</label><select value={bTingkatan} onChange={e => setBTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"><option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option></select></div>
                    <div><label className="block text-sm text-slate-400 mb-2">Pilih Bab</label><select value={bBab} onChange={e => setBBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">{[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}</select></div>
                  </div>
                  
                  <div><label className="block text-sm text-slate-400 mb-2">Tajuk Buku / Nota Induk</label><input type="text" value={bJudul} onChange={e => setBJudul(e.target.value)} placeholder="Contoh: Warisan Negara Bangsa" required className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/></div>
                  
                  <div className="bg-blue-900/20 p-6 rounded-xl border border-blue-800/50 border-dashed text-center">
                    <label className="block text-sm text-blue-300 font-bold mb-2">Pautan / Link Utama (Google Drive/Canva)</label>
                    <p className="text-xs text-blue-400 mb-4 font-normal">Pastikan fail Google Drive cikgu telah ditetapkan kepada "Anyone with the link can view". Anda masih boleh tukar link untuk setiap subtopik di ruangan edit nanti.</p>
                    <input 
                      type="url" 
                      value={bLinkNota} 
                      onChange={e => setBLinkNota(e.target.value)} 
                      placeholder="https://drive.google.com/file/d/....." 
                      required 
                      className="w-full bg-[#0f172a] border border-blue-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div className="flex justify-end pt-4"><button type="submit" disabled={isUploadingBahan} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg disabled:opacity-50">{isUploadingBahan ? <Loader2 className="animate-spin mr-2" size={18} /> : <UploadCloud className="mr-2" size={18}/>}{isUploadingBahan ? "Menyimpan..." : "Simpan Pautan & Proses Automatik"}</button></div>
                </form>
             </div>
          )}

          {/* TAB 7: MAKMAL KAJIAN / ANALITIK SPSS */}
          {activeTab === "analitik" && ( <MakmalDataKajian /> )}
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 border border-slate-700"><div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>{toast.message}</motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}