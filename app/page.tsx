"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// KITA IMPORT FIREBASE DI SINI
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // Pastikan laluan ke fail firebase.ts Dr. Nic betul

export default function Home() {
  const [idMurid, setIdMurid] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const inputId = idMurid.trim().toUpperCase();
      const inputPass = kataLaluan.trim();

      // 1. MENCARI PENGGUNA DI FIREBASE (Koleksi 'users')
      let userData = null;

      // Cuba cari menggunakan inputId sebagai Document ID (Contoh: Doc ID "M002")
      const userDocRef = doc(db, "users", inputId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        userData = { id: userDocSnap.id, ...userDocSnap.data() };
      } else {
        // Jika tak jumpa Doc ID, cuba cari dalam field "id"
        const q = query(collection(db, "users"), where("id", "==", inputId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          userData = { id: docSnap.id, ...docSnap.data() };
        }
      }

      // Jika langsung tak jumpa ID dalam database Firebase
      if (!userData) {
        setError("Ralat: ID Pengguna tidak dijumpai dalam pangkalan data Firebase.");
        setLoading(false);
        return;
      }

      // 2. SEMAK KATA LALUAN
      // (Sistem pandai baca field 'password' atau 'kataLaluan')
      const dbPassword = userData.password || userData.kataLaluan || userData.Password;

      if (dbPassword?.toString() === inputPass) {
        // Berjaya Login! Sediakan data untuk dihantar ke Dashboard
        const userToSave = {
          id: userData.id,
          name: userData.nama || userData.name || "Pelajar",
          tingkatan: userData.tingkatan?.toString() || "4",
          kelas: userData.kelas || "",
          role: userData.role || "murid"
        };

        // Simpan memori login di Browser
        localStorage.setItem("currentUser", JSON.stringify(userToSave));

        // Bawa murid ke Dashboard yang betul
        if (userToSave.role === "guru" || userToSave.role === "admin") {
          router.push("/guru");
        } else {
          router.push("/murid");
        }
      } else {
        setError("Ralat: Kata laluan salah.");
      }

    } catch (err: any) {
      console.error("Ralat Login Firebase:", err);
      setError("Ralat sistem: Sila semak sambungan internet atau kod Firebase.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(180deg,#dff6ff 0%, #eef9ff 100%)" }}
    >
      <div className="w-full max-w-2xl px-6 py-12 rounded-2xl shadow-xl" style={{ background: "white" }}>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight text-sky-700">
              SEJARAH SCORE A+ SMART LEARNING
            </h1>
            <p className="mt-3 text-sm text-sky-600">Pembelajaran pintar untuk murid cemerlang.</p>
          </div>

          <div className="w-full md:w-1/2">
            <div className="rounded-xl p-6" style={{ background: "#f8fbff" }}>
              <form onSubmit={handleLogin}>
                <label className="block text-sm font-medium text-sky-800">ID Pengguna</label>
                <input
                  value={idMurid}
                  onChange={(e) => setIdMurid(e.target.value)}
                  placeholder="Contoh: M001"
                  className="mt-2 mb-4 w-full px-4 py-3 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />

                <label className="block text-sm font-medium text-sky-800">Kata Laluan</label>
                <input
                  value={kataLaluan}
                  onChange={(e) => setKataLaluan(e.target.value)}
                  type="password"
                  placeholder="••••••"
                  className="mt-2 mb-6 w-full px-4 py-3 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold"
                  style={{ background: "linear-gradient(90deg,#ffd24d 0%, #ffbf00 100%)" }}
                >
                  {loading ? "Menyemak Firebase..." : "Log Masuk"}
                </button>
              </form>

              {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

              <p className="mt-4 text-xs text-sky-600">Atau hubungi guru jika anda terlupa ID atau kata laluan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}