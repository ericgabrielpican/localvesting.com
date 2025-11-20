// app/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  resetPassword,
  loginWithGoogleWeb,
} from "../src/firebase/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }

    try {
      setSubmitting(true);

      if (mode === "login") {
        await loginWithEmailPassword(email, password);
      } else {
        await registerWithEmailPassword(email, password);
      }

      // Auth OK → go to role selection
      router.replace("/onboarding/chooseRole" as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        "Authentication error",
        e?.message ?? "Could not authenticate."
      );
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
      Alert.alert(
        "Error",
        e?.message ?? "Could not send password reset email."
      );
    }
  };

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);

      if (Platform.OS === "web") {
        // Web: use Firebase popup
        await loginWithGoogleWeb();
        router.replace("/onboarding/chooseRole" as any);
      } else {
        // Native: not implemented yet
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          {mode === "login" ? "Welcome back" : "Create account"}
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 24,
          }}
        >
          Use your LocalVesting account to continue.
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
            marginBottom: 16,
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
            marginBottom: 12,
          }}
        />

        {mode === "login" && (
          <TouchableOpacity onPress={handleResetPassword}>
            <Text
              style={{
                fontSize: 13,
                color: "#2563eb",
                marginBottom: 20,
              }}
            >
              Forgot password?
            </Text>
          </TouchableOpacity>
        )}

        {/* Email/password submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: "#2563eb",
            borderRadius: 12,
            paddingVertical: 12,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text
              style={{
                color: "#ffffff",
                fontWeight: "600",
                fontSize: 16,
              }}
            >
              {mode === "login" ? "Log in" : "Sign up"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 12,
          }}
        >
          <View
            style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
          />
          <Text
            style={{
              marginHorizontal: 8,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            OR
          </Text>
          <View
            style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
          />
        </View>

        {/* Google button */}
        <TouchableOpacity
          onPress={handleGoogle}
          disabled={googleLoading}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#d1d5db",
            paddingVertical: 10,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            backgroundColor: "#ffffff",
            opacity: googleLoading ? 0.7 : 1,
          }}
        >
          {googleLoading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <Text style={{ color: "#111827", fontSize: 14 }}>
              Continue with Google
            </Text>
          )}
        </TouchableOpacity>

        {/* Toggle login/signup */}
        <TouchableOpacity
          onPress={() =>
            setMode((prev) => (prev === "login" ? "signup" : "login"))
          }
        >
          <Text
            style={{
              fontSize: 13,
              color: "#4b5563",
              textAlign: "center",
            }}
          >
            {mode === "login"
              ? "No account? Tap here to sign up."
              : "Already have an account? Log in."}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
