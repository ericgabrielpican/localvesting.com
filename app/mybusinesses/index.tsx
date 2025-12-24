// app/mybusinesses/index.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";

import {
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";

import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";

import NavBar from "../../src/components/Navbar";
import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import { Theme } from "../../src/styles/Theme";

type Business = {
  id: string;
  name: string;
  address: string;
  category?: string;
  verified?: boolean;
  createdAt?: any;
  verificationStatus?: "pending" | "verified" | "rejected";
};

export default function MyBusinessesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "businesses"),
      where("ownerId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Business[] = snap.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            name: data.name ?? "Unnamed business",
            address: data.address ?? "",
            category: data.category,
            verified: data.verified,
            createdAt: data.createdAt,
          };
        });

        setBusinesses(items);
        setLoading(false);
      },
      (err) => {
        console.error("Business fetch error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  const goToAddBusiness = () => {
    router.push("/dashboard/addBusiness");
  };

  const renderStatusChip = (b: Business) => {
    let label = "Pending verification";
    let bg = "#FEF3C7"; // amber100
    let color = "#92400E";

    if (b.verified === true) {
      label = "Verified";
      bg = "#DCFCE7";
      color = "#166534";
    } else if (b.verified === false && b.verificationStatus === "verified") {
      label = "Rejected";
      bg = "#FEE2E2";
      color = "#991B1B";
    } else if (b.verified === false && b.verificationStatus === "pending") {
      label = "Pending";
      bg = "#FEF3C7";
      color = "#f2ff00ff";
    }

    return (
      <View style={[styles.statusChip, { backgroundColor: bg }]}>
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen>
        <NavBar />
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  const hasBusinesses = businesses.length > 0;

  return (
    <Screen>
      <NavBar />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>My Businesses</Text>
        <Text style={styles.subtitle}>
          Manage your business profiles and verification status
        </Text>

        {/* ------------------------------------------------ */}
        {/* EMPTY STATE — WITH YOUR BIG BUTTON               */}
        {/* ------------------------------------------------ */}
        {!hasBusinesses && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No businesses yet</Text>
            <Text style={styles.emptyText}>
              Add your first business to request verification and start raising funds.
            </Text>

            <Pressable style={styles.bigAddButton} onPress={goToAddBusiness}>
              <Text style={styles.bigAddButtonLabel}>Add business</Text>
            </Pressable>
          </View>
        )}

        {/* ------------------------------------------------ */}
        {/* BUSINESS LIST                                     */}
        {/* ------------------------------------------------ */}
        {hasBusinesses && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Your Businesses</Text>

              {/* small top-right button */}
              <Pressable style={styles.smallAddButton} onPress={goToAddBusiness}>
                <Text style={styles.smallAddButtonLabel}>Add Business</Text>
              </Pressable>
            </View>

            {businesses.map((b) => (
              <Card key={b.id} style={styles.businessCard}>
                <View style={styles.businessHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.businessName}>{b.name}</Text>
                    <Text style={styles.businessMeta}>
                      {b.category || "Uncategorized"}
                    </Text>
                    <Text style={styles.businessAddress}>{b.address}</Text>
                  </View>

                  {renderStatusChip(b)}
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
    gap: Theme.spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  pageTitle: {
    ...Theme.typography.title,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
    marginBottom: Theme.spacing.lg,
  },

  /* EMPTY BOX WITH BIG BUTTON */
  emptyBox: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 16,
    alignItems: "center",
    borderColor: Theme.colors.border,
    borderWidth: 1,
  },
  emptyTitle: {
    ...Theme.typography.title,
    marginBottom: 6,
  },
  emptyText: {
    ...Theme.typography.body,
    textAlign: "center",
    color: Theme.colors.textSubtle,
    marginBottom: 20,
  },

  bigAddButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    minWidth: 220,
    alignItems: "center",
  },
  bigAddButtonLabel: {
    ...Theme.typography.subtitle,
    color: "#fff",
  },

  /* LIST HEADER */
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.subtitle,
  },

  /* SMALL TOP-RIGHT BUTTON */
  smallAddButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
  },
  smallAddButtonLabel: {
    ...Theme.typography.label,
  },

  /* BUSINESS CARDS */
  businessCard: {
    marginBottom: Theme.spacing.md,
  },
  businessHeader: {
    flexDirection: "row",
    gap: Theme.spacing.md,
  },
  businessName: {
    ...Theme.typography.title,
    fontSize: 18,
  },
  businessMeta: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
  },
  businessAddress: {
    ...Theme.typography.body,
    color: Theme.colors.textMuted,
  },

  /* STATUS CHIP */
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusText: {
    ...Theme.typography.label,
  },
});
