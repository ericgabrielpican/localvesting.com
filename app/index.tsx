// app/index.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Navbar from "../src/components/Navbar";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Navbar />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to LocalVesting</Text>
        <Text style={styles.subtitle}>
          Invest in local businesses and share in their success.
        </Text>

        {user ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => router.push("/browse" as any)}
            >
              <Text style={styles.primaryButtonText}>Browse campaigns</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => router.push("/dashboard" as any)}
            >
              <Text style={styles.secondaryButtonText}>Go to dashboard</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => router.push("/login" as any)}
          >
            <Text style={styles.primaryButtonText}>Log in / Sign up</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },
});
