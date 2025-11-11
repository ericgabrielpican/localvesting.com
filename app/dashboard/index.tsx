import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import Navbar from "../../src/components/Navbar";
import CampaignCard from "../../src/components/CampaignCard";
import PrimaryButton from "../../src/components/PrimaryButton";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const q = query(collection(db, "campaigns"), where("ownerId", "==", user?.uid));
      const snap = await getDocs(q);
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    if (user) load();
  }, [user]);

  return (
    <View className="flex-1 bg-background">
      <Navbar />
      <ScrollView className="px-4 py-3">
        <Text className="text-xl font-semibold mb-3 text-gray-800">
          My Campaigns
        </Text>

        {campaigns.length === 0 && (
          <Text className="text-gray-500 mb-4">
            No campaigns yet. Create one to get started!
          </Text>
        )}

        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} />
        ))}

        <PrimaryButton
          label="Create new campaign"
          onPress={() => router.push("/dashboard/addBusiness")}
        />
      </ScrollView>
    </View>
  );
}
