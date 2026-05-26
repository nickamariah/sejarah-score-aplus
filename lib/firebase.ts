import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC8Vl2AYxgO9xRBtDSVuw53WqC1XWs_jck",
  authDomain: "hub-i-rags.firebaseapp.com",
  projectId: "hub-i-rags",
  storageBucket: "hub-i-rags.firebasestorage.app",
  messagingSenderId: "565322316779",
  appId: "1:565322316779:web:2814ea2d8a25918d7f37ae"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);