"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase"; 
import { signInWithEmailAndPassword, signOut } from "firebase/auth"; // 🌟 Tambah signOut
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";

export default function LogMasuk() {
  const router = useRouter();
  
  const [idPengguna, setIdPengguna] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [ralat, setRalat] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🌟 KESELAMATAN 1: Kosongkan sisa login lama setiap kali halaman ini dibuka
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

    // 🌟 KESELAMATAN 2: Pastikan input tidak kosong dan tiada 'space' berlebihan
    if (!idPengguna.trim() || !kataLaluan.trim()) {
      setRalat("Sila masukkan ID Pengguna dan Kata Laluan yang sah.");
      setLoading(false);
      return;
    }

    try {
      const userId = idPengguna.toUpperCase().trim();
      const formatEmail = `${userId.toLowerCase()}@irags.edu`;

      // Log masuk menggunakan Firebase Authentication
      await signInWithEmailAndPassword(auth, formatEmail, kataLaluan);
      
      // Tarik peranan (role) dari Firestore Database
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        localStorage.setItem("currentUser", JSON.stringify({
          id: userId,
          nama: userData.nama,
          tingkatan: userData.tingkatan,
          kumpulan: userData.kumpulan,
          role: userData.role
        }));

        if (userData.role === "murid") {
          router.push("/murid"); 
        } else {
          router.push("/guru");  
        }
        
      } else {
        // 🌟 KESELAMATAN 3: Jika Firebase benarkan, tapi Firestore tiada data (Data Hantu)
        await signOut(auth);
        localStorage.removeItem("currentUser");
        setRalat("Akaun anda tiada dalam pangkalan data rasmi. Sila rujuk guru.");
      }
      
    } catch (error: any) {
      console.error("Ralat Log Masuk:", error);
      
      // 🌟 KESELAMATAN 4: Bersihkan sesi jika ralat
      await signOut(auth).catch(() => {});
      localStorage.removeItem("currentUser");

      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setRalat("ID Pengguna atau Kata Laluan salah. Sila cuba lagi.");
      } else if (error.code === 'auth/invalid-email') {
        setRalat("Format ID Pengguna tidak sah.");
      } else {
        setRalat("Berlaku ralat sistem. Sila pastikan maklumat anda betul.");
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        
        {/* Latar belakang abstrak */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        
        {/* Logo / Tajuk Sistem */}
        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white text-3xl font-black">H</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">HUB I-RAGS</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Sila log masuk untuk mengakses portal.</p>
        </div>

        {/* Borang Log Masuk */}
        <form onSubmit={handleLogin} className="space-y-5 relative z-10">
          
          {/* Paparan Ralat */}
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
              placeholder="Contoh: M4001 atau G001"
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
            className={`w-full text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-95 mt-2 ${
              loading ? "bg-blue-400 cursor-not-allowed shadow-none" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-600/40"
            }`}
          >
            {loading ? "Mengesahkan..." : "Log Masuk"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          <p>&copy; {new Date().getFullYear()} Kajian PhD Sistem HUB I-RAGS.</p>
        </div>
      </div>
    </div>
  );
}