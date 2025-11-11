import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";

export default function AddBusiness() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = async () => {
    if (!name || !category || !address)
      return Alert.alert("Please fill all fields");

    await addDoc(collection(db, "businesses"), {
      ownerId: user?.uid,
      name,
      category,
      address,
      verified: false,
      createdAt: serverTimestamp(),
    });

    Alert.alert("Business added! Awaiting verification.");
    setName("");
    setCategory("");
    setAddress("");
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-2xl font-bold text-primary mb-6">
        Add Business
      </Text>
      <TextField label="Business Name" value={name} onChangeText={setName} />
      <TextField label="Category" value={category} onChangeText={setCategory} />
      <TextField label="Address" value={address} onChangeText={setAddress} />
      <PrimaryButton label="Save" onPress={handleSave} />
    </View>
  );
}
