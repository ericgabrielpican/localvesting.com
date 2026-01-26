// app/map/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import * as Location from "expo-location";

import Screen from "../../src/components/ui/Screen";
import Navbar from "../../src/components/Navbar";
import { Theme } from "../../src/styles/Theme";
import { db } from "../../src/firebase/config";

type Coords = { latitude: number; longitude: number };

type Business = {
  id: string;
  name: string;
  category?: string;
  address?: string;
  phone?: string;
  location?: Coords | null;
};

type Campaign = {
  id: string;
  title: string;
  businessName?: string;
  category?: string;
  address?: string;
  location?: Coords | null;
};

type Point = {
  type: "business" | "campaign";
  id: string;
  title: string;
  subtitle: string;
  address?: string;
  phone?: string;
  category?: string;
  color: string;
  latitude: number;
  longitude: number;
};

const INITIAL_CENTER: Coords = { latitude: 46.7712, longitude: 23.5899 }; // Cluj
const STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

const CATEGORY_COLORS: Record<string, string> = {
  Restaurant: "#ff6b6b",
  "Café / Coffee shop": "#ffa94d",
  "Bar / Pub": "#9775fa",
  Retail: "#4dabf7",
  Services: "#20c997",
  Healthcare: "#ff922b",
  Manufacturing: "#228be6",
  Other: "#868e96",
  Technology: "#2563eb",
  "Real Estate": "#a855f7",
  Agriculture: "#16a34a",
  Education: "#3b82f6",
};

function colorForCategory(category?: string, fallback = Theme.colors.primary) {
  if (!category) return fallback;
  return CATEGORY_COLORS[category] || fallback;
}

function normalizeLocation(raw: any): Coords | null {
  if (!raw) return null;
  if (typeof raw.lat === "number" && typeof raw.lng === "number") {
    return { latitude: raw.lat, longitude: raw.lng };
  }
  if (typeof raw.latitude === "number" && typeof raw.longitude === "number") {
    return { latitude: raw.latitude, longitude: raw.longitude };
  }
  return null;
}

async function geocodeAddress(address: string): Promise<Coords | null> {
  const q = address.trim();
  if (q.length < 3) return null;

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
    encodeURIComponent(q);

  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return null;

  const lat = parseFloat(json[0].lat);
  const lon = parseFloat(json[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return { latitude: lat, longitude: lon };
}

export default function MapPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === "web";
  const isMobileLayout = !isWeb && width < 900;

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // UI
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showBusinesses, setShowBusinesses] = useState(true);
  const [showCampaigns, setShowCampaigns] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);

  const categoriesInUse = useMemo(() => {
    const s = new Set<string>();
    businesses.forEach((b) => b.category && s.add(b.category));
    campaigns.forEach((c) => c.category && s.add(c.category));
    const list = Array.from(s);
    list.sort((a, b) => a.localeCompare(b));
    return list;
  }, [businesses, campaigns]);

  const [selectedCats, setSelectedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (categoriesInUse.length === 0) return;
    setSelectedCats(new Set(categoriesInUse));
  }, [categoriesInUse.join("|")]);

  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Web map refs
  const webDivRef = useRef<HTMLDivElement | null>(null);
  const webMapRef = useRef<any>(null);
  const webMarkersRef = useRef<any[]>([]);
  const [webMapReady, setWebMapReady] = useState(false);

  // Mobile webview map
  const webviewRef = useRef<any>(null);
  const [mobileMapReady, setMobileMapReady] = useState(false);
  const WebView = useMemo(() => {
    if (isWeb) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-webview").WebView;
  }, [isWeb]);

  // Firestore subscriptions
  useEffect(() => {
    const qBiz = query(collection(db, "businesses"), where("verified", "==", true));
    const unsubBiz = onSnapshot(
      qBiz,
      (snap) => {
        const list: Business[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            name: data.name || "Unnamed business",
            category: data.category,
            address: data.address,
            phone: data.phone,
            location: normalizeLocation(data.location),
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

    const qCamp = query(collection(db, "campaigns"), where("status", "==", "active"));
    const unsubCamp = onSnapshot(
      qCamp,
      (snap) => {
        const list: Campaign[] = snap.docs.map((doc) => {
          const data = doc.data() as any;
          return {
            id: doc.id,
            title: data.title || "Untitled campaign",
            businessName: data.businessName,
            category: data.category,
            address: data.address,
            location: normalizeLocation(data.location),
          };
        });
        setCampaigns(list);
      },
      (err) => console.error("Campaigns subscription error", err)
    );

    return () => {
      unsubBiz();
      unsubCamp();
    };
  }, []);

  const points: Point[] = useMemo(() => {
    const allowed = selectedCats;

    const bizPts: Point[] = businesses
      .filter((b) => !!b.location)
      .filter(() => showBusinesses)
      .filter((b) => (b.category ? allowed.has(b.category) : true))
      .map((b) => ({
        type: "business",
        id: b.id,
        title: b.name,
        subtitle: b.category || "Business",
        address: b.address,
        phone: b.phone,
        category: b.category,
        color: colorForCategory(b.category, "#2563eb"),
        latitude: b.location!.latitude,
        longitude: b.location!.longitude,
      }));

    const campPts: Point[] = campaigns
      .filter((c) => !!c.location)
      .filter(() => showCampaigns)
      .filter((c) => (c.category ? allowed.has(c.category) : true))
      .map((c) => ({
        type: "campaign",
        id: c.id,
        title: c.title,
        subtitle: c.businessName ? c.businessName : "Opportunity",
        address: c.address,
        category: c.category,
        color: colorForCategory(c.category, "#16a34a"),
        latitude: c.location!.latitude,
        longitude: c.location!.longitude,
      }));

    return [...campPts, ...bizPts];
  }, [businesses, campaigns, showBusinesses, showCampaigns, selectedCats]);

  const businessPinCount = businesses.filter((b) => !!b.location).length;
  const campaignPinCount = campaigns.filter((c) => !!c.location).length;

  const shownBusinessCount = points.filter((p) => p.type === "business").length;
  const shownCampaignCount = points.filter((p) => p.type === "campaign").length;

  // WEB MAP INIT
  useEffect(() => {
    if (!isWeb) return;
    if (!webDivRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setWebMapReady(false);
        if (typeof document !== "undefined" && !document.getElementById("maplibre-css")) {
          const link = document.createElement("link");
          link.id = "maplibre-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
          document.head.appendChild(link);
        }

        const maplibregl = await import("maplibre-gl");
        if (cancelled) return;

        try {
          webMapRef.current?.remove();
        } catch {}
        webMapRef.current = null;

        const map = new maplibregl.Map({
          container: webDivRef.current!,
          style: STYLE_URL,
          center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
          zoom: 12,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        map.on("load", () => {
          if (cancelled) return;
          webMapRef.current = map;
          setWebMapReady(true);
        });
      } catch (e) {
        console.error("Web map init failed:", e);
        Alert.alert("Map error", "Could not load the map.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isWeb]);

  // WEB: RENDER MARKERS
  useEffect(() => {
    if (!isWeb) return;
    if (!webMapReady) return;
    const map = webMapRef.current;
    if (!map) return;

    (async () => {
      const maplibregl = await import("maplibre-gl");

      webMarkersRef.current.forEach((m) => m.remove?.());
      webMarkersRef.current = [];

      points.forEach((p) => {
        const el = document.createElement("div");
        el.style.width = "28px";
        el.style.height = "28px";
        el.style.borderRadius = "999px";
        el.style.background = "white";
        el.style.border = `3px solid ${p.color}`;
        el.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        el.style.cursor = "pointer";
        el.style.userSelect = "none";
        el.innerHTML = p.type === "campaign" ? "💰" : "🏢";
        el.onclick = () => setSelectedPoint(p);

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([p.longitude, p.latitude])
          .addTo(map);

        webMarkersRef.current.push(marker);
      });
    })();
  }, [points, isWeb, webMapReady]);

  // MOBILE MAP HTML
  const mapHtml = useMemo(() => {
    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  html, body { height: 100%; margin: 0; }
  #map { position: absolute; inset: 0; }
  .pin{
    width: 28px; height: 28px; border-radius: 999px;
    background: white;
    display:flex; align-items:center; justify-content:center;
    border: 3px solid #2563eb;
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    font-size: 16px;
  }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
<script>
  const map = new maplibregl.Map({
    container: "map",
    style: "${STYLE_URL}",
    center: [${INITIAL_CENTER.longitude}, ${INITIAL_CENTER.latitude}],
    zoom: 12
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  let markers = [];

  function clearMarkers(){
    markers.forEach(m => m.remove());
    markers = [];
  }

  function addMarker(p){
    const el = document.createElement("div");
    el.className = "pin";
    el.style.borderColor = p.color;
    el.innerText = p.type === "campaign" ? "💰" : "🏢";

    el.onclick = () => {
      if (window.ReactNativeWebView?.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "tap", payload: p }));
      }
    };

    const m = new maplibregl.Marker({ element: el })
      .setLngLat([p.longitude, p.latitude])
      .addTo(map);

    markers.push(m);
  }

  function setPoints(list){
    clearMarkers();
    list.forEach(addMarker);
  }

  function flyTo(lat,lng){
    map.flyTo({ center: [lng, lat], zoom: 13 });
  }

  function onMessage(raw){
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "setPoints") setPoints(msg.points || []);
      if (msg.type === "flyTo") flyTo(msg.lat, msg.lng);
    } catch(e){}
  }

  document.addEventListener("message", (e) => onMessage(e.data));
  window.addEventListener("message", (e) => onMessage(e.data));

  map.on("load", () => {
    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "ready" }));
    }
  });
</script>
</body>
</html>`;
  }, []);

  const onMobileMessage = (evt: any) => {
    try {
      const msg = JSON.parse(evt?.nativeEvent?.data || "{}");
      if (msg.type === "ready") {
        setMobileMapReady(true);
        webviewRef.current?.postMessage(JSON.stringify({ type: "setPoints", points }));
      }
      if (msg.type === "tap" && msg.payload) setSelectedPoint(msg.payload);
    } catch {}
  };

  useEffect(() => {
    if (isWeb) return;
    if (!mobileMapReady) return;
    webviewRef.current?.postMessage(JSON.stringify({ type: "setPoints", points }));
  }, [points, isWeb, mobileMapReady]);

  const flyTo = (coords: Coords) => {
    if (isWeb) {
      const map = webMapRef.current;
      if (!map) return;
      map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 13 });
    } else {
      webviewRef.current?.postMessage(
        JSON.stringify({ type: "flyTo", lat: coords.latitude, lng: coords.longitude })
      );
    }
  };

  const onSearchGo = async () => {
    const q = searchText.trim();
    if (q.length < 3) return;
    setSearchBusy(true);
    try {
      const coords = await geocodeAddress(q);
      if (!coords) {
        Alert.alert("Not found", "Try a more specific place (city + street).");
        return;
      }
      flyTo(coords);
    } finally {
      setSearchBusy(false);
    }
  };

  const onLocate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      flyTo({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert("Error", "Could not get your location.");
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectAllCats = () => setSelectedCats(new Set(categoriesInUse));
  const selectNoCats = () => setSelectedCats(new Set());

  const onCardAction = () => {
    if (!selectedPoint) return;
    if (selectedPoint.type === "campaign") router.push(`/browse/${selectedPoint.id}` as any);
    else router.push(`/businesses/${selectedPoint.id}` as any);
  };

  return (
    <Screen>
      <Navbar active="map" />

      <View style={styles.container}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator />
          </View>
        )}

        {/* Map */}
        {isWeb ? (
          <div ref={webDivRef} style={{ width: "100%", height: "100%" }} />
        ) : WebView ? (
          <WebView
            ref={webviewRef}
            originWhitelist={["*"]}
            source={{ html: mapHtml }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={onMobileMessage}
            style={{ flex: 1 }}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.fw400}>Missing WebView dependency.</Text>
          </View>
        )}

        {/* Search bar (top-left) */}
        <View style={styles.searchBar}>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search location…"
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
            onSubmitEditing={onSearchGo}
          />
          <TouchableOpacity style={styles.goBtn} onPress={onSearchGo} disabled={searchBusy}>
            <Text style={[styles.goBtnText, styles.fw400]}>{searchBusy ? "…" : "Go"}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.locateBtn} onPress={onLocate}>
            <Text style={[styles.locateIcon, styles.fw400]}>➤</Text>
          </TouchableOpacity>
        </View>

        {/* Filters toggle button below search bar (top-left) */}
        <TouchableOpacity
          style={styles.showFiltersBtn}
          onPress={() => setFiltersOpen((v) => !v)}
        >
          <Text style={[styles.showFiltersText, styles.fw400]}>
            {filtersOpen ? "✕  Hide Filters" : "☰  Show Filters"}
          </Text>
        </TouchableOpacity>

        {/* WEB: filters panel top-right | MOBILE: bottom sheet */}
        {filtersOpen &&
          (isMobileLayout ? (
            <>
              {/* backdrop */}
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setFiltersOpen(false)}
                style={styles.backdrop}
              />

              <View style={styles.bottomSheet}>
                <View style={styles.sheetHandle} />

                <ScrollView contentContainerStyle={{ paddingBottom: 14 }}>
                  <Text style={[styles.sheetTitle, styles.fw400]}>Filters</Text>

                  <View style={styles.sheetCard}>
                    <Text style={[styles.sheetSectionTitle, styles.fw400]}>Show on Map</Text>

                    <TouchableOpacity
                      style={styles.checkRow}
                      onPress={() => setShowCampaigns((v) => !v)}
                    >
                      <View style={[styles.checkbox, showCampaigns && styles.checkboxOn]}>
                        <Text style={[styles.checkboxTick, styles.fw400]}>
                          {showCampaigns ? "✓" : ""}
                        </Text>
                      </View>
                      <Text style={[styles.checkLabel, styles.fw400]}>💰 Opportunities</Text>
                      <View style={styles.countPill}>
                        <Text style={[styles.countPillText, styles.fw400]}>
                          {campaignPinCount}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkRow, { marginTop: 10 }]}
                      onPress={() => setShowBusinesses((v) => !v)}
                    >
                      <View style={[styles.checkbox, showBusinesses && styles.checkboxOn]}>
                        <Text style={[styles.checkboxTick, styles.fw400]}>
                          {showBusinesses ? "✓" : ""}
                        </Text>
                      </View>
                      <Text style={[styles.checkLabel, styles.fw400]}>🏢 Businesses</Text>
                      <View style={styles.countPill}>
                        <Text style={[styles.countPillText, styles.fw400]}>
                          {businessPinCount}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.sheetCard}>
                    <View style={styles.catsHeader}>
                      <Text style={[styles.sheetSectionTitle, styles.fw400]}>Categories</Text>
                      <View style={{ flexDirection: "row", gap: 14 }}>
                        <TouchableOpacity onPress={selectAllCats}>
                          <Text style={[styles.catsAction, styles.fw400]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={selectNoCats}>
                          <Text style={[styles.catsAction, styles.fw400]}>None</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {categoriesInUse.map((cat) => {
                      const active = selectedCats.has(cat);
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={styles.catRow}
                          onPress={() => toggleCategory(cat)}
                        >
                          <View style={[styles.checkbox, active && styles.checkboxOn]}>
                            <Text style={[styles.checkboxTick, styles.fw400]}>
                              {active ? "✓" : ""}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.colorDot,
                              { backgroundColor: colorForCategory(cat, "#2563eb") },
                            ]}
                          />
                          <Text style={[styles.catLabel, styles.fw400]}>{cat}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.footerText, styles.fw400]}>
                    Showing: {shownCampaignCount} campaigns, {shownBusinessCount} businesses
                  </Text>
                  <Text style={[styles.footerTextMuted, styles.fw400]}>
                    {selectedCats.size} / {categoriesInUse.length} categories
                  </Text>

                  <TouchableOpacity
                    style={styles.sheetCloseBtn}
                    onPress={() => setFiltersOpen(false)}
                  >
                    <Text style={[styles.sheetCloseText, styles.fw400]}>Done</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </>
          ) : (
            <View style={styles.filtersPanel}>
              <Text style={[styles.filtersTitle, styles.fw400]}>Show on Map</Text>

              <View style={{ marginTop: 10 }}>
                <TouchableOpacity
                  style={styles.checkRow}
                  onPress={() => setShowCampaigns((v) => !v)}
                >
                  <View style={[styles.checkbox, showCampaigns && styles.checkboxOn]}>
                    <Text style={[styles.checkboxTick, styles.fw400]}>
                      {showCampaigns ? "✓" : ""}
                    </Text>
                  </View>
                  <Text style={[styles.checkLabel, styles.fw400]}>💰 Opportunities</Text>
                  <View style={styles.countPill}>
                    <Text style={[styles.countPillText, styles.fw400]}>{campaignPinCount}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.checkRow, { marginTop: 10 }]}
                  onPress={() => setShowBusinesses((v) => !v)}
                >
                  <View style={[styles.checkbox, showBusinesses && styles.checkboxOn]}>
                    <Text style={[styles.checkboxTick, styles.fw400]}>
                      {showBusinesses ? "✓" : ""}
                    </Text>
                  </View>
                  <Text style={[styles.checkLabel, styles.fw400]}>🏢 Businesses</Text>
                  <View style={styles.countPill}>
                    <Text style={[styles.countPillText, styles.fw400]}>{businessPinCount}</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.catsHeader}>
                <Text style={[styles.catsTitle, styles.fw400]}>Categories</Text>
                <View style={{ flexDirection: "row", gap: 14 }}>
                  <TouchableOpacity onPress={selectAllCats}>
                    <Text style={[styles.catsAction, styles.fw400]}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={selectNoCats}>
                    <Text style={[styles.catsAction, styles.fw400]}>None</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {categoriesInUse.map((cat) => {
                const active = selectedCats.has(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={styles.catRow}
                    onPress={() => toggleCategory(cat)}
                  >
                    <View style={[styles.checkbox, active && styles.checkboxOn]}>
                      <Text style={[styles.checkboxTick, styles.fw400]}>{active ? "✓" : ""}</Text>
                    </View>
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: colorForCategory(cat, "#2563eb") },
                      ]}
                    />
                    <Text style={[styles.catLabel, styles.fw400]}>{cat}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.divider} />

              <Text style={[styles.footerText, styles.fw400]}>
                Showing: {shownCampaignCount} campaigns, {shownBusinessCount} businesses
              </Text>
              <Text style={[styles.footerTextMuted, styles.fw400]}>
                {selectedCats.size} / {categoriesInUse.length} categories
              </Text>
            </View>
          ))}

        {/* Popup card */}
        {selectedPoint && (
          <View style={styles.popupCard}>
            <TouchableOpacity style={styles.popupClose} onPress={() => setSelectedPoint(null)}>
              <Text style={[styles.fw400]}>✕</Text>
            </TouchableOpacity>

            <View style={styles.popupTopRow}>
              <View style={[styles.popupIcon, { borderColor: selectedPoint.color }]}>
                <Text style={[styles.fw400, { fontSize: 20 }]}>
                  {selectedPoint.type === "campaign" ? "💰" : "🏢"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.popupTitle, styles.fw400]} numberOfLines={1}>
                  {selectedPoint.title}
                </Text>
                <Text style={[styles.popupSub, styles.fw400]} numberOfLines={1}>
                  {selectedPoint.category || selectedPoint.subtitle}
                </Text>
              </View>
            </View>

            {!!selectedPoint.address && (
              <Text style={[styles.popupAddress, styles.fw400]} numberOfLines={3}>
                {selectedPoint.address}
              </Text>
            )}

            {!!selectedPoint.phone && (
              <Text style={[styles.popupPhone, styles.fw400]} numberOfLines={1}>
                📞 {selectedPoint.phone}
              </Text>
            )}

            <TouchableOpacity style={styles.popupBtn} onPress={onCardAction}>
              <Text style={[styles.popupBtnText, styles.fw400]}>
                {selectedPoint.type === "campaign" ? "View Opportunity" : "View Business"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fw400: { fontWeight: "400" },

  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  loadingOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 50,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },

  // Search
  searchBar: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    gap: 10,
    zIndex: 60,
    width: 420,
    maxWidth: "80%",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    color: "#111827",
    backgroundColor: "#fff",
  },
  goBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  goBtnText: { color: "#fff" },
  locateBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  locateIcon: { fontSize: 18 },

  // Toggle below search
  showFiltersBtn: {
    position: "absolute",
    top: 78,
    left: 16,
    zIndex: 70,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  showFiltersText: { color: "#111827" },

  // WEB panel
  filtersPanel: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 65,
    width: 360,
    maxWidth: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  filtersTitle: { fontSize: 16, color: "#111827" },

  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },

  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  checkboxTick: { color: "#fff", fontSize: 12 },

  checkLabel: { color: "#111827", flex: 1 },
  countPill: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  countPillText: { color: "#111827" },

  catsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  catsTitle: { fontSize: 14, color: "#111827" },
  catsAction: { color: Theme.colors.primary },

  catRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  colorDot: { width: 10, height: 10, borderRadius: 999 },
  catLabel: { color: "#111827" },

  footerText: { color: "#111827", marginTop: 2 },
  footerTextMuted: { color: "#6b7280", marginTop: 2 },

  // MOBILE bottom sheet
  backdrop: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(0,0,0,0.25)",
    zIndex: 79,
  },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 80,
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginBottom: 10,
  },
  sheetTitle: { fontSize: 16, color: "#111827", marginBottom: 10 },
  sheetCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    marginBottom: 12,
  },
  sheetSectionTitle: { fontSize: 14, color: "#111827", marginBottom: 10 },
  sheetCloseBtn: {
    marginTop: 6,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  sheetCloseText: { color: "#fff" },

  // Popup card
  popupCard: {
    position: "absolute",
    top: 120,
    alignSelf: "center",
    zIndex: 90,
    width: 520,
    maxWidth: "92%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  popupClose: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  popupTopRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingRight: 40 },
  popupIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#2563eb",
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  popupTitle: { fontSize: 18, color: "#111827" },
  popupSub: { color: "#6b7280", marginTop: 2 },
  popupAddress: { marginTop: 10, color: "#374151" },
  popupPhone: { marginTop: 10, color: "#111827" },
  popupBtn: {
    marginTop: 14,
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  popupBtnText: { color: "#fff" },
});
