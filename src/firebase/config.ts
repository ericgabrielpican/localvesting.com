// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const env = (key: string) =>
  process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`] ?? process.env[`EXPO_PUBLIC_${key}`];

const firebaseConfig = {
  apiKey: env("FIREBASE_API_KEY")!,
  authDomain: env("FIREBASE_AUTH_DOMAIN")!,
  projectId: env("FIREBASE_PROJECT_ID")!,
  storageBucket: env("FIREBASE_STORAGE_BUCKET")!,
  messagingSenderId: env("FIREBASE_MESSAGING_SENDER_ID")!,
  appId: env("FIREBASE_APP_ID")!,
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