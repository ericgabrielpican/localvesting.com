import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";
import { Theme } from "../styles/Theme";

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/" as any)}>
        <Text style={styles.logo}>LocalVesting</Text>
      </TouchableOpacity>
      <View style={styles.right}>
        <TouchableOpacity onPress={() => router.push("/browse" as any)}>
          <Text style={styles.link}>Browse</Text>
        </TouchableOpacity>
        {user && (
          <>
            <TouchableOpacity onPress={() => router.push("/dashboard" as any)}>
              <Text style={styles.link}>Dashboard</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/admin" as any)}>
              <Text style={styles.link}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => logout()}>
              <Text style={styles.logout}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: { fontSize: 18, fontWeight: "700", color: Theme.colors.primary },
  right: { flexDirection: "row", alignItems: "center" },
  link: { marginLeft: Theme.spacing.lg, color: Theme.colors.textMuted, fontSize: 14 },
  logout: { marginLeft: Theme.spacing.lg, color: Theme.colors.textSubtle, fontSize: 12 },
});
