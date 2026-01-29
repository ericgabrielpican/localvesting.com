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
} from "react-native";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../src/firebase/config";
import CampaignCard from "../../src/components/CampaignCard";
import { Theme } from "../../src/styles/Theme";

type Campaign = {
  id: string;
  title?: string;
  businessName?: string;
  description?: string;
  category?: string;
  riskLevel?: string;
  minimumInvestment?: number;
  apr?: number;
  termMonths?: number;
  featured?: boolean;
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

const BrowseScreen: React.FC = () => {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "campaigns"));
        const data: Campaign[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));
        setCampaigns(data);
      } catch (e) {
        console.error("Failed to load campaigns", e);
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
        (c.category ?? "").toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [campaigns, search, activeCategory]);

  return (
    <View style={styles.root}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Text style={styles.heroBadge}>P2P Lending Marketplace</Text>
          <Text style={styles.heroTitle}>
            Invest in{"\n"}growing businesses
          </Text>
          <Text style={styles.heroSubtitle}>
            Connect directly with local businesses seeking funding. Earn
            predictable returns while supporting real projects you can visit.
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
                  <CampaignCard campaign={c} />
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => {
                const active = cat === activeCategory;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    style={[
                      styles.categoryPill,
                      active && styles.categoryPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        active && styles.categoryPillTextActive,
                      ]}
                    >
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
                    <Text style={styles.extraFilterFieldText}>
                      Featured (ranking)
                    </Text>
                  </View>
                </View>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>Risk level</Text>
                  <View style={styles.extraFilterField}>
                    <Text style={styles.extraFilterFieldText}>
                      All risk levels
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.extraFiltersRow}>
                <View style={styles.extraFilterCol}>
                  <Text style={styles.extraFilterLabel}>
                    Min investment ($)
                  </Text>
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
                  <Text style={styles.extraFilterLabel}>
                    Loan term (months)
                  </Text>
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
              {filteredCampaigns.length} campaigns available • Sorted by ranking
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
              <View key={c.id} style={styles.campaignCardWrapper}>
                <CampaignCard campaign={c} />
              </View>
            ))}

            {/* Add your campaign */}
            <View style={styles.campaignCardWrapper}>
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
            © {new Date().getFullYear()} LocalVesting • Connecting businesses
            with investors.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default BrowseScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // HERO
  hero: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  heroBadge: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 6,
    fontWeight: "500",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(240,247,255,0.95)",
    maxWidth: 480,
  },
  heroStatsRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  heroStatCard: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    marginRight: 10,
  },
  heroStatLabel: {
    fontSize: 11,
    color: "rgba(226,232,240,0.9)",
    marginBottom: 2,
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

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
  featuredHeaderRow: {
    marginBottom: 8,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400e",
  },
  featuredSubtitle: {
    fontSize: 11,
    color: "#b45309",
  },
  featuredScrollContent: {
    paddingTop: 6,
    paddingBottom: 4,
  },
  featuredCardWrapper: {
    width: 260,
    marginRight: 12,
  },

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
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchIcon: {
    fontSize: 14,
    color: "#9ca3af",
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
  },
  filterToggleButton: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#334155",
  },

  categoryScroll: {
    marginTop: 8,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  categoryPillText: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "500",
  },
  categoryPillTextActive: {
    color: "#ffffff",
  },

  extraFilters: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  extraFiltersRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  extraFilterCol: {
    flex: 1,
    marginRight: 8,
  },
  extraFilterLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  extraFilterField: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  extraFilterFieldText: {
    fontSize: 11,
    color: "#374151",
  },
  rangeRow: {
    flexDirection: "row",
  },
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
  resetRow: {
    alignItems: "flex-end",
    marginTop: 4,
  },
  resetButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#f8fafc",
  },
  resetButtonText: {
    fontSize: 11,
    color: "#64748b",
  },

  // LIST
  listHeader: {
    marginTop: 20,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  listSubtitle: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },

  loadingBox: {
    marginTop: 20,
    alignItems: "center",
  },

  campaignsGrid: {
    marginTop: 10,
    marginHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  campaignCardWrapper: {
    width: "100%",
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
  addCampaignIcon: {
    fontSize: 26,
    color: "#2563eb",
  },
  addCampaignTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  addCampaignSubtitle: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    marginTop: 4,
  },

  footer: {
    marginTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: "#94a3b8",
  },
});
