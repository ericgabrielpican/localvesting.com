import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function PrivacyPolicy() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>
          Privacy Policy
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 18 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Section title="Demo phase (no real-world money)">
          LocalVesting is currently provided in a demo/testing phase and is not
          operating with real-world money yet. Personal data is processed to
          provide and improve the platform experience.
        </Section>

        <Section title="Data Controller">
          LocalVesting is operated by Eric Pican, natural person (Data Controller).
          Contact: gdpr@localvesting.com
        </Section>

        <Section title="Data we collect">
          • Google Login (Firebase): name, email, profile picture (if provided), UID{"\n"}
          • Onboarding forms: data you provide (phone, address/city, business details like name/CUI, IBAN if provided){"\n"}
          • Location: live-only for user map usage; not stored for users. Business/campaign locations stored only when submitted.
        </Section>

        <Section title="Purposes">
          • Authentication and account management{"\n"}
          • Platform features (map, listings, onboarding){"\n"}
          • Security and fraud prevention{"\n"}
          • Transactional communications{"\n"}
          • Marketing communications (only with consent)
        </Section>

        <Section title="Legal bases (GDPR Art. 6)">
          • Contract/performance (core features){"\n"}
          • Consent (marketing & optional cookies){"\n"}
          • Legitimate interest (security & improvement){"\n"}
          • Legal obligation (where required)
        </Section>

        <Section title="Your rights">
          You can request access, rectification, deletion, restriction, portability,
          and withdraw consent anytime. Contact: gdpr@localvesting.com
        </Section>

        <Section title="Age restriction">
          The platform is intended for users 18+.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 6, color: "#111827" }}>
        {title}
      </Text>
      <Text style={{ fontSize: 14, lineHeight: 20, color: "#374151" }}>{children}</Text>
    </View>
  );
}
