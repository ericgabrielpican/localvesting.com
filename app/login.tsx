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

import { db } from "../src/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { width } = useWindowDimensions();

  // ✅ Start in signup mode if URL has ?mode=signup
  const initialMode: "login" | "signup" =
    params?.mode === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ✅ Reusable primary button styles (used by Sign up + Google)
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

  // ✅ Keep state in sync if URL param changes
  useEffect(() => {
    const next: "login" | "signup" =
      params?.mode === "signup" ? "signup" : "login";
    setMode(next);
  }, [params?.mode]);

  // ✅ Legal acceptance (required ONLY for signup)
  const [readPrivacy, setReadPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // ✅ Login does NOT require legal acceptance; Signup DOES.
  const legalOk = useMemo(() => {
    if (mode === "login") return true;
    return readPrivacy && acceptedTerms;
  }, [mode, readPrivacy, acceptedTerms]);

  // Optional: reset checkboxes when switching to login to reduce confusion
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
    // ✅ Only enforce on signup
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

  // 🔥 This function decides where to send the user AFTER login
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

    const update: any = {};
    let needsUpdate = false;

    if (!data.email && user.email) {
      update.email = user.email;
      needsUpdate = true;
    }
    if (typeof data.role === "undefined") {
      update.role = null;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await setDoc(ref, { ...data, ...update }, { merge: true });
    }

    const role = (data.role ?? update.role) ?? null;

    if (!role) {
      router.replace("/onboarding/chooseRole" as any);
      return;
    }

    if (role === "admin") {
      router.replace("/admin");
      return;
    }

    if (role === "business") {
      if (data.businessSetupComplete) router.replace("/dashboard");
      else router.replace("/onboarding/businessSetup");
      return;
    }

    if (role === "investor") {
      if (data.investorSetupComplete) router.replace("/browse");
      else router.replace("/onboarding/investorSetup");
      return;
    }

    router.replace("/onboarding/chooseRole");
  };

  const handleSubmit = async () => {
    if (!requireLegal()) return;

    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);

      let user;

      if (mode === "login") {
        user = await loginWithEmailPassword(email, password);
      } else {
        user = await registerWithEmailPassword(email, password);

        await setDoc(doc(db, "users", user.uid), {
          email,
          role: null,
          createdAt: serverTimestamp(),
        });
      }

      await handlePostLogin(user);
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

      if (Platform.OS === "web") {
        const user = await loginWithGoogleWeb();
        await handlePostLogin(user);
      } else {
        Alert.alert(
          "Not available yet",
          "Google sign-in is currently implemented for web only."
        );
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Google sign-in error",
        e?.message ?? "Could not sign in with Google."
      );
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
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
        paddingVertical: 6,
      }}
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
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              backgroundColor: "#ffffff",
            }}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );

  const cardWidth = Math.min(520, Math.max(320, width - 40));

  // ✅ Disable account-creation actions (email signup + google signup) until checked
  const signupDisabled = mode === "signup" && !legalOk;

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
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.06,
            shadowRadius: 16,
            elevation: 2,
          }}
        >
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            {mode === "login" ? "Welcome back" : "Create account"}
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: "#6b7280",
              marginBottom: 18,
              textAlign: "center",
              lineHeight: 18,
            }}
          >
            {mode === "login" ? "Log in to continue." : "Create an account to continue."}
          </Text>

          {/* Email */}
          <Text style={{ marginBottom: 4, color: "#374151", fontSize: 14 }}>
            Email
          </Text>
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

          {/* Password */}
          <Text style={{ marginBottom: 4, color: "#374151", fontSize: 14 }}>
            Password
          </Text>
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

          {/* ✅ Legal checkboxes ONLY on signup */}
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
              <CheckboxRow
                checked={readPrivacy}
                onToggle={() => setReadPrivacy((p) => !p)}
              >
                <Text style={{ color: "#111827", fontSize: 13, lineHeight: 18 }}>
                  I have read and understand the{" "}
                  <Text
                    style={{ color: "#2563eb", textDecorationLine: "underline" }}
                    onPress={() => openLegalPage("/privacypolicy")}
                  >
                    Privacy Policy
                  </Text>{" "}
                  and{" "}
                  <Text
                    style={{ color: "#2563eb", textDecorationLine: "underline" }}
                    onPress={() => openLegalPage("/cookiepolicy")}
                  >
                    Cookie Policy
                  </Text>
                  .
                </Text>
              </CheckboxRow>

              <CheckboxRow
                checked={acceptedTerms}
                onToggle={() => setAcceptedTerms((p) => !p)}
              >
                <Text style={{ color: "#111827", fontSize: 13, lineHeight: 18 }}>
                  I agree to the{" "}
                  <Text
                    style={{ color: "#2563eb", textDecorationLine: "underline" }}
                    onPress={() => openLegalPage("/terms")}
                  >
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

          {/* ✅ Submit button using primary styles */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || signupDisabled}
            style={[
              primaryBtnStyle,
              {
                marginBottom: 12,
                opacity: submitting || signupDisabled ? 0.6 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={primaryBtnTextStyle}>
                {mode === "login" ? "Log in" : "Sign up"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 10,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
            <Text style={{ marginHorizontal: 8, fontSize: 12, color: "#9ca3af" }}>
              OR
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
          </View>

          {/* ✅ Google button: SAME style as Sign up + non-clickable until checked */}
          <TouchableOpacity
            onPress={handleGoogle}
            disabled={googleLoading || signupDisabled}
            style={[
              primaryBtnStyle,
              {
                marginBottom: 14,
                opacity: googleLoading || signupDisabled ? 0.6 : 1,
              },
            ]}
          >
            {googleLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={primaryBtnTextStyle}>
                {mode === "login" ? "Continue with Google" : "Sign up with Google"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Helper only on signup */}
          {mode === "signup" && signupDisabled ? (
            <Text
              style={{
                fontSize: 12,
                color: "#6b7280",
                textAlign: "center",
                lineHeight: 16,
              }}
            >
              Tip: tick the checkboxes above to enable account creation.
            </Text>
          ) : null}

          {/* Toggle login/signup (keeps URL in sync) */}
          <TouchableOpacity
            onPress={() => {
              const next = mode === "login" ? "signup" : "login";
              setMode(next);
              router.replace(`/login?mode=${next}` as any);
            }}
            style={{ marginTop: 14 }}
          >
            <Text style={{ fontSize: 13, textAlign: "center", color: "#4b5563" }}>
  {mode === "login" ? (
    <>
      No account?{" "}
      <Text style={{ color: "#2563eb", fontWeight: "600" }}>
        Sign up
      </Text>
      .
    </>
  ) : (
    <>
      Already have an account?{" "}
      <Text style={{ color: "#2563eb", fontWeight: "600" }}>
        Log in
      </Text>
      .
    </>
  )}
</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
