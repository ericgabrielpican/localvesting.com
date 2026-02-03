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
  signInWithRedirect,
  getRedirectResult,
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
 * Visible error reporting (so "nothing happens" never occurs again)
 */
function raiseAuthError(where: string, e: any): never {
  const code = e?.code || e?.message || String(e);
  console.error(`[AUTH] ${where}:`, e);

  // Show a dev-visible message on web
  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-alert
    alert(`[AUTH] ${where}: ${code}`);
  }

  // Re-throw so callers can handle it too
  throw e;
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
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (e) {
    raiseAuthError("loginWithEmailPassword", e);
  }
}

/**
 * Email / password sign up + verification email
 * - keeps user logged in
 * - verification link returns to /mybusinesses
 */
export async function registerWithEmailPassword(email: string, password: string): Promise<User> {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    const baseUrl = getAppBaseUrl();
    await sendEmailVerification(res.user, {
      url: `${baseUrl}/mybusinesses`,
      handleCodeInApp: false,
    });

    return res.user;
  } catch (e) {
    raiseAuthError("registerWithEmailPassword", e);
  }
}

/**
 * Send reset password email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (e) {
    raiseAuthError("resetPassword", e);
  }
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    raiseAuthError("logout", e);
  }
}

/**
 * GOOGLE LOGIN (WEB)
 * - First tries popup
 * - If popup is blocked/closed, falls back to redirect
 *
 * IMPORTANT:
 * - If redirect is used, you must call `consumeGoogleRedirectResult()` once
 *   on app start (e.g., in AuthContext useEffect).
 */
export async function loginWithGoogleWeb(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (e: any) {
    // Popup blocked/closed → use redirect flow (more reliable on many browsers)
    if (e?.code === "auth/popup-blocked" || e?.code === "auth/popup-closed-by-user") {
      try {
        await signInWithRedirect(auth, provider);
        // Control returns after redirect; user will be obtained via getRedirectResult
        throw new Error("Redirecting to Google sign-in...");
      } catch (e2) {
        raiseAuthError("loginWithGoogleWeb redirect", e2);
      }
    }
    raiseAuthError("loginWithGoogleWeb popup", e);
  }
}

/**
 * Call this ONCE during app startup (web only),
 * so redirect-based Google login completes.
 */
export async function consumeGoogleRedirectResult(): Promise<User | null> {
  if (Platform.OS !== "web") return null;

  try {
    const res = await getRedirectResult(auth);
    return res?.user ?? null;
  } catch (e) {
    raiseAuthError("consumeGoogleRedirectResult", e);
  }
}

/**
 * GOOGLE LOGIN (NATIVE)
 */
export async function loginWithGoogleIdToken(idToken: string): Promise<User> {
  try {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (e) {
    raiseAuthError("loginWithGoogleIdToken", e);
  }
}

/**
 * Reload user and check if email is verified
 */
export async function isEmailVerified(): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    await user.reload();
    return user.emailVerified === true;
  } catch (e) {
    raiseAuthError("isEmailVerified", e);
  }
}

/**
 * Resend verification email (keeps user logged in)
 */
export async function resendEmailVerification(): Promise<void> {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No authenticated user");

    const baseUrl = getAppBaseUrl();
    await sendEmailVerification(user, {
      url: `${baseUrl}/mybusinesses`,
      handleCodeInApp: false,
    });
  } catch (e) {
    raiseAuthError("resendEmailVerification", e);
  }
}
