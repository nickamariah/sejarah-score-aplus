"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import { db } from "@/lib/firebase"; 
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore";
import { Bot, Send, ArrowLeft, BookOpen, Video, Lightbulb, HelpCircle, Trophy, CheckCircle2, Loader2, PlayCircle, X } from "lucide-react";

function KomponenPembelajaran() {
  const searchParams = useSearchParams();
  const babDariURL = searchParams.get("bab") || "tingkatan4_bab1_sub1.1"; 
  const arasDariURL = (searchParams.get("aras") || "rendah").toLowerCase();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isMastered, setIsMastered] = useState(false);
  const [showPdfMobile, setShowPdfMobile] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(50); 
  const [isDragging, setIsDragging] = useState(false);

  const [chapterData, setChapterData] = useState<any>(null);
  const [koleksiSoalan, setKoleksiSoalan] = useState("");
  const [koleksiSkema, setKoleksiSkema] = useState("");

  const [studentId, setStudentId] = useState("murid_test");
  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) setStudentId(JSON.parse(rawUser).id);
  }, []);

  const chapterId = babDariURL; 
  const sessionId = `${studentId}_${chapterId}`;
  const pdfFileName = chapterId.split('_sub')[0]; 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitializing = useRef(false);
  
  const maxFasa = arasDariURL === "rendah" ? 2 : arasDariURL === "sederhana" ? 3 : 6;
  
  const phaseNames = arasDariURL === "rendah" 
    ? ["Mengingat", "Memahami"] 
    : arasDariURL === "sederhana" 
    ? ["Mengingat", "Memahami", "Mengaplikasi"] 
    : ["Mengingat", "Memahami", "Mengaplikasi", "Menganalisis", "Menilai", "Mencipta"];

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        const docRef = doc(db, "chapters", pdfFileName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setChapterData(docSnap.data());
      } catch (error) { console.error("Ralat ambil data bab:", error); }
    };
    fetchChapterData();
  }, [pdfFileName]);

  const ekstrakSubtopik = (id: string) => id.includes("_sub") ? id.split("_sub")[1] : "1.1";
  const currentSub = ekstrakSubtopik(chapterId);

  useEffect(() => {
    const tarikSoalanPeperiksaan = async () => {
      const tg = chapterId.includes("tingkatan4") ? "4" : "5";
      const babNum = chapterId.split('_bab')[1].split('_')[0];
      const babStr = `Bab ${babNum}`;

      try {
        const q = query(collection(db, "questionBank"), where("tingkatan", "==", tg), where("bab", "==", babStr));
        const snap = await getDocs(q);
        
        let soalanGabungan = ""; let skemaGabungan = "";

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.jenis !== "objektif") {
            if (data.topik.includes(currentSub)) {
               soalanGabungan += `- ${data.soalan} (${data.markah} Markah)\n`;
               skemaGabungan += `- Soalan: ${data.soalan}\nSkema: ${data.skemaJawapan}\n\n`;
            }
          }
        });

        if (soalanGabungan === "") {
           snap.forEach((docSnap) => {
             const data = docSnap.data();
             if (data.jenis !== "objektif") {
                soalanGabungan += `- ${data.soalan} (${data.markah} Markah)\n`;
                skemaGabungan += `- Soalan: ${data.soalan}\nSkema: ${data.skemaJawapan}\n\n`;
             }
           });
        }
        setKoleksiSoalan(soalanGabungan); setKoleksiSkema(skemaGabungan);
      } catch (error) { console.error("Ralat tarik bank soalan:", error); }
    };
    tarikSoalanPeperiksaan();
  }, [chapterId, currentSub]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!isLoading && inputRef.current && !isMastered) setTimeout(() => { inputRef.current?.focus(); }, 100); }, [isLoading, isMastered]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      let newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => { if (isDragging) setIsDragging(false); };
    if (isDragging) { document.addEventListener("mousemove", handleMouseMove); document.addEventListener("mouseup", handleMouseUp); document.body.style.userSelect = "none"; } 
    else { document.body.style.userSelect = ""; }
    return () => { document.removeEventListener("mousemove", handleMouseMove); document.removeEventListener("mouseup", handleMouseUp); document.body.style.userSelect = ""; };
  }, [isDragging]);

  const formatTajuk = (id: string) => id.replace('tingkatan', 'Tg. ').replace('_bab', ' Bab ').replace('_sub', ' - Subtopik ');

  const subtopicsList = chapterData?.subtopics || []; 
  const currentIndex = subtopicsList.findIndex((s: any) => s.id === currentSub);
  const currentSubInfo = subtopicsList.find((s: any) => s.id === currentSub);
  const pageNumber = currentSubInfo ? currentSubInfo.startPage : 1;
  const namaBabSebenar = chapterData?.title || "";
  const namaSubtopikSebenar = currentSubInfo?.title || "";

  const getBimbinganVideoUrl = () => {
    const rawUrl = currentSubInfo?.videoUrl;
    if (!rawUrl) return null;
    try {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
      const match = rawUrl.match(regExp);
      if (match && match[2].length === 11) return "https://www.youtube.com/embed/" + match[2];
      return rawUrl;
    } catch (e) { return rawUrl; }
  };
  const videoKhas = getBimbinganVideoUrl();

  const getNotaUrl = () => {
    const subtopicUrl = currentSubInfo?.notaUrl;
    if (subtopicUrl && subtopicUrl.trim() !== "") {
      if (subtopicUrl.includes("drive.google.com")) return subtopicUrl.replace(/\/view.*/, "/preview");
      return subtopicUrl;
    }
    const mainUrl = chapterData?.chapterUrl;
    if (!mainUrl) return `/${pdfFileName}.pdf#page=${pageNumber}&toolbar=1&view=FitH`;
    if (mainUrl.includes("drive.google.com")) return mainUrl.replace(/\/view.*/, "/preview");
    if (mainUrl.includes("canva.com")) return mainUrl;
    return `${mainUrl}#page=${pageNumber}&toolbar=1&view=FitH`;
  };

  const gotoNextSubtopic = () => {
    if (currentIndex !== -1 && currentIndex + 1 < subtopicsList.length) {
      const nextSub = subtopicsList[currentIndex + 1].id;
      window.location.href = `?bab=${pdfFileName}_sub${nextSub}&aras=${arasDariURL}`;
    } else { window.location.href = '/murid'; }
  };

  useEffect(() => {
    if (studentId === "murid_test") return; 

    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    const inisialisasiSesi = async () => {
      if (isInitializing.current) return; 
      isInitializing.current = true;

      const docSnap = await getDoc(sessionDocRef);
      if (!docSnap.exists()) {
        await setDoc(sessionDocRef, { studentId, chapterId, currentPhase: 1, status: "in_progress", startedAt: serverTimestamp() });
        await addDoc(messagesCollectionRef, { role: "assistant", content: `Hai! Saya Cikgu AI I-RAGs 👋. Kita akan mulakan sesi untuk **${namaBabSebenar} (${currentSub} ${namaSubtopikSebenar})**.\n\nBerdasarkan nota, apa yang awak paling ingat atau faham tentang tajuk ini? Cuba kongsikan.`, timestamp: serverTimestamp() });
      } else {
        const dataSesi = docSnap.data();
        let fasaTerkini = dataSesi.currentPhase || 1;
        if (fasaTerkini > maxFasa) fasaTerkini = maxFasa;
        setCurrentPhase(fasaTerkini);
        if (dataSesi.status === "completed" || (fasaTerkini >= maxFasa && dataSesi.status === "completed")) setIsMastered(true);
      }
    };
    
    if (chapterData) inisialisasiSesi();

    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [sessionId, chapterId, studentId, chapterData, maxFasa, currentSub, namaBabSebenar, namaSubtopikSebenar]); 

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const teksMurid = input;
    setInput(""); setIsLoading(true);

    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    try {
      await addDoc(messagesCollectionRef, { role: "user", content: teksMurid, timestamp: serverTimestamp() });
      const teksRujukanAI = currentSubInfo?.teksAI || "";

      const response = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, chapterId, text: teksMurid, currentPhase, aras: arasDariURL, soalanUjian: koleksiSoalan, skemaJawapan: koleksiSkema,
          tajukBab: namaBabSebenar, tajukSubtopik: namaSubtopikSebenar, kodSubtopik: currentSub, teksRujukanAI: teksRujukanAI, 
          previousMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json(); 

      if (data.reply) {
        await addDoc(messagesCollectionRef, { role: "assistant", content: data.reply, timestamp: serverTimestamp() });

        if (data.isPhaseComplete) {
          if (currentPhase < maxFasa) {
            const nextPhase = currentPhase + 1;
            setCurrentPhase(nextPhase);
            await updateDoc(sessionDocRef, { currentPhase: nextPhase });
            
            await addDoc(messagesCollectionRef, { role: "assistant", content: `✨ Terbaik! Awak dah menguasai Fasa ${currentPhase}. Mari kita ke **Fasa ${nextPhase} (${phaseNames[nextPhase-1]})**.`, timestamp: serverTimestamp() });

            const autoTriggerResponse = await fetch('/api/chat', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId, chapterId, aras: arasDariURL, currentPhase: nextPhase, 
                text: `[SISTEM AUTO]: Murid lulus fasa tadi. Berikan SOALAN PERTAMA untuk menguji FASA ${nextPhase}. Tanya 1 soalan, jangan berbasa-basi.`, 
                soalanUjian: koleksiSoalan, skemaJawapan: koleksiSkema, tajukBab: namaBabSebenar, tajukSubtopik: namaSubtopikSebenar, kodSubtopik: currentSub, teksRujukanAI: teksRujukanAI, previousMessages: [] 
              })
            });

            const autoData = await autoTriggerResponse.json();
            if (autoData.reply) await addDoc(messagesCollectionRef, { role: "assistant", content: autoData.reply, timestamp: serverTimestamp() });

          } else if (currentPhase >= maxFasa) {
            setIsMastered(true);
            await updateDoc(sessionDocRef, { status: "completed" });
            await addDoc(messagesCollectionRef, { role: "assistant", content: `🎉 **SYABAS!** Kefahaman awak sangat cemerlang. Bimbingan subtopik ini selesai. Sila tekan butang Seterusnya.`, timestamp: serverTimestamp() });
          }
        }
      }
    } catch (error) { console.error("Ralat:", error); } finally { setIsLoading(false); }
  };

  const sendQuickPrompt = (text: string) => { setInput(text); setTimeout(() => { inputRef.current?.focus(); }, 50); };

  // ===============================================
  // REKA BENTUK UI BARU: PROFESIONAL & MODEN
  // ===============================================
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-100 overflow-hidden font-sans relative">
      
      {/* 🟢 PANEL KIRI: PDF & VIDEO (DESKTOP) ATAU POP-UP (MOBILE) */}
      <div className={`${showPdfMobile ? 'fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm' : 'hidden'} lg:flex lg:relative flex-col z-20 shadow-2xl lg:shadow-none h-full lg:w-[var(--left-width)]`} style={{ "--left-width": `${leftWidth}%` } as React.CSSProperties}>
        
        {/* HEADER MODAL NOTA (Mobile sahaja nampak X, Desktop nampak nama Nota) */}
        <div className="bg-slate-900 text-white p-3 lg:p-4 shadow-md flex items-center justify-between gap-3 z-30 shrink-0 border-b border-slate-700">
          <button onClick={() => window.location.href = '/murid'} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-300 transition shrink-0 border border-slate-600">
            <ArrowLeft size={16}/> Kembali
          </button>
          
          <h2 className="text-sm lg:text-base font-bold truncate flex items-center gap-2 text-sky-100">
            {showVideoModal ? <><Video size={18} className="text-red-400"/> Video Bimbingan</> : <><BookOpen size={18} className="text-sky-400"/> Nota: {chapterData ? chapterData.title : formatTajuk(chapterId)}</>}
          </h2>
          
          {/* Tunjuk di Mobile sahaja untuk tutup PDF */}
          <button onClick={() => setShowPdfMobile(false)} className="lg:hidden bg-slate-700 hover:bg-slate-600 text-slate-300 p-2 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>
        
        {/* KAWASAN KANDUNGAN NOTA / VIDEO */}
        <div className="flex-1 w-full h-full bg-slate-100 relative flex flex-col">
          {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize"></div>}
          
          {/* MODAL VIDEO YOUTUBE KECIL JIKA DITEKAN */}
          <div className={`absolute inset-0 z-40 flex flex-col bg-slate-900 transition-all duration-300 ${showVideoModal ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`}>
               <div className="bg-red-600/20 text-white p-3 flex justify-between items-center px-4 shadow-md z-20 border-b border-red-500/30">
                  <span className="font-bold text-sm flex items-center gap-2 text-red-100"><PlayCircle size={18} className="text-red-400"/> Tonton & Fahamkan</span>
                  <button onClick={() => setShowVideoModal(false)} className="bg-slate-800/80 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-600 flex items-center gap-1">
                    <BookOpen size={14}/> Baca Nota
                  </button>
               </div>
               <div className="flex-1 w-full h-full flex items-center justify-center p-4 relative bg-black">
                  {videoKhas ? (
                    <iframe className="w-full h-full max-h-[70vh] aspect-video rounded-xl shadow-2xl border border-slate-700" src={showVideoModal ? videoKhas : ""} title="Video Bimbingan" frameBorder="0" allowFullScreen></iframe>
                  ) : (
                    <div className="text-center text-slate-400">
                      <Video size={48} className="mx-auto mb-3 opacity-30"/>
                      <p>Maaf, cikgu belum memasukkan link YouTube untuk subtopik ini.</p>
                      <button onClick={() => setShowVideoModal(false)} className="mt-6 bg-sky-600 hover:bg-sky-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-md">Kembali ke Nota</button>
                    </div>
                  )}
               </div>
          </div>

          <div className="absolute inset-0 w-full h-full z-10 bg-white">
              <iframe src={getNotaUrl()} className="w-full h-full border-0" title="Nota Bimbingan"/>
          </div>
        </div>
      </div>

      {/* DRAGGER PEMBAHAGI SCREEN (DESKTOP) */}
      <div 
        className="hidden lg:flex flex-col justify-center items-center w-1.5 bg-slate-300 hover:bg-sky-500 active:bg-sky-600 cursor-col-resize z-30 transition-colors"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="h-8 w-1 bg-slate-400 rounded-full"></div>
      </div>

      {/* 🟢 PANEL KANAN: CHATBOT AI */}
      <div className="w-full lg:flex-1 h-full bg-white flex flex-col z-10 relative">
        
        {/* HEADER CHAT */}
        <div className="bg-gradient-to-r from-sky-700 to-indigo-800 text-white p-3 lg:p-5 shadow-lg shrink-0 z-10 relative">
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <button onClick={() => window.location.href = '/murid'} className="lg:hidden p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors border border-white/10 text-white">
                <ArrowLeft size={18}/>
              </button>
              
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full flex items-center justify-center shadow-md p-1 border-2 border-sky-200 shrink-0">
                 <Bot size={28} className="text-sky-600"/>
              </div>
              <div>
                <h2 className="font-extrabold text-base lg:text-xl tracking-wide">Cikgu AI I-RAGs</h2>
                <p className="text-sky-200 text-[10px] lg:text-xs font-medium flex items-center gap-1">
                  Aras {arasDariURL.charAt(0).toUpperCase() + arasDariURL.slice(1)} <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse"></span>
                </p>
              </div>
            </div>

            {/* Butang buka nota di skrin telefon */}
            <button onClick={() => setShowPdfMobile(true)} className="lg:hidden bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-md">
              <BookOpen size={16}/> Nota
            </button>
          </div>

          {/* Navigasi Subtopik Puncak */}
          <div className="flex gap-1 overflow-x-auto mt-1 bg-black/20 p-1.5 rounded-xl no-scrollbar">
            {subtopicsList.length > 0 ? subtopicsList.map((sub: any, index: number) => {
              const isPast = index < currentIndex;
              const isActive = index === currentIndex;
              let style = "bg-white/10 text-white/50 border border-white/5"; 
              if (isPast) style = "bg-emerald-500 text-white border-emerald-400 font-bold shadow-sm"; 
              if (isActive) style = "bg-sky-100 text-sky-900 font-bold border-white shadow-sm ring-2 ring-sky-300"; 
              
              return (
                <div key={sub.id} className={`flex-1 text-center py-1.5 rounded-md text-[10px] lg:text-[11px] truncate px-2 transition-all min-w-[50px] ${style}`} title={sub.title}>
                  {sub.id}
                </div>
              );
            }) : <div className="text-xs text-white/70 italic text-center w-full">Memuatkan subtopik...</div>}
          </div>

          {/* Progress Fasa Taksonomi Bloom */}
          <div className="bg-black/20 rounded-xl p-3 mt-2 backdrop-blur-md border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] lg:text-xs font-bold text-sky-100 uppercase tracking-wider">Fasa Inkuiri (Bloom)</span>
              <span className="text-[10px] lg:text-xs font-extrabold text-amber-300 bg-amber-900/30 px-2 py-0.5 rounded-md border border-amber-500/30">{currentPhase} / {maxFasa}</span>
            </div>
            <div className="flex gap-1.5 w-full">
              {phaseNames.map((name, index) => {
                const step = index + 1;
                let bgClass = "bg-slate-500/50"; 
                if (step === currentPhase) bgClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"; 
                if (step < currentPhase) bgClass = "bg-emerald-400"; 
                
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className={`h-1.5 lg:h-2 w-full rounded-full ${bgClass} transition-all duration-500`}></div>
                    <span className={`text-[8px] lg:text-[9px] font-bold uppercase tracking-wider ${step === currentPhase ? 'text-amber-300' : step < currentPhase ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* KAWASAN KANDUNGAN CHAT */}
        <div className="flex-1 p-3 lg:p-6 overflow-y-auto bg-slate-50 relative custom-scrollbar">
          
          <div className="text-center mb-6 mt-2">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-full">Sesi Bermula</span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mr-2 mt-auto border border-sky-200 hidden md:flex">
                  <Bot size={16} className="text-sky-600"/>
                </div>
              )}
              
              <div className={`px-4 py-3 rounded-2xl max-w-[90%] md:max-w-[80%] text-sm md:text-base leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-sky-600 text-white rounded-br-sm" 
                  : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
              }`}>
                <div className="prose prose-sm md:prose-base prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0 mr-2 mt-auto border border-sky-200 hidden md:flex"><Bot size={16} className="text-sky-600"/></div>
              <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-sky-500 animate-spin" />
                <span className="text-slate-500 text-xs md:text-sm font-medium">I-RAGs sedang menaip...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* INPUT TERLEKAT (STICKY FOOTER) */}
        <div className="bg-white border-t border-slate-200 shadow-[0_-4px_15px_-10px_rgba(0,0,0,0.1)] shrink-0 z-20">
            
            {/* Butang Bantuan Cepat */}
            {!isLoading && !isMastered && (
              <div className="flex flex-wrap gap-2 px-4 py-2 bg-slate-50 border-b border-slate-100">
                <button onClick={() => sendQuickPrompt("Boleh bagi hint atau klu sikit?")} className="bg-amber-100 text-amber-700 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1.5 border border-amber-200/50">
                  <Lightbulb size={14}/> Beri Hint
                </button>
                <button onClick={() => sendQuickPrompt("Saya kurang faham, boleh cikgu terangkan?")} className="bg-rose-100 text-rose-700 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-200 transition-colors flex items-center gap-1.5 border border-rose-200/50">
                  <HelpCircle size={14}/> Tak Faham
                </button>
                {arasDariURL === "rendah" && (
                  <button onClick={() => setShowVideoModal(true)} className="bg-purple-100 text-purple-700 text-[11px] md:text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1.5 border border-purple-200/50 ml-auto">
                    <PlayCircle size={14}/> Tonton Video
                  </button>
                )}
              </div>
            )}

            {/* Borang Input Chat */}
            {isMastered ? (
              <div className="p-5 md:p-6 bg-emerald-50 text-center">
                <div className="flex justify-center mb-2"><CheckCircle2 className="w-10 h-10 text-emerald-500" /></div>
                <h3 className="text-lg md:text-xl font-bold text-emerald-800 mb-1">Subtopik Dikuasai!</h3>
                <p className="text-emerald-700 font-medium text-xs md:text-sm mb-4">Syabas, anda cemerlang menyelesaikan bimbingan ini.</p>
                <button onClick={gotoNextSubtopic} className="w-full md:w-auto mx-auto bg-emerald-600 text-white text-sm md:text-base font-bold px-8 py-3 rounded-xl shadow-lg hover:bg-emerald-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                  {currentIndex !== -1 && currentIndex + 1 < subtopicsList.length ? <>Seterusnya <ArrowLeft className="w-5 h-5 rotate-180"/></> : "Selesai Bimbingan (Kembali)"}
                </button>
              </div>
            ) : (
              <form onSubmit={sendMessage} className="p-3 md:p-4 flex gap-2 items-end">
                <textarea 
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Taip jawapan anda di sini..." 
                  className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-400 border border-slate-300 rounded-2xl px-4 py-3 text-sm md:text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 resize-none min-h-[50px] max-h-[120px]" 
                  disabled={isLoading}
                  rows={1}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="bg-sky-600 text-white rounded-2xl w-12 h-12 md:w-14 md:h-14 shrink-0 flex items-center justify-center hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors">
                  <Send size={20} className={input.trim() && !isLoading ? "translate-x-0.5" : ""} />
                </button>
              </form>
            )}
        </div>
      </div>
    </div>
  );
}

export default function SplitScreenLearning() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4"><Loader2 className="w-10 h-10 animate-spin text-sky-600"/><div className="text-sm font-bold text-slate-500">Memuatkan Sistem...</div></div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}