// app/admin/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";
import NavBar from "../../src/components/Navbar";
import Screen from "../../src/components/ui/Screen";
import { Theme } from "../../src/styles/Theme";

const ADMIN_EMAIL = "ericgabrielpican@gmail.com"; // 

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      // Not logged in → send to login
      router.replace("/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));

        let role: string | null = null;
        if (snap.exists()) {
          const data = snap.data() as any;
          role = (data.role || "").toString().toLowerCase().trim();
        }

        const emailIsAdmin = user.email === ADMIN_EMAIL;
        const firestoreIsAdmin = role === "admin";

        if (emailIsAdmin || firestoreIsAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user]);

  // While checking admin rights
  if (checking) {
    return (
      <Screen>
        <NavBar active="admin" />
        <View style={styles.center}>
          <ActivityIndicator />
          <Text style={styles.muted}>Checking permissions…</Text>
        </View>
      </Screen>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.center}>
          <Text style={styles.title}>Access denied</Text>
          <Text style={styles.muted}>
            You don&apos;t have permission to view the admin panel.
          </Text>
        </View>
      </Screen>
    );
  }

  // ✅ Admin content goes here
  return (
    <Screen>
      <NavBar active="admin" />
      <View style={styles.page}>
        {/* 👉 Paste your existing admin UI here (business verification, campaign approvals, etc.) */}
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.muted}>
          Here you can manage business verifications, campaigns, support, etc.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
  },
  title: {
    ...Theme.typography.title,
    marginBottom: 8,
  },
  muted: {
    ...Theme.typography.body,
    color: Theme.colors.textMuted,
    textAlign: "center",
  },
});
