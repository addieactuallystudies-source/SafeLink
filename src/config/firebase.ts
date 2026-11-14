
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrkPmr53vuA5Y5yUr84QE8UnW8lRltzHU",
  authDomain: "safelink-f3676.firebaseapp.com",
  projectId: "safelink-f3676",
  storageBucket: "safelink-f3676.firebasestorage.app",
  messagingSenderId: "848663601223",
  appId: "1:848663601223:web:a8fde8ede9d76d3b5b5162",
};

const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
