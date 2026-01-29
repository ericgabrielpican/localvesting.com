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
  Platform,
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
import TextField from "../../src/components/ui/TextField";
import Button from "../../src/components/ui/Button";
import LocationPickerModal, {
  PickedLocation,
} from "../../src/components/LocationPickerModal";
import { Theme } from "../../src/styles/Theme";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";

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

  const notify = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

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

  // 📍 location
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
        notify("Error", "Could not load businesses");
      } finally {
        setLoadingBusinesses(false);
      }
    };

    loadBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const selectedBusiness = businesses.find((b) => b.id === businessId);

  const validate = () => {
    if (!selectedBusiness) {
      notify("Business required", "Please select a verified business.");
      return false;
    }
    if (!title.trim()) {
      notify("Title required", "Please enter a campaign title.");
      return false;
    }
    if (!desc.trim()) {
      notify("Description required", "Please describe the campaign.");
      return false;
    }
    if (!campaignAddress.trim()) {
      notify("Address required", "Please pick a location (it will fill the address).");
      return false;
    }
    if (!locationCoords) {
      notify("Location required", "Please place the campaign pin on the map.");
      return false;
    }
    if (!category) {
      notify("Category required", "Please select a category.");
      return false;
    }
    if (!riskLevel) {
      notify("Risk level required", "Please select a risk level.");
      return false;
    }

    const goalNum = Number(goal);
    const minNum = Number(minInvestment);
    const aprNum = Number(apr);
    const termNum = Number(termMonths);

    if (!goalNum || goalNum <= 0) {
      notify("Invalid goal", "Funding goal must be a positive number.");
      return false;
    }
    if (!minNum || minNum <= 0) {
      notify("Invalid minimum", "Minimum investment must be a positive number.");
      return false;
    }
    if (!aprNum || aprNum <= 0) {
      notify("Invalid APR", "Interest rate (APR) must be a positive number.");
      return false;
    }
    if (!termNum || termNum <= 0) {
      notify("Invalid loan term", "Loan term must be a positive number of months.");
      return false;
    }
    if (!deadline.trim()) {
      notify("Deadline required", "Please enter a campaign deadline.");
      return false;
    }

    return true;
  };

  const createCampaign = async () => {
    if (!user) {
      notify("Not logged in", "Please log in again.");
      return;
    }
    if (!validate()) return;

    const coords = locationCoords!;

    try {
      setSubmitting(true);

      await addDoc(collection(db, "campaigns"), {
        ownerId: user.uid,
        businessId: selectedBusiness?.id,
        businessName: selectedBusiness?.name,
        title: title.trim(),
        description: desc.trim(),
        address: campaignAddress.trim(),
        category,
        riskLevel,
        goal: Number(goal),
        minInvestment: Number(minInvestment),
        apr: Number(apr),
        termMonths: Number(termMonths),
        deadline: deadline.trim(),
        imageUrl: imageUrl.trim() || null,
        status: "active",
        raised: 0,

        location: { lat: coords.latitude, lng: coords.longitude },
        locationSource: "manual",
        locationUpdatedAt: serverTimestamp(),

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      notify("Success", "Campaign created.");
      router.replace("/dashboard" as any);
    } catch (e: any) {
      console.error(e);
      notify("Error", e?.message ?? "Could not create campaign.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.heading}>Create Campaign</Text>

          {/* SELECT BUSINESS */}
          <Text style={styles.label}>Select Business *</Text>

          {loadingBusinesses ? (
            <View style={styles.rowCenter}>
              <ActivityIndicator />
            </View>
          ) : businesses.length === 0 ? (
            <Text style={styles.warning}>
              You have no verified businesses. Please add a business and wait for verification before creating a campaign.
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
                        selectedBusiness.address ? " – " + selectedBusiness.address : ""
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

          <TextField
            label="Campaign Title *"
            placeholder="e.g., Expand Our Manufacturing Facility"
            value={title}
            onChangeText={setTitle}
          />

          <TextField
            label="Description *"
            placeholder="Describe what you'll use the funds for..."
            value={desc}
            onChangeText={setDesc}
            multiline
            style={{ height: 100, textAlignVertical: "top" }}
          />

          {/* Address is auto-filled from the map */}
          <TextField
            label="Campaign Address *"
            placeholder="Pick on map to fill address..."
            value={campaignAddress}
            onChangeText={setCampaignAddress}
          />

          {/* Location status */}
          <View style={styles.locationRow}>
            <View
              style={[
                styles.dot,
                { backgroundColor: locationCoords ? "#16a34a" : "#ef4444" },
              ]}
            />
            <Text style={styles.locationText}>
              {locationCoords ? "Location selected" : "No location selected"}
            </Text>
          </View>

          <Button
            label={locationCoords ? "Adjust Location on Map" : "Pick Location on Map"}
            variant="secondary"
            onPress={() => setLocationModalVisible(true)}
          />

          {/* CATEGORY */}
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setCategoryOpen((v) => !v)}
          >
            <Text style={styles.dropdownText}>{category ?? "Select category"}</Text>
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

          {/* RISK */}
          <Text style={[styles.label, { marginTop: Theme.spacing.md }]}>Risk Level *</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setRiskOpen((v) => !v)}
          >
            <Text style={styles.dropdownText}>{riskLevel ?? "Select risk level"}</Text>
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
          <TextField
            label="Campaign Deadline *"
            placeholder="mm/dd/yyyy"
            value={deadline}
            onChangeText={setDeadline}
          />
          <TextField
            label="Campaign Image (URL)"
            placeholder="Paste image URL (optional)"
            value={imageUrl}
            onChangeText={setImageUrl}
          />

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={() => router.back()} />
            <Button
              label={submitting ? "Creating..." : "Create Campaign"}
              onPress={createCampaign}
              disabled={submitting || loadingBusinesses || businesses.length === 0}
            />
          </View>
        </Card>
      </ScrollView>

      {/* ✅ Modal */}
      <LocationPickerModal
        visible={locationModalVisible}
        address={campaignAddress}
        initialCoords={locationCoords}
        onClose={() => setLocationModalVisible(false)}
        onConfirm={(data: PickedLocation) => {
          setLocationCoords({ latitude: data.latitude, longitude: data.longitude });
          if (data.address) setCampaignAddress(data.address); // ✅ auto-fill from pin
          setLocationModalVisible(false);
        }}
      />
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
    color: "#000",
  },
  label: {
    ...Theme.typography.label,
    marginBottom: Theme.spacing.xs,
    color: "#000",
  },
  warning: {
    ...Theme.typography.subtitle,
    color: Theme.colors.danger,
    marginBottom: Theme.spacing.md,
  },
  rowCenter: { alignItems: "center", marginBottom: Theme.spacing.md },
  dropdown: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
  },
  dropdownText: { ...Theme.typography.body, color: "#000" },
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
  dropdownItemText: { ...Theme.typography.body, color: "#000" },
  actions: {
    marginTop: Theme.spacing.lg,
    gap: Theme.spacing.sm,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 999 },
  locationText: { ...Theme.typography.subtitle, color: "#000" },
});
