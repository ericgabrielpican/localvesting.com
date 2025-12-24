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
            <Text style={styles.badge}>
              Invest where you live, not where you scroll.
            </Text>

            <Text style={styles.title}>
              The easiest way to invest in local restaurants, cafés and small
              businesses
            </Text>

            <Text style={styles.subtitle}>
              LocalVesting connects everyday investors with real businesses.
              Fund growth, earn revenue-based returns, and support the places
              you already care about.
            </Text>

            <View style={styles.heroButtons}>
              <Pressable style={styles.primaryButton} onPress={goPrimary}>
                <Text style={styles.primaryButtonLabel}>
                  {user ? "Go to marketplace" : "Start investing"}
                </Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={goLogin}>
                <Text style={styles.secondaryButtonLabel}>
                  Let's use a demo
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* OUR STORY */}
        <View style={styles.storySection}>
          <Text style={styles.storyTitle}>What made us create LocalVesting</Text>

          <Text style={styles.storyBody}>
            Most investments today feel distant — numbers on a screen, companies
            you never visit, growth you never see.
          </Text>

          <Text style={styles.storyBody}>
            Meanwhile, the café on your corner or the restaurant you love if it wants to grow it has to 
            raise money through banks, or wait too long to self finance.
          </Text>

<Text style={styles.storyBodyStrong}>
           You can help change that.
          </Text>

          <Text style={styles.storyBodyStrong}>
            LocalVesting was built to reconnect money with real places, real
            people and real impact.
          </Text>
        </View>

        {/* TRUST SIGNALS */}
        <View style={styles.trustSection}>
          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>10+</Text>
            <Text style={styles.trustLabel}>Businesses onboarded</Text>
          </View>

          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>€50 000+</Text>
            <Text style={styles.trustLabel}>Demo funding simulated</Text>
          </View>

          <View style={styles.trustItem}>
            <Text style={styles.trustNumber}>4-8%</Text>
            <Text style={styles.trustLabel}>Typical revenue share per campaign</Text>
          </View>
        </View>

        {/* HOW IT WORKS */}
        <View style={[styles.section, styles.softSection]}>
          <Text style={styles.sectionTitle}>How it works</Text>

          <View style={styles.cardsRow}>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>🏪</Text>
              <Text style={styles.cardTitle}>Browse campaigns</Text>
              <Text style={styles.cardBody}>
                Discover vetted campaigns from local cafés, restaurants and
                shops. Compare funding goals, terms and risk levels at a glance.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardIcon}>📊</Text>
              <Text style={styles.cardTitle}>Invest & earn</Text>
              <Text style={styles.cardBody}>
                Support businesses in exchange for revenue-based repayments or
                perks — until your investment is fully repaid.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardIcon}>🤝</Text>
              <Text style={styles.cardTitle}>Grow YOUR community</Text>
              <Text style={styles.cardBody}>
                Suggest new campaigns for businesses and earn alongside them! Help businesses launch, and earn bonuses
                for growing your local businesses.
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
                Browse campaigns, create a portofolio and explore —
                without using real money.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Business onboarding</Text>
              <Text style={styles.cardBody}>
                Create a business profile, simulate campaign submissions and suitable funding structures.
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Campaign creation</Text>
              <Text style={styles.cardBody}>
                Test campaign templates from our dedicated marketplace, pre-create your own campaigns before posting them. 
              </Text>
            </View>
          </View>
        </View>

        {/* CTA FOOTER */}
        <View style={styles.footerSection}>
          <Text style={styles.footerTitle}>
            Build wealth exactly where you live
          </Text>

          <Text style={styles.footerSubtitle}>
            Join our demo and explore how you can make an impact and care about your future.
          </Text>

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

/* ---------------- STYLES ---------------- */

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
    fontSize: 32,
    fontWeight: "700",
    color: Theme.colors.text,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 18,
    lineHeight: 22,
  },

  heroButtons: {
    flexDirection: "row",
    gap: 12,
  },

  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 22,
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
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Theme.colors.surface,
  },
  secondaryButtonLabel: {
    color: Theme.colors.text,
    fontWeight: "500",
    fontSize: 14,
  },

  storySection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: Theme.spacing.lg,
    gap: 10,
  },
  storyTitle: {
    ...Theme.typography.title,
  },
  storyBody: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },
  storyBodyStrong: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
    lineHeight: 22,
    marginTop: 4,
  },

  trustSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Theme.spacing.md,
  },
  trustItem: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: "center",
  },
  trustNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  trustLabel: {
    fontSize: 12,
    color: "#4B5563",
    marginTop: 4,
  },

  section: {
    gap: Theme.spacing.md,
  },
  softSection: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: Theme.spacing.lg,
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

  cardIcon: {
    fontSize: 24,
    marginBottom: 6,
  },

  cardTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
  },

  cardBody: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  footerSection: {
    paddingVertical: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    gap: Theme.spacing.sm,
  },

  footerTitle: {
    ...Theme.typography.title,
  },

  footerSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
});
