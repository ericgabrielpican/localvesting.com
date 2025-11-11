import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import Navbar from "../../src/components/Navbar";
import PrimaryButton from "../../src/components/PrimaryButton";

export default function CampaignDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "campaigns", id as string);
      const snap = await getDoc(ref);
      if (snap.exists()) setCampaign(snap.data());
    };
    load();
  }, [id]);

  const handlePledge = async () => {
    if (!user) return Alert.alert("Please log in first");
    if (!amount || Number(amount) <= 0) return Alert.alert("Invalid amount");

    await addDoc(collection(db, "pledges"), {
      campaignId: id,
      investorId: user.uid,
      amount: Number(amount),
      createdAt: serverTimestamp(),
    });

    Alert.alert("Pledge recorded!");
    setAmount("");
  };

  if (!campaign)
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );

  return (
    <View className="flex-1 bg-white">
      <Navbar />
      <ScrollView className="p-4">
        <Text className="text-2xl font-bold text-primary mb-2">
          {campaign.title}
        </Text>
        <Text className="text-gray-600 mb-4">{campaign.description}</Text>
        <View className="bg-gray-100 rounded-xl p-4 mb-6">
          <Text className="text-gray-700">
            Goal: €{campaign.goal.toLocaleString()}
          </Text>
          <Text className="text-gray-700">APR: {campaign.apr}%</Text>
          <Text className="text-gray-700">
            Raised: €{campaign.raised?.toLocaleString() ?? 0}
          </Text>
        </View>

        <TextInput
          placeholder="Enter amount to pledge (€)"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          className="border border-gray-300 rounded-xl px-4 py-3 mb-3"
        />
        <PrimaryButton label="Pledge" onPress={handlePledge} />
      </ScrollView>
    </View>
  );
}
