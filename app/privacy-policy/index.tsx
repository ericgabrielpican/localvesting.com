// app/privacy-policy/index.tsx
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

export default function PrivacyPolicyPage() {
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
          <Text style={styles.kicker}>Privacy policy</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            How we process your data
          </Text>
          <Text style={styles.subtitle}>
            LocalVesting is currently in demo phase (no real-world money). This
            policy explains what data we collect and why.
          </Text>
        </View>

        {/* CONTENT */}
        <View style={styles.storyCard}>
          <Text style={styles.paragraph}>
            <Text style={styles.strong}>Data controller:</Text> Eric Pican
            (natural person)
            {"\n"}
            <Text style={styles.strong}>Contact:</Text> gdpr@localvesting.com
            {"\n"}
            <Text style={styles.strong}>Eligibility:</Text> 18+ only
          </Text>

          <Text style={styles.sectionTitle}>1) What data we collect</Text>
          <View style={styles.list}>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Account data:</Text> email, name (if
              provided by Google), UID, login provider.
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Onboarding form data:</Text> the data
              you type during onboarding (e.g., role selection, business/investor
              profile inputs).
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Location data (optional):</Text>{" "}
              approximate/current location only when you grant permission for the
              map feature.
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Campaign/business data:</Text> data
              you create in the app that is saved to the database (e.g., campaigns
              and business details).
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Support messages:</Text> if you contact
              support, we store your message and relevant account context.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>2) Purposes and legal bases</Text>
          <Text style={styles.paragraph}>
            We process personal data to:
          </Text>
          <View style={styles.list}>
            <Text style={styles.bullet}>
              • Provide the platform (create accounts, login, onboarding, map,
              campaigns). <Text style={styles.strong}>Legal basis:</Text>{" "}
              contract/steps before contract.
            </Text>
            <Text style={styles.bullet}>
              • Secure the platform, prevent fraud/abuse.{" "}
              <Text style={styles.strong}>Legal basis:</Text> legitimate
              interests.
            </Text>
            <Text style={styles.bullet}>
              • Send transactional emails (password resets, important service
              notices). <Text style={styles.strong}>Legal basis:</Text>{" "}
              contract/legitimate interests.
            </Text>
            <Text style={styles.bullet}>
              • Marketing emails/newsletters (future).{" "}
              <Text style={styles.strong}>Legal basis:</Text> consent (opt-in).
            </Text>
          </View>

          <Text style={styles.sectionTitle}>3) Data sharing</Text>
          <Text style={styles.paragraph}>
            We use Firebase (Google) as a processor for authentication and
            database hosting. We do not sell your personal data. We may share
            data if legally required (e.g., lawful requests).
          </Text>

          <Text style={styles.sectionTitle}>4) Data retention</Text>
          <Text style={styles.paragraph}>
            We keep your account data while your account is active. If you
            request deletion, we will delete or anonymize data unless we must
            keep it for legal reasons (e.g., security logs, dispute handling).
          </Text>

          <Text style={styles.sectionTitle}>5) Your rights</Text>
          <Text style={styles.paragraph}>
            Depending on your jurisdiction (including GDPR), you may have rights
            to access, rectify, delete, restrict, object, or port your data. To
            exercise these rights, contact{" "}
            <Text style={styles.strong}>gdpr@localvesting.com</Text>.
          </Text>

          <Text style={styles.sectionTitle}>6) Security</Text>
          <Text style={styles.paragraph}>
            We apply reasonable technical and organizational measures (e.g.,
            Firebase security rules, access control) to protect your data.
            However, no method of transmission or storage is 100% secure.
          </Text>

          <Text style={styles.sectionTitle}>7) International transfers</Text>
          <Text style={styles.paragraph}>
            Firebase may process data on servers outside your country. Where
            applicable, transfers are protected by appropriate safeguards (e.g.,
            standard contractual clauses).
          </Text>

          <Text style={styles.sectionTitle}>8) Changes</Text>
          <Text style={styles.paragraph}>
            We may update this policy as the platform evolves. If changes are
            significant, we will notify you and/or request consent where
            required.
          </Text>

          <Text style={styles.tiny}>
            Last updated: {new Date().toLocaleDateString("en-GB")}
          </Text>
        </View>

        {/* LINKS */}
        <View style={styles.bottomButtons}>
          <Pressable style={styles.secondaryButton} onPress={() => go("/cookie-policy")}>
            <Text style={styles.secondaryButtonLabel}>Cookie Policy</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => go("/terms")}>
            <Text style={styles.secondaryButtonLabel}>Terms & Conditions</Text>
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
