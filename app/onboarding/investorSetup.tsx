import React, { useState } from "react";
import { View, Alert } from "react-native";
import Screen from "../../src/components/ui/Screen";
import Navbar from "../../src/components/Navbar";
import Card from "../../src/components/ui/Card";
import TextField from "../../src/components/ui/TextField";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";

import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function InvestorSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  const save = async () => {
    if (!name) return Alert.alert("Name required");

    await setDoc(doc(db, "users", user?.uid!), {
      uid: user?.uid,
      name,
      bio,
      role: "investor",
      createdAt: serverTimestamp(),
    });

    router.replace("/browse" as any);
  };

  return (
    <Screen>
      <Navbar />
      <View style={{ padding: Theme.spacing.lg }}>
        <Card>
          <TextField label="Full name" value={name} onChangeText={setName} />
          <TextField label="About you" value={bio} onChangeText={setBio} multiline style={{ height: 100 }} />

          <Button label="Save & Continue" onPress={save} />
        </Card>
      </View>
    </Screen>
  );
}
