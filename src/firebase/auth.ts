// src/firebase/auth.ts
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Subscribe to auth changes (used by AuthContext)
 */
export function subscribeToAuth(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Email / password login
 */
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

/**
 * Email / password sign up
 */
export async function registerWithEmailPassword(
  email: string,
  password: string
): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email, password);
  return res.user;
}

/**
 * Send reset password email
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * GOOGLE LOGIN (WEB)
 * Use this when Platform.OS === "web".
 */
export async function loginWithGoogleWeb(): Promise<User> {
  const provider = new GoogleAuthProvider();
  // Optional: force account selection each time
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(auth, provider);
  return result.user;
}

/**
 * GOOGLE LOGIN (NATIVE)
 * Use this when you already have an idToken from Expo Auth Session.
 */
export async function loginWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}
