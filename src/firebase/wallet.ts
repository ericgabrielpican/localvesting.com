// src/firebase/wallet.ts
import { db } from "./config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export type WalletDoc = {
  demoBalance: number;
  liveBalance: number;
  createdAt: any;
  updatedAt: any;
};

export const WALLET_DEFAULTS = {
  demoBalance: 3000,
  liveBalance: 0,
} as const;

export function walletDocRef(uid: string) {
  // users/{uid}/wallet/main
  return doc(db, "users", uid, "wallet", "main");
}

export async function ensureUserWallet(uid: string) {
  if (!uid) throw new Error("ensureUserWallet: uid missing");

  const ref = walletDocRef(uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial: WalletDoc = {
      demoBalance: WALLET_DEFAULTS.demoBalance,
      liveBalance: WALLET_DEFAULTS.liveBalance,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial, { merge: false });
  }
}
