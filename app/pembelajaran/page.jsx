"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import { db } from "@/lib/firebase"; 
import { collection, doc, setDoc, getDoc, updateDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

function KomponenPembelajaran() {
  const searchParams = useSearchParams();
  const babDariURL = searchParams.get("bab") || "tingkatan4_bab1_sub1.1"; 

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [isMastered, setIsMastered] = useState(false);

  // ID Murid (Guna murid_007 untuk sesi baru yang bersih)
  const studentId = "murid_007"; 
  const chapterId = babDariURL; 
  const sessionId = `${studentId}_${chapterId}`;

  // ==========================================
  // PENYELESAIAN 1: BACA FAIL PDF YANG BETUL
  // ==========================================
  // Kita buang perkataan "_sub..." supaya ia baca fail bab utama sahaja.
  // Contoh: tingkatan4_bab1_sub1.1 -> tingkatan4_bab1
  const pdfFileName = chapterId.split('_sub')[0]; 
  const pdfUrl = `/${pdfFileName}.pdf`; 

  const messagesEndRef = useRef(null);
  const isInitializing = useRef(false);
  const phaseNames = ["Tanya", "Teroka", "Analisis", "Rumus", "Refleksi"];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTajuk = (id) => id.replace('tingkatan', 'Tingkatan ').replace('_bab', ' Bab ').replace('_sub', ' Subtopik ');

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
          // UBAH CONTENT INI SUPAYA JADI DINAMIK 👇
          content: `Hai! Saya I-RAGS 🤖. Jom kita mulakan sesi inkuiri untuk ${formatTajuk(chapterId).toUpperCase()}. ${dapatkanSoalanPertama(chapterId)}`,
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
      // 1. Simpan mesej murid
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: teksMurid,
        timestamp: serverTimestamp()
      });

      // 2. Panggil API AI untuk semak jawapan
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          chapterId, 
          text: teksMurid,
          currentPhase: currentPhase,
          previousMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json(); 

      // 3. Simpan jawapan/semakan dari AI
      if (data.reply) {
        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: data.reply,
          timestamp: serverTimestamp()
        });

        // ==========================================
        // PENYELESAIAN 2: AUTO-TANYA SOALAN FASA BARU
        // ==========================================
        if (data.isPhaseComplete) {
          if (currentPhase < 5) {
            const nextPhase = currentPhase + 1;
            setCurrentPhase(nextPhase);
            await updateDoc(sessionDocRef, { currentPhase: nextPhase });
            
            // Mesej sistem memberitahu fasa bertukar
            await addDoc(messagesCollectionRef, {
              role: "assistant",
              content: `✨ Tahniah! Awak dah lepasi Fasa ${currentPhase}. Mari kita ke **Fasa ${nextPhase} (${phaseNames[nextPhase-1]})** pula.`,
              timestamp: serverTimestamp()
            });

            // AI akan dipaksa tanya soalan baharu untuk fasa baharu secara sembunyi!
            const autoResponse = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                studentId, chapterId, 
                text: "Saya bersedia. Sila terus berikan soalan pertama untuk fasa baharu ini.", 
                currentPhase: nextPhase, // FASA BARU
                previousMessages: [] // Kosongkan ingatan pendek supaya AI fokus pada fasa baru
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
            // JIKA LULUS SEMUA FASA (MASTERED)
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* BAHAGIAN KIRI: PDF VIEWER */}
      <div className="w-[60%] h-full p-4 flex flex-col">
        <div className="bg-white rounded-t-xl p-4 shadow-sm border-b-2 border-blue-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 capitalize">
            📄 Nota Rujukan: {formatTajuk(chapterId)}
          </h2>
        </div>
        <div className="flex-1 bg-gray-200 rounded-b-xl shadow-inner overflow-hidden relative">
          <iframe src={`${pdfUrl}#toolbar=1&view=FitH`} className="w-full h-full z-10 relative bg-white" title="PDF Viewer" />
          {/* Mesej Backup jika PDF tak wujud */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 z-0 bg-gray-100">
            <span className="text-4xl mb-3 animate-pulse">📄</span>
            <span className="text-lg">Sistem sedang mencari fail: <b>{pdfUrl}</b></span>
          </div>
        </div>
      </div>

      {/* BAHAGIAN KANAN: CHATBOT */}
      <div className="w-[40%] h-full bg-white shadow-2xl flex flex-col border-l-4 border-blue-500">
        
        {/* HEADER & PROGRESS BAR */}
        <div className="bg-blue-600 text-white p-5 flex flex-col gap-3 shadow-md z-10">
          <div className="flex items-center gap-4">
            <div className="text-5xl bg-white rounded-full p-2 shadow-sm">🤖</div>
            <div>
              <h2 className="font-extrabold text-2xl tracking-wide">I-RAGS Tutor</h2>
              <p className="text-blue-100 text-base font-medium">Model 5 Fasa Inkuiri</p>
            </div>
          </div>

          <div className="bg-blue-800/50 rounded-xl p-3 mt-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-blue-200">Tahap Kemajuan Anda:</span>
              <span className="text-sm font-bold text-yellow-300">Fasa {currentPhase} / 5</span>
            </div>
            <div className="flex gap-1 w-full">
              {phaseNames.map((name, index) => {
                const step = index + 1;
                let bgClass = "bg-gray-400"; 
                if (step === currentPhase) bgClass = "bg-yellow-400 animate-pulse"; 
                if (step < currentPhase) bgClass = "bg-green-400"; 
                
                return (
                  <div key={step} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`h-2 w-full rounded-full ${bgClass} transition-all duration-500`}></div>
                    <span className={`text-[10px] font-bold ${step === currentPhase ? 'text-yellow-300' : 'text-blue-200'}`}>
                      {name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RUANG CHAT */}
        <div className="flex-1 p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-5 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-5 rounded-3xl max-w-[85%] text-xl font-medium leading-relaxed shadow-md ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 border-2 border-blue-200 rounded-bl-none"
              }`}>
                <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-5">
              <div className="p-5 bg-white border-2 border-blue-200 rounded-3xl rounded-bl-none shadow-md flex items-center gap-3">
                <span className="animate-bounce text-2xl">💭</span>
                <span className="text-gray-500 text-lg italic font-medium">I-RAGS sedang memproses...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* BUTANG PANTAS */}
        {!isLoading && !isMastered && (
          <div className="flex flex-wrap gap-3 px-5 py-3 bg-gray-50 border-t-2 border-gray-200">
            <button onClick={() => sendQuickPrompt("Saya tak tahu jawapannya.")} className="bg-orange-100 text-orange-700 text-base font-bold px-5 py-3 rounded-full hover:bg-orange-200 shadow-sm transition-all hover:scale-105">🤷‍♂️ Saya tak tahu</button>
            <button onClick={() => sendQuickPrompt("Boleh bagi petunjuk (hint)?")} className="bg-green-100 text-green-700 text-base font-bold px-5 py-3 rounded-full hover:bg-green-200 shadow-sm transition-all hover:scale-105">💡 Beri saya hint</button>
          </div>
        )}

        {/* RUANG BAWAH: BORANG / BUTANG NEXT SUBTOPIK */}
        {isMastered ? (
          <div className="p-6 bg-green-50 border-t-4 border-green-500 text-center shadow-inner">
            <h3 className="text-2xl font-extrabold text-green-700 mb-2">🏆 Subtopik Selesai! ✅</h3>
            <p className="text-green-800 font-medium mb-5">Syabas! Anda telah melengkapkan 5 Fasa Inkuiri.</p>
            
            <button 
              onClick={() => window.location.href = "?bab=tingkatan4_bab1_sub1.2"} 
              className="bg-green-600 text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:bg-green-700 hover:scale-105 transition-all flex items-center justify-center gap-2 mx-auto"
            >
              <span>Buka Kunci Subtopik Seterusnya</span>
              <span className="text-2xl">🔓🚀</span>
            </button>
          </div>
        ) : (
          <form onSubmit={sendMessage} className="p-5 bg-white border-t-2 border-gray-200 flex gap-3 items-center shadow-inner">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Taip jawapan awak di sini..." 
              className="flex-1 border-2 border-gray-300 rounded-full px-6 py-4 text-xl font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-sm" 
              disabled={isLoading} 
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center hover:bg-blue-700 hover:scale-105 disabled:opacity-50 shadow-lg text-2xl transition-all" 
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-2xl font-bold text-blue-600 animate-pulse">Sistem I-RAGS sedang dimuatkan...</div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}

const formatTajuk = (id) => id.replace('tingkatan', 'Tingkatan ').replace('_bab', ' Bab ').replace('_sub', ' Subtopik ');

  // FUNGSI BARU: Ambil soalan inkuiri pertama mengikut subtopik
  const dapatkanSoalanPertama = (id) => {
    if (id.includes("sub1.1")) {
      return "Mengapakah kerajaan Alam Melayu boleh dianggap sebagai sebuah negara bangsa?";
    } else if (id.includes("sub1.2")) {
      return "Apakah yang membuatkan Kesultanan Melayu Melaka diiktiraf sebagai model negara bangsa yang unggul?";
    } else {
      return "Apakah persoalan utama yang menarik perhatian awak dalam subtopik ini?";
    }
  };