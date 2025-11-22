// app/dashboard/createCampaign.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import Navbar from "../../src/components/Navbar";
import TextField from "../../src/components/ui/TextField";
import Button from "../../src/components/ui/Button";
import { Theme } from "../../src/styles/Theme";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";
// import LocationPickerModal from "../../src/components/LocationPickerModal";

interface Business {
  id: string;
  name: string;
  address?: string;
}

const CATEGORIES = [
  "Restaurant",
  "Café / Coffee shop",
  "Bar / Pub",
  "Retail",
  "Services",
  "Other",
];

const RISK_LEVELS = ["Low", "Medium", "High"];

export default function CreateCampaign() {
  const router = useRouter();
  const { user } = useAuth();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);

  const [category, setCategory] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [riskOpen, setRiskOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [campaignAddress, setCampaignAddress] = useState("");
  const [goal, setGoal] = useState("50000");
  const [minInvestment, setMinInvestment] = useState("100");
  const [apr, setApr] = useState("8.5");
  const [termMonths, setTermMonths] = useState("12");
  const [deadline, setDeadline] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // NEW: location state
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    const loadBusinesses = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "businesses"),
          where("ownerId", "==", user.uid),
          where("verified", "==", true)
        );
        const snap = await getDocs(q);
        const list: Business[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? "Unnamed business",
            address: data.address,
          };
        });
        setBusinesses(list);
        if (list.length > 0) setBusinessId(list[0].id);
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load businesses");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
  }, [user]);

  const selectedBusiness = businesses.find((b) => b.id === businessId);

  const validate = () => {
    if (!selectedBusiness) {
      Alert.alert("Business required", "Please select a verified business.");
      return false;
    }
    if (!title.trim()) {
      Alert.alert("Title required", "Please enter a campaign title.");
      return false;
    }
    if (!desc.trim()) {
      Alert.alert("Description required", "Please describe the campaign.");
      return false;
    }
    if (!campaignAddress.trim()) {
      Alert.alert("Address required", "Please enter the campaign address.");
      return false;
    }
    if (!category) {
      Alert.alert("Category required", "Please select a category.");
      return false;
    }
    if (!riskLevel) {
      Alert.alert("Risk level required", "Please select a risk level.");
      return false;
    }

    const goalNum = Number(goal);
    const minNum = Number(minInvestment);
    const aprNum = Number(apr);
    const termNum = Number(termMonths);

    if (!goalNum || goalNum <= 0) {
      Alert.alert("Invalid goal", "Funding goal must be a positive number.");
      return false;
    }
    if (!minNum || minNum <= 0) {
      Alert.alert(
        "Invalid minimum",
        "Minimum investment must be a positive number."
      );
      return false;
    }
    if (!aprNum || aprNum <= 0) {
      Alert.alert(
        "Invalid APR",
        "Interest rate (APR) must be a positive number."
      );
      return false;
    }
    if (!termNum || termNum <= 0) {
      Alert.alert(
        "Invalid loan term",
        "Loan term must be a positive number of months."
      );
      return false;
    }
    if (!deadline.trim()) {
      Alert.alert("Deadline required", "Please enter a campaign deadline.");
      return false;
    }

    return true;
  };

  const createCampaign = async () => {
    if (!user) {
      Alert.alert("Not logged in", "Please log in again.");
      return;
    }

    if (!validate()) return;

    try {
      setSubmitting(true);

      const goalNum = Number(goal);
      const minNum = Number(minInvestment);
      const aprNum = Number(apr);
      const termNum = Number(termMonths);

      await addDoc(collection(db, "campaigns"), {
        ownerId: user.uid,
        businessId: selectedBusiness?.id,
        businessName: selectedBusiness?.name,
        title: title.trim(),
        description: desc.trim(),
        address: campaignAddress.trim(),
        category,
        riskLevel,
        goal: goalNum,
        minInvestment: minNum,
        apr: aprNum,
        termMonths: termNum,
        deadline: deadline.trim(),
        imageUrl: imageUrl.trim() || null,
        status: "active",
        raised: 0,
        location: locationCoords
          ? {
              latitude: locationCoords.latitude,
              longitude: locationCoords.longitude,
            }
          : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Success", "Campaign created.");
      router.replace("/dashboard" as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", e?.message ?? "Could not create campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    router.back();
  };

  return (
    <Screen>
      <Navbar />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.heading}>Create Campaign</Text>

          {/* SELECT BUSINESS */}
          <Text style={styles.label}>Select Business *</Text>
          <Text style={styles.helper}>
            Choose which verified business is posting this campaign
          </Text>

          {loadingBusinesses ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator />
            </View>
          ) : businesses.length === 0 ? (
            <Text style={styles.warning}>
              You have no verified businesses. Please add a business and wait
              for verification before creating a campaign.
            </Text>
          ) : (
            <View style={{ marginBottom: Theme.spacing.md }}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setBusinessDropdownOpen((v) => !v)}
              >
                <Text style={styles.dropdownText}>
                  {selectedBusiness
                    ? `${selectedBusiness.name}${
                        selectedBusiness.address
                          ? " – " + selectedBusiness.address
                          : ""
                      }`
                    : "Select business"}
                </Text>
              </TouchableOpacity>
              {businessDropdownOpen && (
                <View style={styles.dropdownList}>
                  {businesses.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setBusinessId(b.id);
                        setBusinessDropdownOpen(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>
                        {b.name}
                        {b.address ? " – " + b.address : ""}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TITLE */}
          <TextField
            label="Campaign Title *"
            placeholder="e.g., Expand Our Manufacturing Facility"
            value={title}
            onChangeText={setTitle}
          />

          {/* DESCRIPTION */}
          <TextField
            label="Description *"
            placeholder="Describe what you'll use the funds for..."
            value={desc}
            onChangeText={setDesc}
            multiline
            style={{ height: 100, textAlignVertical: "top" }}
          />

          {/* ADDRESS + FIND */}
          <TextField
            label="Campaign Address *"
            placeholder="Enter campaign/project address..."
            value={campaignAddress}
            onChangeText={setCampaignAddress}
          />

          <Button
            label={
              locationCoords
                ? "Adjust Pin Location on Map"
                : "Find on Map (OpenStreetMap)"
            }
            variant="secondary"
            onPress={() => setLocationModalVisible(true)}
          />

          {/* CATEGORY */}
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setCategoryOpen((v) => !v)}
          >
            <Text style={styles.dropdownText}>
              {category ?? "Select category"}
            </Text>
          </TouchableOpacity>
          {categoryOpen && (
            <View style={styles.dropdownList}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategory(c);
                    setCategoryOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* RISK LEVEL */}
          <Text style={[styles.label, { marginTop: Theme.spacing.md }]}>
            Risk Level *
          </Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setRiskOpen((v) => !v)}
          >
            <Text style={styles.dropdownText}>
              {riskLevel ?? "Select risk level"}
            </Text>
          </TouchableOpacity>
          {riskOpen && (
            <View style={styles.dropdownList}>
              {RISK_LEVELS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setRiskLevel(r);
                    setRiskOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* FINANCIALS */}
          <TextField
            label="Funding Goal ($) *"
            placeholder="50000"
            value={goal}
            onChangeText={setGoal}
            keyboardType="numeric"
          />
          <TextField
            label="Minimum Investment ($) *"
            placeholder="100"
            value={minInvestment}
            onChangeText={setMinInvestment}
            keyboardType="numeric"
          />
          <TextField
            label="Interest Rate (APR %) *"
            placeholder="8.5"
            value={apr}
            onChangeText={setApr}
            keyboardType="numeric"
          />
          <TextField
            label="Loan Term (Months) *"
            placeholder="12"
            value={termMonths}
            onChangeText={setTermMonths}
            keyboardType="numeric"
          />

          {/* DEADLINE */}
          <TextField
            label="Campaign Deadline *"
            placeholder="mm/dd/yyyy"
            value={deadline}
            onChangeText={setDeadline}
          />

          {/* IMAGE URL */}
          <TextField
            label="Campaign Image (URL)"
            placeholder="Paste image URL (optional)"
            value={imageUrl}
            onChangeText={setImageUrl}
          />

          {/* ACTIONS */}
          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={cancel} />
            <Button
              label={submitting ? "Creating..." : "Create Campaign"}
              onPress={createCampaign}
              disabled={
                submitting || loadingBusinesses || businesses.length === 0
              }
            />
          </View>
        </Card>
      </ScrollView>

      {/* OSM Location Picker */}
      {/* <LocationPickerModal
        visible={locationModalVisible}
        address={campaignAddress}
        initialCoords={locationCoords}
        onClose={() => setLocationModalVisible(false)}
        onConfirm={(data) => {
          setLocationCoords({
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setLocationModalVisible(false);
        }}
      /> */}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  heading: {
    ...Theme.typography.title,
    marginBottom: Theme.spacing.lg,
  },
  label: {
    ...Theme.typography.label,
    marginBottom: Theme.spacing.xs,
  },
  helper: {
    ...Theme.typography.subtitle,
    marginBottom: Theme.spacing.sm,
  },
  warning: {
    ...Theme.typography.subtitle,
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.md,
  },
  rowCenter: {
    alignItems: "center",
    marginBottom: Theme.spacing.md,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  dropdownText: {
    ...Theme.typography.body,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.md,
    backgroundColor: Theme.colors.surface,
  },
  dropdownItem: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  dropdownItemText: {
    ...Theme.typography.body,
  },
  actions: {
    marginTop: Theme.spacing.lg,
  },
});
