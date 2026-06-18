"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { db, auth } from "@/lib/firebase"; 
import { onAuthStateChanged, signOut } from "firebase/auth";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";

export default function PengurusanPengguna() {
  const router = useRouter();
  
  // State Autentikasi
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // State untuk senarai pengguna
  const [senaraiPengguna, setSenaraiPengguna] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk form
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Data Pengguna (Jadual 'users')
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kataLaluan, setKataLaluan] = useState("");
  const [role, setRole] = useState("murid"); // Default role
  const [tingkatan, setTingkatan] = useState("");
  const [kelas, setKelas] = useState("");
  const [tahapInkuiri, setTahapInkuiri] = useState("Rendah");

  // Rujuk kepada jadual 'users'
  const usersCollectionRef = collection(db, "users");

  // ==========================================
  // 1. SEMAK AUTENTIKASI
  // ==========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthorized(true);
        setCheckingAuth(false);
        dapatkanSenaraiPengguna(); 
      } else {
        router.push("/login"); 
      }
    });
    return () => unsubscribe();
  }, [router]);

  // ==========================================
  // 2. FUNGSI CRUD
  // ==========================================
  const dapatkanSenaraiPengguna = async () => {
    setLoading(true);
    try {
      const data = await getDocs(usersCollectionRef);
      const penggunaDisaring = data.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSenaraiPengguna(penggunaDisaring);
    } catch (error) {
      console.error("Ralat mengambil data:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Sediakan payload (data yang nak disimpan)
      const userData = {
        nama,
        email,
        kataLaluan,
        role,
        // Hanya simpan data sekolah jika role adalah murid
        ...(role === "murid" && { tingkatan, kelas, tahapInkuiri }),
      };

      if (isEditing) {
        const userDoc = doc(db, "users", editId);
        await updateDoc(userDoc, userData);
        setIsEditing(false);
        setEditId(null);
      } else {
        await addDoc(usersCollectionRef, {
          ...userData,
          tarikhDaftar: new Date().toISOString(),
        });
      }
      resetForm();
      dapatkanSenaraiPengguna();
    } catch (error) {
      console.error("Ralat menyimpan data:", error);
    }
  };

  const padamPengguna = async (id) => {
    const sahkan = window.confirm("Adakah anda pasti mahu memadam rekod ini?");
    if (sahkan) {
      try {
        const userDoc = doc(db, "users", id);
        await deleteDoc(userDoc);
        dapatkanSenaraiPengguna();
      } catch (error) {
        console.error("Ralat memadam data:", error);
      }
    }
  };

  const editPengguna = (user) => {
    setIsEditing(true);
    setEditId(user.id);
    setNama(user.nama || ""); 
    setEmail(user.email || "");
    setKataLaluan(user.kataLaluan || "");
    setRole(user.role || "murid");
    setTingkatan(user.tingkatan || "");
    setKelas(user.kelas || ""); 
    setTahapInkuiri(user.tahapInkuiri || "Rendah");
  };

  const resetForm = () => {
    setNama(""); setEmail(""); setKataLaluan(""); setRole("murid");
    setTingkatan(""); setKelas(""); setTahapInkuiri("Rendah");
    setIsEditing(false); setEditId(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Ralat log keluar:", error);
    }
  };

  // ==========================================
  // PAPARAN (UI)
  // ==========================================
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-600">Mengesahkan akses...</p>
        </div>
      </div>
    );
  }

  if (isAuthorized) {
    return (
      // Tambah min-h-screen & bg-gray-50 supaya background sync dan penuh
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                Pengurusan Pengguna (I-RAGS)
              </h1>
              <p className="text-gray-500 mt-1">Urus data Admin, Guru, dan Murid dalam satu pangkalan data.</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-5 py-2.5 rounded-lg border border-red-200 transition"
            >
              Log Keluar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* KOTAK KIRI: BORANG TAMBAH / EDIT */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-1 h-fit">
              <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
                {isEditing ? "Kemas Kini Akaun" : "Daftar Akaun Baru"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* PILIHAN ROLE (Sangat Penting) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Peranan (Role)</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="murid">Murid</option>
                    <option value="guru">Guru</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* MAKLUMAT ASAS */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Penuh</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    placeholder="Contoh: Ahmad Albab"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">E-mel</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ahmad@sekolah.edu.my"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kata Laluan</label>
                  <input
                    type="text" // Boleh tukar type="password" kalau tak nak tunjuk
                    value={kataLaluan}
                    onChange={(e) => setKataLaluan(e.target.value)}
                    required
                    placeholder="Cipta kata laluan sementara"
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>

                {/* MAKLUMAT KHAS UNTUK MURID SAHAJA */}
                {role === "murid" && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">Maklumat Akademik (Murid)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tingkatan</label>
                        <select
                          value={tingkatan}
                          onChange={(e) => setTingkatan(e.target.value)}
                          required={role === "murid"}
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Pilih</option>
                          <option value="Tingkatan 1">Tingkatan 1</option>
                          <option value="Tingkatan 2">Tingkatan 2</option>
                          <option value="Tingkatan 3">Tingkatan 3</option>
                          <option value="Tingkatan 4">Tingkatan 4</option>
                          <option value="Tingkatan 5">Tingkatan 5</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Kelas</label>
                        <input
                          type="text"
                          value={kelas}
                          onChange={(e) => setKelas(e.target.value)}
                          required={role === "murid"}
                          placeholder="Cth: 4 Sains"
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Tahap Inkuiri Awal</label>
                      <select
                        value={tahapInkuiri}
                        onChange={(e) => setTahapInkuiri(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="Rendah">Rendah</option>
                        <option value="Sederhana">Sederhana</option>
                        <option value="Tinggi">Tinggi</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* BUTANG SUBMIT */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition shadow-md"
                  >
                    {isEditing ? "Simpan Perubahan" : "Daftar Akaun"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-300 transition"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* KOTAK KANAN: JADUAL SENARAI PENGGUNA */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 lg:col-span-2">
              <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Senarai Pengguna Sistem</h2>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-500">Memuatkan pangkalan data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full text-left text-sm whitespace-nowrap">
                    <thead className="uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-5 py-4 text-gray-600 font-bold">Maklumat Pengguna</th>
                        <th className="px-5 py-4 text-gray-600 font-bold">Peranan (Role)</th>
                        <th className="px-5 py-4 text-gray-600 font-bold">Tingkatan / Kelas</th>
                        <th className="px-5 py-4 text-gray-600 font-bold text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {senaraiPengguna.length > 0 ? (
                        senaraiPengguna.map((user) => (
                          <tr key={user.id} className="hover:bg-blue-50/50 transition">
                            <td className="px-5 py-4">
                              <div className="font-bold text-gray-800">{user.nama}</div>
                              <div className="text-gray-500 text-xs mt-0.5">{user.email}</div>
                              <div className="text-gray-400 text-xs mt-0.5">Pass: {user.kataLaluan}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                  user.role === 'guru' ? 'bg-indigo-100 text-indigo-700' : 
                                  'bg-blue-100 text-blue-700'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-700">
                              {user.role === "murid" ? (
                                <div>
                                  <span className="block font-medium">{user.tingkatan}</span>
                                  <span className="block text-xs text-gray-500">{user.kelas}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs italic">- Tidak Berkaitan -</span>
                              )}
                            </td>
                            <td className="px-5 py-4 flex justify-center items-center gap-2 mt-2">
                              <button
                                onClick={() => editPengguna(user)}
                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-semibold px-3 py-1.5 rounded-md text-xs transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => padamPengguna(user.id)}
                                className="bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-3 py-1.5 rounded-md text-xs transition"
                              >
                                Padam
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-12 text-gray-500 bg-gray-50/50">
                            Tiada rekod pengguna dijumpai dalam pangkalan data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}