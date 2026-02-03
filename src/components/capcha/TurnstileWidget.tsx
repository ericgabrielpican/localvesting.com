import React from "react";
import { View, Text } from "react-native";

type Props = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpired?: () => void;
  onError?: () => void;
  theme?: "light" | "dark" | "auto";
};

/**
 * Native fallback.
 * Turnstile is mainly for web bot defense. For mobile, you typically rely on:
 * - App Attest / Play Integrity (later)
 * - Rate limiting on backend
 */
export default function TurnstileWidget() {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
        (Security check is shown on web.)
      </Text>
    </View>
  );
}
