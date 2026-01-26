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
  sendEmailVerification,
} from "firebase/auth";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { auth } from "./config";

/**
 * Robust base URL resolver:
 * - Uses app.json -> expo.extra.APP_BASE_URL if available
 * - Falls back to window.location.origin on web (localhost or any domain)
 * - Final fallback to your current subdomain
 */
function getAppBaseUrl(): string {
  const extra =
    (Constants.expoConfig?.extra as any) ??
    ((Constants as any).manifest?.extra as any) ??
    ((Constants as any).manifest2?.extra?.extra as any);

  const fromExtra = extra?.APP_BASE_URL as string | undefined;

  if (fromExtra && typeof fromExtra === "string" && fromExtra.trim().length > 0) {
    return fromExtra.replace(/\/+$/, "");
  }

  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin.replace(/\/+$/, "");
  }

  return "https://demodev.localvesting.com";
}

/**
 * Subscribe to auth changes (used by AuthContext)
 */
export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Email / password login
 */
export async function loginWithEmailPassword(email: string, password: string): Promise<User> {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

/**
 * Email / password sign up + verification email
 * - keeps user logged in
 * - verification link returns to /mybusinesses
 */
export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  const res = await createUserWithEmailAndPassword(auth, email, password);

  const baseUrl = getAppBaseUrl();
  await sendEmailVerification(res.user, {
    url: `${baseUrl}/mybusinesses`,
    handleCodeInApp: false,
  });

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

/**
 * Reload user and check if email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  return user.emailVerified === true;
}

/**
 * Resend verification email (keeps user logged in)
 */
export async function resendEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");

  const baseUrl = getAppBaseUrl();
  await sendEmailVerification(user, {
    url: `${baseUrl}/mybusinesses`,
    handleCodeInApp: false,
  });
}
