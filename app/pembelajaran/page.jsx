"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 
import { db } from "@/lib/firebase"; 
import { collection, doc, setDoc, getDoc, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

// ==========================================
// KOMPONEN UTAMA (CHAT & PDF)
// ==========================================
function KomponenPembelajaran() {
  const searchParams = useSearchParams();
  const babDariURL = searchParams.get("bab") || "tingkatan4_bab1"; // Ambil bab dari pautan URL

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const studentId = "murid_003"; 
  const chapterId = babDariURL; 
  const sessionId = `${studentId}_${chapterId}`;

  // Nama fail PDF akan mengikut URL
  const pdfUrl = `/${chapterId}.pdf`; 

  const messagesEndRef = useRef(null);

  // Auto-scroll ke mesej terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fungsi Cantikkan Tajuk (Cth: tingkatan4_bab1 -> Tingkatan 4 Bab 1)
  const formatTajuk = (id) => {
    return id.replace('tingkatan', 'Tingkatan ').replace('_bab', ' Bab ');
  };

  // Pengawal supaya sapaan tak dihantar dua kali
  const isInitializing = useRef(false);

  // Firebase: Load Sejarah Chat
  useEffect(() => {
    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    const inisialisasiSesi = async () => {
      // Jika dah pernah inisialisasi, jangan buat lagi
      if (isInitializing.current) return; 
      isInitializing.current = true;

      const docSnap = await getDoc(sessionDocRef);
      if (!docSnap.exists()) {
        await setDoc(sessionDocRef, {
          studentId: studentId,
          chapterId: chapterId,
          status: "in_progress",
          mistakesCount: 0,
          startedAt: serverTimestamp(),
        });

        // AI Mulakan Chat (Hanya sekali!)
        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: `Hai! Saya I-RAGs 🤖. Jom kita uji kefahaman untuk ${formatTajuk(chapterId).toUpperCase()}. Boleh kongsikan apa yang awak faham setakat ini?`,
          timestamp: serverTimestamp()
        });
      }
    };

    inisialisasiSesi();

    // Dengar chat dari Firebase secara real-time
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

  // Fungsi Hantar Mesej
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const teksMurid = input;
    setInput("");
    setIsLoading(true);

    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    try {
      // Simpan chat murid
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: teksMurid,
        timestamp: serverTimestamp()
      });

      // Panggil API OpenAI
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          chapterId, 
          text: teksMurid,
          previousMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json();

      if (data.reply) {
        // Simpan balasan I-RAGs
        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: data.reply,
          timestamp: serverTimestamp(),
          isHint: true 
        });
      }

    } catch (error) {
      console.error("Ralat menghantar mesej:", error);
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
          <iframe
            src={`${pdfUrl}#toolbar=1&view=FitH`} 
            className="w-full h-full z-10 relative bg-white"
            title="PDF Viewer"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 z-0 bg-gray-100">
            <span className="text-4xl mb-3 animate-pulse">📄</span>
            <span className="text-lg">Sistem sedang mencari fail: <b>{pdfUrl}</b></span>
          </div>
        </div>
      </div>

      {/* BAHAGIAN KANAN: CHATBOT */}
      <div className="w-[40%] h-full bg-white shadow-2xl flex flex-col border-l-4 border-blue-500">
        <div className="bg-blue-600 text-white p-5 flex items-center gap-4 shadow-md z-10">
          <div className="text-5xl bg-white rounded-full p-2 shadow-sm">🤖</div>
          <div>
            <h2 className="font-extrabold text-2xl tracking-wide">I-RAGs Tutor</h2>
            <p className="text-blue-100 text-base font-medium">Pembimbing Sejarah Anda</p>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-5 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* UI BUIH CHAT YANG DIBESARKAN */}
              <div className={`p-5 rounded-3xl max-w-[85%] text-xl font-medium leading-relaxed shadow-md ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 border-2 border-blue-200 rounded-bl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-5">
              <div className="p-5 bg-white border-2 border-blue-200 rounded-3xl rounded-bl-none shadow-md flex items-center gap-3">
                <span className="animate-bounce text-2xl">💭</span>
                <span className="text-gray-500 text-lg italic font-medium">I-RAGs sedang berfikir...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* UI BUTANG PANTAS (HINT) YANG DIBESARKAN */}
        {!isLoading && (
          <div className="flex flex-wrap gap-3 px-5 py-3 bg-gray-50 border-t-2 border-gray-200">
            <button onClick={() => sendQuickPrompt("Saya tak tahu jawapannya.")} className="bg-orange-100 text-orange-700 text-base font-bold px-5 py-3 rounded-full hover:bg-orange-200 shadow-sm transition-all hover:scale-105">
              🤷‍♂️ Saya tak tahu
            </button>
            <button onClick={() => sendQuickPrompt("Boleh bagi petunjuk (hint)?")} className="bg-green-100 text-green-700 text-base font-bold px-5 py-3 rounded-full hover:bg-green-200 shadow-sm transition-all hover:scale-105">
              💡 Beri saya hint
            </button>
          </div>
        )}

        {/* UI RUANG MENAIP YANG DIBESARKAN */}
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
      </div>
    </div>
  );
}

// ==========================================
// FUNGSI UTAMA (Diperlukan oleh Next.js)
// ==========================================
export default function SplitScreenLearning() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-2xl font-bold text-blue-600 animate-pulse">Sistem I-RAGs sedang dimuatkan...</div>}>
      <KomponenPembelajaran />
    </Suspense>
  );
}