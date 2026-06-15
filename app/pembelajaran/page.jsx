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
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isMastered, setIsMastered] = useState(false);

  // ID Murid - Pastikan guna sistem login sebenar nanti
  const studentId = "murid_006"; 
  const chapterId = babDariURL; 
  const sessionId = `${studentId}_${chapterId}`;

  const pdfFileName = chapterId.split('_sub')[0]; 
  const pdfUrl = `/${pdfFileName}.pdf`; 

  const messagesEndRef = useRef(null);
  const isInitializing = useRef(false);
  const phaseNames = ["Tanya", "Teroka", "Analisis", "Rumus", "Refleksi"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTajuk = (id) => id.replace('tingkatan', 'Tingkatan ').replace('_bab', ' Bab ').replace('_sub', ' Subtopik ');
  
  // Fungsi ektrak nombor subtopik untuk paparan UI
  const ekstrakSubtopik = (id) => {
    if (id.includes("_sub")) return id.split("_sub")[1];
    return "Umum";
  };

  // ==========================================
  // FIREBASE INIT
  // ==========================================
  useEffect(() => {
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
          content: `Hai! Saya I-RAGs 🤖. Jom kita mulakan sesi inkuiri untuk ${formatTajuk(chapterId).toUpperCase()}. Boleh beritahu saya apa persoalan utama yang bermain di fikiran awak tentang topik ini?`,
          timestamp: serverTimestamp()
        });
      } else {
        const dataSesi = docSnap.data();
        setCurrentPhase(dataSesi.currentPhase || 1);
        if (dataSesi.status === "completed") {
          setIsMastered(true);
        }
      }
    };

    inisialisasiSesi();

    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [sessionId, chapterId, studentId]);

  // ==========================================
  // HANTAR MESEJ & LOGIK PINDAH FASA AUTOMATIK
  // ==========================================
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const teksMurid = input;
    setInput("");
    setIsLoading(true);

    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    try {
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: teksMurid,
        timestamp: serverTimestamp()
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          chapterId, 
          text: teksMurid,
          currentPhase: currentPhase,
          aras: arasDariURL,
          previousMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json(); 

      if (data.reply) {
        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: data.reply,
          timestamp: serverTimestamp()
        });

        if (data.isPhaseComplete) {
          if (currentPhase < 5) {
            const nextPhase = currentPhase + 1;
            setCurrentPhase(nextPhase);
            await updateDoc(sessionDocRef, { currentPhase: nextPhase });
            
            await addDoc(messagesCollectionRef, {
              role: "assistant",
              content: `✨ Tahniah! Awak dah lepasi Fasa ${currentPhase}. Mari kita ke **Fasa ${nextPhase} (${phaseNames[nextPhase-1]})** pula.`,
              timestamp: serverTimestamp()
            });

            // Auto-tanya soalan fasa baru
            const autoResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId, chapterId, 
                text: "Saya bersedia. Sila berikan soalan inkuiri pertama untuk fasa baharu ini.", 
                currentPhase: nextPhase, 
                aras: arasDariURL,
                previousMessages: [] 
              })
            });

            const autoData = await autoResponse.json();
            if (autoData.reply) {
               await addDoc(messagesCollectionRef, {
                  role: "assistant",
                  content: autoData.reply,
                  timestamp: serverTimestamp()
               });
            }

          } else if (currentPhase === 5) {
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
    // 🌟 UBAHSUAI RESPONSIVE: flex-col untuk Mobile, lg:flex-row untuk Laptop
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* ======================================= */}
      {/* BAHAGIAN 1: PDF VIEWER (Atas untuk Mobile, Kiri untuk Laptop) */}
      {/* ======================================= */}
      <div className="w-full lg:w-[60%] h-[40%] lg:h-full p-2 lg:p-4 flex flex-col z-20 shadow-md lg:shadow-none bg-white lg:bg-transparent">
        <div className="bg-white rounded-t-xl p-2 lg:p-4 shadow-sm border-b-2 border-blue-100 flex items-center gap-3">
          {/* 🌟 BUTANG KEMBALI KE DASHBOARD */}
          <button 
            onClick={() => window.location.href = '/murid'} 
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-bold text-slate-700 transition shrink-0"
          >
            ⬅️ <span className="hidden sm:inline">Dashboard</span>
          </button>
          
          <h2 className="text-sm lg:text-lg font-bold text-gray-800 truncate capitalize">
            📄 Nota: {formatTajuk(chapterId)}
          </h2>
        </div>
        
        <div className="flex-1 bg-gray-200 lg:rounded-b-xl shadow-inner overflow-hidden relative">
          <iframe src={`${pdfUrl}#toolbar=1&view=FitH`} className="w-full h-full z-10 relative bg-white" title="PDF Viewer" />
        </div>
      </div>

      {/* ======================================= */}
      {/* BAHAGIAN 2: CHATBOT (Bawah untuk Mobile, Kanan untuk Laptop) */}
      {/* ======================================= */}
      <div className="w-full lg:w-[40%] h-[60%] lg:h-full bg-white shadow-2xl flex flex-col border-t-4 lg:border-t-0 lg:border-l-4 border-blue-500 z-10">
        
        {/* HEADER & PROGRESS BAR */}
        <div className="bg-blue-600 text-white p-3 lg:p-5 flex flex-col gap-2 shadow-md z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl lg:text-5xl bg-white rounded-full p-1.5 lg:p-2 shadow-sm">🤖</div>
              <div>
                <h2 className="font-extrabold text-lg lg:text-2xl tracking-wide leading-tight">I-RAGs Tutor</h2>
                <p className="text-blue-100 text-xs lg:text-sm font-medium">Model 5 Fasa Inkuiri</p>
              </div>
            </div>
            {/* 🌟 JEJAK SUBTOPIK: Beritahu murid mereka di mana */}
            <div className="bg-blue-800 text-blue-100 text-xs font-bold px-3 py-1 rounded-full border border-blue-400 shadow-sm">
              Subtopik {ekstrakSubtopik(chapterId)}
            </div>
          </div>

          <div className="bg-blue-800/50 rounded-xl p-2 lg:p-3 mt-1">
            <div className="flex justify-between items-center mb-1.5 lg:mb-2">
              <span className="text-[10px] lg:text-sm font-bold text-blue-200">Tahap Kemajuan Anda:</span>
              <span className="text-[10px] lg:text-sm font-bold text-yellow-300">Fasa {currentPhase} / 5</span>
            </div>
            <div className="flex gap-1 w-full">
              {phaseNames.map((name, index) => {
                const step = index + 1;
                let bgClass = "bg-gray-400"; 
                if (step === currentPhase) bgClass = "bg-yellow-400 animate-pulse"; 
                if (step < currentPhase) bgClass = "bg-green-400"; 
                
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

        {/* RUANG CHAT */}
        <div className="flex-1 p-3 lg:p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-3 lg:mb-5 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 lg:p-5 rounded-2xl lg:rounded-3xl max-w-[90%] lg:max-w-[85%] text-base lg:text-xl font-medium leading-relaxed shadow-sm lg:shadow-md ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 border-2 border-blue-200 rounded-bl-none"
              }`}>
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-5">
              <div className="p-4 bg-white border-2 border-blue-200 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <span className="animate-bounce text-xl">💭</span>
                <span className="text-gray-500 text-sm lg:text-lg italic font-medium">I-RAGs sedang menilai...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BUTANG PANTAS */}
        {!isLoading && !isMastered && (
          <div className="flex flex-wrap gap-2 px-3 py-2 bg-gray-50 border-t-2 border-gray-200 shrink-0">
            <button onClick={() => sendQuickPrompt("Saya tak tahu jawapannya.")} className="bg-orange-100 text-orange-700 text-xs lg:text-sm font-bold px-3 py-2 rounded-full hover:bg-orange-200 shadow-sm transition-all active:scale-95">🤷‍♂️ Saya tak tahu</button>
            <button onClick={() => sendQuickPrompt("Boleh bagi petunjuk (hint)?")} className="bg-green-100 text-green-700 text-xs lg:text-sm font-bold px-3 py-2 rounded-full hover:bg-green-200 shadow-sm transition-all active:scale-95">💡 Beri saya hint</button>
          </div>
        )}

        {/* RUANG BAWAH: BORANG / BUTANG NEXT SUBTOPIK */}
        {isMastered ? (
          <div className="p-4 lg:p-6 bg-green-50 border-t-4 border-green-500 text-center shadow-inner shrink-0">
            <h3 className="text-xl lg:text-2xl font-extrabold text-green-700 mb-1">🏆 Subtopik Selesai! ✅</h3>
            <p className="text-green-800 font-medium text-xs lg:text-sm mb-3">Syabas! Anda telah melengkapkan 5 Fasa Inkuiri.</p>
            
            <button 
              onClick={() => window.location.href = "?bab=tingkatan4_bab1_sub1.2"} 
              className="bg-green-600 text-white text-sm lg:text-lg font-bold px-6 py-3 rounded-full shadow-lg hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>Seterusnya</span>
              <span className="text-xl">🔓🚀</span>
            </button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="p-3 lg:p-5 bg-white border-t-2 border-gray-200 flex gap-2 lg:gap-3 items-center shadow-inner shrink-0">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Taip jawapan awak di sini..." 
              className="flex-1 border-2 border-gray-300 rounded-full px-4 lg:px-6 py-3 lg:py-4 text-sm lg:text-xl font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
              disabled={isLoading} 
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white rounded-full w-12 h-12 lg:w-16 lg:h-16 flex items-center justify-center hover:bg-blue-700 active:scale-95 disabled:opacity-50 shadow-md text-xl lg:text-2xl transition-all shrink-0" 
              disabled={isLoading || !input.trim()}
            >
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-xl lg:text-2xl font-bold text-blue-600 animate-pulse">Sistem I-RAGs sedang dimuatkan...</div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}