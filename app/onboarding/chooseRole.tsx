import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function ChooseRole() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-2xl font-semibold text-primary mb-6">
        Choose your role
      </Text>

      <TouchableOpacity
        className="w-full bg-primary py-3 rounded-xl mb-4"
        onPress={() => router.push("/onboarding/investorSetup")}
      >
        <Text className="text-center text-white text-lg font-medium">
          I’m an Investor
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="w-full bg-white border border-primary py-3 rounded-xl"
        onPress={() => router.push("/onboarding/businessSetup")}
      >
        <Text className="text-center text-primary text-lg font-medium">
          I’m a Business Owner
        </Text>
      </TouchableOpacity>
    </View>
  );
}
