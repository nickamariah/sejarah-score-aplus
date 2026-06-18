"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Plus, Edit3, Trash2, ChartBar, Users, BookOpen, FileText, Loader2, HelpCircle, Save, Zap, Sparkles, Activity } from "lucide-react";
import MakmalDataKajian from "../../utils/MakmalDataKajian";

// ==========================================
// IMPORT FIREBASE 
// ==========================================
import { collection, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp, updateDoc, setDoc } from "firebase/firestore";
import { db, app } from "../../lib/firebase"; 
import { initializeApp, getApps } from "firebase/app"; 
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

type TabKey = "murid" | "pemantauan" | "kandungan" | "upload" | "soalan" | "analitik";

export default function GuruDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>("murid");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // ==========================================
  // 🌟 STATE PENGURUSAN PENGGUNA 
  // ==========================================
  const [senaraiPengguna, setSenaraiPengguna] = useState<any[]>([]);
  const [loadingPengguna, setLoadingPengguna] = useState(true);
  
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [uRole, setURole] = useState("murid");
  const [uNama, setUNama] = useState("");
  const [uKataLaluan, setUKataLaluan] = useState("");
  const [uTingkatan, setUTingkatan] = useState("4"); // Default Tingkatan 4
  const [uKelas, setUKelas] = useState("");
  const [uTahapInkuiri, setUTahapInkuiri] = useState("Rendah");
  const [uKumpulan, setUKumpulan] = useState("Eksperimen");
  const [uIsSubmitting, setUIsSubmitting] = useState(false);

  const [statistik, setStatistik] = useState({ jumlah: 0, tinggi: 0, sederhana: 0, rendah: 0 });

  // STATE BANK SOALAN
  const [soalanList, setSoalanList] = useState<any[]>([]);
  const [loadingSoalan, setLoadingSoalan] = useState(true);
  const [isCreatingSoalan, setIsCreatingSoalan] = useState(false);
  const [isEditingSoalan, setIsEditingSoalan] = useState(false);
  const [editSoalanId, setEditSoalanId] = useState<string | null>(null);

  const [qTingkatan, setQTingkatan] = useState("4");
  const [qBab, setQBab] = useState("Bab 1");
  const [qTopik, setQTopik] = useState("");
  const [qJenis, setQJenis] = useState("objektif"); 
  const [qSoalan, setQSoalan] = useState("");
  const [qMarkah, setQMarkah] = useState("1");
  const [qImageUrl, setQImageUrl] = useState("");
  const [qPilihanA, setQPilihanA] = useState("");
  const [qPilihanB, setQPilihanB] = useState("");
  const [qPilihanC, setQPilihanC] = useState("");
  const [qPilihanD, setQPilihanD] = useState("");
  const [qJawapanBetul, setQJawapanBetul] = useState("A");
  const [qSkema, setQSkema] = useState("");

  const GAS_URL = "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec";

  // SENARAI SUBTOPIK SEJARAH
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
    if (!isEditingSoalan) {
      setQTopik(subtopikPilihan[0] || "");
    }
  }, [qTingkatan, qBab, isEditingSoalan]);

  // ==========================================
  // TARIK DATA DARI DATABASE
  // ==========================================
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
      setSenaraiPengguna(data);
      setStatistik({ jumlah: jumlahMurid, tinggi, sederhana, rendah });
    } catch (error) {
      console.error("Ralat tarik data pengguna:", error);
    } finally {
      setLoadingPengguna(false);
    }
  };

  const tarikSoalanFirebase = async () => {
    setLoadingSoalan(true);
    try {
      const q = query(collection(db, "questionBank"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const data: any[] = [];
      querySnapshot.forEach((doc) => { data.push({ id: doc.id, ...doc.data() }); });
      setSoalanList(data);
    } catch (error) {} finally { setLoadingSoalan(false); }
  };

  useEffect(() => {
    tarikSoalanFirebase(); 
    tarikDataPenggunaFirebase(); 
  }, []);

  // ==========================================
  // FUNGSI SIMPAN PENGGUNA AUTOMATIK (AUTH & DB)
  // ==========================================
  const handleSimpanPengguna = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi keselamatan: Kata Laluan mesti >= 6 aksara
    if (uKataLaluan.length < 6) {
      return showToastMessage("Kata laluan mesti sekurang-kurangnya 6 aksara!", "error");
    }

    setUIsSubmitting(true);
    
    try {
      let customId = editUserId;
      let emailMaya = "";

      if (!isEditingUser) {
        let awalan = "M"; 
        if (uRole === "murid") {
          const nomborTingkatan = uTingkatan.replace(/\D/g, "") || "4"; // Fallback ke 4
          
          // 👇 TAMBAHAN BARU: Tentukan huruf E atau K
          const hurufKumpulan = uKumpulan === "Eksperimen" ? "E" : "K";
          awalan = `M${hurufKumpulan}${nomborTingkatan}`; // Hasil: ME4 atau MK4
          
        } else if (uRole === "guru") awalan = "G";
        else if (uRole === "admin") awalan = "A";

        const penggunaSamaRole = senaraiPengguna.filter(u => u.id && u.id.startsWith(awalan));
        let maxNumber = 0;
        penggunaSamaRole.forEach(u => {
          const numPart = parseInt(u.id.substring(awalan.length)); 
          if (!isNaN(numPart) && numPart > maxNumber) maxNumber = numPart;
        });
        
        customId = `${awalan}${String(maxNumber + 1).padStart(3, '0')}`;
        emailMaya = `${customId.toLowerCase()}@irags.edu`;

        // ... (bawah ni kod Helah Pintu Belakang Firebase Auth yang sedia ada)

        // 🌟 HELAH PINTU BELAKANG FIREBASE AUTH
        try {
          const apps = getApps();
          let secondaryApp = apps.find(a => a.name === "AppPendaftaranRahsia");
          if (!secondaryApp) {
            secondaryApp = initializeApp(app.options, "AppPendaftaranRahsia");
          }
          const secondaryAuth = getAuth(secondaryApp);
          await createUserWithEmailAndPassword(secondaryAuth, emailMaya, uKataLaluan);
          await signOut(secondaryAuth); 
        } catch (authError: any) {
          console.error("Ralat Auth:", authError);
          showToastMessage("Ralat mendaftar di sistem sekuriti. Pastikan format betul.", "error");
          setUIsSubmitting(false);
          return; 
        }
      }

      // SIMPAN KE FIRESTORE
      const userData = {
        nama: uNama, 
        email: emailMaya, 
        kataLaluan: uKataLaluan, 
        role: uRole,
        idPengguna: customId, 
        ...(uRole === "murid" && { 
          tingkatan: uTingkatan, 
          kelas: uKelas, 
          tahapInkuiri: uTahapInkuiri, 
          kumpulan: uKumpulan, 
          markahTerkini: 0 
        }),
      };

      if (isEditingUser && customId) {
        await updateDoc(doc(db, "users", customId), userData);
        showToastMessage(`Akaun ${customId} dikemas kini!`, "success");
      } else if (customId) {
        await setDoc(doc(db, "users", customId), {
          ...userData, 
          tarikhDaftar: new Date().toISOString(),
        });
        showToastMessage(`Akaun didaftar! Murid boleh log masuk guna ID: ${customId}`, "success");
      }
      
      resetFormPengguna();
      tarikDataPenggunaFirebase();
      
    } catch (error) {
      console.error(error);
      showToastMessage("Ralat sistem menyimpan data.", "error");
    } finally {
      setUIsSubmitting(false);
    }
  };

  const handlePadamPengguna = async (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam akaun ini?")) {
      try {
        await deleteDoc(doc(db, "users", id));
        showToastMessage("Akaun berjaya dipadam.", "success");
        tarikDataPenggunaFirebase();
      } catch (error) {
        showToastMessage("Ralat memadam akaun.", "error");
      }
    }
  };

  const setEditPengguna = (u: any) => {
    setIsEditingUser(true); setEditUserId(u.id);
    setURole(u.role || "murid"); setUNama(u.nama || ""); 
    setUKataLaluan(u.kataLaluan || ""); setUTingkatan(u.tingkatan || "4");
    setUKelas(u.kelas || ""); setUTahapInkuiri(u.tahapInkuiri || "Rendah");
    setUKumpulan(u.kumpulan || "Eksperimen");
  };

  const resetFormPengguna = () => {
    setIsEditingUser(false); setEditUserId(null);
    setURole("murid"); setUNama(""); setUKataLaluan("");
    setUTingkatan("4"); setUKelas(""); setUTahapInkuiri("Rendah");
    setUKumpulan("Eksperimen");
  };

  // ==========================================
  // 🌟 FUNGSI SIMPAN, EDIT & PADAM SOALAN
  // ==========================================
  const handleSimpanSoalan = async () => {
    if (!qSoalan || !qTopik) return showToastMessage("Sila isikan Soalan dan Subtopik!", "error");
    setUIsSubmitting(true);

    try {
      const dataSoalan: any = {
        tingkatan: qTingkatan,
        bab: qBab,
        topik: qTopik,
        jenis: qJenis,
        soalan: qSoalan,
        markah: parseInt(qMarkah),
        imageUrl: qImageUrl,
      };

      if (qJenis === "objektif") {
        if (!qPilihanA || !qPilihanB) return showToastMessage("Isi pilihan A dan B!", "error");
        dataSoalan.pilihan = { A: qPilihanA, B: qPilihanB, C: qPilihanC, D: qPilihanD };
        dataSoalan.jawapan = qJawapanBetul;
      } else {
        if (!qSkema) return showToastMessage("Sila isikan Skema Jawapan!", "error");
        dataSoalan.skemaJawapan = qSkema;
      }

      if (isEditingSoalan && editSoalanId) {
        dataSoalan.updatedAt = serverTimestamp();
        await updateDoc(doc(db, "questionBank", editSoalanId), dataSoalan);
        showToastMessage(`Soalan ${editSoalanId} dikemas kini!`, "success");
      } else {
        dataSoalan.createdAt = serverTimestamp();
        const babNum = qBab.replace(/\D/g, ""); 
        const typeChar = qJenis === "objektif" ? "Q" : "S"; 
        const awalanSoalan = `B${babNum}${typeChar}`; 

        const soalanSamaAwalan = soalanList.filter(s => s.id && s.id.startsWith(awalanSoalan));
        let maxNum = 0;
        soalanSamaAwalan.forEach(s => {
          const numPart = parseInt(s.id.substring(awalanSoalan.length));
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        });

        const customIdSoalan = `${awalanSoalan}${String(maxNum + 1).padStart(3, '0')}`;
        await setDoc(doc(db, "questionBank", customIdSoalan), dataSoalan);
        showToastMessage(`Soalan ditambah dengan ID: ${customIdSoalan}`, "success");
      }

      resetFormSoalan();
      tarikSoalanFirebase();
    } catch (error) {
      console.error(error);
      showToastMessage("Ralat sistem semasa menyimpan soalan.", "error");
    } finally {
      setUIsSubmitting(false);
    }
  };

  const handleEditSoalan = (q: any) => {
    setIsEditingSoalan(true); setEditSoalanId(q.id);
    setQTingkatan(q.tingkatan || "4"); setQBab(q.bab || "Bab 1");
    setQTopik(q.topik || ""); setQJenis(q.jenis || "objektif");
    setQSoalan(q.soalan || ""); setQMarkah(q.markah?.toString() || "1");
    setQImageUrl(q.imageUrl || "");

    if (q.jenis === "objektif" && q.pilihan) {
      setQPilihanA(q.pilihan.A || ""); setQPilihanB(q.pilihan.B || "");
      setQPilihanC(q.pilihan.C || ""); setQPilihanD(q.pilihan.D || "");
      setQJawapanBetul(q.jawapan || "A");
    } else {
      setQSkema(q.skemaJawapan || "");
    }
    setIsCreatingSoalan(true);
  };

  const resetFormSoalan = () => {
    setIsCreatingSoalan(false); setIsEditingSoalan(false); setEditSoalanId(null);
    setQSoalan(""); setQTopik(""); setQSkema(""); setQImageUrl("");
    setQPilihanA(""); setQPilihanB(""); setQPilihanC(""); setQPilihanD(""); setQJawapanBetul("A");
  };

  const handlePadamSoalan = async (id: string) => {
    if (confirm("Adakah anda pasti mahu memadam soalan ini?")) {
      try {
        await deleteDoc(doc(db, "questionBank", id));
        showToastMessage("Soalan berjaya dipadam.", "success");
        tarikSoalanFirebase();
      } catch (error) {
        showToastMessage("Ralat memadam soalan.", "error");
      }
    }
  };

  const showToastMessage = (msg: string, type: 'success'|'error'|'info'='info') => {
    setToast({ message: msg, type }); setTimeout(() => setToast(null), 3000);
  };
  const handleLogout = () => { window.location.href = '/login'; };

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-72 bg-[#1e293b] border-r border-slate-800 p-6 flex flex-col justify-between z-10">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-white mb-2">Makmal Penyelidikan</h1>
            <p className="text-sm text-slate-400">Sistem admin bertaraf PhD untuk analisis dan kandungan.</p>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("murid")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "murid" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <Users size={20} /> Pengurusan Pengguna
            </button>
            <button onClick={() => setActiveTab("pemantauan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "pemantauan" ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <Activity size={20} /> Pemantauan I-RAGS
            </button>
            <button onClick={() => setActiveTab("soalan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "soalan" ? "bg-cyan-900/40 text-cyan-400 border border-cyan-800/50" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <HelpCircle size={20} /> Bank Soalan Ujian
            </button>
            <button onClick={() => setActiveTab("kandungan")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "kandungan" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <BookOpen size={20} /> Senarai Bahan (GAS)
            </button>
            <button onClick={() => setActiveTab("upload")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "upload" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <FileText size={20} /> Tambah Bahan Baru
            </button>
            <button onClick={() => setActiveTab("analitik")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activeTab === "analitik" ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
              <ChartBar size={20} /> Makmal Data Kajian
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors mt-auto"><LogOut size={20} /> Log Keluar</button>
      </div>

      {/* KANDUNGAN UTAMA */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <header className="mb-8 border-b border-slate-800 pb-6">
          <p className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-1">Makmal Penyelidikan</p>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Admin PhD</h2>
        </header>

       <main>
          {/* ========================================== */}
          {/* 🌟 TAB 1: PENGURUSAN PENGGUNA 🌟 */}
          {/* ========================================== */}
          {activeTab === "murid" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                <div><h3 className="text-xl font-bold text-white mb-1">Pengurusan Pengguna (Firebase)</h3><p className="text-slate-400 text-sm">Daftar dan urus akaun Admin, Guru, dan Murid.</p></div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 lg:col-span-1 h-fit shadow-lg">
                  <h4 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="text-blue-400" size={20}/> {isEditingUser ? "Kemas Kini Akaun" : "Daftar Akaun Baru"}
                  </h4>
                  <form onSubmit={handleSimpanPengguna} className="space-y-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Peranan (Role)</label>
                      <select value={uRole} onChange={e => setURole(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                        <option value="murid">Murid</option>
                        <option value="guru">Guru</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Nama Penuh</label>
                      <input type="text" value={uNama} onChange={e => setUNama(e.target.value)} required placeholder="Contoh: Ahmad" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"/>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-4 mt-2">
                      <p className="text-xs text-slate-300 font-medium">
                        💡 ID Pengguna (seperti M4001, G001) akan dijana secara automatik oleh sistem.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Kata Laluan</label>
                      <input type="text" value={uKataLaluan} onChange={e => setUKataLaluan(e.target.value)} required placeholder="123456" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"/>
                    </div>

                    {uRole === "murid" && (
                      <div className="p-4 bg-blue-900/10 rounded-lg border border-blue-900/50 mt-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Tingkatan</label>
                            {/* DITUKAR KEPADA SELECT SUPAYA TIADA TYPO ERROR */}
                            <select value={uTingkatan} onChange={e => setUTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500">
                              <option value="4">Tingkatan 4</option>
                              <option value="5">Tingkatan 5</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Kelas</label>
                            <input type="text" value={uKelas} onChange={e => setUKelas(e.target.value)} required={uRole === 'murid'} placeholder="Cth: Sains" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white"/>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Tahap Inkuiri Awal</label>
                            <select value={uTahapInkuiri} onChange={e => setUTahapInkuiri(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white">
                              <option value="Rendah">Rendah</option><option value="Sederhana">Sederhana</option><option value="Tinggi">Tinggi</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">Kumpulan Kajian</label>
                            <select value={uKumpulan} onChange={e => setUKumpulan(e.target.value)} className="w-full bg-[#0f172a] border border-cyan-800/50 rounded-lg p-3 text-cyan-400 font-bold focus:outline-none focus:border-cyan-500">
                              <option value="Eksperimen">Eksperimen</option>
                              <option value="Kawalan">Kawalan</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      {isEditingUser && ( <button type="button" onClick={resetFormPengguna} className="flex-1 bg-slate-800 text-slate-300 font-semibold py-3 rounded-lg hover:bg-slate-700 transition">Batal</button> )}
                      <button type="submit" disabled={uIsSubmitting} className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-900/20">
                        {uIsSubmitting ? "Menyimpan..." : isEditingUser ? "Simpan Perubahan" : "Daftar Akaun"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden lg:col-span-2 shadow-lg">
                  {loadingPengguna ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Menarik data pengguna dari Firebase... ⏳</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="p-4 font-semibold text-sm text-slate-300">Maklumat Pengguna</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Peranan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Kelas / Tahap</th>
                            <th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {senaraiPengguna.length > 0 ? senaraiPengguna.map((u, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4">
                                <div className="font-bold text-slate-200">{u.nama}</div>
                                <div className="text-slate-500 text-xs mt-1">ID: <span className="text-amber-400">{u.idPengguna || u.id}</span> | Pass: <span className="text-slate-400">{u.kataLaluan}</span></div>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider
                                  ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400 border border-purple-800' : 
                                    u.role === 'guru' ? 'bg-cyan-900/30 text-cyan-400 border border-cyan-800' : 
                                    'bg-blue-900/30 text-blue-400 border border-blue-800'}`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4 text-slate-400 text-sm">
                                {u.role === "murid" ? (
                                  <div className="flex flex-col items-start gap-1.5">
                                    <div className="font-medium text-slate-300">Tingkatan {u.tingkatan} {u.kelas}</div>
                                    {/* 👇 LABEL KUMPULAN KAJIAN DITAMBAH DI SINI */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider border
                                      ${u.kumpulan === 'Eksperimen' 
                                        ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50' 
                                        : 'bg-slate-800 text-slate-400 border-slate-600'}`}>
                                      {u.kumpulan || "Eksperimen"}
                                    </span>
                                  </div>
                                ) : <span className="italic text-slate-600">- N/A -</span>}
                              </td>
                              <td className="p-4 flex gap-3 justify-end items-center mt-2">
                                <button onClick={() => setEditPengguna(u)} className="text-slate-400 hover:text-amber-400 transition-colors"><Edit3 size={18} /></button>
                                <button onClick={() => handlePadamPengguna(u.id)} className="text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                              </td>
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

          {/* ========================================== */}
          {/* 🌟 TAB 2: ANALITIK PEMANTAUAN 🌟 */}
          {/* ========================================== */}
          {activeTab === "pemantauan" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                  <Activity className="text-emerald-400" size={24}/> Analitik Prestasi Inkuiri Adaptif (I-RAGS)
                </h3>
                <p className="text-slate-400 text-sm">Pantau tahap inkuiri semasa murid secara automasi.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-[#1e293b] rounded-2xl border border-slate-800 p-6 flex flex-col justify-center items-center shadow-lg shadow-black/20">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Jumlah Murid</span>
                  <span className="text-4xl font-bold text-blue-400">{statistik.jumlah}</span>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-emerald-900/30 p-6 flex flex-col justify-center items-center shadow-lg shadow-emerald-900/10 relative overflow-hidden">
                  <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider mb-2 z-10">Inkuiri Tinggi</span>
                  <span className="text-4xl font-bold text-emerald-400 z-10">{statistik.tinggi}</span>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-amber-900/30 p-6 flex flex-col justify-center items-center shadow-lg shadow-amber-900/10 relative overflow-hidden">
                  <span className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-2 z-10">Inkuiri Sederhana</span>
                  <span className="text-4xl font-bold text-amber-400 z-10">{statistik.sederhana}</span>
                </div>
                <div className="bg-[#1e293b] rounded-2xl border border-red-900/30 p-6 flex flex-col justify-center items-center shadow-lg shadow-red-900/10 relative overflow-hidden">
                  <span className="text-red-500 text-xs font-bold uppercase tracking-wider mb-2 z-10">Inkuiri Rendah</span>
                  <span className="text-4xl font-bold text-red-400 z-10">{statistik.rendah}</span>
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/50">
                        <th className="p-5 font-semibold text-sm text-slate-300">Nama Murid</th>
                        <th className="p-5 font-semibold text-sm text-slate-300 text-center">Markah Terkini</th>
                        <th className="p-5 font-semibold text-sm text-slate-300 text-center">Tahap Inkuiri Semasa</th>
                        <th className="p-5 font-semibold text-sm text-slate-300 text-center">Status / Indikator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {senaraiPengguna.filter(u => u.role === "murid").map((murid, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="p-5">
                            <div className="font-bold text-slate-200">{murid.nama}</div>
                            <div className="text-slate-500 text-xs mt-1">Tg. {murid.tingkatan} {murid.kelas}</div>
                          </td>
                          <td className="p-5 text-center">
                            <span className="font-bold text-lg text-slate-300">
                              {murid.markahTerkini ? `${murid.markahTerkini}%` : <span className="text-sm font-normal text-slate-500">Belum Mula</span>}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide border
                              ${murid.tahapInkuiri === 'Tinggi' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800/50' : 
                                murid.tahapInkuiri === 'Sederhana' ? 'bg-amber-900/30 text-amber-400 border-amber-800/50' : 
                                'bg-red-900/30 text-red-400 border-red-800/50'}`}>
                              {murid.tahapInkuiri || 'Rendah'}
                            </span>
                          </td>
                          <td className="p-5 text-center">
                            {murid.tahapInkuiri === 'Tinggi' ? (
                              <span className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1"><Zap size={14}/> Prestasi Cemerlang</span>
                            ) : murid.tahapInkuiri === 'Sederhana' ? (
                              <span className="text-amber-400 text-xs font-bold flex items-center justify-center gap-1"><Activity size={14}/> Sedang Berkembang</span>
                            ) : (
                              <span className="text-red-400 text-xs font-bold flex items-center justify-center gap-1">⚠️ Perlu Bimbingan</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* 🌟 TAB 3: BANK SOALAN 🌟 */}
          {/* ========================================== */}
          {activeTab === "soalan" && (
            <div className="space-y-6">
              
              {!isCreatingSoalan ? (
                <>
                  <div className="flex justify-between items-center bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">Bank Soalan Ujian (Diagnostik & Post-Test)</h3>
                      <p className="text-slate-400 text-sm">Uruskan soalan Objektif dan Struktur. Data disimpan di Firebase.</p>
                    </div>
                    <button onClick={() => { resetFormSoalan(); setIsCreatingSoalan(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors">
                      <Plus size={18} className="mr-2" /> Bina Soalan Baru
                    </button>
                  </div>

                  <div className="bg-[#1e293b] rounded-2xl border border-slate-800 overflow-hidden">
                    {loadingSoalan ? (
                      <div className="p-12 text-center text-slate-400 animate-pulse">Memuat turun Bank Soalan dari Firebase... ⏳</div>
                    ) : (
                      <table className="w-full text-left border-collapse min-w-max">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/50">
                            <th className="p-4 font-semibold text-sm text-slate-300">Kedudukan ID</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Topik</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Jenis</th>
                            <th className="p-4 font-semibold text-sm text-slate-300">Soalan</th>
                            <th className="p-4 font-semibold text-sm text-slate-300 text-right">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {soalanList.length > 0 ? soalanList.map((q, i) => (
                            <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                              <td className="p-4 text-slate-400 text-sm font-bold text-amber-500">{q.id}</td>
                              <td className="p-4 text-slate-200">{q.topik}</td>
                              <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded-md font-bold ${q.jenis === 'objektif' ? 'bg-amber-900/30 text-amber-400 border border-amber-800' : 'bg-purple-900/30 text-purple-400 border border-purple-800'}`}>
                                  {q.jenis?.toUpperCase()}
                                </span>
                              </td>
                              <td className="p-4 text-slate-300 text-sm truncate max-w-xs">{q.soalan}</td>
                              <td className="p-4 flex gap-3 justify-end">
                                <button onClick={() => handleEditSoalan(q)} className="text-slate-500 hover:text-amber-400 transition-colors"><Edit3 size={18} /></button>
                                <button onClick={() => handlePadamSoalan(q.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={18} /></button>
                              </td>
                            </tr>
                          )) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada soalan dicipta.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              ) : (
                
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#1e293b] p-8 rounded-2xl border border-cyan-800/50 shadow-lg max-w-4xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <HelpCircle className="text-cyan-400 w-8 h-8" /> 
                    {isEditingSoalan ? `Kemas Kini Soalan (${editSoalanId})` : "Cipta Soalan Baharu"}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Tingkatan</label>
                      <select value={qTingkatan} onChange={e => setQTingkatan(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                        <option value="4">Tingkatan 4</option><option value="5">Tingkatan 5</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Bab</label>
                      <select value={qBab} onChange={e => setQBab(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500">
                        {[1,2,3,4,5,6,7,8,9,10].map(num => (<option key={num} value={`Bab ${num}`}>Bab {num}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Topik / Subtopik</label>
                      <select 
                        value={qTopik} 
                        onChange={e => setQTopik(e.target.value)} 
                        className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                      >
                        {subtopikPilihan.map((sub: string, index: number) => (
                          <option key={index} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Jenis Soalan</label>
                      <select value={qJenis} onChange={e => setQJenis(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-bold">
                        <option value="objektif">Objektif (A, B, C, D)</option>
                        <option value="struktur">Struktur / Esei (Semakan AI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Markah</label>
                      <input type="number" value={qMarkah} onChange={e => setQMarkah(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"/>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm text-slate-400 mb-2">Soalan</label>
                    <textarea rows={4} value={qSoalan} onChange={e => setQSoalan(e.target.value)} placeholder="Taip soalan anda di sini..." className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-cyan-500 resize-none text-lg"></textarea>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm text-slate-400 mb-2">Pautan Gambar (Pilihan)</label>
                    <input type="text" value={qImageUrl} onChange={e => setQImageUrl(e.target.value)} placeholder="https://contoh.com/gambar.png" className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-slate-300 focus:outline-none focus:border-cyan-500"/>
                  </div>

                  {qJenis === "objektif" ? (
                    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 mb-8">
                      <h4 className="text-amber-400 font-bold mb-4 flex items-center gap-2"><Zap size={18}/> Pilihan Jawapan Objektif</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">A</span>
                          <input type="text" value={qPilihanA} onChange={e => setQPilihanA(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white focus:bg-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"/>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">B</span>
                          <input type="text" value={qPilihanB} onChange={e => setQPilihanB(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white focus:bg-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"/>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">C</span>
                          <input type="text" value={qPilihanC} onChange={e => setQPilihanC(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white focus:bg-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"/>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg">D</span>
                          <input type="text" value={qPilihanD} onChange={e => setQPilihanD(e.target.value)} className="flex-1 bg-slate-700 border border-slate-500 rounded-lg p-3 text-white focus:bg-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-emerald-400 font-bold mb-2">Pilih Jawapan Yang Betul</label>
                        <select value={qJawapanBetul} onChange={e => setQJawapanBetul(e.target.value)} className="w-full md:w-1/2 bg-emerald-900/30 border border-emerald-500/50 rounded-lg p-3 text-emerald-300 font-bold focus:outline-none">
                          <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-purple-900/20 p-6 rounded-xl border border-purple-800/50 mb-8">
                      <h4 className="text-purple-400 font-bold mb-2 flex items-center gap-2"><Sparkles size={18}/> Skema Jawapan (Untuk Rujukan AI)</h4>
                      <p className="text-xs text-purple-300/70 mb-4">Sistem AI Gemini akan menggunakan skema ini untuk menanda jawapan struktur murid secara automatik.</p>
                      <textarea rows={5} value={qSkema} onChange={e => setQSkema(e.target.value)} className="w-full bg-[#0f172a] border border-purple-700/50 rounded-lg p-4 text-white focus:outline-none focus:border-purple-500 resize-none"></textarea>
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-4 border-t border-slate-800">
                    <button onClick={resetFormSoalan} className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">Batal</button>
                    <button onClick={handleSimpanSoalan} disabled={uIsSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-bold flex items-center shadow-lg shadow-cyan-500/20 transition-transform active:scale-95">
                      {uIsSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18}/>}
                      {isEditingSoalan ? "Simpan Perubahan" : "Simpan Soalan"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ========================================== */}
          {/* 🌟 TAB 4: KANDUNGAN & UPLOAD (GAS) 🌟 */}
          {/* ========================================== */}
          {activeTab === "kandungan" && (
            <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800">
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><BookOpen className="text-blue-400" size={20}/> Senarai Bahan Rujukan (GAS)</h3>
               <p className="text-slate-400 text-sm mb-4">Ini adalah senarai modul rujukan yang ditarik dari Google Apps Script.</p>
            </div>
          )}

          {activeTab === "upload" && (
             <div className="bg-[#1e293b] p-6 rounded-2xl border border-slate-800 max-w-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="text-blue-400" size={20}/> Muat Naik Bahan Modul Baru (GAS)</h3>
             </div>
          )}

          {/* ========================================== */}
          {/* 🌟 TAB 5: MAKMAL KAJIAN / ANALITIK 🌟 */}
          {/* ========================================== */}
          {activeTab === "analitik" && ( 
             <MakmalDataKajian /> 
          )}
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50">
            <div className={`w-3 h-3 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>{toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}