// app/dashboard/addBusiness.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

import Screen from "../../src/components/ui/Screen";
import Card from "../../src/components/ui/Card";
import Navbar from "../../src/components/Navbar";
import TextField from "../../src/components/ui/TextField";
import Button from "../../src/components/ui/Button";
import LocationPickerModal from "../../src/components/LocationPickerModal";
import { Theme } from "../../src/styles/Theme";
import { db } from "../../src/firebase/config";
import { useAuth } from "../../src/context/AuthContext";

const CATEGORIES = [
  "Restaurant",
  "Café / Coffee shop",
  "Bar / Pub",
  "Retail",
  "Services",
  "Healthcare",
  "Manufacturing",
  "Other",
];

export default function AddBusiness() {
  const router = useRouter();
  const { user } = useAuth();

  const notify = (title: string, message: string) => {
    if (Platform.OS === "web") {
      // RN Alert can be flaky on web; this is guaranteed visible
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [saving, setSaving] = useState(false);

  // 📍 LOCATION STATE
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const validate = () => {
    if (!name.trim()) {
      notify("Business name required", "Please enter a business name.");
      return false;
    }
    if (!category) {
      notify("Category required", "Please select a business category.");
      return false;
    }
    if (!phone.trim()) {
      notify("Phone required", "Please enter a phone number.");
      return false;
    }
    if (!address.trim()) {
      notify("Address required", "Please enter the business address.");
      return false;
    }
    if (!locationCoords) {
      notify("Location required", "Please place your business on the map.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    console.log("Create Business pressed"); // helps you confirm button is firing

    if (!user) {
      notify("Not logged in", "Please log in again.");
      return;
    }
    if (!validate()) return;

    // ✅ TypeScript-safe (validated above)
    const coords = locationCoords!;

    try {
      setSaving(true);

      await addDoc(collection(db, "businesses"), {
        ownerId: user.uid,
        name: name.trim(),
        description: description.trim(),
        category,
        phone: phone.trim(),
        address: address.trim(),
        logoUrl: logoUrl.trim() || null,

        // 📍 MAP LOCATION
        location: {
          lat: coords.latitude,
          lng: coords.longitude,
        },
        locationSource: "manual",
        locationUpdatedAt: serverTimestamp(),

        // verification flags
        verified: false,
        verificationStatus: "pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      notify(
        "Business added",
        "Your business has been created and sent for verification."
      );
      router.replace("/dashboard" as any);
    } catch (e: any) {
      console.error(e);
      notify("Error", e?.message ?? "Could not save business.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => router.back();

  return (
    <Screen>
      <Navbar />

      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={styles.heading}>Add New Business</Text>

          <TextField
            label="Business Name *"
            placeholder="Enter your business name"
            value={name}
            onChangeText={setName}
          />

          <TextField
            label="Description"
            placeholder="Briefly describe your business..."
            value={description}
            onChangeText={setDescription}
            multiline
            style={{ height: 100, textAlignVertical: "top" }}
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

          <TextField
            label="Phone Number *"
            placeholder="+40 712 345 678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

   
          {/* 📍 LOCATION STATUS */}
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

          <TextField
            label="Business Logo (URL)"
            placeholder="Paste logo image URL (optional)"
            value={logoUrl}
            onChangeText={setLogoUrl}
          />

          <View style={styles.actions}>
            <Button label="Cancel" variant="secondary" onPress={handleCancel} />
            <Button
              label={saving ? "Saving..." : "Create Business"}
              onPress={handleSave}
              disabled={saving}
            />
          </View>
        </Card>
      </ScrollView>

   <LocationPickerModal
  visible={locationModalVisible}
  address={address}
  initialCoords={locationCoords}
  onClose={() => setLocationModalVisible(false)}
  onConfirm={(data) => {
    setLocationCoords({ latitude: data.latitude, longitude: data.longitude });

    // ✅ auto-fill address from pin
    if (data.address) setAddress(data.address);

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
    color: "#000", // ✅ black label above dropdown
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    marginBottom: Theme.spacing.sm,
  },
  dropdownText: {
    ...Theme.typography.body,
    color: "#000",
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radii.md,
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
    color: "#000",
  },
  actions: {
    marginTop: Theme.spacing.lg,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  locationText: {
    ...Theme.typography.subtitle,
    color: "#000",
  },
});
