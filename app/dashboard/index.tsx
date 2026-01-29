import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase/config";

import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import Button from "../../src/components/ui/Button";

import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { Theme } from "../../src/styles/Theme";
import CampaignCard from "../../src/components/CampaignCard";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const q = query(collection(db, "campaigns"), where("ownerId", "==", user?.uid));
    const snap = await getDocs(q);
    setCampaigns(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const totalRaised = campaigns.reduce((s, c) => s + Number(c.raised || 0), 0);

  return (
    <Screen>

      <ScrollView contentContainerStyle={{ padding: Theme.spacing.lg }}>
        <Text style={styles.title}>Business Dashboard</Text>

        <View style={styles.stats}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total raised</Text>
            <Text style={styles.statValue}>€{totalRaised}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Active campaigns</Text>
            <Text style={styles.statValue}>
              {campaigns.filter((c) => c.status === "active").length}
            </Text>
          </Card>
        </View>

        <View style={styles.actions}>
          <Button
            label="Create Campaign"
            onPress={() => router.push("/dashboard/createCampaign" as any)}
          />
          <Button
            label="Add Business"
            variant="secondary"
            onPress={() => router.push("/dashboard/addBusiness" as any)}
          />
        </View>

        <Text style={styles.subtitle}>My Campaigns</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : (
          campaigns.map((c) => <CampaignCard key={c.id} campaign={c} />)
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Theme.typography.title, marginBottom: Theme.spacing.md },
  subtitle: { ...Theme.typography.subtitle, marginVertical: Theme.spacing.md },
  stats: { flexDirection: "row", marginBottom: Theme.spacing.md },
  statCard: { flex: 1, marginRight: Theme.spacing.sm },
  statLabel: { ...Theme.typography.subtitle },
  statValue: { ...Theme.typography.title, marginTop: Theme.spacing.xs },
  actions: { marginBottom: Theme.spacing.lg },
  center: { alignItems: "center", marginTop: Theme.spacing.lg },
});
