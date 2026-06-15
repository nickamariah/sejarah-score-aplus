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
  
  // 🌟 STATE BARU UNTUK KAWAL NOTA DI MOBILE
  const [showPdfMobile, setShowPdfMobile] = useState(false);

  // Ambil ID dari LocalStorage (Sistem Sebenar)
  const [studentId, setStudentId] = useState("murid_test");
  useEffect(() => {
    const rawUser = localStorage.getItem("currentUser");
    if (rawUser) {
      setStudentId(JSON.parse(rawUser).id);
    }
  }, []);

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
  const ekstrakSubtopik = (id) => id.includes("_sub") ? id.split("_sub")[1] : "Umum";

  // ==========================================
  // FIREBASE INIT
  // ==========================================
  useEffect(() => {
    if (studentId === "murid_test") return; // Tunggu ID sebenar load

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
          content: `Hai! Saya I-RAGs 🤖. Jom kita mulakan sesi inkuiri untuk **${formatTajuk(chapterId).toUpperCase()}**. Boleh beritahu saya apa persoalan utama yang bermain di fikiran awak tentang topik ini?`,
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
      const fetchedMessages = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [sessionId, chapterId, studentId]);

  // ==========================================
  // HANTAR MESEJ
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
          if (currentPhase < 5) {
            const nextPhase = currentPhase + 1;
            setCurrentPhase(nextPhase);
            await updateDoc(sessionDocRef, { currentPhase: nextPhase });
            
            await addDoc(messagesCollectionRef, {
              role: "assistant",
              content: `✨ Tahniah! Awak dah lepasi Fasa ${currentPhase}. Mari kita ke **Fasa ${nextPhase} (${phaseNames[nextPhase-1]})** pula.`,
              timestamp: serverTimestamp()
            });

            const autoResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId, chapterId, text: "Saya bersedia. Sila berikan soalan inkuiri pertama untuk fasa baharu ini.", 
                currentPhase: nextPhase, aras: arasDariURL, previousMessages: [] 
              })
            });

            const autoData = await autoResponse.json();
            if (autoData.reply) {
               await addDoc(messagesCollectionRef, { role: "assistant", content: autoData.reply, timestamp: serverTimestamp() });
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
    // Susunan Layout: Kiri(PDF), Kanan(Chat) untuk Desktop.
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 overflow-hidden font-sans relative">
      
      {/* ======================================= */}
      {/* BAHAGIAN KIRI: PDF VIEWER */}
      {/* ======================================= */}
      {/* Desktop: Sentiasa nampak (w-60%). Mobile: Hanya nampak jika showPdfMobile = true */}
      <div className={`${showPdfMobile ? 'flex absolute inset-0 z-50 bg-white' : 'hidden'} lg:flex lg:relative lg:w-[60%] lg:h-full flex-col z-20 shadow-xl lg:shadow-none`}>
        
        <div className="bg-slate-800 text-white p-3 lg:p-4 shadow-sm flex items-center justify-between gap-3">
          <h2 className="text-sm lg:text-lg font-bold truncate capitalize flex items-center gap-2">
            📄 Nota: {formatTajuk(chapterId)}
          </h2>
          {/* Butang Tutup Nota hanya muncul di Mobile */}
          <button 
            onClick={() => setShowPdfMobile(false)}
            className="lg:hidden bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
          >
            Tutup Nota ✖
          </button>
        </div>
        
        <div className="flex-1 bg-gray-200 overflow-hidden relative">
          <iframe src={`${pdfUrl}#toolbar=1&view=FitH`} className="w-full h-full z-10 relative bg-white" title="PDF Viewer" />
        </div>
      </div>

      {/* ======================================= */}
      {/* BAHAGIAN KANAN: CHATBOT I-RAGS */}
      {/* ======================================= */}
      <div className="w-full lg:w-[40%] h-full bg-white shadow-2xl flex flex-col border-l-0 lg:border-l-4 border-blue-500 z-10 relative">
        
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 lg:p-5 flex flex-col gap-2 shadow-md shrink-0">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Butang Kembali ke Dashboard */}
              {/* Butang Kembali ke Dashboard (KINI LEBIH JELAS!) */}
            <button 
              onClick={() => window.location.href = '/murid'} 
              className="bg-white text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition flex items-center gap-2 shrink-0"
              title="Kembali ke Dashboard"
            >
              <span>⬅️</span> <span className="hidden lg:inline">Dashboard</span>
            </button>
              
              <div className="text-2xl lg:text-4xl bg-white rounded-full p-1 shadow-sm">🤖</div>
              <div>
                <h2 className="font-extrabold text-base lg:text-xl tracking-wide leading-tight">I-RAGs Tutor</h2>
                <p className="text-blue-100 text-[10px] lg:text-xs font-medium">Model 5 Fasa Inkuiri</p>
              </div>
            </div>

            {/* Butang Buka Nota (Hanya di Mobile) */}
            <button 
              onClick={() => setShowPdfMobile(true)}
              className="lg:hidden bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
            >
              📖 Baca Nota
            </button>
          </div>

          {/* PROGRESS BAR & JEJAK SUBTOPIK */}
          <div className="bg-black/20 rounded-xl p-2 lg:p-3 mt-1 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-1.5 lg:mb-2">
              <span className="text-[10px] lg:text-xs font-bold text-blue-100 bg-white/10 px-2 py-0.5 rounded-full">
                Subtopik: {ekstrakSubtopik(chapterId)}
              </span>
              <span className="text-[10px] lg:text-xs font-bold text-yellow-300">Fasa {currentPhase} / 5</span>
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

        {/* RUANG CHAT */}
        {/* Saiz text dikecilkan (text-sm) untuk Mobile, dan kekal besar (text-lg) untuk Desktop */}
        <div className="flex-1 p-3 lg:p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-3 lg:mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 lg:p-5 rounded-2xl lg:rounded-3xl max-w-[85%] text-sm lg:text-lg font-medium leading-relaxed shadow-sm lg:shadow-md ${
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
                <span className="text-gray-500 text-xs lg:text-sm italic font-medium">I-RAGs sedang memproses...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BUTANG PANTAS */}
        {!isLoading && !isMastered && (
          <div className="flex flex-wrap gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200 shrink-0">
            <button onClick={() => sendQuickPrompt("Saya tak faham.")} className="bg-orange-100 text-orange-700 text-xs lg:text-sm font-bold px-3 py-1.5 rounded-full hover:bg-orange-200">🤷‍♂️ Tak Faham</button>
            <button onClick={() => sendQuickPrompt("Boleh bagi hint?")} className="bg-green-100 text-green-700 text-xs lg:text-sm font-bold px-3 py-1.5 rounded-full hover:bg-green-200">💡 Beri Hint</button>
          </div>
        )}

        {/* FORM INPUT / BUTANG NEXT */}
        {isMastered ? (
          <div className="p-4 lg:p-6 bg-emerald-50 border-t-4 border-emerald-500 text-center shrink-0">
            <h3 className="text-lg lg:text-2xl font-extrabold text-emerald-700 mb-1">🏆 Subtopik Selesai!</h3>
            <p className="text-emerald-800 font-medium text-xs lg:text-sm mb-3">Sila kembali ke Dashboard untuk mengambil Post-Test.</p>
            <button onClick={() => window.location.href = '/murid'} className="bg-emerald-600 text-white text-sm lg:text-base font-bold px-6 py-2.5 rounded-full shadow-md hover:bg-emerald-700 transition">
              Kembali ke Dashboard 🚀
            </button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="p-3 lg:p-4 bg-white border-t border-gray-200 flex gap-2 items-center shadow-inner shrink-0">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Taip jawapan..." 
              className="flex-1 border-2 border-gray-300 rounded-full px-4 py-2.5 text-sm lg:text-base focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm" 
              disabled={isLoading} 
            />
            <button type="submit" className="bg-blue-600 text-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all shrink-0" disabled={isLoading || !input.trim()}>
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