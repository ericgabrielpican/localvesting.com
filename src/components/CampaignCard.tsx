// src/components/CampaignCard.tsx
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";

interface CampaignCardProps {
  campaign: any;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/browse/${campaign.id}` as any)}
    >
      {campaign.image ? (
        <Image source={{ uri: campaign.image }} style={styles.image} />
      ) : null}

      <View>
        <Text style={styles.title}>{campaign.title}</Text>
        <Text style={styles.category}>{campaign.category}</Text>

        <View style={styles.row}>
          <Text style={styles.meta}>
            Goal: €{Number(campaign.goal || 0).toLocaleString()}
          </Text>
          <Text style={styles.apr}>APR {campaign.apr}%</Text>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.raised}>
            Raised: €{Number(campaign.raised || 0).toLocaleString()}
          </Text>
          <Text style={styles.status}>
            {campaign.status === "active" ? "Active" : "Closed"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#4b5563",
  },
  apr: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  raised: {
    fontSize: 12,
    color: "#4b5563",
  },
  status: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
});

export default CampaignCard;
