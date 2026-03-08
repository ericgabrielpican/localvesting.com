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

import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import { Theme } from "../../src/styles/Theme";

import {
  isEmailVerified,
  resendEmailVerification,
} from "../../src/firebase/auth";

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

  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [checkingEmail, setCheckingEmail] = useState<boolean>(true);
  const [resending, setResending] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);

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
            verificationStatus: data.verificationStatus,
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

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setCheckingEmail(true);
        setEmailError(null);
        setEmailInfo(null);

        if (!user) {
          if (!alive) return;
          setEmailVerified(false);
          return;
        }

        const v = await isEmailVerified();
        if (!alive) return;
        setEmailVerified(v);
      } catch (e: any) {
        if (!alive) return;
        setEmailError(e?.message ?? "Failed to check email verification status");
      } finally {
        if (!alive) return;
        setCheckingEmail(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user) return;
    if (emailVerified) return;

    const interval = setInterval(async () => {
      try {
        const v = await isEmailVerified();
        setEmailVerified(v);
        if (v) setEmailInfo("Email verified ✅");
      } catch {
        // silent
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user?.uid, emailVerified]);

  const handleResendVerification = async () => {
    try {
      setResending(true);
      setEmailError(null);
      setEmailInfo(null);

      await resendEmailVerification();
      setEmailInfo("Verification email sent. Check inbox/spam.");
    } catch (e: any) {
      setEmailError(e?.message ?? "Failed to resend verification email");
    } finally {
      setResending(false);
    }
  };

  const goToAddBusiness = () => {
    router.push("/dashboard/addBusiness");
  };

  const goToBusinessProfile = (businessId: string) => {
    router.push(`/mybusinesses/${businessId}` as any);
  };

  const renderStatusChip = (b: Business) => {
    let label = "Pending verification";
    let bg = "#FEF3C7";
    let color = "#92400E";

    if (b.verified === true) {
      label = "Verified";
      bg = "#DCFCE7";
      color = "#166534";
    } else if (b.verified === false && b.verificationStatus === "rejected") {
      label = "Rejected";
      bg = "#FEE2E2";
      color = "#991B1B";
    } else if (b.verified === false && b.verificationStatus === "pending") {
      label = "Pending";
      bg = "#FEF3C7";
      color = "#92400E";
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
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  const hasBusinesses = businesses.length > 0;

  return (
    <Screen style={Theme.screen}>
      <ScrollView style={Theme.content}
          contentContainerStyle={styles.container}>
        <Text style={styles.pageTitle}>My Businesses</Text>
        <Text style={styles.subtitle}>
          Manage your business profiles and verification status
        </Text>

        {!!user && (
          <View style={styles.verifyBox}>
            <View style={styles.verifyRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: emailVerified ? "#22C55E" : "#EF4444" },
                ]}
              />
              <Text style={styles.verifyText}>
                {checkingEmail
                  ? "Checking email verification..."
                  : emailVerified
                  ? "Email verified"
                  : "Email not verified"}
              </Text>

              {!emailVerified && (
                <Pressable
                  style={[
                    styles.resendButtonInline,
                    (resending || checkingEmail) && { opacity: 0.6 },
                  ]}
                  onPress={handleResendVerification}
                  disabled={resending || checkingEmail}
                >
                  <Text style={styles.resendButtonInlineLabel}>
                    {resending ? "Sending..." : "Resend email"}
                  </Text>
                </Pressable>
              )}
            </View>

            {!!emailInfo && <Text style={styles.infoText}>{emailInfo}</Text>}
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>
        )}

        {!hasBusinesses && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No businesses yet</Text>
            <Text style={styles.emptyText}>
              Add your first business to request verification and start raising
              funds.
            </Text>

            <Pressable style={styles.bigAddButton} onPress={goToAddBusiness}>
              <Text style={styles.bigAddButtonLabel}>Add business</Text>
            </Pressable>
          </View>
        )}

        {hasBusinesses && (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Your Businesses</Text>

              <Pressable style={styles.smallAddButton} onPress={goToAddBusiness}>
                <Text style={styles.smallAddButtonLabel}>Add Business</Text>
              </Pressable>
            </View>

            {businesses.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => goToBusinessProfile(b.id)}
                style={({ pressed }) => [
                  styles.businessPressable,
                  pressed && styles.businessPressablePressed,
                ]}
              >
                <Card style={styles.businessCard}>
                  <View style={styles.businessHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.businessName}>{b.name}</Text>
                      <Text style={styles.businessMeta}>
                        {b.category || "Uncategorized"}
                      </Text>
                      <Text style={styles.businessAddress}>{b.address}</Text>
                    </View>

                    <View style={styles.businessRight}>
                      {renderStatusChip(b)}
                      <Text style={styles.viewProfileText}>View profile →</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
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

  verifyBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderColor: Theme.colors.border,
    borderWidth: 1,
    gap: 10,
  },
  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  verifyText: {
    ...Theme.typography.body,
  },
  resendButtonInline: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.primary,
    borderRadius: 10,
    marginLeft: "auto",
  },
  resendButtonInlineLabel: {
    ...Theme.typography.label,
    color: "#fff",
  },
  infoText: {
    ...Theme.typography.body,
    color: Theme.colors.textSubtle,
  },
  errorText: {
    ...Theme.typography.body,
    color: "#B91C1C",
  },

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

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    ...Theme.typography.subtitle,
  },

  smallAddButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    backgroundColor: Theme.colors.primary,
    borderRadius: 8,
  },
  smallAddButtonLabel: {
    ...Theme.typography.label,
    color: "#fff",
  },

  businessPressable: {
    marginBottom: Theme.spacing.md,
    borderRadius: 16,
  },
  businessPressablePressed: {
    opacity: 0.92,
  },

  businessCard: {
    marginBottom: 0,
  },
  businessHeader: {
    flexDirection: "row",
    gap: Theme.spacing.md,
    alignItems: "flex-start",
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
  businessRight: {
    alignItems: "flex-end",
    gap: 8,
  },
  viewProfileText: {
    fontSize: 12,
    fontWeight: "600",
    color: Theme.colors.primary,
  },

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