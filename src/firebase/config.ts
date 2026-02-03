// src/firebase/config.ts
import Constants from "expo-constants";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

type Extra = Record<string, any>;

function getExtra(): Extra {
  // Works across SDK versions
  return (
    (Constants.expoConfig?.extra as Extra) ||
    ((Constants as any).manifest?.extra as Extra) ||
    ((Constants as any).manifest2?.extra?.extra as Extra) ||
    {}
  );
}

function env(key: string): string | undefined {
  const extra = getExtra();
  return (
    // Prefer app.config.js injected values
    extra?.[key] ??
    // Fallbacks if needed
    process.env[`EXPO_PUBLIC_${key}`] ??
    process.env[key]
  );
}

const firebaseConfig = {
  apiKey: env("FIREBASE_API_KEY")!,
  authDomain: env("FIREBASE_AUTH_DOMAIN")!,
  projectId: env("FIREBASE_PROJECT_ID")!,
  storageBucket: env("FIREBASE_STORAGE_BUCKET")!,
  messagingSenderId: env("FIREBASE_MESSAGING_SENDER_ID")!,
  appId: env("FIREBASE_APP_ID")!,
};

// Avoid double-init during fast refresh
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Region (defaults to us-central1)
const region = env("FIREBASE_FUNCTIONS_REGION") || "us-central1";
export const functions = getFunctions(app, region);

// Emulators toggle
const USE_EMULATORS = String(env("USE_EMULATORS") ?? "false").toLowerCase() === "true";
const EMU_HOST = env("EMULATOR_HOST") || "127.0.0.1";

if (USE_EMULATORS) {
  connectFirestoreEmulator(db, EMU_HOST, 8080);
  connectFunctionsEmulator(functions, EMU_HOST, 5001);
  connectStorageEmulator(storage, EMU_HOST, 9199);
  console.log("✅ Using Firebase emulators");
} else {
  console.log("✅ Using Firebase production services");
}

// OPTIONAL TEMP DEBUG (remove after fix)
// console.log("FB key prefix:", firebaseConfig.apiKey?.slice(0, 4), "len=", firebaseConfig.apiKey?.length);
