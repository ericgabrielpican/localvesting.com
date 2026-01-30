// app/cookie-policy/index.tsx
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

export default function CookiePolicyPage() {
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
          <Text style={styles.kicker}>Cookie policy</Text>
          <Text style={[styles.title, isMobile && styles.titleMobile]}>
            Cookies & consent
          </Text>
          <Text style={styles.subtitle}>
            LocalVesting is currently in demo phase (no real-world money). This
            page explains how cookies and similar technologies are used.
          </Text>
        </View>

        {/* CONTENT CARD */}
        <View style={styles.storyCard}>
          <Text style={styles.paragraph}>
            <Text style={styles.strong}>Controller:</Text> Eric Pican (natural
            person)
            {"\n"}
            <Text style={styles.strong}>Contact:</Text> gdpr@localvesting.com
          </Text>

          <Text style={styles.sectionTitle}>1) What are cookies?</Text>
          <Text style={styles.paragraph}>
            Cookies are small text files stored on your device. They help a
            website remember information about your visit, such as preferences
            and session state. “Similar technologies” include local storage and
            SDK identifiers used by web and mobile apps.
          </Text>

          <Text style={styles.sectionTitle}>2) What cookies we use</Text>
          <Text style={styles.paragraph}>
            LocalVesting uses a consent banner with 3 options: Decline (no
            optional cookies), Essential only, or Accept all. Depending on your
            choice, we may store a small record of your consent selection.
          </Text>

          <View style={styles.list}>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Essential cookies</Text>: needed for
              core features and security. These may include authentication/session
              technical storage when you log in.
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Analytics cookies</Text> (optional):
              used only if you accept them, to understand usage and improve the
              product.
            </Text>
            <Text style={styles.bullet}>
              • <Text style={styles.strong}>Marketing cookies</Text> (optional):
              currently not used. If enabled in the future, we will update this
              policy and the banner.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>3) Managing your choices</Text>
          <Text style={styles.paragraph}>
            You can change your cookie preferences anytime from the cookie
            banner (or a future “Privacy settings” link if we add one). If you
            decline optional cookies, you can still use the platform, including
            logging in.
          </Text>

          <Text style={styles.sectionTitle}>4) Third-party services</Text>
          <Text style={styles.paragraph}>
            We use Firebase for authentication and database services. These
            services may set strictly necessary storage for login/security. We
            also request location permission for the map feature only when you
            choose to use it.
          </Text>

          <Text style={styles.sectionTitle}>5) Updates</Text>
          <Text style={styles.paragraph}>
            We may update this Cookie Policy to reflect changes in the platform.
            When changes are significant, we will show a notice and/or request
            consent again where required.
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
