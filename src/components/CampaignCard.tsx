import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";

export default function CampaignCard({ campaign }: any) {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push(`/browse/${campaign.id}`)}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4"
    >
      {campaign.image && (
        <Image
          source={{ uri: campaign.image }}
          className="w-full h-40 rounded-lg mb-3"
          resizeMode="cover"
        />
      )}
      <Text className="text-lg font-semibold text-gray-800 mb-1">
        {campaign.title}
      </Text>
      <Text className="text-gray-500 mb-2">{campaign.category}</Text>
      <View className="flex-row justify-between">
        <Text className="text-gray-600 text-sm">
          Goal: €{campaign.goal.toLocaleString()}
        </Text>
        <Text className="text-primary text-sm font-medium">
          APR {campaign.apr}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}
