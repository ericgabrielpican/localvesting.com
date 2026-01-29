import React, { useState } from "react";
import { View, Alert } from "react-native";
import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import TextField from "../../src/components/ui/TextField";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";

import { useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function BusinessSetup() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const save = async () => {
    if (!name || !phone) return Alert.alert("Fill all fields");

    await setDoc(doc(db, "users", user?.uid!), {
      uid: user?.uid,
      name,
      phone,
      role: "business",
      createdAt: serverTimestamp(),
    });

    router.replace("/dashboard" as any);
  };

  return (
    <Screen>
      <View style={{ padding: Theme.spacing.lg }}>
        <Card>
          <TextField label="Full name" placeholder="Enter your full name…" value={name} onChangeText={setName} />
          <TextField label="Phone number" placeholder="Enter your phone number..." value={phone} onChangeText={setPhone} />
          <Button label="Save & Continue" onPress={save} />
        </Card>
      </View>
    </Screen>
  );
}
