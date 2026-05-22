"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzeGCohq7mGAcQ7igJryYX7Nba3SkZPLDluj44K-Cps1CwWuOEpNdxAGkL4RwBc1nfjLQ/exec",
        {
          method: "POST",
          body: JSON.stringify({ action: "LOGIN", id: idMurid, password: kataLaluan }),
        }
      );

      const textResult = await response.text();
      const result = JSON.parse(textResult);

      if (result.success) {
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        if (result.user.role === "guru") {
          window.location.href = "/guru";
        } else {
          window.location.href = "/murid";
        }
      } else {
        setError(result.error || "ID atau kata laluan salah");
      }
    } catch (err: any) {
      setError("Ralat: " + (err?.message || "sila cuba lagi"));
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
                <label className="block text-sm font-medium text-sky-800">ID Murid</label>
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
