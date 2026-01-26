// src/components/LocationPickerModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Theme } from "../styles/Theme";

type Coords = { latitude: number; longitude: number };

export type PickedLocation = Coords & {
  address?: string; // human readable
  zip?: string;
};

type Props = {
  visible: boolean;
  address?: string; // optional typed address to geocode/jump
  initialCoords?: Coords | null;
  onClose: () => void;
  onConfirm: (data: PickedLocation) => void;
};

async function geocodeAddress(address: string): Promise<Coords | null> {
  const q = address.trim();
  if (q.length < 4) return null;

  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=" +
    encodeURIComponent(q);

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  if (!Array.isArray(json) || json.length === 0) return null;

  const item = json[0];
  const latitude = parseFloat(item.lat);
  const longitude = parseFloat(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}

// Reverse geocode: coords -> address + postcode (zip)
async function reverseGeocode(coords: Coords): Promise<{ address: string; zip?: string } | null> {
  const url =
    "https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=" +
    encodeURIComponent(String(coords.latitude)) +
    "&lon=" +
    encodeURIComponent(String(coords.longitude));

  const res = await fetch(url);
  if (!res.ok) return null;

  const json = await res.json();
  const display = String(json?.display_name ?? "").trim();

  // postcode in json.address.postcode typically
  const zip = json?.address?.postcode ? String(json.address.postcode) : undefined;

  if (!display) return null;
  return { address: display, zip };
}

export default function LocationPickerModal({
  visible,
  address,
  initialCoords,
  onClose,
  onConfirm,
}: Props) {
  const isWeb = Platform.OS === "web";
  const [busy, setBusy] = useState(false);
  const [searchText, setSearchText] = useState(address ?? "");

  const [picked, setPicked] = useState<Coords | null>(initialCoords ?? null);
  const [pickedAddress, setPickedAddress] = useState<string>("");
  const [pickedZip, setPickedZip] = useState<string>("");

  const [mapReady, setMapReady] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);

  // ---- Refs for web map ----
  const webDivRef = useRef<HTMLDivElement | null>(null);
  const webMapRef = useRef<any>(null);
  const webMarkerRef = useRef<any>(null);

  // ---- Ref for mobile webview ----
  const webviewRef = useRef<any>(null);
  const WebView = useMemo(() => {
    if (isWeb) return null;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("react-native-webview").WebView;
  }, [isWeb]);

  const DEFAULT_CENTER: Coords = useMemo(
    () => initialCoords ?? { latitude: 46.7712, longitude: 23.5899 }, // Cluj fallback
    [initialCoords]
  );

  // Better basemap (streets + cities)
  const STYLE_URL = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  // Reset modal state when opened
  useEffect(() => {
    if (!visible) return;
    setSearchText(address ?? "");
    setPicked(initialCoords ?? null);
    setPickedAddress("");
    setPickedZip("");
    setBusy(false);
    setMapReady(false);
    setReverseLoading(false);
  }, [visible, address, initialCoords]);

  // If we open with initial coords, fetch address once
  useEffect(() => {
    if (!visible) return;
    if (!initialCoords) return;

    (async () => {
      setReverseLoading(true);
      try {
        const r = await reverseGeocode(initialCoords);
        if (r) {
          setPickedAddress(r.address);
          setPickedZip(r.zip ?? "");
        }
      } finally {
        setReverseLoading(false);
      }
    })();
  }, [visible, initialCoords?.latitude, initialCoords?.longitude]);

  // Reverse geocode on pick change (with debounce)
  useEffect(() => {
    if (!visible) return;
    if (!picked) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setReverseLoading(true);
        const r = await reverseGeocode(picked);
        if (cancelled) return;
        if (r) {
          setPickedAddress(r.address);
          setPickedZip(r.zip ?? "");
        } else {
          setPickedAddress("");
          setPickedZip("");
        }
      } catch {
        if (!cancelled) {
          setPickedAddress("");
          setPickedZip("");
        }
      } finally {
        if (!cancelled) setReverseLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [visible, picked?.latitude, picked?.longitude]);

  // ---------------- WEB: init MapLibre in a div ----------------
  useEffect(() => {
    if (!visible) return;
    if (!isWeb) return;
    if (!webDivRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        // Inject CSS once
        if (typeof document !== "undefined" && !document.getElementById("maplibre-css")) {
          const link = document.createElement("link");
          link.id = "maplibre-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css";
          document.head.appendChild(link);
        }

        const maplibregl = await import("maplibre-gl");
        if (cancelled) return;

        // Destroy old map if any
        try {
          webMapRef.current?.remove();
        } catch {}
        webMapRef.current = null;

        const map = new maplibregl.Map({
          container: webDivRef.current!,
          style: STYLE_URL,
          center: [DEFAULT_CENTER.longitude, DEFAULT_CENTER.latitude],
          zoom: 13,
        });

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        map.on("load", () => {
          if (cancelled) return;
          webMapRef.current = map;
          setMapReady(true);

          // If we already have picked coords, show marker
          if (picked) {
            if (webMarkerRef.current) webMarkerRef.current.remove();
            webMarkerRef.current = new maplibregl.Marker({ color: Theme.colors.primary })
              .setLngLat([picked.longitude, picked.latitude])
              .addTo(map);
          }
        });

        map.on("click", (e: any) => {
          const longitude = e.lngLat.lng;
          const latitude = e.lngLat.lat;
          setPicked({ latitude, longitude });

          if (webMarkerRef.current) webMarkerRef.current.remove();
          webMarkerRef.current = new maplibregl.Marker({ color: Theme.colors.primary })
            .setLngLat([longitude, latitude])
            .addTo(map);
        });
      } catch (e) {
        console.error("Map init failed (web):", e);
        Alert.alert("Map error", "Could not load map on web.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isWeb]);

  const moveTo = async (coords: Coords) => {
    setPicked(coords);

    if (isWeb) {
      const map = webMapRef.current;
      if (!map) return;
      const maplibregl = await import("maplibre-gl");

      map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 15 });

      if (webMarkerRef.current) webMarkerRef.current.remove();
      webMarkerRef.current = new maplibregl.Marker({ color: Theme.colors.primary })
        .setLngLat([coords.longitude, coords.latitude])
        .addTo(map);
    } else {
      webviewRef.current?.postMessage(
        JSON.stringify({ type: "moveTo", lat: coords.latitude, lng: coords.longitude })
      );
    }
  };

  // ---------------- Mobile: Map HTML (MapLibre in WebView) ----------------
  const mapHtml = useMemo(() => {
    const centerLat = DEFAULT_CENTER.latitude;
    const centerLng = DEFAULT_CENTER.longitude;

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link href="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.css" rel="stylesheet" />
<style>
  html, body { height: 100%; margin: 0; }
  #map { position: absolute; inset: 0; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/maplibre-gl@3.6.2/dist/maplibre-gl.js"></script>
<script>
  const map = new maplibregl.Map({
    container: "map",
    style: "${STYLE_URL}",
    center: [${centerLng}, ${centerLat}],
    zoom: 13
  });

  map.addControl(new maplibregl.NavigationControl(), "top-right");

  let marker = null;

  function setPin(lng, lat){
    if (marker) marker.remove();
    marker = new maplibregl.Marker({ color: "${Theme.colors.primary}" })
      .setLngLat([lng, lat])
      .addTo(map);
  }

  function moveTo(lng, lat){
    map.flyTo({ center: [lng, lat], zoom: 15 });
    setPin(lng, lat);
  }

  map.on("click", (e) => {
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    setPin(lng, lat);
    if (window.ReactNativeWebView?.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: "picked", lng, lat }));
    }
  });

  function onMessage(raw){
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "moveTo") moveTo(msg.lng, msg.lat);
      if (msg.type === "setPin") setPin(msg.lng, msg.lat);
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
  }, [DEFAULT_CENTER.latitude, DEFAULT_CENTER.longitude]);

  const onFindAddress = async () => {
    const txt = searchText.trim();
    if (txt.length < 4) {
      Alert.alert("Type more", "Please type a more complete address.");
      return;
    }
    setBusy(true);
    try {
      const coords = await geocodeAddress(txt);
      if (!coords) {
        Alert.alert("Not found", "Could not geocode that address. Try adding city/country.");
        return;
      }
      await moveTo(coords);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not search that address.");
    } finally {
      setBusy(false);
    }
  };

  const onUseMyLocation = async () => {
    setBusy(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required to use this feature.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords: Coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      await moveTo(coords);
    } catch (e) {
      console.error(e);
      Alert.alert("Location error", "Could not read your GPS location.");
    } finally {
      setBusy(false);
    }
  };

  const onConfirmPress = () => {
    if (!picked) {
      Alert.alert("Pick a spot", "Tap the map to drop a pin first.");
      return;
    }

    onConfirm({
      latitude: picked.latitude,
      longitude: picked.longitude,
      address: pickedAddress || undefined,
      zip: pickedZip || undefined,
    });
  };

  const onWebViewMessage = (evt: any) => {
    try {
      const msg = JSON.parse(evt?.nativeEvent?.data || "{}");
      if (msg.type === "ready") {
        setMapReady(true);
        if (picked) {
          webviewRef.current?.postMessage(
            JSON.stringify({ type: "setPin", lat: picked.latitude, lng: picked.longitude })
          );
        }
      }
      if (msg.type === "picked") {
        setPicked({ latitude: msg.lat, longitude: msg.lng });
      }
    } catch {}
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Pick location</Text>

              {/* ✅ Show address + zip (not coords) */}
              <View style={styles.addressRow}>
                {reverseLoading ? (
                  <View style={styles.addrLoading}>
                    <ActivityIndicator />
                    <Text style={styles.addrHint}>Looking up address…</Text>
                  </View>
                ) : picked ? (
                  <View>
                    <Text style={styles.addrText} numberOfLines={2}>
                      {pickedAddress ? pickedAddress : "Tap a street/building to get address"}
                    </Text>
                    <Text style={styles.zipText}>
                      {pickedZip ? `ZIP: ${pickedZip}` : "ZIP: —"}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.addrHint}>Tap the map to drop a pin.</Text>
                )}
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.searchRow}>
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Search address (optional)…"
                style={styles.input}
              />
              <TouchableOpacity style={styles.smallBtn} onPress={onFindAddress} disabled={busy}>
                {busy ? <ActivityIndicator /> : <Text style={styles.smallBtnText}>Find</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.locBtn} onPress={onUseMyLocation} disabled={busy}>
                <Text style={styles.locBtnText}>📍 Use my location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.smallBtn, { minWidth: 120 }]}
                onPress={onConfirmPress}
              >
                <Text style={styles.smallBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Map */}
          <View style={styles.mapWrap}>
            {isWeb ? (
              <div ref={webDivRef} style={{ width: "100%", height: "100%" }} />
            ) : WebView ? (
              <WebView
                ref={webviewRef}
                originWhitelist={["*"]}
                source={{ html: mapHtml }}
                javaScriptEnabled
                domStorageEnabled
                onMessage={onWebViewMessage}
                style={{ flex: 1 }}
              />
            ) : (
              <View style={styles.fallback}>
                <Text>Missing WebView dependency.</Text>
              </View>
            )}

            {!mapReady && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator />
                <Text style={styles.loadingText}>Loading map…</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={[styles.footerBtn, styles.footerSecondary]} onPress={onClose}>
              <Text style={[styles.footerBtnText, styles.footerSecondaryText]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerBtn} onPress={onConfirmPress}>
              <Text style={styles.footerBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 12,
    justifyContent: "flex-end",
  },
  sheet: {
    height: "85%",
    backgroundColor: Theme.colors.surface,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },

  header: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: { ...Theme.typography.subtitle, fontWeight: "400" },

  addressRow: { marginTop: 6 },
  addrLoading: { flexDirection: "row", alignItems: "center", gap: 8 },
  addrText: { fontSize: 12, color: "#111827" },
  zipText: { fontSize: 12, color: "#111827", marginTop: 2, fontWeight: "400" },
  addrHint: { fontSize: 12, color: "#6b7280" },

  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f3f5",
  },
  closeText: { fontSize: 16, fontWeight: "400" },

  controls: {
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderColor: Theme.colors.border,
  },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  smallBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 70,
    alignItems: "center",
  },
  smallBtnText: { color: "#fff", fontWeight: "400" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locBtn: {
    backgroundColor: "#eef2ff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    flex: 1,
    marginRight: 8,
  },
  locBtnText: { color: Theme.colors.primary, fontWeight: "400", textAlign: "center" },

  mapWrap: { flex: 1, position: "relative" },
  loadingOverlay: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: { fontSize: 12, color: "#374151" },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center" },

  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: Theme.colors.border,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  footerBtn: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  footerBtnText: { color: "#fff", fontWeight: "400" },
  footerSecondary: { backgroundColor: "#f1f5f9" },
  footerSecondaryText: { color: "#111827" },
});
