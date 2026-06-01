import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; 
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8Vl2AYxgO9xRBtDSVuw53WqC1XWs_jck",
  authDomain: "hub-i-rags.firebaseapp.com",
  projectId: "hub-i-rags",
  storageBucket: "hub-i-rags.firebasestorage.app",
  messagingSenderId: "565322316779",
  appId: "1:565322316779:web:2814ea2d8a25918d7f37ae"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// 2. PASTIKAN BARIS INI ADA
const storage = getStorage(app); 

// 3. PASTIKAN 'storage' DITULIS DI DALAM KURUNGAN EXPORT INI
export { db, storage };