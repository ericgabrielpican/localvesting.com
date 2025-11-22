// app/index.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import Screen from "../src/components/ui/Screen";
import NavBar from "../src/components/Navbar";
import { Theme } from "../src/styles/Theme";
import { useAuth } from "../src/context/AuthContext";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const goPrimary = () => {
    if (user) {
      router.push("/browse" as any);
    } else {
      router.push("/login" as any);
    }
  };

  const goLogin = () => {
    router.push("/login" as any);
  };

  return (
    <Screen>
      <NavBar />

      <ScrollView contentContainerStyle={styles.container}>
        {/* HERO */}
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.badge}>Invest in what you can touch</Text>

            <Text style={styles.title}>
              Fund local restaurants, cafés and small businesses.
            </Text>

            <Text style={styles.subtitle}>
              LocalVesting is a revenue-share marketplace that lets you back
              real businesses in your city and earn a fixed return from their
              future revenue.
            </Text>

            <View style={styles.heroButtons}>
              <Pressable style={styles.primaryButton} onPress={goPrimary}>
                <Text style={styles.primaryButtonLabel}>
                  {user ? "Go to marketplace" : "Get started"}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={goLogin}>
                <Text style={styles.secondaryButtonLabel}>
                  Try the demo
                </Text>
              </Pressable>
            </View>

            <Text style={styles.helperText}>
              This is a demo environment for showcasing the platform – no real
              investments are processed.
            </Text>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How LocalVesting works</Text>

          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Browse campaigns</Text>
              <Text style={styles.cardBody}>
                Discover vetted campaigns from local cafés, restaurants and
                shops. Each campaign shows funding goal, APR, term and risk
                level so you can quickly compare opportunities.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Revenue-share lending</Text>
              <Text style={styles.cardBody}>
                Investors fund a business in exchange for fixed repayments from
                a share of future revenue – until principal + interest is fully
                repaid.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Transparent dashboards</Text>
              <Text style={styles.cardBody}>
                Both investors and business owners get dashboards to track
                campaigns, funding progress and status, all in one place.
              </Text>
            </View>
          </View>
        </View>

        {/* DEMO FEATURES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What you can explore in the demo</Text>

          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Investor experience</Text>
              <Text style={styles.cardBody}>
                Sign up as an investor to browse sample campaigns, open detailed
                views, and simulate pledges – without using real money.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Business onboarding</Text>
              <Text style={styles.cardBody}>
                Create a business account, fill in your profile, add a location
                and request verification, just like a real merchant would.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Support & admin tools</Text>
              <Text style={styles.cardBody}>
                Test the support center, open tickets, and (as an admin) respond
                to them, close them, and manage business verification and
                campaigns.
              </Text>
            </View>
          </View>
        </View>

        {/* CTA FOOTER */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>Ready to see it in action?</Text>
          <View style={styles.heroButtons}>
            <Pressable style={styles.primaryButton} onPress={goPrimary}>
              <Text style={styles.primaryButtonLabel}>
                {user ? "Open marketplace" : "Create free account"}
              </Text>
            </Pressable>

            <Pressable style={styles.secondaryButton} onPress={goLogin}>
              <Text style={styles.secondaryButtonLabel}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.xl,
    maxWidth: 1200,
    width: "100%",
    alignSelf: "center",
  },
  hero: {
    flexDirection: "row",
    gap: Theme.spacing.lg,
  },
  heroText: {
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
    backgroundColor: "#E0ECFF",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: Theme.colors.textSubtle,
    marginBottom: 16,
  },
  heroButtons: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  primaryButtonLabel: {
    color: Theme.colors.primaryText,
    fontWeight: "600",
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Theme.colors.surface,
  },
  secondaryButtonLabel: {
    color: Theme.colors.text,
    fontWeight: "500",
    fontSize: 14,
  },
  helperText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    marginTop: 4,
  },
  section: {
    gap: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.title,
  },
  cardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Theme.spacing.md,
  },
  card: {
    flexBasis: "32%",
    minWidth: 260,
    flexGrow: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 13,
    color: Theme.colors.textSubtle,
  },
  footerSection: {
    alignItems: "flex-start",
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: Theme.spacing.sm,
  },
  footerTitle: {
    ...Theme.typography.title,
  },
});
