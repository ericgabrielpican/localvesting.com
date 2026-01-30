// app/browse/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  Pressable,
  LayoutAnimation,
  UIManager,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { db, functions } from "../../src/firebase/config";
import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import Button from "../../src/components/ui/Button";
import TextField from "../../src/components/ui/TextField";
import { useAuth } from "../../src/context/AuthContext";
import { Theme } from "../../src/styles/Theme";

type PledgeRow = {
  id: string;
  investorId: string;
  amount: number;
  campaignId: string;
  createdAt?: Timestamp | null;
};

const RECENT_OVERFETCH = 80;
const RECENT_PREVIEW_COUNT = 3;
const DESC_COLLAPSE_AT = 220;

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth() as any;
  const { width } = useWindowDimensions();

  const campaignId = (id as string) || "";

  const [campaign, setCampaign] = useState<any | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [pledging, setPledging] = useState(false);

  const [walletLoading, setWalletLoading] = useState(true);
  const [walletLive, setWalletLive] = useState<number>(0);

  const [recentLoading, setRecentLoading] = useState(true);
  const [recentPledges, setRecentPledges] = useState<PledgeRow[]>([]);
  const [recentError, setRecentError] = useState<string>("");

  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [seeAllRecent, setSeeAllRecent] = useState(false);

  const [descExpanded, setDescExpanded] = useState(false);

  // Web-only sticky pledge panel. Mobile = inline after Description (no overlay).
  const isWeb = Platform.OS === "web";
  const isWebWide = isWeb && width >= 860;

  // 1) Realtime campaign
  useEffect(() => {
    if (!campaignId) return;

    setCampaignLoading(true);
    const unsub = onSnapshot(
      doc(db, "campaigns", campaignId),
      (snap) => {
        if (snap.exists()) setCampaign({ id: snap.id, ...snap.data() });
        else setCampaign(null);
        setCampaignLoading(false);
      },
      (err) => {
        console.error("campaign snapshot error:", err);
        setCampaign(null);
        setCampaignLoading(false);
      }
    );

    return () => unsub();
  }, [campaignId]);

  // 2) Realtime wallet (wallets/{uid})
  useEffect(() => {
    if (!user?.uid) {
      setWalletLive(0);
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);
    const unsub = onSnapshot(
      doc(db, "wallets", user.uid),
      (snap) => {
        if (!snap.exists()) {
          setWalletLive(0);
        } else {
          const data: any = snap.data();
          const live = Number(data?.liveBalance ?? 0);
          setWalletLive(Number.isFinite(live) ? live : 0);
        }
        setWalletLoading(false);
      },
      (err) => {
        console.error("wallet snapshot error:", err);
        setWalletLive(0);
        setWalletLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  // 3) Recent pledges (avoid composite index prompt)
  useEffect(() => {
    if (!campaignId) return;

    setRecentLoading(true);
    setRecentError("");

    const qy = query(
      collection(db, "pledges"),
      orderBy("createdAt", "desc"),
      limit(RECENT_OVERFETCH)
    );

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const allRows: PledgeRow[] = snap.docs.map((d) => {
          const data: any = d.data();
          return {
            id: d.id,
            investorId: String(data?.investorId ?? ""),
            amount: Number(data?.amount ?? 0),
            campaignId: String(data?.campaignId ?? ""),
            createdAt: (data?.createdAt as Timestamp) ?? null,
          };
        });

        const filtered = allRows.filter((r) => r.campaignId === campaignId);
        setRecentPledges(filtered);
        setRecentLoading(false);
      },
      (err) => {
        console.error("recent pledges snapshot error:", err);
        setRecentPledges([]);
        setRecentLoading(false);
        setRecentError((err as any)?.message || "Could not load recent investments.");
      }
    );

    return () => unsub();
  }, [campaignId]);

  // 4) Resolve display names from users/{uid}.name (cached)
  useEffect(() => {
    const missing = Array.from(
      new Set(
        recentPledges
          .map((p) => p.investorId)
          .filter((uid) => uid && !nameCache[uid])
      )
    );

    if (missing.length === 0) return;

    const batch = missing.slice(0, 12);
    let cancelled = false;

    (async () => {
      try {
        const results = await Promise.all(
          batch.map(async (uid) => {
            try {
              const snap = await getDoc(doc(db, "users", uid));
              const data: any = snap.data();
              const raw = data?.name;
              const name =
                typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : "";
              return [uid, name] as const;
            } catch {
              return [uid, ""] as const;
            }
          })
        );

        if (cancelled) return;

        setNameCache((prev) => {
          const next = { ...prev };
          for (const [uid, name] of results) next[uid] = name;
          return next;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [recentPledges, nameCache]);

  const goal = Number(campaign?.goal ?? 0);
  const raised = Number(campaign?.raised ?? 0);
  const minInv = Number(campaign?.minInvestment ?? 0);
  const status = (campaign?.status ?? "").toString().toLowerCase();

  const remaining = useMemo(() => {
    if (!Number.isFinite(goal) || goal <= 0) return null;
    return Math.max(0, goal - raised);
  }, [goal, raised]);

  const progressPct = useMemo(() => {
    if (!Number.isFinite(goal) || goal <= 0) return 0;
    return Math.min(100, Math.max(0, (raised / goal) * 100));
  }, [goal, raised]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const canPledge = useMemo(() => {
    if (!user) return false;
    if (pledging) return false;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return false;
    if (status !== "active") return false;
    if (Number.isFinite(minInv) && parsedAmount < minInv) return false;
    if (remaining !== null && parsedAmount > remaining) return false;
    if (walletLive < parsedAmount) return false;
    return true;
  }, [user, pledging, parsedAmount, status, minInv, remaining, walletLive]);

  const pledge = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in first.");
      return;
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid number.");
      return;
    }

    try {
      setPledging(true);
      const fn = httpsCallable(functions, "createLivePledge");
      await fn({ campaignId, amount: amt });

      Alert.alert("Success", "Pledge confirmed!");
      setAmount("");
    } catch (e: any) {
      const msg =
        e?.message || e?.details || "Could not confirm pledge. Please try again.";
      Alert.alert("Pledge failed", msg);
      console.error("Pledge error:", e);
    } finally {
      setPledging(false);
    }
  };

  const descText = String(campaign?.description ?? "");
  const descShouldCollapse = descText.length > DESC_COLLAPSE_AT;
  const descShown =
    descShouldCollapse && !descExpanded
      ? descText.slice(0, DESC_COLLAPSE_AT).trimEnd() + "…"
      : descText;

  const recentToShow = useMemo(() => {
    if (seeAllRecent) return recentPledges;
    return recentPledges.slice(0, RECENT_PREVIEW_COUNT);
  }, [seeAllRecent, recentPledges]);

  const toggleDesc = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDescExpanded((v) => !v);
  };

  const toggleSeeMore = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSeeAllRecent((v) => !v);
  };

  const PledgePanel = (
    <Card>
      <Text style={styles.section}>Invest / Pledge</Text>

      <View style={styles.walletBox}>
        <Text style={styles.walletText}>
          Wallet Balance:{" "}
          {walletLoading ? (
            <Text style={styles.metaStrong}>Loading…</Text>
          ) : (
            <Text style={styles.metaStrong}>{formatMoney(walletLive)}</Text>
          )}
        </Text>
        <Text style={styles.walletHint}>
          (Live wallet will be wired to 3DS payments later.)
        </Text>
      </View>

      <TextField
        label="Amount (EUR)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
      />

      <Text style={styles.helper}>
        {status !== "active"
          ? "This campaign is not active."
          : minInv > 0
          ? `Minimum investment: ${formatMoney(minInv)}`
          : "Enter an amount to invest."}
      </Text>

      <Button
        label={pledging ? "Processing..." : "Confirm pledge"}
        onPress={pledge}
        disabled={!canPledge}
      />

      {!canPledge ? (
        <Text style={styles.disabledHint}>
          {user
            ? walletLive < parsedAmount
              ? "Not enough wallet balance."
              : remaining !== null && parsedAmount > remaining
              ? "Amount exceeds remaining capacity."
              : minInv > 0 && parsedAmount > 0 && parsedAmount < minInv
              ? "Amount below minimum investment."
              : ""
            : "Login required."}
        </Text>
      ) : null}
    </Card>
  );

  if (campaignLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  if (!campaign) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text>Campaign not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.pageWrap}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.layout}>
            {/* LEFT: main content */}
            <View style={styles.leftCol}>
              <Card>
                <Text style={styles.title}>{campaign.title}</Text>
                <Text style={styles.subtitle}>{campaign.category}</Text>

                <View style={{ marginTop: 12 }}>
                  <Text style={styles.meta}>
                    Raised:{" "}
                    <Text style={styles.metaStrong}>{formatMoney(raised)}</Text>
                    {Number.isFinite(goal) && goal > 0 ? (
                      <>
                        {" "}
                        / <Text style={styles.metaStrong}>{formatMoney(goal)}</Text>
                      </>
                    ) : null}
                  </Text>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                  </View>

                  <Text style={styles.metaSmall}>
                    Status: <Text style={styles.metaStrong}>{status || "unknown"}</Text>
                    {remaining !== null ? (
                      <>
                        {" "}
                        • Remaining:{" "}
                        <Text style={styles.metaStrong}>{formatMoney(remaining)}</Text>
                      </>
                    ) : null}
                  </Text>

                  <Text style={styles.metaSmall}>
                    APR: <Text style={styles.metaStrong}>{formatApr(campaign.apr)}</Text> • Min:{" "}
                    <Text style={styles.metaStrong}>{formatMoney(minInv)}</Text> • Term:{" "}
                    <Text style={styles.metaStrong}>{campaign.termMonths ?? "-"} mo</Text>
                  </Text>
                </View>
              </Card>

              {/* Description */}
              <Card>
                <View style={styles.descHeaderRow}>
                  <Text style={styles.section}>Description</Text>
                  {descShouldCollapse ? (
                    <Pressable onPress={toggleDesc} hitSlop={10} style={styles.chevBtn}>
                      <Text style={styles.chev}>{descExpanded ? "▲" : "▼"}</Text>
                    </Pressable>
                  ) : null}
                </View>

                <Text style={styles.desc}>{descShown}</Text>

                {descShouldCollapse ? (
                  <Pressable onPress={toggleDesc} style={styles.descMoreRow}>
                    <Text style={styles.descMoreText}>
                      {descExpanded ? "Show less" : "Show more"}
                    </Text>
                    <Text style={styles.descMoreText}>{descExpanded ? "▲" : "▼"}</Text>
                  </Pressable>
                ) : null}
              </Card>

              {/* ✅ MOBILE: pledge panel inline AFTER description */}
              {!isWebWide ? PledgePanel : null}

              {/* Recent investments */}
              <Card>
                <Text style={styles.section}>Recent investments</Text>

                {recentLoading ? (
                  <View style={{ paddingVertical: 8 }}>
                    <ActivityIndicator />
                  </View>
                ) : recentPledges.length === 0 ? (
                  <Text style={styles.metaSmall}>No investments yet.</Text>
                ) : (
                  <View style={styles.bubblesWrap}>
                    {recentToShow.map((p) => {
                      const nameFromUserDoc = nameCache[p.investorId];
                      const baseName =
                        (nameFromUserDoc && nameFromUserDoc.trim()) ||
                        maskUid(p.investorId);

                      const displayName = censorShort(baseName);
                      const dateLabel = formatDate(p.createdAt);

                      return (
                        <View key={p.id} style={styles.bubble}>
                          <View style={styles.bubbleTopRow}>
                            <Text style={styles.bubbleName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            <Text style={styles.bubbleAmount} numberOfLines={1}>
                              {formatMoney(p.amount)}
                            </Text>
                          </View>

                          <Text style={styles.bubbleDate}>{dateLabel}</Text>
                        </View>
                      );
                    })}

                    {recentPledges.length > RECENT_PREVIEW_COUNT ? (
                      <Pressable onPress={toggleSeeMore} style={styles.seeMoreBubble}>
                        <Text style={styles.seeMoreBubbleText}>
                          {seeAllRecent ? "See less" : "See more"}
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                )}

                {!!recentError ? (
                  <Text style={[styles.metaSmall, { marginTop: 10 }]}>{recentError}</Text>
                ) : (
                  <Text style={[styles.metaSmall, { marginTop: 10 }]}>
                    (Names are partially hidden for privacy.)
                  </Text>
                )}
              </Card>
            </View>

            {/* RIGHT: sticky pledge panel on wide web only */}
            {isWebWide ? (
              <View style={styles.rightCol}>
                <View style={styles.stickyWrap}>{PledgePanel}</View>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

function formatMoney(n: any) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `${num.toLocaleString("en-US")} EUR`;
}

function formatApr(n: any) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return `${num}%`;
}

function formatDate(ts?: Timestamp | null) {
  if (!ts) return "—";
  const d = ts.toDate();
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskUid(uid: string) {
  if (!uid) return "User";
  const head = uid.slice(0, 3);
  return `${head}***`;
}

// requested: "first few letters then asterix"
function censorShort(name: string) {
  const s = String(name || "").trim();
  if (!s) return "User***";
  const head = s.slice(0, 3);
  return `${head}***`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  pageWrap: {
    flex: 1,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },

  scrollContent: {
    padding: Theme.spacing.lg,
    alignItems: Platform.OS === "web" ? "center" : "stretch",
  },

  layout: {
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1060 : undefined,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 14,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  leftCol: {
    flex: 1,
    width: "100%",
    gap: 14,
    minWidth: 0,
  },

  rightCol: {
    width: 360,
    display: Platform.OS === "web" ? "flex" : "none",
  },

  stickyWrap:
    Platform.OS === "web"
      ? ({
          position: "sticky" as any,
          top: 18,
        } as any)
      : ({} as any),

  title: { ...Theme.typography.title, marginBottom: Theme.spacing.sm, fontWeight: "400" as any },
  subtitle: {
    ...Theme.typography.subtitle,
    marginBottom: Theme.spacing.md,
    fontWeight: "400" as any,
  },

  section: { ...Theme.typography.title, marginBottom: Theme.spacing.md, fontWeight: "400" as any },

  meta: { fontSize: 13, color: Theme.colors.textMuted, fontWeight: "400" as any },
  metaSmall: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 6, fontWeight: "400" as any },
  metaStrong: { fontWeight: "400", color: Theme.colors.text },

  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 8,
  },
  progressFill: { height: "100%", backgroundColor: Theme.colors.primary },

  descHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  desc: { ...Theme.typography.body, fontWeight: "400" as any },

  chevBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  chev: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "400" as any },

  descMoreRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Theme.colors.surface,
  },
  descMoreText: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "400" as any },

  walletBox: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  walletText: { fontSize: 13, color: Theme.colors.textMuted, fontWeight: "400" as any },
  walletHint: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 4, fontWeight: "400" as any },

  helper: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 6, marginBottom: 10, fontWeight: "400" as any },
  disabledHint: { fontSize: 12, color: "#B45309", marginTop: 10, fontWeight: "400" as any },

  bubblesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: Platform.OS === "web" ? "center" : "flex-start",
    gap: 10,
    marginTop: 6,
  },

  bubble: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: Platform.OS === "web" ? 280 : "48%",
    flexGrow: 1,
  },

  bubbleTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },

  bubbleName: { flex: 1, minWidth: 0, fontSize: 13, color: Theme.colors.text, fontWeight: "400" },
  bubbleAmount: { fontSize: 14, color: Theme.colors.text, fontWeight: "700" }, // bold EUR
  bubbleDate: { marginTop: 6, fontSize: 12, color: Theme.colors.textMuted, fontWeight: "400" },

  seeMoreBubble: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 12,
    minWidth: Platform.OS === "web" ? 280 : "48%",
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  seeMoreBubbleText: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: "400",
  },
});
