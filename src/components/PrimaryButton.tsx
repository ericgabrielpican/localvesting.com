import React from "react";
import { TextInput, View, Text } from "react-native";

export default function TextField({
  label,
  value,
  onChangeText,
  ...props
}: any) {
  return (
    <View className="mb-4">
      {label && <Text className="text-gray-700 mb-1 text-sm">{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        className="border border-gray-300 rounded-xl px-4 py-3 bg-white text-gray-900"
        placeholderTextColor="#9ca3af"
        {...props}
      />
    </View>
  );
}
