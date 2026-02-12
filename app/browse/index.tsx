// app/browse/index.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Image,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";

import { db } from "../../src/firebase/config";
import { Theme } from "../../src/styles/Theme";

type Campaign = {
  id: string;
  title?: string;
  businessName?: string;
  description?: string;
  category?: string;
  riskLevel?: string;

  // Your schema fields
  goal?: number;
  raised?: number;
  demoRaised?: number;
  apr?: number;
  termMonths?: number;
  minInvestment?: number; // you use minInvestment elsewhere
  minimumInvestment?: number; // older naming in your type
  deadline?: string; // "12/26/2026"
  imageUrl?: string | null;
  featured?: boolean;
  status?: string;
  backers?: number; // optional if you store it; otherwise we show 0
};

const CATEGORIES = [
  "All",
  "Tech",
  "Real Estate",
  "Retail",
  "Manufacturing",
  "Services",
  "Hospitality",
  "Agriculture",
];

// ✅ replace later with your real default image (CDN / Firebase Storage)
const DEFAULT_IMAGE_URI =
  "https://via.placeholder.com/1200x600.png?text=LocalVesting+Campaign";

const BrowseScreen: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  // ✅ responsive columns like screenshot (3 on wide web)
  const columns = useMemo(() => {
    if (Platform.OS !== "web") return 1;
    if (width >= 1200) return 3;
    if (width >= 860) return 2;
    return 1;
  }, [width]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // ✅ IMPORTANT for your rules: only read active campaigns
        const qy = query(
          collection(db, "campaigns"),
          where("status", "==", "active")
        );

        const snap = await getDocs(qy);

        const data: Campaign[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        setCampaigns(data);
      } catch (e) {
        console.error("Failed to load campaigns", e);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const featuredCampaigns = useMemo(
    () => campaigns.filter((c) => c.featured).slice(0, 3),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !search ||
        `${c.title ?? ""} ${c.businessName ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        normalizeCategory(c.category) === normalizeCategory(activeCategory);

      return matchesSearch && matchesCategory;
    });
  }, [campaigns, search, activeCategory]);

  return (
    <View style={styles.root}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>P2P Lending Marketplace</Text>
          <Text style={styles.heroTitle}>
            Invest in{"\n"}growing businesses
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect directly with local businesses seeking funding. Earn predictable
            returns while supporting real projects you can visit.
          </Text>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Average Returns</Text>
              <Text style={styles.heroStatValue}>8–12% APR</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatLabel}>Active Campaigns</Text>
              <Text style={styles.heroStatValue}>{campaigns.length}</Text>
            </View>
          </View>
        </View>

        {/* FEATURED CAMPAIGNS */}
        {featuredCampaigns.length > 0 && (
          <View style={styles.featuredWrapper}>
            <View style={styles.featuredHeaderRow}>
              <Text style={styles.featuredTitle}>Featured campaigns</Text>
              <Text style={styles.featuredSubtitle}>
                Highlighted opportunities selected by our team
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScrollContent}
            >
              {featuredCampaigns.map((c) => (
                <View key={c.id} style={styles.featuredCardWrapper}>
                  <BrowseCampaignCard
                    campaign={c}
                    onPress={() => router.push(`/browse/${c.id}` as any)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* FILTER CARD */}
        <View style={styles.filterCard}>
          {/* Search row */}
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search campaigns or businesses..."
                placeholderTextColor="#9ca3af"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <Pressable
              onPress={() => setShowFilters((x) => !x)}
              style={styles.filterToggleButton}
            >
              <Text style={styles.filterToggleText}>
                {showFilters ? "Hide filters" : "Show filters"}
              </Text>
            </Pressable>
          </View>

          {/* Category pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[styles.categoryPill, active && styles.categoryPillActive]}
                  >
                    <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Extra filters (placeholder) */}
          {showFilters && (
            <View style={styles.extraFilters}>
              <View style={styles.extraFiltersRow}>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>Sort by</Text>
                  <View style={styles.extraFilterField}>
                    <Text style={styles.extraFilterFieldText}>Featured (ranking)</Text>
                  </View>
                </View>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>Risk level</Text>
                  <View style={styles.extraFilterField}>
                    <Text style={styles.extraFilterFieldText}>All risk levels</Text>
                  </View>
                </View>
              </View>

              <View style={styles.extraFiltersRow}>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>Min investment ($)</Text>
                  <View style={styles.rangeRow}>
                    <TextInput
                      style={styles.rangeInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      style={styles.rangeInput}
                      keyboardType="numeric"
                      placeholder="10000"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>Loan term (months)</Text>
                  <View style={styles.rangeRow}>
                    <TextInput
                      style={styles.rangeInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#9ca3af"
                    />
                    <TextInput
                      style={styles.rangeInput}
                      keyboardType="numeric"
                      placeholder="120"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.resetRow}>
                <Pressable style={styles.resetButton}>
                  <Text style={styles.resetButtonText}>Reset all filters</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* ALL CAMPAIGNS */}
        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>All campaigns</Text>
            <Text style={styles.listSubtitle}>
              {filteredCampaigns.length} campaigns available • Active only
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.campaignsGrid}>
            {filteredCampaigns.map((c) => (
              <View
                key={c.id}
                style={[
                  styles.campaignCardWrapper,
                  { width: `${100 / columns}%` },
                ]}
              >
                <BrowseCampaignCard
                  campaign={c}
                  onPress={() => router.push(`/browse/${c.id}` as any)}
                />
              </View>
            ))}

            {/* Add your campaign */}
            <View style={[styles.campaignCardWrapper, { width: `${100 / columns}%` }]}>
              <Pressable
                style={styles.addCampaignCard}
                onPress={() => router.push("/dashboard/createCampaign" as any)}
              >
                <View style={styles.addCampaignIconCircle}>
                  <Text style={styles.addCampaignIcon}>+</Text>
                </View>
                <Text style={styles.addCampaignTitle}>Add your campaign</Text>
                <Text style={styles.addCampaignSubtitle}>
                  Start raising funds for your business
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} LocalVesting • Connecting businesses with investors.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default BrowseScreen;

/* -----------------------------
   Card component (matches screenshot style)
------------------------------ */
function BrowseCampaignCard({
  campaign,
  onPress,
}: {
  campaign: Campaign;
  onPress: () => void;
}) {
  const imageUri = (campaign.imageUrl && campaign.imageUrl.trim()) || DEFAULT_IMAGE_URI;

  const goal = num(campaign.goal);
  const raised = num(campaign.raised);
  const demoRaised = num(campaign.demoRaised);
  const totalRaised = Math.max(0, raised); // show live only as main $ number (like screenshot)
  const fundedPct = goal > 0 ? clamp((raised / goal) * 100, 0, 100) : 0;

  const apr = campaign.apr ?? 0;
  const term = campaign.termMonths ?? 0;
  const backers = num(campaign.backers);

  const daysLeft = computeDaysLeft(campaign.deadline);

  const cat = (campaign.category ?? "category").toString();
  const risk = (campaign.riskLevel ?? "risk").toString();

  return (
    <Pressable onPress={onPress} style={cardStyles.card}>
      {/* image header */}
      <View style={cardStyles.imageWrap}>
        <Image source={{ uri: imageUri }} style={cardStyles.image} resizeMode="cover" />
        <View style={cardStyles.pillsRow}>
          <Pill text={cat} variant="category" />
          <Pill text={risk} variant="risk" />
        </View>
      </View>

      {/* content */}
      <View style={cardStyles.body}>
        <View style={cardStyles.businessRow}>
          <Text style={cardStyles.businessIcon}>🏢</Text>
          <Text style={cardStyles.businessName} numberOfLines={1}>
            {campaign.businessName || "—"}
          </Text>
        </View>

        <Text style={cardStyles.title} numberOfLines={1}>
          {campaign.title || "Untitled"}
        </Text>
        <Text style={cardStyles.desc} numberOfLines={2}>
          {campaign.description || ""}
        </Text>

        <View style={cardStyles.moneyRow}>
          <Text style={cardStyles.raisedValue}>{formatMoneyShort(totalRaised)}</Text>
          <Text style={cardStyles.goalText}>
            of {formatMoneyShort(goal || 0)}
          </Text>
        </View>

        <View style={cardStyles.progressTrack}>
          <View style={[cardStyles.progressFill, { width: `${fundedPct}%` }]} />
          {/* optional: show demoRaised tint (very subtle overlay) */}
          {goal > 0 && demoRaised > 0 ? (
            <View
              style={[
                cardStyles.progressDemoFill,
                { width: `${clamp((demoRaised / goal) * 100, 0, 100)}%` },
              ]}
            />
          ) : null}
        </View>
        <Text style={cardStyles.fundedText}>{fundedPct.toFixed(1)}% funded</Text>

        <View style={cardStyles.metricsRow}>
          <Metric label="APR" value={`${Math.round(apr)}%`} />
          <Metric label="Term" value={`${term}m`} />
          <Metric label="Backers" value={`${backers}`} />
        </View>

        <Text style={cardStyles.daysLeft}>{daysLeft}</Text>
      </View>
    </Pressable>
  );
}

function Pill({ text, variant }: { text: string; variant: "category" | "risk" }) {
  const t = (text || "").toString();
  const s = t.trim().length ? t.trim() : variant;

  const colors =
    variant === "category"
      ? { bg: "#E0F2FE", bd: "#BAE6FD", fg: "#0369A1" }
      : riskColors(s);

  return (
    <View style={[cardStyles.pill, { backgroundColor: colors.bg, borderColor: colors.bd }]}>
      <Text style={[cardStyles.pillText, { color: colors.fg }]} numberOfLines={1}>
        {s}
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={cardStyles.metric}>
      <Text style={cardStyles.metricValue}>{value}</Text>
      <Text style={cardStyles.metricLabel}>{label}</Text>
    </View>
  );
}

/* -----------------------------
   Utils
------------------------------ */
function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function normalizeCategory(s?: string) {
  return (s ?? "").trim().toLowerCase();
}

function formatMoneyShort(n: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

function computeDaysLeft(deadline?: string) {
  // expected "MM/DD/YYYY" (your example)
  if (!deadline) return "—";
  const d = parseDeadline(deadline);
  if (!d) return "—";
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return "0 days left";
  return `${days} days left`;
}

function parseDeadline(s: string) {
  const raw = String(s || "").trim();
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mm = Number(m[1]);
  const dd = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!mm || !dd || !yyyy) return null;
  const d = new Date(yyyy, mm - 1, dd, 23, 59, 59);
  return Number.isFinite(d.getTime()) ? d : null;
}

function riskColors(risk: string) {
  const r = risk.trim().toLowerCase();
  if (r.includes("low")) return { bg: "#DCFCE7", bd: "#BBF7D0", fg: "#166534" };
  if (r.includes("medium")) return { bg: "#FEF3C7", bd: "#FDE68A", fg: "#92400E" };
  if (r.includes("high")) return { bg: "#FEE2E2", bd: "#FECACA", fg: "#991B1B" };
  return { bg: "#EEF2FF", bd: "#E0E7FF", fg: "#3730A3" };
}

/* -----------------------------
   Styles
------------------------------ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f3f4f6" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // HERO
  hero: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroBadge: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 6, fontWeight: "500" },
  heroTitle: { fontSize: 28, fontWeight: "600", color: "#fff", marginBottom: 8 },
  heroSubtitle: { fontSize: 13, color: "rgba(240,247,255,0.95)", maxWidth: 480 },
  heroStatsRow: { flexDirection: "row", marginTop: 16 },
  heroStatCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginRight: 10,
  },
  heroStatLabel: { fontSize: 11, color: "rgba(226,232,240,0.9)", marginBottom: 2 },
  heroStatValue: { fontSize: 15, fontWeight: "400", color: "#fff" },

  // FEATURED
  featuredWrapper: {
    marginHorizontal: 16,
    marginTop: -18,
    backgroundColor: "#fff7e6",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffe4b5",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  featuredHeaderRow: { marginBottom: 8 },
  featuredTitle: { fontSize: 14, fontWeight: "600", color: "#92400e" },
  featuredSubtitle: { fontSize: 11, color: "#b45309" },
  featuredScrollContent: { paddingTop: 6, paddingBottom: 4 },
  featuredCardWrapper: { width: 360, marginRight: 12 },

  // FILTER CARD
  filterCard: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchRow: { flexDirection: "row", alignItems: "center" },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: { fontSize: 14, color: "#9ca3af", marginRight: 6 },
  searchInput: { flex: 1, fontSize: 13, color: "#111827" },
  filterToggleButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  filterToggleText: { fontSize: 12, fontWeight: "500", color: "#334155" },

  categoryScroll: { marginTop: 8 },
  categoryRow: { flexDirection: "row", alignItems: "center" },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  categoryPillActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  categoryPillText: { fontSize: 11, color: "#4b5563", fontWeight: "500" },
  categoryPillTextActive: { color: "#ffffff" },

  extraFilters: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 10 },
  extraFiltersRow: { flexDirection: "row", marginBottom: 8 },
  extraFilterCol: { flex: 1, marginRight: 8 },
  extraFilterLabel: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  extraFilterField: { backgroundColor: "#f1f5f9", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  extraFilterFieldText: { fontSize: 11, color: "#374151" },
  rangeRow: { flexDirection: "row" },
  rangeInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11,
    color: "#111827",
    marginRight: 6,
  },
  resetRow: { alignItems: "flex-end", marginTop: 4 },
  resetButton: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#f8fafc" },
  resetButtonText: { fontSize: 11, color: "#64748b" },

  // LIST
  listHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  listTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  listSubtitle: { fontSize: 11, color: "#64748b", marginTop: 2 },

  loadingBox: { marginTop: 20, alignItems: "center" },

  campaignsGrid: {
    marginTop: 10,
    marginHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  campaignCardWrapper: {
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  addCampaignCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 360,
    justifyContent: "center",
  },
  addCampaignIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addCampaignIcon: { fontSize: 26, color: "#2563eb" },
  addCampaignTitle: { fontSize: 13, fontWeight: "600", color: "#0f172a" },
  addCampaignSubtitle: { fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 4 },

  footer: { marginTop: 18, paddingHorizontal: 16, paddingBottom: 10, alignItems: "center" },
  footerText: { fontSize: 11, color: "#94a3b8" },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
    minHeight: 360,
  },

  imageWrap: {
    height: 160,
    backgroundColor: "#eef2ff",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  pillsRow: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    maxWidth: "55%",
  },
  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },

  body: {
    padding: 14,
  },

  businessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  businessIcon: {
    fontSize: 14,
    color: "#94a3b8",
  },
  businessName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },

  title: {
    fontSize: 18,
    color: "#0f172a",
    fontWeight: "400",
    marginBottom: 6,
  },
  desc: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 18,
    marginBottom: 10,
  },

  moneyRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  raisedValue: {
    fontSize: 26,
    fontWeight: "600",
    color: "#0f172a",
  },
  goalText: {
    fontSize: 12,
    color: "#64748b",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
  },
  progressDemoFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#60A5FA",
  },

  fundedText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },

  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    paddingTop: 10,
    marginTop: 2,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "400",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 11,
    color: "#64748b",
  },

  daysLeft: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
});
