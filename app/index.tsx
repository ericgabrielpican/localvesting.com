// app/index.tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../src/context/AuthContext";
import { listCampaigns } from "../src/services/campaigns";
import { listReviews } from "../src/services/reviews";
import { Campaign, Review } from "../src/types/entities";
import CampaignCard from "../src/components/CampaignCard";
import PrimaryButton from "../src/components/PrimaryButton";

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [c, r] = await Promise.all([listCampaigns(), listReviews()]);
        if (mounted) {
          setCampaigns(c);
          setReviews(r);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const avgByCampaign = useMemo(() => {
    const grouped: Record<
      string,
      { total: number; count: number }
    > = {};

    for (const rev of reviews) {
      if (!grouped[rev.campaign_id]) {
        grouped[rev.campaign_id] = { total: 0, count: 0 };
      }
      grouped[rev.campaign_id].total += rev.rating;
      grouped[rev.campaign_id].count += 1;
    }

    const result: Record<
      string,
      { average: number; count: number }
    > = {};
    for (const [id, { total, count }] of Object.entries(grouped)) {
      result[id] = { average: total / count, count };
    }
    return result;
  }, [reviews]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (
        search &&
        !`${c.title} ${c.business_name}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        return false;
      }
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [campaigns, search, selectedCategory]);

  if (loading) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text>Loading campaigns...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 16,
            alignItems: "center",
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                marginBottom: 4,
              }}
            >
              Invest in local businesses
            </Text>
            <Text style={{ color: "#6b7280", fontSize: 13 }}>
              Discover campaigns from cafés, restaurants, and local projects in
              your city.
            </Text>
          </View>

          {user ? (
            <TouchableOpacity onPress={() => router.push("/dashboard")}>
              <Text style={{ color: "#2563eb", fontSize: 13 }}>
                Dashboard
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push("/login")}>
              <Text style={{ color: "#2563eb", fontSize: 13 }}>Log in</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search */}
        <TextInput
          placeholder="Search campaigns or businesses"
          value={search}
          onChangeText={setSearch}
          style={{
            borderWidth: 1,
            borderColor: "#ddd",
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 12,
            backgroundColor: "white",
          }}
        />

        {/* Categories */}
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {["all", "food", "coffee", "retail", "services"].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginRight: 8,
                backgroundColor:
                  selectedCategory === cat ? "#111827" : "#e5e7eb",
              }}
            >
              <Text
                style={{
                  color: selectedCategory === cat ? "white" : "#111827",
                  fontSize: 12,
                }}
              >
                {cat === "all" ? "All" : cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Campaign list */}
        {filteredCampaigns.map((campaign) => {
          const stats = avgByCampaign[campaign.id] ?? {
            average: 0,
            count: 0,
          };
          return (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              averageRating={
                stats.count > 0 ? stats.average : null
              }
              reviewCount={stats.count}
              onPress={() =>
                router.push(`/campaign/${campaign.id}`)
              }
            />
          );
        })}

        {/* CTA for business owners */}
        {user && (
          <View style={{ marginTop: 24 }}>
            <PrimaryButton
              label="Go to dashboard"
              onPress={() => router.push("/dashboard")}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
