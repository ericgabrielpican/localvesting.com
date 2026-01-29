// app/admin/index.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../src/context/AuthContext";
import Screen from "../../src/components/ui/Screen";
import { Theme } from "../../src/styles/Theme";

const ADMIN_EMAIL = "ericgabrielpican@gmail.com"; // optional fallback

type AdminToolKey =
  | "campaigns"
  | "businesses"
  | "support"
  | "users"
  | "onboarding"
  | "analytics"
  | "settings";

export default function AdminPage() {
  const router = useRouter();
  const { user, role, roleLoading } = useAuth() as any;

  // ✅ Admin rule: role=admin OR email match (fallback)
  const isAdmin = useMemo(() => {
    const emailIsAdmin = (user?.email ?? "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
    const roleIsAdmin = (role ?? "").toString().toLowerCase() === "admin";
    return emailIsAdmin || roleIsAdmin;
  }, [user?.email, role]);

  // Not logged in
  if (!user) {
    router.replace("/login" as any);
    return null;
  }

  // Wait for role to load (only relevant when logged in)
  if (roleLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Loading admin…</Text>
          <Text style={styles.muted}>Checking permissions.</Text>
        </View>
      </Screen>
    );
  }

  // Logged in but not admin
  if (!isAdmin) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>Access denied</Text>
          <Text style={styles.muted}>
            You don&apos;t have permission to view the admin panel.
          </Text>
        </View>
      </Screen>
    );
  }

  // ✅ Admin “tools”
  const tools: {
    key: AdminToolKey;
    title: string;
    desc: string;
    route: string;
  }[] = [
    {
      key: "campaigns",
      title: "Campaigns",
      desc: "Approve, edit, pause, feature, or remove campaigns. Moderate content and manage status.",
      route: "/admin/campaigns",
    },
    {
      key: "businesses",
      title: "Businesses",
      desc: "Edit business details, verify businesses, manage pins/locations, and moderate profiles.",
      route: "/admin/businesses",
    },
    {
      key: "support",
      title: "Support inbox",
      desc: "View and respond to support requests, assign status, and manage FAQ / canned responses.",
      route: "/admin/support",
    },
    {
      key: "users",
      title: "Users",
      desc: "Search users, review profiles, manage roles, and disable/restore accounts (soft actions).",
      route: "/admin/users",
    },
    {
      key: "onboarding",
      title: "Onboarding flows",
      desc: "Review onboarding completion, resend prompts, and monitor drop-off points.",
      route: "/admin/onboarding",
    },
    {
      key: "analytics",
      title: "Analytics (MVP)",
      desc: "Track signups, active users, campaign views, map usage, and onboarding completion rates.",
      route: "/admin/analytics",
    },
    {
      key: "settings",
      title: "Platform settings",
      desc: "Manage demo-mode text, legal links, feature flags, and platform configuration.",
      route: "/admin/settings",
    },
  ];

  const go = (route: string) => router.push(route as any);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Panel</Text>
          <Text style={styles.muted}>
            Manage campaigns, businesses, users and support. (Demo phase — no real money.)
          </Text>
        </View>

        <View style={styles.grid}>
          {tools.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => go(t.route)}
              style={({ pressed }) => [
                styles.card,
                pressed && { transform: [{ scale: 0.99 }], opacity: 0.98 },
              ]}
            >
              <Text style={styles.cardTitle}>{t.title}</Text>
              <Text style={styles.cardDesc}>{t.desc}</Text>

              <View style={styles.cardFooter}>
                <Text style={styles.linkText}>Open</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {/* Suggestions */}
        <View style={styles.suggestions}>
          <Text style={styles.suggestionsTitle}>Good admin features to add next</Text>

          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Audit log:</Text> record who changed what (campaign edits, role changes).
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Soft moderation:</Text> “flagged”, “hidden”, “needs review” statuses.
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Bulk actions:</Text> approve multiple campaigns, bulk status changes.
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Content templates:</Text> reusable descriptions and perk templates for campaigns.
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>User messaging:</Text> send transactional messages (e.g., “campaign approved”).
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Rate limits + abuse prevention:</Text> throttle campaign creation / spam.
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>Map QA:</Text> detect duplicate pins / invalid locations / missing addresses.
          </Text>
          <Text style={styles.suggestionsItem}>
            • <Text style={styles.bold}>KYC-ready structure:</Text> store “verification state” fields (even if demo).
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: Theme.spacing.lg,
    backgroundColor: Theme.colors.background,
    gap: 14,
  },
  header: {
    gap: 6,
    marginBottom: 6,
  },
  title: {
    ...Theme.typography.title,
  },
  muted: {
    ...Theme.typography.body,
    color: Theme.colors.textMuted,
  },
  center: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    padding: Theme.spacing.lg,
    gap: 10,
  },

  grid: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  cardDesc: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
  },
  cardFooter: {
    marginTop: 4,
    alignItems: "flex-start",
  },
  linkText: {
    fontSize: 13,
    color: Theme.colors.primary,
    fontWeight: "600",
  },

  suggestions: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 2,
  },
  suggestionsItem: {
    fontSize: 13,
    color: Theme.colors.textMuted,
    lineHeight: 18,
  },
  bold: {
    fontWeight: "700",
    color: Theme.colors.text,
  },
});
