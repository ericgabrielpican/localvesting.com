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

type WalletType = "live" | "demo";

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

  // ✅ Wallet state (users/{uid}/wallet/main)
  const [walletLoading, setWalletLoading] = useState(true);
  const [walletLive, setWalletLive] = useState<number>(0);
  const [walletDemo, setWalletDemo] = useState<number>(0);

  const [walletType, setWalletType] = useState<WalletType>("live");

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

  // 2) Realtime wallet (users/{uid}/wallet/main)
  useEffect(() => {
    if (!user?.uid) {
      setWalletLive(0);
      setWalletDemo(0);
      setWalletLoading(false);
      return;
    }

    setWalletLoading(true);

    const walletRef = doc(db, "users", user.uid, "wallet", "main");

    const unsub = onSnapshot(
      walletRef,
      (snap) => {
        if (!snap.exists()) {
          setWalletLive(0);
          setWalletDemo(0);
        } else {
          const data: any = snap.data();
          const live = Number(data?.liveBalance ?? 0);
          const demo = Number(data?.demoBalance ?? 0);

          setWalletLive(Number.isFinite(live) ? Math.max(0, live) : 0);
          setWalletDemo(Number.isFinite(demo) ? Math.max(0, demo) : 0);
        }
        setWalletLoading(false);
      },
      (err) => {
        console.error("wallet snapshot error:", err);
        setWalletLive(0);
        setWalletDemo(0);
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
  const demoRaised = Number(campaign?.demoRaised ?? 0);
  const minInv = Number(campaign?.minInvestment ?? 0);
  const status = (campaign?.status ?? "").toString().toLowerCase();

  const remaining = useMemo(() => {
    if (!Number.isFinite(goal) || goal <= 0) return null;
    return Math.max(0, goal - raised);
  }, [goal, raised]);

  // ✅ Real pct splits
  const liveProgressPct = useMemo(() => {
    if (!Number.isFinite(goal) || goal <= 0) return 0;
    return Math.min(100, Math.max(0, (raised / goal) * 100));
  }, [goal, raised]);

  const demoProgressPct = useMemo(() => {
    if (!Number.isFinite(goal) || goal <= 0) return 0;
    return Math.min(100, Math.max(0, (demoRaised / goal) * 100));
  }, [goal, demoRaised]);

  // ✅ Deterministic social proof (0..25)
  const socialBasePct = useMemo(() => {
    return pseudoRandomPctFromId(campaignId, 25);
  }, [campaignId]);

  // ✅ Cap to 100 total. Social gets reduced first if needed.
  const socialShownPct = useMemo(() => {
    const maxSocial = Math.max(0, 100 - (liveProgressPct + demoProgressPct));
    return Math.min(socialBasePct, maxSocial);
  }, [socialBasePct, liveProgressPct, demoProgressPct]);

  // ✅ Live segment includes social + live
  const liveShownPct = useMemo(() => {
    return Math.min(100, socialShownPct + liveProgressPct);
  }, [socialShownPct, liveProgressPct]);

  // ✅ Demo sits after live
  const demoShownPct = useMemo(() => {
    const remainingForDemo = Math.max(0, 100 - liveShownPct);
    return Math.min(demoProgressPct, remainingForDemo);
  }, [demoProgressPct, liveShownPct]);

  const totalShownPct = useMemo(() => {
    return Math.min(100, liveShownPct + demoShownPct);
  }, [liveShownPct, demoShownPct]);

  const parsedAmount = useMemo(() => Number(amount), [amount]);

  const selectedBalance = useMemo(() => {
    return walletType === "live" ? walletLive : walletDemo;
  }, [walletType, walletLive, walletDemo]);

  const canPledge = useMemo(() => {
    if (!user) return false;
    if (pledging) return false;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return false;
    if (status !== "active") return false;
    if (Number.isFinite(minInv) && parsedAmount < minInv) return false;

    // Capacity check only for LIVE pledges (demo can exceed goal)
    if (walletType === "live") {
      if (remaining !== null && parsedAmount > remaining) return false;
    }

    if (selectedBalance < parsedAmount) return false;
    return true;
  }, [user, pledging, parsedAmount, status, minInv, remaining, selectedBalance, walletType]);

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

      const fnName = walletType === "live" ? "createLivePledge" : "createDemoPledge";
      const fn = httpsCallable(functions, fnName);

      // backend ignores walletType in your current callable input types, but safe to send
      await fn({ campaignId, amount: amt, walletType });

      Alert.alert("Success", "Pledge confirmed!");
      setAmount("");
    } catch (e: any) {
      const msg =
        e?.message ||
        e?.details ||
        (walletType === "demo"
          ? "Demo pledging is not enabled on the backend yet."
          : "Could not confirm pledge. Please try again.");
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

  const BalanceToggle = (
    <View style={styles.balanceToggleRow}>
      <Pressable
        onPress={() => setWalletType("live")}
        style={[
          styles.balanceToggleBtn,
          walletType === "live" ? styles.balanceToggleBtnActive : null,
        ]}
      >
        <Text
          style={[
            styles.balanceToggleText,
            walletType === "live" ? styles.balanceToggleTextActive : null,
          ]}
        >
          Balance
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setWalletType("demo")}
        style={[
          styles.balanceToggleBtn,
          walletType === "demo" ? styles.balanceToggleBtnActive : null,
        ]}
      >
        <Text
          style={[
            styles.balanceToggleText,
            walletType === "demo" ? styles.balanceToggleTextActive : null,
          ]}
        >
          Demo Balance
        </Text>
      </Pressable>
    </View>
  );

  const PledgePanel = (
    <Card>
      <Text style={styles.section}>Invest / Pledge</Text>

      <View style={styles.walletBox}>
        <Text style={styles.walletText}>
          Balance:{" "}
          {walletLoading ? (
            <Text style={styles.metaStrong}>Loading…</Text>
          ) : (
            <Text style={styles.metaStrong}>{formatMoney(walletLive)}</Text>
          )}
        </Text>

        <Text style={[styles.walletText, { marginTop: 6 }]}>
          Demo Balance:{" "}
          {walletLoading ? (
            <Text style={styles.metaStrong}>Loading…</Text>
          ) : (
            <Text style={styles.metaStrong}>{formatMoney(walletDemo)}</Text>
          )}
        </Text>

        <Text style={styles.walletHint}>Choose which balance to use for this pledge:</Text>

        {BalanceToggle}

        <Text style={styles.walletHint}>
          Selected:{" "}
          <Text style={styles.metaStrong}>
            {walletType === "live" ? "Balance" : "Demo Balance"} (
            {walletLoading ? "…" : formatMoney(selectedBalance)})
          </Text>
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
        label={
          pledging
            ? "Processing..."
            : walletType === "live"
            ? "Confirm pledge"
            : "Confirm demo pledge"
        }
        onPress={pledge}
        disabled={!canPledge}
      />

      {!canPledge ? (
        <Text style={styles.disabledHint}>
          {user
            ? selectedBalance < parsedAmount
              ? `Not enough ${walletType === "live" ? "balance" : "demo balance"}.`
              : walletType === "live" && remaining !== null && parsedAmount > remaining
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

                  {/* ✅ Stacked progress bar (ghost + live + demo) */}
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressGhost, { width: `${socialShownPct}%` }]} />
                    <View style={[styles.progressLive, { width: `${liveShownPct}%` }]} />
                    <View
                      style={[
                        styles.progressDemo,
                        { left: `${liveShownPct}%`, width: `${demoShownPct}%` },
                      ]}
                    />
                  </View>

                  <Text style={styles.metaSmall}>
                    Live: <Text style={styles.metaStrong}>{formatMoney(raised)}</Text> • Demo:{" "}
                    <Text style={styles.metaStrong}>{formatMoney(demoRaised)}</Text>
                   
                    {remaining !== null ? (
                      <>
                        {" "}
                        • Remaining:{" "}
                        <Text style={styles.metaStrong}>{formatMoney(remaining)}</Text>
                      </>
                    ) : null}  
                  </Text>

                  
                  <Text style={styles.metaSmall}>
                   Status: <Text style={styles.metaStrong}>{status || "unknown"}</Text>

                </Text>

                  <Text style={styles.metaSmall}>
                    APR: <Text style={styles.metaStrong}>{formatApr(campaign.apr)}</Text> • Min:{" "}
                    <Text style={styles.metaStrong}>{formatMoney(minInv)}</Text> • Term:{" "}
                    <Text style={styles.metaStrong}>{campaign.termMonths ?? "-"} mo</Text>
                  </Text>

                  <Text style={styles.metaSmall}>
                    Progress shown: <Text style={styles.metaStrong}>{totalShownPct.toFixed(0)}%</Text>{" "}
                    {/* (live: <Text style={styles.metaStrong}>{liveProgressPct.toFixed(0)}%</Text>, demo:{" "} */}
                    {/* <Text style={styles.metaStrong}>{demoProgressPct.toFixed(0)}%</Text>) */}
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
  typeof nameFromUserDoc === "string" &&
  nameFromUserDoc.trim().length > 0
    ? nameFromUserDoc.trim()
    : "User";

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

function censorShort(name: string) {
  const s = String(name || "").trim();
  if (!s) return "User***";
  const head = s.slice(0, 3);
  return `${head}***`;
}

// ✅ deterministic pseudo-random 0..maxPct based on campaignId string
function pseudoRandomPctFromId(id: string, maxPct: number) {
  if (!id) return 0;
  let h = 2166136261; // FNV-ish
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const x = (h >>> 0) / 4294967295;
  const pct = x * Math.max(0, maxPct);
  return Math.max(0, Math.min(maxPct, pct));
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

  // ✅ Stacked progress bar styles
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 8,
    position: "relative",
  },
  progressGhost: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#FEF3C7", // pale amber
  },
  progressLive: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#F59E0B", // amber (live)
  },
  progressDemo: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#60A5FA", // blue (demo)
  },

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
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  walletText: { fontSize: 13, color: Theme.colors.textMuted, fontWeight: "400" as any },
  walletHint: { fontSize: 12, color: Theme.colors.textMuted, marginTop: 8, fontWeight: "400" as any },

  balanceToggleRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  balanceToggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#ffffff",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceToggleBtnActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FEF3C7",
  },
  balanceToggleText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    fontWeight: "400",
  },
  balanceToggleTextActive: {
    color: "#92400E",
    fontWeight: "600",
  },

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
  bubbleAmount: { fontSize: 14, color: Theme.colors.text, fontWeight: "700" },
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
