// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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
// export const functions = getFunctions(app);

// ✅ Pin region to where your function is deployed (your deploy log shows us-central1)
export const functions = getFunctions(app, "us-central1");

// ------------------------------------------------------------
// Emulator wiring (ONLY when you want local testing)
// ------------------------------------------------------------
// Turn emulators on/off via an env var:
// EXPO_PUBLIC_USE_EMULATORS=true
const USE_EMULATORS =
  String(process.env.EXPO_PUBLIC_USE_EMULATORS).toLowerCase() === "true";

if (USE_EMULATORS) {
  // Firestore emulator default: 8080
  connectFirestoreEmulator(db, "localhost", 8080);

  // Functions emulator default: 5001
  connectFunctionsEmulator(functions, "localhost", 5001);

  // Storage emulator default: 9199 (optional)
  connectStorageEmulator(storage, "localhost", 9199);

  console.log("✅ Using Firebase emulators");
} else {
  console.log("✅ Using Firebase production services");
}