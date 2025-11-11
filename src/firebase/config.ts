// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
 apiKey: "AIzaSyDiJHWYUA5N767cXx5U992p4Zl4n0pbDNo",
  authDomain: "localvesting.firebaseapp.com",
  projectId: "localvesting",
  storageBucket: "localvesting.firebasestorage.app",
  messagingSenderId: "236840190653",
  appId: "1:236840190653:web:5901c842a3fd1545486dd4",
  measurementId: "G-H95C6KW2SL"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
