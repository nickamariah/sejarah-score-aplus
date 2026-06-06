import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getAuth } from "firebase/auth"; // <-- Diperlukan untuk sistem Log Masuk
import { getAnalytics, isSupported } from "firebase/analytics";

// KOD KEBAL: Kita gabungkan Environment Variables (Vercel) & Kod Asal awak
// Jika Vercel gagal baca .env, sistem akan automatik guna kunci asal awak ini.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC8Vl2AYxgO9xRBtDSVuw53WqC1XWs_jck",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "hub-i-rags.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "hub-i-rags",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "hub-i-rags.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "565322316779",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:565322316779:web:2814ea2d8a25918d7f37ae",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 1. Hidupkan Enjin Utama Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Hidupkan Enjin untuk Projek (Database, Storage, Auth)
const db = getFirestore(app);
const storage = getStorage(app); 
const auth = getAuth(app);

// 3. Hidupkan Analitik (Untuk data kajian PhD)
let analytics: any;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// 4. EXPORT SEMUA - Mengikut cara asal awak!
export { app, db, storage, auth, analytics };