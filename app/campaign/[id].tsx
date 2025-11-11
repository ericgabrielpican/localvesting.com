// app/campaign/[id].tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useAuth } from "../../src/context/AuthContext";
import { getCampaignById } from "../../src/services/campaigns";
import {
  listReviewsForCampaign,
  addReview,
} from "../../src/services/reviews";
import { createInvestment } from "../../src/services/investments";
import { Campaign, Review } from "../../src/types/entities";
import PrimaryButton from "../../src/components/PrimaryButton";

const CampaignDetailsScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const [investmentAmount, setInvestmentAmount] = useState<string>("");
  const [investing, setInvesting] = useState(false);

  const [reviewRating, setReviewRating] = useState<string>("");
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      try {
        const [c, r] = await Promise.all([
          getCampaignById(id),
          listReviewsForCampaign(id),
        ]);
        if (mounted) {
          setCampaign(c);
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
  }, [id]);

  const ratingStats = useMemo(() => {
    if (!reviews.length) return { average: null as number | null, count: 0 };
    const sum = reviews.reduce(
      (acc, r) => acc + (r.rating || 0),
      0
    );
    return {
      average: sum / reviews.length,
      count: reviews.length,
    };
  }, [reviews]);

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Loading campaign...</Text>
      </SafeAreaView>
    );
  }

  if (!campaign) {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Text>Campaign not found.</Text>
      </SafeAreaView>
    );
  }

  const fundingPercentage =
    campaign.funding_goal > 0
      ? (campaign.current_funding / campaign.funding_goal) * 100
      : 0;

  const deadlineDate = campaign.deadline
    ? new Date(campaign.deadline)
    : null;

  const daysLeft = deadlineDate
    ? Math.max(
        0,
        Math.ceil(
          (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      )
    : null;

  const handleInvest = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to invest.");
      return;
    }
    const amount = parseFloat(investmentAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a valid amount.");
      return;
    }
    if (amount < (campaign.min_investment || 0)) {
      Alert.alert(
        "Minimum investment",
        `Minimum investment is ${campaign.min_investment} EUR.`
      );
      return;
    }

    try {
      setInvesting(true);
      await createInvestment({
        campaignId: campaign.id,
        amount,
        userEmail: user.email ?? "",
      });
      Alert.alert("Success", "Investment registered.");
      setInvestmentAmount("");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Investment failed. Please try again.");
    } finally {
      setInvesting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      Alert.alert("Login required", "Please log in to leave a review.");
      return;
    }
    const rating = parseInt(reviewRating, 10);
    if (!rating || rating < 1 || rating > 5) {
      Alert.alert("Invalid rating", "Please enter a rating between 1 and 5.");
      return;
    }
    if (!reviewComment.trim()) {
      Alert.alert("Empty comment", "Please write a short comment.");
      return;
    }

    try {
      setReviewSubmitting(true);
      await addReview({
        campaignId: campaign.id,
        userEmail: user.email ?? "",
        rating,
        comment: reviewComment.trim(),
      });
      const updated = await listReviewsForCampaign(campaign.id);
      setReviews(updated);
      setReviewRating("");
      setReviewComment("");
      Alert.alert("Thank you!", "Your review has been submitted.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginBottom: 12 }}
        >
          <Text style={{ color: "#2563eb" }}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            marginBottom: 4,
          }}
        >
          {campaign.title}
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 4 }}>
          {campaign.business_name} • {campaign.city}
        </Text>
        <Text style={{ color: "#6b7280", marginBottom: 12 }}>
          Category: {campaign.category} • Risk: {campaign.risk_profile}
        </Text>

        {/* Description */}
        <Text style={{ marginBottom: 16, color: "#374151" }}>
          {campaign.description}
        </Text>

        {/* Funding progress */}
        <View style={{ marginBottom: 12 }}>
          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: "#e5e7eb",
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: 8,
                width: `${Math.min(fundingPercentage, 100)}%`,
                backgroundColor: "#10b981",
              }}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12, color: "#374151" }}>
              {campaign.current_funding.toLocaleString()} /{" "}
              {campaign.funding_goal.toLocaleString()} EUR
            </Text>
            {daysLeft != null && (
              <Text style={{ fontSize: 12, color: "#6b7280" }}>
                {daysLeft} days left
              </Text>
            )}
          </View>
        </View>

        {/* Invest box */}
        <View
          style={{
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            backgroundColor: "#f9fafb",
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              marginBottom: 8,
              color: "#111827",
            }}
          >
            Invest in this campaign
          </Text>
          <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            Minimum investment: {campaign.min_investment} EUR
          </Text>
          <TextInput
            placeholder="Amount in EUR"
            keyboardType="numeric"
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginBottom: 8,
              backgroundColor: "white",
            }}
          />
          <PrimaryButton
            label={investing ? "Processing..." : "Invest"}
            onPress={handleInvest}
            disabled={investing}
          />
        </View>

        {/* Reviews */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              marginBottom: 4,
            }}
          >
            Reviews
          </Text>
          <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
            {ratingStats.average
              ? `⭐ ${ratingStats.average.toFixed(1)} (${ratingStats.count} reviews)`
              : "No reviews yet"}
          </Text>

          {reviews.map((rev) => (
            <View
              key={rev.id}
              style={{
                borderWidth: 1,
                borderColor: "#e5e7eb",
                borderRadius: 8,
                padding: 8,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  marginBottom: 4,
                }}
              >
                {rev.user_email} • ⭐ {rev.rating}
              </Text>
              <Text style={{ fontSize: 14, color: "#111827" }}>
                {rev.comment}
              </Text>
            </View>
          ))}

          {/* Add review */}
          <View
            style={{
              borderWidth: 1,
              borderColor: "#e5e7eb",
              borderRadius: 8,
              padding: 8,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontWeight: "600",
                marginBottom: 8,
                color: "#111827",
              }}
            >
              Leave a review
            </Text>
            <TextInput
              placeholder="Rating (1–5)"
              keyboardType="numeric"
              value={reviewRating}
              onChangeText={setReviewRating}
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
                backgroundColor: "white",
              }}
            />
            <TextInput
              placeholder="Your comment"
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 8,
                backgroundColor: "white",
                minHeight: 60,
                textAlignVertical: "top",
              }}
            />
            <PrimaryButton
              label={reviewSubmitting ? "Submitting..." : "Submit review"}
              onPress={handleSubmitReview}
              disabled={reviewSubmitting}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CampaignDetailsScreen;
