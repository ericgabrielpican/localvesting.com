import React, { useEffect, useState } from "react";
import { ScrollView, View, Text } from "react-native";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import CampaignCard from "../../src/components/CampaignCard";
import Navbar from "../../src/components/Navbar";

export default function BrowseScreen() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      const snap = await getDocs(collection(db, "campaigns"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCampaigns(data);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  if (loading)
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading campaigns...</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-background">
      <Navbar />
      <ScrollView className="px-4 py-3">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}
      </ScrollView>
    </View>
  );
}
