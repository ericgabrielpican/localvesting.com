import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";

export default function BusinessSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSave = async () => {
    try {
      if (!name) return Alert.alert("Please enter your name");
      await setDoc(doc(db, "users", user!.uid), {
        uid: user!.uid,
        displayName: name,
        phone,
        role: "business",
        isAdmin: false,
        createdAt: serverTimestamp(),
      });
      router.replace("/dashboard");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-primary mb-6">
        Business Owner Profile
      </Text>
      <TextField label="Full name" value={name} onChangeText={setName} />
      <TextField
        label="Phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <PrimaryButton label="Save & Continue" onPress={handleSave} />
    </View>
  );
}
