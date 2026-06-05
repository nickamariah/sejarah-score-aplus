"use client";

import { useState, useRef, useEffect } from "react";
// IMPORT FUNGSI FIREBASE
import { db } from "@/lib/firebase"; // Tukar path ini mengikut lokasi fail firebase.js anda
import { 
  collection, doc, setDoc, getDoc, addDoc, 
  query, orderBy, onSnapshot, serverTimestamp 
} from "firebase/firestore";

export default function SplitScreenLearning() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Maklumat simulasi murid (Dalam sistem sebenar, ambil dari sistem Login)
  const studentId = "murid_001";
  const chapterId = "sains_bab_2";
  const sessionId = `${studentId}_${chapterId}`; // cth: murid_001_sains_bab_2

  const messagesEndRef = useRef(null);

  // Auto-scroll ke mesej terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================================
  // FUNGSI FIREBASE 1: LOAD SEJARAH PERBUALAN
  // ==========================================
  useEffect(() => {
    const sessionDocRef = doc(db, "chat_sessions", sessionId);
    const messagesCollectionRef = collection(sessionDocRef, "messages");

    const inisialisasiSesi = async () => {
      const docSnap = await getDoc(sessionDocRef);
      if (!docSnap.exists()) {
        // Jika murid belum pernah buka bab ini, cipta sesi baru
        await setDoc(sessionDocRef, {
          studentId: studentId,
          chapterId: chapterId,
          status: "in_progress",
          mistakesCount: 0,
          startedAt: serverTimestamp(),
        });

        // AI mulakan perbualan (Greeting)
        await addDoc(messagesCollectionRef, {
          role: "assistant",
          content: "Hai! Saya I-RAGs 🤖. Jom kita uji kefahaman awak berdasarkan nota di sebelah kiri. Boleh beritahu saya, apakah proses tumbuhan membuat makanan sendiri?",
          timestamp: serverTimestamp()
        });
      }
    };

    inisialisasiSesi();

    // Dengar (Listen) secara real-time jika ada mesej baharu dalam database
    const q = query(messagesCollectionRef, orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe(); // Tutup listener bila keluar halaman
  }, []);


  // ==========================================
  // FUNGSI FIREBASE 2: HANTAR & SIMPAN MESEJ
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
      // 1. Simpan mesej Murid ke Firestore
      await addDoc(messagesCollectionRef, {
        role: "user",
        content: teksMurid,
        timestamp: serverTimestamp()
      });

      // 2. Panggil API AI Sebenar (app/api/chat/route.js)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studentId, 
          chapterId, 
          text: teksMurid,
          // Boleh hantar 3-4 mesej terakhir supaya AI faham konteks perbualan
          previousMessages: messages.slice(-4).map(m => ({ role: m.role, content: m.content })) 
        })
      });
      
      const data = await response.json();

      if (data.reply) {
        // 3. Simpan balasan AI (I-RAGs) ke Firestore
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
      
      {/* KIRI: PDF VIEWER (60%) */}
      <div className="w-[60%] h-full p-4 flex flex-col">
        <div className="bg-white rounded-t-xl p-3 shadow-sm border-b-2 border-blue-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-700 flex items-center gap-2">📄 Nota Rujukan: Sains Bab 2</h2>
        </div>
        <div className="flex-1 bg-gray-200 rounded-b-xl shadow-inner overflow-hidden relative">
          <iframe src="/contoh-nota.pdf#toolbar=0" className="w-full h-full" title="PDF Viewer" />
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 -z-10 bg-gray-100">
            [Ruang Pemapar PDF]
          </div>
        </div>
      </div>

      {/* KANAN: CHATBOT I-RAGs (40%) */}
      <div className="w-[40%] h-full bg-white shadow-2xl flex flex-col border-l-4 border-blue-500">
        
        {/* Header */}
        <div className="bg-blue-600 text-white p-5 flex items-center gap-3 shadow-md z-10">
          <div className="text-4xl bg-white rounded-full p-1 shadow-sm">🤖</div>
          <div>
            <h2 className="font-extrabold text-xl">I-RAGs Tutor</h2>
            <p className="text-blue-100 text-sm">Pembimbing Maya Anda</p>
          </div>
        </div>

        {/* Ruang Chat */}
        <div className="flex-1 p-5 overflow-y-auto bg-[url('/bg-chat-pattern.png')] bg-blue-50/30">
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-4 rounded-2xl max-w-[85%] text-[15px] leading-relaxed shadow-sm ${
                msg.role === "user" ? "bg-blue-500 text-white rounded-br-none" : "bg-white text-gray-800 border-2 border-blue-100 rounded-bl-none"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="p-4 bg-white border-2 border-blue-100 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <span className="animate-bounce">💭</span>
                <span className="text-gray-500 text-sm italic">I-RAGs sedang menaip...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Butang Pantas */}
        {!isLoading && (
          <div className="flex flex-wrap gap-2 px-4 py-2 bg-gray-50 border-t">
            <button onClick={() => sendQuickPrompt("Saya tak tahu jawapannya.")} className="bg-orange-100 text-orange-700 text-xs px-3 py-1.5 rounded-full hover:bg-orange-200">🤷‍♂️ Saya tak tahu</button>
            <button onClick={() => sendQuickPrompt("Boleh bagi petunjuk (hint)?")} className="bg-green-100 text-green-700 text-xs px-3 py-1.5 rounded-full hover:bg-green-200">💡 Beri saya hint</button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t-2 border-gray-100 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Taip jawapan awak di sini..."
            className="flex-1 border-2 border-gray-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-blue-500"
            disabled={isLoading}
          />
          <button type="submit" className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-blue-700 hover:scale-105 disabled:opacity-50 shadow-md" disabled={isLoading || !input.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}