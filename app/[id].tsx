// import React, { useEffect, useState } from "react";
// import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
// import { useLocalSearchParams } from "expo-router";
// import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "../src/firebase/config";

// import Screen from "../src/components/ui/Screen";
// import Card from "../src/components/ui/Card";
// import Button from "../src/components/ui/Button";
// import TextField from "../src/components/ui/TextField";

// import { useAuth } from "../src/context/AuthContext";
// import { Theme } from "../src/styles/Theme";

// export default function CampaignDetail() {
//   const { id } = useLocalSearchParams();
//   const { user } = useAuth();

//   const [campaign, setCampaign] = useState<any | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [amount, setAmount] = useState("");

//   const load = async () => {
//     try {
//       const snap = await getDoc(doc(db, "campaigns", id as string));
//       if (snap.exists()) setCampaign(snap.data());
//     } finally {
//       setLoading(false);
//     }
//   };

//   const pledge = async () => {
//     if (!user) return alert("Login first");
//     if (!Number(amount)) return alert("Invalid amount");

//     await addDoc(collection(db, "pledges"), {
//       campaignId: id,
//       investorId: user.uid,
//       amount: Number(amount),
//       createdAt: serverTimestamp(),
//     });

//     alert("Pledge confirmed!");
//     setAmount("");
//   };

//   useEffect(() => {
//     load();
//   }, [id]);

//   if (loading)
//     return (
//       <Screen>
//         <View style={styles.center}>
//           <ActivityIndicator />
//         </View>
//       </Screen>
//     );

//   if (!campaign)
//     return (
//       <Screen>
//         <View style={styles.center}>
//           <Text>Campaign not found</Text>
//         </View>
//       </Screen>
//     );

//   return (
//     <Screen>

//       <ScrollView contentContainerStyle={{ padding: Theme.spacing.lg }}>
//         <Card>
//           <Text style={styles.title}>{campaign.title}</Text>
//           <Text style={styles.subtitle}>{campaign.category}</Text>
//           <Text style={styles.desc}>{campaign.description}</Text>
//         </Card>

//         <Card>
//           <Text style={styles.section}>Invest / Pledge</Text>

//           <TextField
//             label="Amount (EUR)"
//             value={amount}
//             onChangeText={setAmount}
//             keyboardType="numeric"
//           />

//           <Button label="Confirm pledge" onPress={pledge} />
//         </Card>
//       </ScrollView>
//     </Screen>
//   );
// }

// const styles = StyleSheet.create({
//   center: { flex: 1, alignItems: "center", justifyContent: "center" },
//   title: { ...Theme.typography.title, marginBottom: Theme.spacing.sm },
//   subtitle: { ...Theme.typography.subtitle, marginBottom: Theme.spacing.md },
//   desc: { ...Theme.typography.body },
//   section: { ...Theme.typography.title, marginBottom: Theme.spacing.md },
// });
