import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import Navbar from "../../src/components/Navbar";
import Screen from "../../src/components/ui/Screen";
import CampaignCard from "../../src/components/CampaignCard";
import { Theme } from "../../src/styles/Theme";

export default function Browse() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    try {
      const snap = await getDocs(collection(db, "campaigns"));
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <Screen>
      <Navbar />

      <View style={styles.container}>
        <Text style={styles.title}>Active Campaigns</Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.loading}>Loading campaigns…</Text>
          </View>
        ) : campaigns.length === 0 ? (
          <Text style={styles.empty}>No campaigns available.</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Theme.spacing.lg },
  title: { ...Theme.typography.title, marginBottom: Theme.spacing.md },
  center: { marginTop: Theme.spacing.xl, alignItems: "center" },
  loading: { ...Theme.typography.subtitle, marginTop: Theme.spacing.sm },
  empty: { ...Theme.typography.subtitle },
});
