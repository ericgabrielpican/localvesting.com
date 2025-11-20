// src/components/Navbar.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { logout } from "../../firebase/auth";
import { colors, spacing } from "../../styles/Theme";

const Navbar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login" as any);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.push("/" as any)}>
        <Text style={styles.logo}>LocalVesting</Text>
      </TouchableOpacity>

      <View style={styles.right}>
        <TouchableOpacity onPress={() => router.push("/browse" as any)}>
          <Text style={styles.link}>Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dashboard" as any)}>
          <Text style={styles.link}>Dashboard</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity onPress={() => router.push("/admin" as any)}>
            <Text style={styles.link}>Admin</Text>
          </TouchableOpacity>
        )}

        {user && (
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logout}>Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  link: {
    marginLeft: spacing.lg,
    fontSize: 14,
    color: "#4b5563",
  },
  logout: {
    marginLeft: spacing.lg,
    fontSize: 12,
    color: colors.textSubtle,
  },
});

export default Navbar;
