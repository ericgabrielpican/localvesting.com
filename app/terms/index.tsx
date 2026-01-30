// app/terms/index.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";

import Screen from "../../src/components/ui/Screen";
import { Theme } from "../../src/styles/Theme";

export default function TermsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const go = (path: string) => router.push(path as any);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.bgSoft} />

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.kicker}>Terms</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            Terms & Conditions
          </Text>
          <Text style={styles.subtitle}>
            LocalVesting is currently in demo phase (no real-world money). By
            using the platform, you agree to these terms.
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.storyCard}>
          <Text style={styles.paragraph}>
            <Text style={styles.strong}>Operator:</Text> Eric Pican (natural
            person){"\n"}
            <Text style={styles.strong}>Contact:</Text> gdpr@localvesting.com{"\n"}
            <Text style={styles.strong}>Eligibility:</Text> 18+ only
          </Text>

          <Text style={styles.sectionTitle}>1) Demo phase / no real money</Text>
          <Text style={styles.paragraph}>
            LocalVesting is a demo/intermediary platform. It is not currently
            operating with real-world funds. Any “investments”, “returns”, or
            “campaign funding” shown are for demonstration/testing only.
          </Text>

          <Text style={styles.sectionTitle}>2) Platform role</Text>
          <Text style={styles.paragraph}>
            LocalVesting acts as an intermediary platform connecting potential
            investors and businesses. We do not provide financial advice. You
            are responsible for your decisions and for verifying information.
          </Text>

          <Text style={styles.sectionTitle}>3) Accounts</Text>
          <Text style={styles.paragraph}>
            You must provide accurate information and keep your account secure.
            You are responsible for all activity under your account.
          </Text>

          <Text style={styles.sectionTitle}>4) Acceptable use</Text>
          <View style={styles.list}>
            <Text style={styles.bullet}>
              • Do not misuse the platform, attempt unauthorized access, or
              interfere with operation.
            </Text>
            <Text style={styles.bullet}>
              • Do not upload unlawful content or impersonate others.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>5) Content and campaigns</Text>
          <Text style={styles.paragraph}>
            Campaign and business information may be user-generated. We may
            review, moderate, or remove content to protect users and the
            platform.
          </Text>

          <Text style={styles.sectionTitle}>6) Suspension and termination</Text>
          <Text style={styles.paragraph}>
            We may suspend or terminate access if we reasonably believe your use
            violates these terms or creates risk for others.
          </Text>

          <Text style={styles.sectionTitle}>7) Liability</Text>
          <Text style={styles.paragraph}>
            The platform is provided “as is” without warranties. To the maximum
            extent permitted by law, we are not liable for indirect damages,
            lost profits, or losses arising from your use of the platform.
          </Text>

          <Text style={styles.sectionTitle}>8) Changes</Text>
          <Text style={styles.paragraph}>
            We may update these terms as the product evolves. Continued use
            after updates means you accept the updated terms.
          </Text>

          <Text style={styles.tiny}>
            Last updated: {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* LINKS */}
        <View style={styles.bottomButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => go("/privacy-policy")}>
            <Text style={styles.secondaryButtonLabel}>Privacy Policy</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => go("/cookie-policy")}>
            <Text style={styles.secondaryButtonLabel}>Cookie Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 1000,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.xl,
    gap: Theme.spacing.xl,
    position: "relative",
  },
  bgSoft: {
    position: "absolute",
    top: -80,
    left: -80,
    right: -80,
    height: 220,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    backgroundColor: "#F5F7FF",
  },
  header: { gap: 6 },
  kicker: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: { fontSize: 34, fontWeight: "700", color: Theme.colors.text },
  titleMobile: { fontSize: 30 },
  subtitle: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22,
    marginTop: 2,
  },

  storyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    padding: Theme.spacing.lg,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 12,
  },
  sectionTitle: { ...Theme.typography.title },
  paragraph: { fontSize: 15, color: "#374151", lineHeight: 22 },
  strong: { fontWeight: "600", color: "#111827" },

  list: { gap: 8, marginTop: 2 },
  bullet: { fontSize: 15, color: "#374151", lineHeight: 22 },

  tiny: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 6 },

  bottomButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: Theme.colors.surface,
  },
  secondaryButtonLabel: {
    color: Theme.colors.text,
    fontWeight: "500",
    fontSize: 14,
  },
});
