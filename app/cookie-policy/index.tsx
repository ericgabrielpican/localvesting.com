import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

export default function CookiePolicy() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", marginBottom: 6 }}>
          Cookie Policy
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 18 }}>
          Last updated: {new Date().toLocaleDateString()}
        </Text>

        <Section title="Essential cookies">
          We use essential cookies for authentication, security, and basic platform
          operation (Firebase Authentication). These are always enabled.
        </Section>

        <Section title="Analytics cookies (optional)">
          Analytics cookies help us improve the platform and are enabled only if you
          choose “Accept all cookies” in the cookie banner.
        </Section>

        <Section title="Third-party services">
          • Google Firebase (auth, database, hosting){"\n"}
          • Google Maps (loaded only when you use map features)
        </Section>

        <Section title="Contact">
          For privacy questions: gdpr@localvesting.com
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
