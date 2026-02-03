// app/login.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  Pressable,
  Linking,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  resetPassword,
  loginWithGoogleWeb,
} from "../src/firebase/auth";

import { db, functions } from "../src/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import TurnstileWidget from "../src/components/capcha/TurnstileWidget.web";

// CLOUDFLARE TURNSTILE SITE KEY here (client-side)
const env = (key: string) =>
  process.env[key] ?? process.env[`NEXT_PUBLIC_${key}`] ?? process.env[`EXPO_PUBLIC_${key}`];
const TURNSTILE_SITE_KEY = env("TURNSTILE_SITE_KEY");

const VERIFY_FN_NAME = "verifyTurnstile";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { width } = useWindowDimensions();

  const initialMode: Mode = params?.mode === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 🔐 Turnstile token from widget (web)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // ✅ Legal acceptance (required ONLY for signup)
  const [readPrivacy, setReadPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const legalOk = useMemo(() => {
    if (mode === "login") return true;
    return readPrivacy && acceptedTerms;
  }, [mode, readPrivacy, acceptedTerms]);

  useEffect(() => {
    const next: Mode = params?.mode === "signup" ? "signup" : "login";
    setMode(next);
  }, [params?.mode]);

  useEffect(() => {
    if (mode === "login") {
      setReadPrivacy(false);
      setAcceptedTerms(false);
    }
  }, [mode]);

  const openLegalPage = (path: "/privacypolicy" | "/cookiepolicy" | "/terms") => {
    try {
      router.push(path as any);
    } catch {
      Linking.openURL(path);
    }
  };

  const requireLegal = () => {
    if (mode === "login") return true;
    if (!readPrivacy || !acceptedTerms) {
      Alert.alert(
        "Before you continue",
        "To create an account, please read and accept the Privacy/Cookie Policy and the Terms & Conditions."
      );
      return false;
    }
    return true;
  };

  const requireTurnstile = async () => {
    // Enforce only on web (where bots are your biggest problem)
    if (Platform.OS !== "web") return;

    if (!turnstileToken) {
      Alert.alert("Verification required", "Please complete the security check.");
      throw new Error("Turnstile token missing");
    }

    const verify = httpsCallable(functions, VERIFY_FN_NAME);
    const res: any = await verify({ token: turnstileToken });

    if (res?.data?.success === false) {
      throw new Error(res?.data?.message ?? "Turnstile verification failed");
    }
  };

  const handlePostLogin = async (user: any) => {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email: user.email ?? null,
        role: null,
        createdAt: serverTimestamp(),
      });
      router.replace("/onboarding/chooseRole" as any);
      return;
    }

    const data = snap.data() as any;
    const role = data?.role ?? null;

    if (!role) {
      router.replace("/onboarding/chooseRole" as any);
      return;
    }

    if (role === "admin") {
      router.replace("/admin" as any);
      return;
    }

    if (role === "business") {
      if (data.businessSetupComplete) router.replace("/dashboard" as any);
      else router.replace("/onboarding/businessSetup" as any);
      return;
    }

    if (role === "investor") {
      if (data.investorSetupComplete) router.replace("/browse" as any);
      else router.replace("/onboarding/investorSetup" as any);
      return;
    }

    router.replace("/onboarding/chooseRole" as any);
  };

  const handleSubmit = async () => {
    if (!requireLegal()) return;

    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);

      await requireTurnstile();

      let user;
      if (mode === "login") {
        user = await loginWithEmailPassword(email, password);
      } else {
        user = await registerWithEmailPassword(email, password);
        await setDoc(
          doc(db, "users", user.uid),
          { email, role: null, createdAt: serverTimestamp() },
          { merge: true }
        );
      }

      await handlePostLogin(user);

      // reset token after success
      setTurnstileToken(null);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Authentication error", e?.message ?? "Could not authenticate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Enter email", "Please enter your email first.");
      return;
    }
    try {
      await resetPassword(email);
      Alert.alert(
        "Password reset",
        "If an account exists for that email, you'll receive a reset link."
      );
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Could not send password reset email.");
    }
  };

  const handleGoogle = async () => {
    if (!requireLegal()) return;

    try {
      setGoogleLoading(true);

      await requireTurnstile();

      if (Platform.OS === "web") {
        const user = await loginWithGoogleWeb();
        await handlePostLogin(user);
        setTurnstileToken(null);
      } else {
        Alert.alert("Not available yet", "Google sign-in is currently implemented for web only.");
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert("Google sign-in error", e?.message ?? "Could not sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const CheckboxRow = ({
    checked,
    onToggle,
    children,
  }: {
    checked: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }) => (
    <Pressable
      onPress={onToggle}
      style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          borderWidth: 1,
          borderColor: checked ? "#2563eb" : "#d1d5db",
          backgroundColor: checked ? "#2563eb" : "#ffffff",
          marginTop: 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked ? (
          <View style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: "#ffffff" }} />
        ) : null}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );

  const cardWidth = Math.min(520, Math.max(320, width - 40));
  const signupDisabled = mode === "signup" && !legalOk;

  const primaryBtnStyle = {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  const primaryBtnTextStyle = {
    color: "#ffffff",
    fontWeight: "600" as const,
    fontSize: 16,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            width: cardWidth,
            borderWidth: 1,
            borderColor: "#e5e7eb",
            backgroundColor: "#ffffff",
            borderRadius: 16,
            padding: 18,
          }}
        >
          <Text style={{ fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 6, textAlign: "center" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </Text>

          <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 18, textAlign: "center", lineHeight: 18 }}>
            {mode === "login" ? "Log in to continue." : "Create an account to continue."}
          </Text>

          <Text style={{ marginBottom: 4, color: "#374151", fontSize: 14 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#9ca3af"
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 14,
            }}
          />

          <Text style={{ marginBottom: 4, color: "#374151", fontSize: 14 }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor="#9ca3af"
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 10,
            }}
          />

          {mode === "login" && (
            <TouchableOpacity onPress={handleResetPassword}>
              <Text style={{ fontSize: 13, color: "#2563eb", marginBottom: 14 }}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {mode === "signup" && (
            <View
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                backgroundColor: "#f9fafb",
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <CheckboxRow checked={readPrivacy} onToggle={() => setReadPrivacy((p) => !p)}>
                <Text style={{ color: "#111827", fontSize: 13, lineHeight: 18 }}>
                  I have read and understand the{" "}
                  <Text style={{ color: "#2563eb", textDecorationLine: "underline" }} onPress={() => openLegalPage("/privacypolicy")}>
                    Privacy Policy
                  </Text>{" "}
                  and{" "}
                  <Text style={{ color: "#2563eb", textDecorationLine: "underline" }} onPress={() => openLegalPage("/cookiepolicy")}>
                    Cookie Policy
                  </Text>
                  .
                </Text>
              </CheckboxRow>

              <CheckboxRow checked={acceptedTerms} onToggle={() => setAcceptedTerms((p) => !p)}>
                <Text style={{ color: "#111827", fontSize: 13, lineHeight: 18 }}>
                  I agree to the{" "}
                  <Text style={{ color: "#2563eb", textDecorationLine: "underline" }} onPress={() => openLegalPage("/terms")}>
                    Terms & Conditions
                  </Text>
                  .
                </Text>
              </CheckboxRow>

              {signupDisabled ? (
                <Text style={{ marginTop: 6, fontSize: 12, color: "#b45309" }}>
                  Accept the policies to create an account.
                </Text>
              ) : null}
            </View>
          )}

          {/* ✅ Turnstile appears on WEB (via TurnstileWidget.web.tsx) */}
          {Platform.OS === "web" && (
            <View style={{ marginBottom: 14 }}>
              <TurnstileWidget
                siteKey={TURNSTILE_SITE_KEY}
                onToken={(t) => setTurnstileToken(t)}
                onExpired={() => setTurnstileToken(null)}
                onError={() => {
                  setTurnstileToken(null);
                  Alert.alert("Security check error", "Could not load Turnstile. Please refresh.");
                }}
              />
              <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center" }}>
                {turnstileToken ? "✅ Security check completed" : "Complete the security check above"}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || signupDisabled}
            style={[primaryBtnStyle, { marginBottom: 12, opacity: submitting || signupDisabled ? 0.6 : 1 }]}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={primaryBtnTextStyle}>{mode === "login" ? "Log in" : "Sign up"}</Text>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            <Text style={{ marginHorizontal: 8, fontSize: 12, color: "#9ca3af" }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
          </View>

          <TouchableOpacity
            onPress={handleGoogle}
            disabled={googleLoading || signupDisabled}
            style={[primaryBtnStyle, { marginBottom: 14, opacity: googleLoading || signupDisabled ? 0.6 : 1 }]}
          >
            {googleLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={primaryBtnTextStyle}>
                {mode === "login" ? "Continue with Google" : "Sign up with Google"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              const next = mode === "login" ? "signup" : "login";
              setMode(next);
              router.replace(`/login?mode=${next}` as any);
            }}
            style={{ marginTop: 10 }}
          >
            <Text style={{ fontSize: 13, textAlign: "center", color: "#4b5563" }}>
              {mode === "login" ? (
                <>
                  No account? <Text style={{ color: "#2563eb", fontWeight: "600" }}>Sign up</Text>.
                </>
              ) : (
                <>
                  Already have an account? <Text style={{ color: "#2563eb", fontWeight: "600" }}>Log in</Text>.
                </>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
