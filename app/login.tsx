import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  resetPassword,
  loginWithGoogleWeb,
  loginWithGoogleIdToken,
} from "../src/firebase/auth";
import TextField from "../src/components/TextField";
import PrimaryButton from "../src/components/PrimaryButton";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com";
const IOS_CLIENT_ID = "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com";

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: WEB_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID || WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID || WEB_CLIENT_ID,
  });

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type !== "success") return;
      const idToken = response.params?.id_token;
      if (!idToken) return;
      try {
        setGoogleLoading(true);
        await loginWithGoogleIdToken(idToken);
        router.replace("/onboarding/chooseRole");
      } catch (e: any) {
        Alert.alert("Google sign-in error", e.message);
      } finally {
        setGoogleLoading(false);
      }
    };
    handleResponse();
  }, [response]);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    try {
      setSubmitting(true);
      if (mode === "login") await loginWithEmailPassword(email, password);
      else await registerWithEmailPassword(email, password);
      router.replace("/onboarding/chooseRole");
    } catch (e: any) {
      Alert.alert("Authentication error", e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      if (Platform.OS === "web") {
        await loginWithGoogleWeb();
        router.replace("/onboarding/chooseRole");
      } else {
        await promptAsync();
      }
    } catch (e: any) {
      Alert.alert("Google sign-in error", e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-5 justify-center">
      <Text className="text-center text-2xl font-bold text-primary mb-1">
        {mode === "login" ? "Welcome Back" : "Create Account"}
      </Text>
      <Text className="text-center text-gray-500 mb-6">
        Use your LocalVesting account to continue
      </Text>

      <TextField label="Email" value={email} onChangeText={setEmail} />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <PrimaryButton
        label={
          submitting
            ? "Please wait..."
            : mode === "login"
            ? "Log in"
            : "Sign up"
        }
        onPress={handleSubmit}
        disabled={submitting}
      />

      {mode === "login" && (
        <TouchableOpacity onPress={() => resetPassword(email)}>
          <Text className="text-center text-sm text-primary mt-3">
            Forgot password?
          </Text>
        </TouchableOpacity>
      )}

      <View className="flex-row items-center my-6">
        <View className="flex-1 h-[1px] bg-gray-200" />
        <Text className="mx-2 text-gray-400 text-sm">OR</Text>
        <View className="flex-1 h-[1px] bg-gray-200" />
      </View>

      <PrimaryButton
        label={googleLoading ? "Connecting..." : "Continue with Google"}
        onPress={handleGoogleSignIn}
        style="bg-white border border-gray-300"
        textClass="text-black"
        disabled={googleLoading}
      />

      <TouchableOpacity
        onPress={() =>
          setMode((p) => (p === "login" ? "signup" : "login"))
        }
      >
        <Text className="text-center text-gray-500 mt-6">
          {mode === "login"
            ? "No account? Tap here to sign up."
            : "Already have an account? Log in."}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
