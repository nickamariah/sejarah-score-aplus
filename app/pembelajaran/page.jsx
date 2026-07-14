"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import { db } from "@/lib/firebase"; 
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

function KomponenPembelajaran() {
  const searchParams = useSearchParams();
  const babDariURL = searchParams.get("bab") || "tingkatan4_bab1_sub1.1"; 
  const arasDariURL = searchParams.get("aras") || "rendah";

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // STATE UNTUK VIDEO BIMBINGAN (MURID LEMAH)
  const [showVideoModal, setShowVideoModal] = useState(false);
  
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isMastered, setIsMastered] = useState(false);
  
  const [showPdfMobile, setShowPdfMobile] = useState(false);
  
  // STATE BARU UNTUK SPLIT SCREEN RESIZABLE
  const [leftWidth, setLeftWidth] = useState(60); 
  const [isDragging, setIsDragging] = useState(false);

  // STATE BARU UNTUK DATA BAB DARI DATABASE
  const [chapterData, setChapterData] = useState(null);

  const [studentId, setStudentId] = useState("murid_test");
  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) setStudentId(JSON.parse(rawUser).id);
  }, []);

  const chapterId = babDariURL; 
  const sessionId = `${studentId}_${chapterId}`;
  const pdfFileName = chapterId.split('_sub')[0]; // cth: tingkatan4_bab1

  const messagesEndRef = useRef(null);
  const isInitializing = useRef(false);
  // KOD BARU: Tentukan maksimum fasa ikut aras
  const maxFasa = arasDariURL === "rendah" ? 3 : 6;
  
  const phaseNames = arasDariURL === "rendah" 
    ? ["Mengingat", "Memahami", "Mengaplikasi"] 
    : ["Mengetahui", "Memahami", "Mengaplikasi", "Menganalisis", "Menilai", "Mencipta Idea"];

  // 1. TARIK DATA SUBTOPIK DARI FIREBASE BERDASARKAN BAB
  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        const docRef = doc(db, "chapters", pdfFileName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChapterData(docSnap.data());
        } else {
          console.log("Tiada data bab dijumpai untuk:", pdfFileName);
        }
      } catch (error) {
        console.error("Ralat ambil data bab:", error);
      }
    };
    fetchChapterData();
  }, [pdfFileName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // FUNGSI MENGENDALIKAN DRAG PANEL (RESIZABLE)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      let newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth < 20) newWidth = 20;
      if (newWidth > 80) newWidth = 80;
      setLeftWidth(newWidth);
    };
    const handleMouseUp = () => { if (isDragging) setIsDragging(false); };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isDragging]);

  const formatTajuk = (id) => id.replace('tingkatan', 'Tingkatan ').replace('_bab', ' Bab ').replace('_sub', ' Subtopik ');
  const ekstrakSubtopik = (id) => id.includes("_sub") ? id.split("_sub")[1] : "1.1";

  // LOGIK MENENTUKAN SUBTOPIK BERDASARKAN DATA DATABASE
  const currentSub = ekstrakSubtopik(chapterId);
  const subtopicsList = chapterData?.subtopics || []; // Ambil dari Firestore
  const currentIndex = subtopicsList.findIndex(s => s.id === currentSub);
  
  // Tentukan muka surat PDF (Kalau takde data, mula di muka surat 1)
  const currentSubInfo = subtopicsList.find(s => s.id === currentSub);
  const pageNumber = currentSubInfo ? currentSubInfo.startPage : 3;

  const gotoNextSubtopic = () => {
    if (currentIndex !== -1 && currentIndex + 1 < subtopicsList.length) {
      const nextSub = subtopicsList[currentIndex + 1].id;
      const nextUrl = `?bab=${pdfFileName}_sub${nextSub}&aras=${arasDariURL}`;
      window.location.href = nextUrl;
    } else {
      window.location.href = '/murid'; 
    }
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
        await setDoc(sessionDocRef, {
          studentId: studentId,
          chapterId: chapterId,
          currentPhase: 1,
          status: "in_progress",
          startedAt: serverTimestamp(),
        });

        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: `Hai! Saya I-RAGs 🤖. Jom mulakan sesi inkuiri untuk **${formatTajuk(chapterId).toUpperCase()}**. Boleh beritahu saya apa persoalan utama yang bermain di fikiran awak tentang topik ini?`,
          timestamp: serverTimestamp()
        });
      } else {
        const dataSesi = docSnap.data();
        setCurrentPhase(dataSesi.currentPhase || 1);
        if (dataSesi.status === "completed") setIsMastered(true);
      }
    };

    inisialisasiSesi();

    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [sessionId, chapterId, studentId]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const teksMurid = input;
    setInput("");
    setIsLoading(true);

    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    try {
      await addDoc(messagesCollectionRef, { role: "user", content: teksMurid, timestamp: serverTimestamp() });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, chapterId, text: teksMurid, currentPhase: currentPhase, aras: arasDariURL,
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
            
            await addDoc(messagesCollectionRef, {
              role: "assistant",
              content: `✨ Tahniah! Awak dah lepasi Fasa ${currentPhase}. Mari kita ke **Fasa ${nextPhase} (${phaseNames[nextPhase-1]})** pula.`,
              timestamp: serverTimestamp()
            });
          } else if (currentPhase === 6) {
            setIsMastered(true);
            await updateDoc(sessionDocRef, { status: "completed" });
            
            await addDoc(messagesCollectionRef, {
              role: "assistant",
              content: `🎉 **SYABAS!** Awak telah berjaya menjawab soalan Fasa Refleksi dengan cemerlang! Ini bermakna awak telah menguasai sepenuhnya subtopik ini.`,
              timestamp: serverTimestamp()
            });
          }
        }
      }
    } catch (error) {
      console.error("Ralat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuickPrompt = (text) => setInput(text);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* 1. PANEL KIRI (NOTA PDF) */}
      <div 
        className={`${showPdfMobile ? 'flex absolute inset-0 z-50 bg-white' : 'hidden'} lg:flex lg:relative flex-col z-20 shadow-xl lg:shadow-none h-full lg:w-[var(--left-width)]`}
        style={{ "--left-width": `${leftWidth}%` }}
      >
        <div className="bg-slate-800 text-white p-3 lg:p-4 shadow-sm flex items-center justify-between gap-3">
          <button onClick={() => window.location.href = '/murid'} className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition shrink-0">
            ⬅️ <span className="hidden sm:inline">Dashboard</span>
          </button>
          <h2 className="text-sm lg:text-lg font-bold truncate capitalize flex items-center gap-2">
            📄 Nota: {chapterData ? chapterData.title : formatTajuk(chapterId)}
          </h2>
          <button onClick={() => setShowPdfMobile(false)} className="lg:hidden bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">
            Tutup Nota ✖
          </button>
        </div>
        
        <div className="flex-1 bg-gray-200 overflow-hidden relative">
          {isDragging && <div className="absolute inset-0 z-50 cursor-col-resize"></div>}
          
          {/* Iframe akan lompat automatik ke muka surat berdasarkaan #page=X */}
          {/* Iframe yang telah dibaiki (Guna key untuk paksa refresh & baca URL Firebase) */}
          <iframe 
            key={pageNumber} 
            src={chapterData?.chapterUrl ? `${chapterData.chapterUrl}#page=${pageNumber}&toolbar=1&view=FitH` : `/${pdfFileName}.pdf#page=${pageNumber}&toolbar=1&view=FitH`}
            className="w-full h-full z-10 relative bg-white" 
            title="PDF Viewer" 
          />
        </div>
      </div>

      {/* 2. DRAG RESIZER BAR */}
      <div 
        className="hidden lg:flex flex-col justify-center items-center w-2 bg-gray-200 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize z-30 transition-colors"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="h-12 w-1 bg-gray-400 rounded-full"></div>
      </div>

      {/* 3. PANEL KANAN (CHAT AI) */}
      <div className="w-full lg:flex-1 h-full bg-white shadow-2xl flex flex-col border-t-4 lg:border-t-0 z-10 relative">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 lg:p-5 flex flex-col gap-2 shadow-md shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 lg:gap-3">
              <button onClick={() => window.location.href = '/murid'} className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition lg:hidden" title="Kembali ke Dashboard">
                ⬅️
              </button>
              <div className="text-2xl lg:text-4xl bg-white rounded-full p-1 shadow-sm">🤖</div>
              <div>
                <h2 className="font-extrabold text-base lg:text-xl tracking-wide leading-tight">I-RAGs Tutor</h2>
                <p className="text-blue-100 text-[10px] lg:text-xs font-medium">Model 5 Fasa Inkuiri</p>
              </div>
            </div>
            <button onClick={() => setShowPdfMobile(true)} className="lg:hidden bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm">
              📖 Baca Nota
            </button>
          </div>

          <div className="flex gap-1 overflow-hidden mt-1 bg-black/20 p-1.5 rounded-lg">
            {subtopicsList.length > 0 ? subtopicsList.map((sub, index) => {
              const isPast = index < currentIndex;
              const isActive = index === currentIndex;
              let style = "bg-white/10 text-white/50 border border-white/5"; 
              let icon = "🔒";
              if (isPast) { style = "bg-emerald-500/80 text-white border-emerald-400"; icon = "✅"; }
              if (isActive) { style = "bg-sky-400 text-sky-950 font-bold border-white shadow-sm"; icon = "🚀"; }
              
              return (
                <div key={sub.id} className={`flex-1 text-center py-1 rounded text-[9px] lg:text-[11px] truncate px-1 transition-all ${style}`} title={sub.title}>
                  {icon} {sub.id}
                </div>
              );
            }) : <div className="text-xs text-white/70 italic text-center w-full">Memuatkan subtopik...</div>}
          </div>

          <div className="bg-black/20 rounded-xl p-2 lg:p-3 mt-1 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1.5 lg:mb-2">
              <span className="text-[10px] lg:text-xs font-bold text-blue-100 bg-white/10 px-2 py-0.5 rounded-full">Fasa Semasa</span>
              <span className="text-[10px] lg:text-xs font-bold text-yellow-300">{currentPhase} / {maxFasa}</span>
            </div>
            <div className="flex gap-1 w-full">
              {phaseNames.map((name, index) => {
                const step = index + 1;
                let bgClass = "bg-gray-400/50"; 
                if (step === currentPhase) bgClass = "bg-yellow-400 animate-pulse"; 
                if (step < currentPhase) bgClass = "bg-emerald-400"; 
                
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-1.5 lg:h-2 w-full rounded-full ${bgClass} transition-all duration-500`}></div>
                    <span className={`text-[8px] lg:text-[10px] font-bold ${step === currentPhase ? 'text-yellow-300' : 'text-blue-200'}`}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1 p-3 lg:p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-3 lg:mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 lg:p-5 rounded-2xl lg:rounded-3xl max-w-[90%] lg:max-w-[85%] text-sm lg:text-base font-medium leading-relaxed shadow-sm lg:shadow-md ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 border-2 border-blue-100 rounded-bl-none"
              }`}>
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="p-3 lg:p-4 bg-white border-2 border-blue-100 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <span className="animate-bounce text-lg">💭</span>
                <span className="text-gray-500 text-xs lg:text-sm italic font-medium">I-RAGs sedang menilai...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {!isLoading && !isMastered && (
          <div className="flex flex-wrap gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200 shrink-0">
            <button onClick={() => sendQuickPrompt("Saya tak faham.")} className="bg-orange-100 text-orange-700 text-xs lg:text-sm font-bold px-3 py-1.5 rounded-full hover:bg-orange-200 shadow-sm">🤷‍♂️ Tak Faham</button>
            <button onClick={() => sendQuickPrompt("Boleh bagi hint?")} className="bg-green-100 text-green-700 text-xs lg:text-sm font-bold px-3 py-1.5 rounded-full hover:bg-green-200 shadow-sm">💡 Beri Hint</button>
            
            {/* 🌟 BUTANG VIDEO KHAS UNTUK ARAS RENDAH */}
            {arasDariURL === "rendah" && (
              <button 
                onClick={() => setShowVideoModal(true)} 
                className="bg-red-100 text-red-700 text-xs lg:text-sm font-bold px-3 py-1.5 rounded-full hover:bg-red-200 shadow-sm flex items-center gap-1 ml-auto"
              >
                🎬 Tonton Video Bimbingan
              </button>
            )}
          </div>
        )}

        {/* 🌟 POP-UP (MODAL) VIDEO YOUTUBE */}
        {showVideoModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <h3 className="font-bold flex items-center gap-2">🎬 Video Bimbingan: {currentSubInfo?.title || currentSub}</h3>
                <button onClick={() => setShowVideoModal(false)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-bold transition">
                  Tutup ✖
                </button>
              </div>
              <div className="w-full aspect-video bg-black">
                <iframe 
                  className="w-full h-full"
                  /* GANTI URL DI BAWAH DENGAN URL YOUTUBE EMBED CIKGU SEMENTARA WAKTU */
                  src={currentSubInfo?.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                  title="Video Bimbingan" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <p className="text-sm text-slate-600 font-medium">Tonton penerangan di atas. Jika anda sudah faham, tutup video ini dan teruskan menjawab soalan bersama I-RAGS Tutor.</p>
              </div>
            </div>
          </div>
        )}

        {isMastered ? (
          <div className="p-4 lg:p-6 bg-emerald-50 border-t-4 border-emerald-500 text-center shrink-0">
            <h3 className="text-lg lg:text-2xl font-extrabold text-emerald-700 mb-1">🏆 Subtopik Selesai! ✅</h3>
            <p className="text-emerald-800 font-medium text-xs lg:text-sm mb-3">Syabas! Anda telah melengkapkan 5 Fasa Inkuiri.</p>
            
            <button 
              onClick={gotoNextSubtopic} 
              className="bg-emerald-600 text-white text-sm lg:text-lg font-bold px-6 py-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>{currentIndex !== -1 && currentIndex + 1 < subtopicsList.length ? "Seterusnya" : "Kembali ke Dashboard"}</span>
              <span className="text-xl">{currentIndex !== -1 && currentIndex + 1 < subtopicsList.length ? "🔓🚀" : "🏠"}</span>
            </button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="p-3 lg:p-4 bg-white border-t border-gray-200 flex gap-2 items-center shadow-inner shrink-0">
            <input 
              type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Taip jawapan..." 
              className="flex-1 border-2 border-gray-300 rounded-full px-4 py-2.5 text-sm lg:text-base focus:outline-none focus:border-blue-500" disabled={isLoading} 
            />
            <button type="submit" className="bg-blue-600 text-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 text-xl" disabled={isLoading || !input.trim()}>
              ➤
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SplitScreenLearning() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xl font-bold text-blue-600 animate-pulse">Sistem sedang dimuatkan...</div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}