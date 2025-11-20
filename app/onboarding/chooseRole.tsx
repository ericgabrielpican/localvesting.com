import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Screen from "../../src/components/ui/Screen";
import Navbar from "../../src/components/Navbar";
import Card from "../../src/components/ui/Card";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";
import { useRouter } from "expo-router";

export default function ChooseRole() {
  const router = useRouter();

  return (
    <Screen>
      <Navbar />

      <View style={{ padding: Theme.spacing.lg }}>
        <Card>
          <Text style={styles.title}>Choose role</Text>

          <Button
            label="I am an investor"
            onPress={() => router.push("/onboarding/investorSetup" as any)}
          />

          <Button
            label="I am a business owner"
            variant="secondary"
            onPress={() => router.push("/onboarding/businessSetup" as any)}
          />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    ...Theme.typography.title,
    textAlign: "center",
    marginBottom: Theme.spacing.lg,
  },
});
