"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

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
    const userRef = doc(db, "users", idMurid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      setError("ID tidak dijumpai");
      return;
    }

    const user = userSnap.data();

    if (user["Kata Laluan"] !== kataLaluan) {
      setError("Kata laluan salah");
      return;
    }

    localStorage.setItem(
      "currentUser",
      JSON.stringify(user)
    );

    if (user.role === "guru") {
      router.push("/guru");
    } else {
      router.push("/murid");
    }

  } catch (err: any) {
    setError("Ralat sambungan");
    console.log(err);

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
              HUB I-RAGS AI-Powered Adaptive History Learning System
            </h1>
            <p className="mt-3 text-sm text-sky-600">Hab Inkuiri Adaptif Berasaskan Retrieval-Augmented Generation dan Sokongan Berperingkat</p>
          </div>

          <div className="w-full md:w-1/2">
            <div className="rounded-xl p-6" style={{ background: "#f8fbff" }}>
              <form onSubmit={handleLogin}>
                <label className="block text-sm font-medium text-sky-800">ID Pengguna</label>
                <input
                  value={idMurid}
                  onChange={(e) => setIdMurid(e.target.value)}
                  placeholder="Masukkan ID Murid"
                  className="mt-2 mb-4 w-full px-4 py-3 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />

                <label className="block text-sm font-medium text-sky-800">Kata Laluan</label>
                <input
                  value={kataLaluan}
                  onChange={(e) => setKataLaluan(e.target.value)}
                  type="password"
                  placeholder="Kata Laluan"
                  className="mt-2 mb-6 w-full px-4 py-3 rounded-lg border border-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center px-6 py-3 rounded-lg text-white font-semibold"
                  style={{ background: "linear-gradient(90deg,#ffd24d 0%, #ffbf00 100%)" }}
                >
                  {loading ? "Sedang log masuk..." : "Log Masuk"}
                </button>
              </form>

              {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

              <p className="mt-3 text-xs text-sky-600">Atau hubungi guru jika anda terlupa ID atau kata laluan.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
