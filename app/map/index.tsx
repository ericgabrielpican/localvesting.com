// app/map/index.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  FlatList,
  Keyboard,
  Alert,
} from "react-native";
import MapView, { Marker, UrlTile, Region } from "react-native-maps";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useRouter } from "expo-router";

import Screen from "../../src/components/ui/Screen";
import Navbar from "../../src/components/Navbar";
import { Theme } from "../../src/styles/Theme";
import { db } from "../../src/firebase/config";

type GeoPointLike = {
  latitude: number;
  longitude: number;
};

type Business = {
  id: string;
  name: string;
  category?: string;
  location?: GeoPointLike | null;
};

type Campaign = {
  id: string;
  title: string;
  businessName?: string;
  category?: string;
  location?: GeoPointLike | null;
};

type SearchSuggestion = {
  id: string;
  displayName: string;
  lat: number;
  lon: number;
};

const INITIAL_REGION: Region = {
  latitude: 45.9432,
  longitude: 24.9668,
  latitudeDelta: 5,
  longitudeDelta: 5,
};

// basic color helpers
const CATEGORY_COLORS: { [key: string]: string } = {
  Restaurant: "#ff6b6b",
  "Café / Coffee shop": "#ffa94d",
  "Bar / Pub": "#9775fa",
  Retail: "#4dabf7",
  Services: "#20c997",
  Healthcare: "#ff922b",
  Manufacturing: "#228be6",
  Other: "#868e96",
};

function getBusinessColor(category?: string) {
  if (!category) return "#2563eb";
  return CATEGORY_COLORS[category] || "#2563eb";
}

function getCampaignColor(category?: string) {
  if (!category) return "#16a34a";
  return CATEGORY_COLORS[category] || "#16a34a";
}

export default function MapPage() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);

  const [region, setRegion] = useState<Region>(INITIAL_REGION);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showCampaigns, setShowCampaigns] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ----- Firestore subscriptions -----
  useEffect(() => {
    const qBiz = query(
      collection(db, "businesses"),
      where("verified", "==", true)
    );

    const unsubscribeBiz = onSnapshot(
      qBiz,
      (snap) => {
        const list: Business[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          const loc = data.location as GeoPointLike | undefined;
          return {
            id: doc.id,
            name: data.name || "Unnamed business",
            category: data.category,
            location: loc || null,
          };
        });
        setBusinesses(list);
        setLoading(false);
      },
      (err) => {
        console.error("Businesses subscription error", err);
        setLoading(false);
      }
    );

    const qCamp = query(
      collection(db, "campaigns"),
      where("status", "==", "active")
    );

    const unsubscribeCamp = onSnapshot(
      qCamp,
      (snap) => {
        const list: Campaign[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          const loc = data.location as GeoPointLike | undefined;
          return {
            id: doc.id,
            title: data.title || "Untitled campaign",
            businessName: data.businessName,
            category: data.category,
            location: loc || null,
          };
        });
        setCampaigns(list);
      },
      (err) => {
        console.error("Campaigns subscription error", err);
      }
    );

    return () => {
      unsubscribeBiz();
      unsubscribeCamp();
    };
  }, []);

  // ----- Derived filters -----
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (!b.location) return false;
      if (!showBusinesses) return false;
      if (selectedCategory !== "All" && b.category !== selectedCategory)
        return false;
      return true;
    });
  }, [businesses, showBusinesses, selectedCategory]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (!c.location) return false;
      if (!showCampaigns) return false;
      if (selectedCategory !== "All" && c.category !== selectedCategory)
        return false;
      return true;
    });
  }, [campaigns, showCampaigns, selectedCategory]);

  const categoriesInUse = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => b.category && set.add(b.category));
    campaigns.forEach((c) => c.category && set.add(c.category));
    return ["All", ...Array.from(set)];
  }, [businesses, campaigns]);

  // ----- Search suggestions (OSM) -----
  useEffect(() => {
    const text = searchText.trim();
    if (text.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const q = encodeURIComponent(text);
        const url =
          "https://nominatim.openstreetmap.org/search?format=json&limit=3&addressdetails=1&q=" +
          q;

        const res = await fetch(url, {
          headers: { "User-Agent": "LocalVestingApp/1.0" },
        });
        const json = await res.json();

        if (cancelled) return;

        if (Array.isArray(json)) {
          const mapped: SearchSuggestion[] = json.map(
            (item: any, index: number) => ({
              id: String(item.place_id || index),
              displayName: String(item.display_name || ""),
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            })
          );
          setSuggestions(mapped);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (e) {
        console.warn("Search error", e);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchText]);

  const moveToSuggestion = (s: SearchSuggestion) => {
    const newRegion: Region = {
      latitude: s.lat,
      longitude: s.lon,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    };
    setRegion(newRegion);
    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 600);
    }
    setSearchText(s.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
  };

  const onSearchSubmit = () => {
    if (suggestions.length > 0) {
      moveToSuggestion(suggestions[0]);
    } else {
      Alert.alert(
        "Not found",
        "Type at least 3 characters and choose a suggestion."
      );
    }
  };

  const onCampaignPress = (c: Campaign) => {
    router.push(`/browse/${c.id}` as any);
  };

  const onBusinessPress = (b: Business) => {
    Alert.alert(b.name, b.category ? b.category : "Business HQ");
  };

  return (
    <Screen>
      <Navbar />

      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator />
          </View>
        )}

        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          region={region}
          onRegionChangeComplete={setRegion}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />

          {filteredBusinesses.map((b) =>
            b.location ? (
              <Marker
                key={"biz-" + b.id}
                coordinate={{
                  latitude: b.location.latitude,
                  longitude: b.location.longitude,
                }}
                pinColor={getBusinessColor(b.category)}
                title={b.name}
                description={b.category || "Business HQ"}
                onCalloutPress={() => onBusinessPress(b)}
              />
            ) : null
          )}

          {filteredCampaigns.map((c) =>
            c.location ? (
              <Marker
                key={"camp-" + c.id}
                coordinate={{
                  latitude: c.location.latitude,
                  longitude: c.location.longitude,
                }}
                pinColor={getCampaignColor(c.category)}
                title={c.title}
                description={
                  c.businessName
                    ? c.businessName + " • Campaign"
                    : "Campaign"
                }
                onCalloutPress={() => onCampaignPress(c)}
              />
            ) : null
          )}
        </MapView>

        {/* Search (top-left) */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city or place..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={onSearchSubmit}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchSubmit}
          >
            <Text style={styles.searchButtonText}>
              {searchLoading ? "…" : "Go"}
            </Text>
          </TouchableOpacity>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => moveToSuggestion(item)}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.displayName}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* Filters (top-right) */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>

          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                showBusinesses && styles.filterPillActive,
              ]}
              onPress={() => setShowBusinesses((v) => !v)}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: getBusinessColor(undefined) },
                ]}
              />
              <Text
                style={[
                  styles.filterPillText,
                  showBusinesses && styles.filterPillTextActive,
                ]}
              >
                Businesses
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterPill,
                showCampaigns && styles.filterPillActive,
              ]}
              onPress={() => setShowCampaigns((v) => !v)}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: getCampaignColor(undefined) },
                ]}
              />
              <Text
                style={[
                  styles.filterPillText,
                  showCampaigns && styles.filterPillTextActive,
                ]}
              >
                Campaigns
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoriesRow}>
            {categoriesInUse.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat && styles.categoryPillActive,
                ]}
                onPress={() => {
                  setSelectedCategory((current) =>
                    current === cat ? "All" : cat
                  );
                }}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat && styles.categoryPillTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Legend (bottom-left) */}
        <View style={styles.legendContainer}>
          <Text style={styles.legendTitle}>Legend</Text>

          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getBusinessColor(undefined) },
              ]}
            />
            <Text style={styles.legendText}>Business HQ</Text>
          </View>

          <View style={styles.legendRow}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: getCampaignColor(undefined) },
              ]}
            />
            <Text style={styles.legendText}>Campaign location</Text>
          </View>

          <Text style={styles.legendSubtitle}>
            Colors vary by category/domain
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -12,
    marginTop: -12,
    zIndex: 20,
  },

  // Search
  searchContainer: {
    position: "absolute",
    top: 80,
    left: 12,
    right: 160,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    ...Theme.typography.body,
  },
  searchButton: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: Theme.radii.md,
    backgroundColor: Theme.colors.primary,
  },
  searchButtonText: {
    ...Theme.typography.body,
    color: "#fff",
    fontWeight: "600",
  },
  suggestionsBox: {
    position: "absolute",
    top: 120,
    left: 12,
    right: 160,
    maxHeight: 160,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 16,
  },
  suggestionItem: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 6,
  },
  suggestionText: {
    ...Theme.typography.subtitle,
  },

  // Filters
  filtersContainer: {
    position: "absolute",
    top: 80,
    right: 12,
    width: 160,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radii.lg,
    padding: Theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
    zIndex: 10,
  },
  filtersTitle: {
    ...Theme.typography.label,
    marginBottom: Theme.spacing.xs,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Theme.spacing.sm,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: Theme.radii.lg,
    backgroundColor: "#f1f3f5",
  },
  filterPillActive: {
    backgroundColor: "#e5edff", // light primary
  },
  filterPillText: {
    ...Theme.typography.subtitle,
    fontSize: 12,
    marginLeft: 4,
  },
  filterPillTextActive: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Theme.radii.lg,
    backgroundColor: "#f1f3f5",
    marginRight: 4,
    marginBottom: 4,
  },
  categoryPillActive: {
    backgroundColor: "#e5edff",
  },
  categoryPillText: {
    ...Theme.typography.subtitle,
    fontSize: 12,
  },
  categoryPillTextActive: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },

  // Legend
  legendContainer: {
    position: "absolute",
    left: 12,
    bottom: 20,
    padding: Theme.spacing.sm,
    borderRadius: Theme.radii.lg,
    backgroundColor: "rgba(255,255,255,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 8,
  },
  legendTitle: {
    ...Theme.typography.label,
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    ...Theme.typography.subtitle,
    fontSize: 12,
  },
  legendSubtitle: {
    ...Theme.typography.subtitle,
    fontSize: 11,
    marginTop: 4,
    color: "#868e96",
  },
});

