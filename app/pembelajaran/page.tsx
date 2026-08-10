"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import { db } from "@/lib/firebase"; 
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, where } from "firebase/firestore";
import { Bot, Send, ArrowLeft, BookOpen, Video, Lightbulb, HelpCircle, CheckCircle2, Loader2, PlayCircle, X, Mic, Palette, Printer, Library } from "lucide-react";

function KomponenPembelajaran() {
  const searchParams = useSearchParams();
  const babDariURL = searchParams.get("bab") || "tingkatan4_bab1_sub1.1"; 
  const arasDariURL = (searchParams.get("aras") || "rendah").toLowerCase();
  
  const modeDariURL = (searchParams.get("mode") || "normal").toLowerCase();
  const isPemulihan = modeDariURL === "pemulihan";

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 🌟 PENGURUSAN TAB BARU: bukuTeks | nota | video
  const [activeView, setActiveView] = useState<"nota" | "video" | "bukuTeks">("bukuTeks");
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isMastered, setIsMastered] = useState(false);
  const [showPdfMobile, setShowPdfMobile] = useState(false);
  
  const [leftWidth, setLeftWidth] = useState(50); 
  const [isDragging, setIsDragging] = useState(false);

  const [chapterData, setChapterData] = useState<any>(null);
  const [koleksiSoalan, setKoleksiSoalan] = useState("");
  const [koleksiSkema, setKoleksiSkema] = useState("");

  const [studentId, setStudentId] = useState("murid_test");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    if (rawUser) setStudentId(JSON.parse(rawUser).id);
  }, []);

  const chapterId = babDariURL; 
  const sessionId = isPemulihan ? `${studentId}_${chapterId}_pemulihan` : `${studentId}_${chapterId}`;
  const pdfFileName = chapterId.split('_sub')[0]; 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isInitializing = useRef(false);
  
  let maxFasa = arasDariURL === "rendah" ? 2 : arasDariURL === "sederhana" ? 3 : 6;
  if (isPemulihan) maxFasa = 3; 
  
  const phaseNames = isPemulihan 
    ? ["Nota Ringkas", "Kefahaman Mudah", "Aplikasi Santai"] 
    : arasDariURL === "rendah" 
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
          if (data.jenis !== "objektif" && data.topik.includes(currentSub)) {
             soalanGabungan += `- ${data.soalan} (${data.markah} Markah)\n`;
             skemaGabungan += `- Soalan: ${data.soalan}\nSkema: ${data.skemaJawapan}\n\n`;
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

  // 🌟 FUNGSI URL UNTUK VIDEO KHAS
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

  // 🌟 FUNGSI URL UNTUK BUKU TEKS (PAUTAN INDUK BAB)
  const getBukuTeksUrl = () => {
    const mainUrl = chapterData?.chapterUrl;
    if (!mainUrl) return `/${pdfFileName}.pdf#page=1&toolbar=1&view=FitH`;
    if (mainUrl.includes("drive.google.com")) return mainUrl.replace(/\/view.*/, "/preview");
    if (mainUrl.includes("canva.com")) return mainUrl;
    return mainUrl;
  };

  // 🌟 FUNGSI URL UNTUK NOTA SUBTOPIK
  const getNotaUrl = () => {
    const subtopicUrl = currentSubInfo?.notaUrl;
    if (subtopicUrl && subtopicUrl.trim() !== "") {
      if (subtopicUrl.includes("drive.google.com")) return subtopicUrl.replace(/\/view.*/, "/preview");
      return subtopicUrl;
    }
    // Jatuh balik ke buku teks jika tiada link khas subtopik
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
        
        let ayatPertamaAI = `Hai! Saya Cikgu AI I-RAGs 👋. Kita akan mulakan sesi untuk **${namaBabSebenar} (${currentSub} ${namaSubtopikSebenar})**.\n\nBerdasarkan nota di sebelah, apa yang awak paling ingat atau faham tentang tajuk ini? Cuba kongsikan.`;
        
        if (isPemulihan) {
          ayatPertamaAI = `Hai awak! 🌟 Jangan risau kalau tak lulus ujian tadi, cikgu ada di sini untuk bantu. Kita buat santai-santai je untuk topik **${namaBabSebenar} (${currentSub} ${namaSubtopikSebenar})**.\n\nCuba awak tengok nota di sebelah sekejap, lepas tu beritahu cikgu kalau awak dah sedia! 😊`;
        }

        await setDoc(sessionDocRef, { studentId, chapterId, currentPhase: 1, status: "in_progress", startedAt: serverTimestamp(), mode: modeDariURL });
        await addDoc(messagesCollectionRef, { role: "assistant", content: ayatPertamaAI, timestamp: serverTimestamp() });
      
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
  }, [sessionId, chapterId, studentId, chapterData, maxFasa, currentSub, namaBabSebenar, namaSubtopikSebenar, isPemulihan, modeDariURL]); 

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault(); 
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Sistem suara tidak disokong. Guna Chrome terkini."); return; }

    if (isListening) {
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(err) {} }
      setIsListening(false);
    } else {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ms-MY';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput((prev) => prev + (prev.trim() !== '' ? ' ' : '') + transcript);
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.style.height = 'auto';
              inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
            }
          }, 50);
        };

        recognition.onerror = (event: any) => {
          console.error("Ralat Suara:", event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') alert("Akses mikrofon disekat!");
        };

        recognition.onend = () => setIsListening(false);
        recognitionRef.current = recognition;
        recognition.start();
        
      } catch (err) { setIsListening(false); }
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const teksMurid = input;
    setInput(""); setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

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
          mode: modeDariURL,
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
                mode: modeDariURL,
                text: `[SISTEM AUTO]: Murid lulus fasa tadi. Berikan SOALAN PERTAMA untuk menguji FASA ${nextPhase}. Tanya 1 soalan sahaja.`, 
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

  const sendQuickPrompt = (text: string) => { 
    setInput(text); 
    if (inputRef.current) inputRef.current.style.height = 'auto'; 
    setTimeout(() => { inputRef.current?.focus(); }, 50); 
  };

  return (
    <div className={`flex flex-col lg:flex-row h-screen overflow-hidden font-sans relative transition-colors duration-700 ${selectedTheme}`}>
      
      {/* 🟢 PANEL KIRI: PDF & VIDEO */}
      <div className={`${showPdfMobile ? 'fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm' : 'hidden'} lg:flex lg:relative flex-col z-20 shadow-2xl lg:shadow-none h-full lg:w-(--left-width)`} style={{ "--left-width": `${leftWidth}%` } as React.CSSProperties}>
        
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 lg:p-4 shadow-md flex items-center gap-3 z-30 shrink-0 border-b border-white/10 overflow-x-auto no-scrollbar">
          
          <button onClick={() => window.location.href = '/murid'} className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-slate-100 transition shrink-0 border border-white/10">
            <ArrowLeft size={14}/> Kembali
          </button>
          
          {/* 🌟 BUTANG BARU (BUKU TEKS, NOTA, VIDEO) */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10 shrink-0">
            <button
              onClick={() => setActiveView("bukuTeks")}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === "bukuTeks" ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
              title="Rujuk Buku Teks / Nota Induk Bab"
            >
              <Library size={14}/> Buku Teks
            </button>
            <button
              onClick={() => setActiveView("nota")}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === "nota" ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
              title="Nota Spesifik Subtopik"
            >
              <BookOpen size={14}/> Nota
            </button>
            <button
              onClick={() => setActiveView("video")}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${activeView === "video" ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
            >
              <PlayCircle size={14}/> Video
            </button>
            
            <div className="w-px h-5 bg-white/20 mx-1 self-center"></div>
            <button
              onClick={() => window.open(activeView === "bukuTeks" ? getBukuTeksUrl() : getNotaUrl(), '_blank')}
              className="px-3 md:px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all text-slate-400 hover:text-slate-200 hover:bg-white/10"
              title="Buka tab baru untuk Cetak Dokumen"
            >
              <Printer size={14}/> Cetak
            </button>
          </div>

          <h2 className="text-xs font-bold truncate flex-1 text-right text-slate-300 hidden lg:block">
            {chapterData ? chapterData.title : formatTajuk(chapterId)}
          </h2>
          
          <button onClick={() => setShowPdfMobile(false)} className="lg:hidden ml-auto bg-white/10 hover:bg-white/20 text-slate-300 p-1.5 rounded-full transition-colors"><X size={18}/></button>
        </div>
        
        <div className="flex-1 w-full h-full bg-white/50 backdrop-blur-sm relative flex flex-col">
          {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize"></div>}
          
          {/* PAPARAN VIDEO */}
          <div className={`absolute inset-0 z-40 flex flex-col bg-slate-900/95 backdrop-blur-md transition-all duration-300 ${activeView === "video" ? "opacity-100 visible pointer-events-auto" : "opacity-0 invisible pointer-events-none"}`}>
               <div className="flex-1 w-full h-full flex items-center justify-center p-4 relative bg-black/50">
                  {videoKhas ? (
                    <iframe className="w-full h-full aspect-video rounded-xl shadow-2xl border border-white/10" src={activeView === "video" ? videoKhas : ""} title="Video Bimbingan" frameBorder="0" allowFullScreen></iframe>
                  ) : (
                    <div className="text-center text-slate-300">
                      <Video size={48} className="mx-auto mb-3 opacity-50"/>
                      <p className="text-sm font-bold">Tiada video YouTube disertakan.</p>
                      <button onClick={() => setActiveView("nota")} className="mt-4 bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">Kembali ke Nota</button>
                    </div>
                  )}
               </div>
          </div>
          
          {/* PAPARAN BUKU TEKS & NOTA */}
          <div className={`absolute inset-0 w-full h-full z-10 bg-white transition-opacity ${activeView !== "video" ? "opacity-100" : "opacity-0"}`}>
             <iframe src={activeView === "bukuTeks" ? getBukuTeksUrl() : getNotaUrl()} className="w-full h-full border-0" title="Dokumen Rujukan"/>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-center items-center w-1.5 bg-black/20 hover:bg-sky-500 active:bg-sky-600 cursor-col-resize z-30 transition-colors backdrop-blur-sm" onMouseDown={() => setIsDragging(true)}><div className="h-8 w-1 bg-white/50 rounded-full"></div></div>

      {/* 🟢 PANEL KANAN: CHATBOT AI */}
      <div className="w-full lg:flex-1 h-full bg-white/20 backdrop-blur-lg flex flex-col z-10 relative">
        
        {/* HEADER CHAT */}
        <div className="bg-gradient-to-r from-blue-600/90 to-indigo-700/90 backdrop-blur-md text-white p-2 lg:px-4 lg:py-2.5 shadow-md shrink-0 z-10 relative border-b border-white/10">
          <div className="flex justify-between items-center gap-2 mb-1.5">
            
            <div className="flex items-center gap-2">
              <button onClick={() => window.location.href = '/murid'} className="lg:hidden p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 text-white"><ArrowLeft size={16}/></button>
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm p-1 border border-white/30 shrink-0"><Bot size={18} className="text-white"/></div>
              <div className="leading-tight">
                <h2 className="font-bold text-[13px] lg:text-sm tracking-wide flex items-center gap-2">
                  Cikgu AI I-RAGs 
                  {isPemulihan && <span className="bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider hidden md:inline-block">Mod Pemulihan 🚀</span>}
                </h2>
                <p className="text-blue-100 text-[9px] lg:text-[10px] font-medium flex items-center gap-1">
                  Aras {arasDariURL.charAt(0).toUpperCase() + arasDariURL.slice(1)} 
                  {isPemulihan && <span className="bg-amber-400 text-amber-950 px-1 py-0.5 rounded text-[8px] font-bold md:hidden">PEMULIHAN</span>}
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse ml-0.5"></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl border border-white/20 shadow-sm backdrop-blur-sm">
                <Palette size={14} className="text-white ml-2" />
                <select 
                  value={selectedTheme}
                  onChange={handleThemeChange}
                  className="bg-transparent text-[10px] md:text-xs font-bold text-white outline-none cursor-pointer py-1 pl-1 pr-2 hover:text-sky-200 transition-colors appearance-none"
                  title="Tukar Latar Belakang"
                >
                  {senaraiTheme.map(theme => (
                    <option key={theme.id} value={theme.class} className="text-slate-800">{theme.nama}</option>
                  ))}
                </select>
              </div>

              {/* 🌟 TEKS FASA DINAMIK 🌟 */}
              <div className="flex flex-col items-end w-32 lg:w-48">
                 <div className="text-[8px] lg:text-[9px] font-bold text-blue-100 uppercase tracking-wider mb-1 flex justify-between w-full gap-2">
                    <span className="truncate" title={isPemulihan ? "Fasa Santai" : `Fasa ${phaseNames[currentPhase - 1] || "Inkuiri"}`}>
                      {isPemulihan ? "Fasa Santai" : `FASA ${phaseNames[currentPhase - 1]?.toUpperCase() || "INKUIRI"}`}
                    </span> 
                    <span className="text-amber-300 shrink-0">{currentPhase}/{maxFasa}</span>
                 </div>
                 <div className="flex gap-0.5 w-full">
                    {phaseNames.map((name, index) => {
                      const step = index + 1;
                      return <div key={step} className={`h-1.5 w-full rounded-full ${step === currentPhase ? 'bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.8)]' : step < currentPhase ? 'bg-emerald-400' : 'bg-white/30'} transition-all`} title={`Fasa ${name}`}></div>;
                    })}
                 </div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto bg-black/20 p-1 rounded-lg no-scrollbar items-center border border-white/10">
            {subtopicsList.length > 0 ? subtopicsList.map((sub: any, index: number) => {
              const isPast = index < currentIndex;
              const isActive = index === currentIndex;
              let style = "bg-white/10 text-white/50 border border-white/5"; 
              if (isPast) style = "bg-emerald-500 text-white border-emerald-400 font-bold shadow-sm"; 
              if (isActive) style = "bg-white/30 text-white font-bold border-white/50 shadow-sm ring-1 ring-white/30"; 
              return <div key={sub.id} className={`flex-1 text-center py-1 rounded-sm text-[9px] lg:text-[10px] truncate px-1.5 transition-all min-w-[45px] ${style}`} title={sub.title}>{sub.id}</div>;
            }) : <div className="text-[10px] text-white/70 italic text-center w-full">Memuatkan...</div>}
          </div>
        </div>

        {/* KAWASAN KANDUNGAN CHAT */}
        <div className="flex-1 p-3 lg:p-4 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-white/30 relative custom-scrollbar">
          
          <div className="text-center mb-4 mt-1"><span className="text-[9px] lg:text-[10px] font-bold text-slate-100 uppercase tracking-widest bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10">{isPemulihan ? "Sesi Pemulihan Bermula" : "Sesi Bermula"}</span></div>

          {messages.map((msg) => (
            <div key={msg.id} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/90 backdrop-blur-sm hidden md:flex items-center justify-center shrink-0 mr-2 mt-auto border border-white/50 shadow-sm"><Bot size={14} className="text-blue-600"/></div>
              )}
              <div className={`px-3 py-2.5 lg:px-4 lg:py-3 rounded-2xl max-w-[90%] md:max-w-[80%] text-[13px] lg:text-[15px] leading-relaxed shadow-md backdrop-blur-md ${msg.role === "user" ? "bg-blue-600/95 text-white rounded-br-sm border border-blue-500/50" : "bg-white/95 text-slate-800 border border-white/50 rounded-bl-sm"}`}>
                <div className="prose prose-sm md:prose-base prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/90 backdrop-blur-sm hidden md:flex items-center justify-center shrink-0 mr-2 mt-auto border border-white/50 shadow-sm"><Bot size={14} className="text-blue-600"/></div>
              <div className="px-3 py-2 bg-white/95 backdrop-blur-md border border-white/50 rounded-2xl rounded-bl-sm shadow-md flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" /><span className="text-slate-600 text-[11px] lg:text-xs font-medium">I-RAGs sedang menaip...</span></div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* INPUT TERLEKAT DI BAWAH */}
        <div className="bg-white/90 backdrop-blur-md border-t border-white/50 shadow-[0_-4px_10px_-10px_rgba(0,0,0,0.1)] shrink-0 z-20">
            
            {!isLoading && !isMastered && (
              <div className="flex flex-wrap gap-2 px-3 py-2.5 bg-white/50 border-b border-white/50 items-center justify-between">
                
                {/* 🌟 BAHAGIAN KIRI: RUJUKAN (Khas Mobile) */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => { setShowPdfMobile(true); setActiveView("bukuTeks"); }} 
                    className="lg:hidden bg-emerald-100 text-emerald-700 text-[11px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5 shadow-sm border border-emerald-200"
                  >
                    <Library size={14}/> Buku
                  </button>

                  <button 
                    onClick={() => { setShowPdfMobile(true); setActiveView("nota"); }} 
                    className="lg:hidden bg-amber-400 text-amber-950 text-[11px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <BookOpen size={14}/> Nota
                  </button>

                  {(arasDariURL === "rendah" || arasDariURL === "sederhana") && (
                    <button 
                      onClick={() => { setShowPdfMobile(true); setActiveView("video"); }} 
                      className="lg:hidden bg-red-600 text-white text-[11px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg hover:bg-red-700 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <PlayCircle size={14}/> Video
                    </button>
                  )}
                </div>

                {/* BAHAGIAN KANAN: BANTUAN AI */}
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => sendQuickPrompt("Boleh bagi hint atau klu sikit?")} className="bg-emerald-100/80 text-emerald-700 text-[10px] lg:text-[11px] font-bold px-2.5 py-1.5 rounded-md hover:bg-emerald-200 transition-colors flex items-center gap-1 shadow-sm border border-emerald-200/50">
                    <Lightbulb size={12}/> Hint
                  </button>
                  <button onClick={() => sendQuickPrompt("Saya kurang faham, boleh cikgu terangkan?")} className="bg-rose-100/80 text-rose-700 text-[10px] lg:text-[11px] font-bold px-2.5 py-1.5 rounded-md hover:bg-rose-200 transition-colors flex items-center gap-1 shadow-sm border border-rose-200/50">
                    <HelpCircle size={12}/> Tak Faham
                  </button>
                </div>

              </div>
            )}

            {isMastered ? (
              <div className="p-3 lg:p-4 bg-emerald-50/90 backdrop-blur-sm text-center flex flex-col md:flex-row items-center justify-center gap-3">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-6 h-6 text-emerald-500" /><div className="text-left"><h3 className="text-sm font-bold text-emerald-800 leading-tight">Dikuasai!</h3><p className="text-emerald-700 font-medium text-[10px]">Syabas, selesai bimbingan.</p></div></div>
                <button onClick={gotoNextSubtopic} className="w-full md:w-auto bg-emerald-600 text-white text-[11px] lg:text-xs font-bold px-6 py-2 rounded-lg shadow-md hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 ml-auto">
                  {currentIndex !== -1 && currentIndex + 1 < subtopicsList.length ? <>Seterusnya <ArrowLeft className="w-4 h-4 rotate-180"/></> : "Tamat & Kembali"}
                </button>
              </div>
            ) : (
              <form onSubmit={sendMessage} className="p-2 lg:p-3 flex gap-2 items-end relative">
                
                <textarea
                   ref={inputRef}
                   value={input}
                   onChange={handleInput}
                   disabled={isLoading}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       sendMessage();
                     }
                   }}
                   onPaste={(e) => {
                     e.preventDefault();
                     alert("💡 CIKGU AI PESAN:\n\nFungsi 'Paste' (Tampal) ditutup ya. \n\nCikgu nak awak taip jawapan tu sendiri atau guna butang Suara (Mic). Bila kita taip atau sebut sendiri, otak kita akan lebih cepat ingat fakta Sejarah tau. Jom cuba! 💪");
                   }}
                   onDrop={(e) => e.preventDefault()}
                   placeholder="Taip mesej di sini..."
                   rows={1}
                   className="w-full bg-white/70 backdrop-blur-sm border border-slate-300 text-sm lg:text-base text-slate-800 p-3 lg:p-3.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-inner resize-none max-h-32 transition-colors"
                />
                
                <button 
                  type="button" 
                  onClick={toggleListening}
                  disabled={isLoading}
                  title="Gunakan Suara"
                  className={`rounded-xl w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center transition-colors mb-0.5 shadow-sm border ${
                    isListening 
                      ? 'bg-red-500 text-white border-red-600 animate-pulse shadow-red-500/50' 
                      : 'bg-white/80 text-slate-600 border-white/60 hover:bg-white hover:text-blue-600'
                  }`}
                >
                  <Mic size={18} />
                </button>

                <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 text-white rounded-xl w-10 h-10 md:w-11 md:h-11 shrink-0 flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20 transition-all active:scale-95 mb-0.5 border border-blue-500">
                  <Send size={16} className={input.trim() && !isLoading ? "translate-x-0.5" : ""} />
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-3"><Loader2 className="w-8 h-8 animate-spin text-blue-600"/><div className="text-xs font-bold text-slate-500">Memuatkan Sistem...</div></div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}