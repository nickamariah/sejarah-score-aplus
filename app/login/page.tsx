"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase"; 
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LogMasuk() {
  const router = useRouter();
  
  const [idPengguna, setIdPengguna] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [ralat, setRalat] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Kosongkan sesi lama setiap kali buka halaman ini
  useEffect(() => {
    const clearOldSessions = async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.log("Ralat signout:", e);
      }
      localStorage.removeItem("currentUser");
      localStorage.removeItem("completedModules");
    };
    clearOldSessions();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRalat("");

    // Pembersihan Data: Buang jarak (space) yang tidak sengaja ditaip
    const rawId = idPengguna.replace(/\s+/g, '');

    if (!rawId || !kataLaluan.trim()) {
      setRalat("Sila masukkan ID Pengguna dan Kata Laluan yang sah.");
      setLoading(false);
      return;
    }

    try {
      const isEmail = rawId.includes("@");
      const formatEmail = isEmail ? rawId.toLowerCase() : `${rawId.toLowerCase()}@irags.edu`;

      let docId = rawId.toUpperCase();
      if (isEmail) {
         docId = rawId.split("@")[0].toUpperCase();
      }

      // 🌟 PERUBAHAN: Tarik data dari Firestore DAHULU (Bypass Auth check)
      const docRef = doc(db, "users", docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // 🌟 SEMAKAN KATA LALUAN DARI DATABASE (FIRESTORE)
        if (userData.kataLaluan === kataLaluan) {
          
          // Cuba log masuk ke Firebase Auth secara senyap
          // Jika gagal (sebab password Auth masih password lama), kita ABAIKAN dan teruskan login!
          try {
            await signInWithEmailAndPassword(auth, formatEmail, kataLaluan);
          } catch (err) {
            console.log("Bypass Firebase Auth: Login diteruskan menggunakan pengesahan Database.");
          }

          // Simpan dalam Local Storage
          localStorage.setItem("currentUser", JSON.stringify({
            id: docId,
            idPengguna: userData.idPengguna || docId,
            nama: userData.nama || userData.name,
            tingkatan: userData.tingkatan,
            kumpulan: userData.kumpulan,
            sekolah: userData.sekolah,
            role: userData.role // "admin", "guru", "pembantu", atau "murid"
          }));

          // HALA TUJU PINTAR (SMART ROUTING)
          if (userData.role === "murid") {
            router.push("/murid"); 
          } else {
            router.push("/guru");  // Bawa admin, guru, pembantu ke dashboard
          }
          
        } else {
          setRalat("Kata Laluan salah. Sila cuba lagi.");
        }
      } else {
        await signOut(auth).catch(() => {});
        localStorage.removeItem("currentUser");
        setRalat("Akaun anda tiada dalam pangkalan data rasmi. Sila rujuk guru.");
      }
      
    } catch (error: any) {
      console.error("Ralat Log Masuk:", error);
      await signOut(auth).catch(() => {});
      localStorage.removeItem("currentUser");

      if (error.code === 'permission-denied') {
        setRalat("Ralat Akses Pangkalan Data. Sila maklumkan kepada Pembangun (Firestore Rules).");
      } else {
        setRalat("Berlaku ralat sistem. Sila pastikan maklumat anda betul.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white text-3xl font-black">H</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HUB I-RAGS</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Sila log masuk untuk mengakses portal.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          
          {ralat && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center border border-red-100 font-medium">
              {ralat}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              ID Pengguna
            </label>
            <input
              type="text"
              value={idPengguna}
              onChange={(e) => setIdPengguna(e.target.value)}
              required
              placeholder=""
              className="w-full border-2 border-slate-200 rounded-xl p-3 focus:ring-0 focus:border-blue-500 outline-none transition font-medium bg-slate-50 focus:bg-white uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">
              Kata Laluan
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={kataLaluan}
                onChange={(e) => setKataLaluan(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border-2 border-slate-200 rounded-xl p-3 pr-10 focus:ring-0 focus:border-blue-500 outline-none transition font-medium bg-slate-50 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 mt-2 flex items-center justify-center gap-2 ${
              loading ? "bg-blue-400 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-600/40"
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {loading ? "Mengesahkan..." : "Log Masuk"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          <p>&copy; {new Date().getFullYear()} Hak Cipta Terpelihara</p>
        </div>
      </div>
    </div>
  );
}