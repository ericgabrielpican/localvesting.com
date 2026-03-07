// app/mybusinesses/[id].tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import { db, storage } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
import { Theme } from "../../src/styles/Theme";

type BusinessProfile = {
  id: string;
  ownerId?: string;
  businessName?: string;
  name?: string;
  profileImageUrl?: string;
  description?: string;
  website?: string;
  rating?: number;
  totalRaised?: number;
  successfulCampaigns?: number;
  management?: ManagementMember[];
};

type ManagementMember = {
  id: string;
  name: string;
  title: string;
  photoUrl?: string;
};

type CampaignItem = {
  id: string;
  title?: string;
  businessName?: string;
  description?: string;
  category?: string;
  riskLevel?: string;
  goal?: number;
  raised?: number;
  demoRaised?: number;
  apr?: number;
  termMonths?: number;
  minInvestment?: number;
  minimumInvestment?: number;
  deadline?: string;
  imageUrl?: string | null;
  featured?: boolean;
  status?: string;
  backers?: number;
  businessId?: string;
  businessOwnerUid?: string;
};

const DEFAULT_PROFILE =
  "https://via.placeholder.com/300x300.png?text=Business+Profile";

const DEFAULT_MEMBER =
  "https://via.placeholder.com/200x200.png?text=Member";

const DEFAULT_CAMPAIGN_IMAGE =
  "https://via.placeholder.com/1200x600.png?text=LocalVesting+Campaign";

export default function BusinessProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingManagement, setSavingManagement] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);

  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [management, setManagement] = useState<ManagementMember[]>([]);

  const [showAddManagementModal, setShowAddManagementModal] = useState(false);
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerTitle, setNewManagerTitle] = useState("");
  const [newManagerPhotoUrl, setNewManagerPhotoUrl] = useState("");

const isOwner = useMemo(() => {
  if (!user || !business) return false;
  return business.ownerId === user.uid;
}, [user, business]);
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        setLoading(true);

        const businessRef = doc(db, "businesses", String(id));
        const businessSnap = await getDoc(businessRef);

        if (!businessSnap.exists()) {
          Alert.alert("Not found", "This business profile does not exist.");
          router.back();
          return;
        }

        const businessData = {
          id: businessSnap.id,
          ...(businessSnap.data() as any),
        } as BusinessProfile;

        setBusiness(businessData);
        setDescription(businessData.description ?? "");
        setWebsite(businessData.website ?? "");
        setProfileImageUrl(businessData.profileImageUrl ?? "");
        setManagement(businessData.management ?? []);

        const qy = query(
          collection(db, "campaigns"),
          where("businessId", "==", businessSnap.id)
        );
        const campaignSnap = await getDocs(qy);

        const loadedCampaigns: CampaignItem[] = campaignSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }));

        const visibleCampaigns = loadedCampaigns.filter(
          (c) => c.status === "active" || c.status === "funded"
        );

        setCampaigns(visibleCampaigns);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load business profile.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, router]);

  const visibleCampaigns = useMemo(() => {
    if (showAllCampaigns) return campaigns;
    return campaigns.slice(0, 3);
  }, [campaigns, showAllCampaigns]);

  const starCount = Math.max(0, Math.min(5, Math.round(business?.rating ?? 0)));
  const totalRaised = Number(business?.totalRaised ?? 0);
  const successfulCampaigns = Number(business?.successfulCampaigns ?? 0);

  const pickAndUploadImage = async (path: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets?.length) return null;

    const asset = result.assets[0];
    const uri = asset.uri;

    const response = await fetch(uri);
    const blob = await response.blob();

    const ext =
      asset.fileName?.split(".").pop()?.toLowerCase() ||
      (asset.mimeType?.split("/").pop() ?? "jpg");

    const fileRef = storageRef(storage, `${path}.${ext}`);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const handleChangeProfilePhoto = async () => {
    if (!isOwner || !business) return;

    try {
      setUploadingPhoto(true);
      const url = await pickAndUploadImage(`businesses/${business.id}/profile`);
      if (!url) return;

      await updateDoc(doc(db, "businesses", business.id), {
        profileImageUrl: url,
        updatedAt: serverTimestamp(),
      });

      setProfileImageUrl(url);
      setBusiness((prev) => (prev ? { ...prev, profileImageUrl: url } : prev));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveDetails = async () => {
    if (!isOwner || !business) return;

    try {
      setSavingDetails(true);

      await updateDoc(doc(db, "businesses", business.id), {
        description: description.trim(),
        website: website.trim(),
        updatedAt: serverTimestamp(),
      });

      setBusiness((prev) =>
        prev
          ? {
              ...prev,
              description: description.trim(),
              website: website.trim(),
            }
          : prev
      );

      Alert.alert("Saved", "Business details updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save business details.");
    } finally {
      setSavingDetails(false);
    }
  };

  const updateManagementMember = (
    memberId: string,
    field: "name" | "title" | "photoUrl",
    value: string
  ) => {
    setManagement((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, [field]: value } : m))
    );
  };

  const removeManagementMember = (memberId: string) => {
    setManagement((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleChangeMemberPhoto = async (memberId: string) => {
    if (!isOwner || !business) return;

    try {
      setUploadingPhoto(true);
      const url = await pickAndUploadImage(
        `businesses/${business.id}/management/${memberId}`
      );
      if (!url) return;

      setManagement((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, photoUrl: url } : m))
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not upload member photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePickNewManagerPhoto = async () => {
    if (!isOwner || !business) return;

    try {
      setUploadingPhoto(true);
      const tempId = Math.random().toString(36).slice(2, 10);
      const url = await pickAndUploadImage(
        `businesses/${business.id}/management/${tempId}`
      );
      if (!url) return;
      setNewManagerPhotoUrl(url);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not upload manager photo.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddManagementPerson = () => {
    const cleanName = newManagerName.trim();
    const cleanTitle = newManagerTitle.trim();

    if (!cleanName || !cleanTitle) {
      Alert.alert("Missing info", "Please enter the person's name and role.");
      return;
    }

    setManagement((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 10),
        name: cleanName,
        title: cleanTitle,
        photoUrl: newManagerPhotoUrl.trim(),
      },
    ]);

    setNewManagerName("");
    setNewManagerTitle("");
    setNewManagerPhotoUrl("");
    setShowAddManagementModal(false);
  };

  const handleSaveManagement = async () => {
    if (!isOwner || !business) return;

    try {
      setSavingManagement(true);

      await updateDoc(doc(db, "businesses", business.id), {
        management,
        updatedAt: serverTimestamp(),
      });

      setBusiness((prev) => (prev ? { ...prev, management } : prev));
      Alert.alert("Saved", "Management section updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save management section.");
    } finally {
      setSavingManagement(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Theme.colors.primary} />
      </View>
    );
  }

  if (!business) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Business not found.</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerSection}>
            <Image
              source={{ uri: profileImageUrl || DEFAULT_PROFILE }}
              style={styles.profileImage}
            />

            {isOwner && (
              <Pressable
                onPress={handleChangeProfilePhoto}
                style={styles.editPhotoButton}
              >
                <Text style={styles.editPhotoButtonText}>
                  {uploadingPhoto ? "Uploading..." : "Edit photo"}
                </Text>
              </Pressable>
            )}

            <Text style={styles.businessName}>
              {business.businessName || business.name || "Business profile"}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.ratingBlock}>
                <Text style={styles.sectionMiniLabel}>Rating</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Text
                      key={n}
                      style={[
                        styles.star,
                        n <= starCount ? styles.starFilled : styles.starEmpty,
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.performanceBlock}>
                <Text style={styles.sectionMiniLabel}>Performance</Text>
                <Text style={styles.performanceValue}>
                  ${Math.round(totalRaised).toLocaleString()} /{" "}
                  {successfulCampaigns}
                </Text>
                <Text style={styles.performanceHint}>
                  Raised / successful campaigns
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Description</Text>
              {isOwner && (
                <Pressable
                  onPress={handleSaveDetails}
                  style={styles.inlineSaveButton}
                >
                  <Text style={styles.inlineSaveButtonText}>
                    {savingDetails ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              )}
            </View>

            <TextInput
              value={description}
              onChangeText={setDescription}
              editable={isOwner}
              multiline
              placeholder="Write a short description of the business..."
              placeholderTextColor="#9CA3AF"
              style={[styles.textArea, !isOwner && styles.readOnlyField]}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Website</Text>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              editable={isOwner}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://yourbusiness.com"
              placeholderTextColor="#9CA3AF"
              style={[styles.input, !isOwner && styles.readOnlyField]}
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Campaigns</Text>
            {campaigns.length > 3 && (
              <Pressable
                onPress={() => setShowAllCampaigns((prev) => !prev)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {showAllCampaigns ? "Show less" : "Show more"}
                </Text>
              </Pressable>
            )}
          </View>

          {visibleCampaigns.length === 0 ? (
            <Text style={styles.emptyText}>No campaigns available yet.</Text>
          ) : (
            <View style={styles.campaignsGrid}>
              {visibleCampaigns.map((campaign) => (
                <View key={campaign.id} style={styles.campaignCardWrapper}>
                  <BusinessCampaignCard
                    campaign={campaign}
                    onPress={() => router.push(`/browse/${campaign.id}` as any)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.managementHeader}>
            <Text style={styles.sectionTitle}>Management</Text>
            {isOwner && (
              <Pressable onPress={handleSaveManagement} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {savingManagement ? "Saving..." : "Save management"}
                </Text>
              </Pressable>
            )}
          </View>

          <View style={styles.managementGrid}>
            {management.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <Image
                  source={{ uri: member.photoUrl || DEFAULT_MEMBER }}
                  style={styles.memberPhoto}
                />

                <View style={styles.memberInfo}>
                  <TextInput
                    value={member.name}
                    onChangeText={(text) =>
                      updateManagementMember(member.id, "name", text)
                    }
                    editable={isOwner}
                    placeholder="Full name"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, !isOwner && styles.readOnlyField]}
                  />

                  <TextInput
                    value={member.title}
                    onChangeText={(text) =>
                      updateManagementMember(member.id, "title", text)
                    }
                    editable={isOwner}
                    placeholder="Role in company"
                    placeholderTextColor="#9CA3AF"
                    style={[styles.input, !isOwner && styles.readOnlyField]}
                  />
                </View>

                {isOwner && (
                  <View style={styles.memberActions}>
                    <Pressable
                      onPress={() => handleChangeMemberPhoto(member.id)}
                      style={styles.smallButton}
                    >
                      <Text style={styles.smallButtonText}>Photo</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => removeManagementMember(member.id)}
                      style={[styles.smallButton, styles.deleteButton]}
                    >
                      <Text style={styles.deleteButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}

            {isOwner && (
              <Pressable
                style={styles.addManagementCard}
                onPress={() => setShowAddManagementModal(true)}
              >
                <View style={styles.addManagementIconCircle}>
                  <Text style={styles.addManagementIcon}>+</Text>
                </View>
                <Text style={styles.addManagementTitle}>Add person</Text>
                <Text style={styles.addManagementSubtitle}>
                  Add someone from management
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showAddManagementModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddManagementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add management person</Text>

            <View style={styles.modalPhotoWrap}>
              <Image
                source={{ uri: newManagerPhotoUrl || DEFAULT_MEMBER }}
                style={styles.modalPhoto}
              />
              <Pressable
                onPress={handlePickNewManagerPhoto}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>
                  {uploadingPhoto ? "Uploading..." : "Upload photo"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              value={newManagerName}
              onChangeText={setNewManagerName}
              placeholder="Full name"
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <Text style={styles.modalLabel}>Role in company</Text>
            <TextInput
              value={newManagerTitle}
              onChangeText={setNewManagerTitle}
              placeholder="CEO, COO, Operations Manager..."
              placeholderTextColor="#9CA3AF"
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setShowAddManagementModal(false);
                  setNewManagerName("");
                  setNewManagerTitle("");
                  setNewManagerPhotoUrl("");
                }}
                style={[styles.secondaryButton, styles.modalButton]}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddManagementPerson}
                style={[styles.primaryButton, styles.modalButton]}
              >
                <Text style={styles.primaryButtonText}>Add person</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function BusinessCampaignCard({
  campaign,
  onPress,
}: {
  campaign: CampaignItem;
  onPress: () => void;
}) {
  const imageUri =
    (campaign.imageUrl && campaign.imageUrl.trim()) || DEFAULT_CAMPAIGN_IMAGE;

  const goal = num(campaign.goal);
  const raised = num(campaign.raised);
  const demoRaised = num(campaign.demoRaised);
  const totalRaised = Math.max(0, raised);
  const fundedPct = goal > 0 ? clamp((raised / goal) * 100, 0, 100) : 0;

  const apr = campaign.apr ?? 0;
  const term = campaign.termMonths ?? 0;
  const backers = num(campaign.backers);
  const daysLeft = computeDaysLeft(campaign.deadline);

  const cat = (campaign.category ?? "category").toString();
  const risk = (campaign.riskLevel ?? "risk").toString();

  return (
    <Pressable onPress={onPress} style={cardStyles.card}>
      <View style={cardStyles.imageWrap}>
        <Image
          source={{ uri: imageUri }}
          style={cardStyles.image}
          resizeMode="cover"
        />
        <View style={cardStyles.pillsRow}>
          <Pill text={cat} variant="category" />
          <Pill text={risk} variant="risk" />
        </View>
      </View>

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
          <Text style={cardStyles.raisedValue}>
            {formatMoneyShort(totalRaised)}
          </Text>
          <Text style={cardStyles.goalText}>
            of {formatMoneyShort(goal || 0)}
          </Text>
        </View>

        <View style={cardStyles.progressTrack}>
          <View
            style={[cardStyles.progressFill, { width: `${fundedPct}%` }]}
          />
          {goal > 0 && demoRaised > 0 ? (
            <View
              style={[
                cardStyles.progressDemoFill,
                { width: `${clamp((demoRaised / goal) * 100, 0, 100)}%` },
              ]}
            />
          ) : null}
        </View>

        <Text style={cardStyles.fundedText}>
          {fundedPct.toFixed(1)}% funded
        </Text>

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

function Pill({
  text,
  variant,
}: {
  text: string;
  variant: "category" | "risk";
}) {
  const t = (text || "").toString();
  const s = t.trim().length ? t.trim() : variant;

  const colors =
    variant === "category"
      ? { bg: "#E0F2FE", bd: "#BAE6FD", fg: "#0369A1" }
      : riskColors(s);

  return (
    <View
      style={[
        cardStyles.pill,
        { backgroundColor: colors.bg, borderColor: colors.bd },
      ]}
    >
      <Text
        style={[cardStyles.pillText, { color: colors.fg }]}
        numberOfLines={1}
      >
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

function num(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function formatMoneyShort(n: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "$0";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}

function computeDaysLeft(deadline?: string) {
  if (!deadline) return "—";
  const d = parseDeadline(deadline);
  if (!d) return "—";
  const now = new Date();
  const ms = d.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return "0 days left";
  return `${days} days left`;
}

function parseDeadline(s?: string) {
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
  if (r.includes("low"))
    return { bg: "#DCFCE7", bd: "#BBF7D0", fg: "#166534" };
  if (r.includes("medium"))
    return { bg: "#FEF3C7", bd: "#FDE68A", fg: "#92400E" };
  if (r.includes("high"))
    return { bg: "#FEE2E2", bd: "#FECACA", fg: "#991B1B" };
  return { bg: "#EEF2FF", bd: "#E0E7FF", fg: "#3730A3" };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 18,
  },
  headerSection: {
    alignItems: "center",
  },
  profileImage: {
    width: 132,
    height: 132,
    borderRadius: 999,
    marginBottom: 12,
    backgroundColor: "#E5E7EB",
  },
  editPhotoButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#111827",
    marginBottom: 10,
  },
  editPhotoButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
  },
  businessName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 14,
  },
  statsRow: {
    width: "100%",
    flexDirection: Platform.OS === "web" ? "row" : "column",
    gap: 14,
    justifyContent: "space-between",
  },
  ratingBlock: {
    flex: 1,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  performanceBlock: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionMiniLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  star: {
    fontSize: 26,
  },
  starFilled: {
    color: "#F59E0B",
  },
  starEmpty: {
    color: "#CBD5E1",
  },
  performanceValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },
  performanceHint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    marginTop: 18,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  inlineSaveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#EEF2FF",
  },
  inlineSaveButtonText: {
    color: "#3730A3",
    fontWeight: "600",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
    textAlignVertical: "top",
  },
  readOnlyField: {
    backgroundColor: "#F8FAFC",
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: "#3730A3",
    fontWeight: "600",
    fontSize: 13,
  },

  campaignsGrid: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  campaignCardWrapper: {
    width: Platform.OS === "web" ? "33.3333%" : "100%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  managementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  managementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  memberCard: {
    width: Platform.OS === "web" ? "50%" : "100%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  memberPhoto: {
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  memberInfo: {
    flex: 1,
    gap: 10,
  },
  memberActions: {
    gap: 8,
    marginTop: 10,
  },
  smallButton: {
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
  },
  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
  },
  deleteButtonText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "600",
  },
  memberInnerCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    minHeight: 250,
  },
  memberTop: {
    alignItems: "center",
    marginBottom: 12,
  },
  addManagementCard: {
    width: Platform.OS === "web" ? "50%" : "100%",
    marginBottom: 12,
    marginTop: 0,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    minHeight: 250,
    justifyContent: "center",
    marginHorizontal: 6,
  },
  addManagementIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  addManagementIcon: {
    fontSize: 26,
    color: "#2563EB",
  },
  addManagementTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  addManagementSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 14,
  },
  modalPhotoWrap: {
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  modalPhoto: {
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 6,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalButton: {
    minWidth: 120,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
  },
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