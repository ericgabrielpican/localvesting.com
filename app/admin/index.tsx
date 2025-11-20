import React, { useEffect, useState } from "react";
import { Text, ScrollView, StyleSheet } from "react-native";
import Navbar from "../../src/components/Navbar";
import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";

import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../../src/firebase/config";

export default function Admin() {
  const [pending, setPending] = useState<any[]>([]);

  const load = async () => {
    const snap = await getDocs(collection(db, "businesses"));
    const arr = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    setPending(arr.filter((b) => !b.verified));
  };

  const verify = async (id: string) => {
    await updateDoc(doc(db, "businesses", id), { verified: true });
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Screen>
      <Navbar />
      <ScrollView contentContainerStyle={{ padding: Theme.spacing.lg }}>
        <Text style={styles.title}>Pending Verifications</Text>

        {pending.map((b) => (
          <Card key={b.id}>
            <Text style={styles.name}>{b.name}</Text>
            <Text style={styles.sub}>{b.category}</Text>
            <Text style={styles.sub}>{b.address}</Text>

            <Button label="Verify" onPress={() => verify(b.id)} />
          </Card>
        ))}

        {pending.length === 0 && (
          <Text style={styles.empty}>No pending businesses.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...Theme.typography.title, marginBottom: Theme.spacing.lg },
  name: { ...Theme.typography.title },
  sub: { ...Theme.typography.subtitle },
  empty: { ...Theme.typography.subtitle, marginTop: Theme.spacing.md },
});
