// import React, { useEffect, useState } from "react";
// import {
//   Modal,
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import MapView, { Marker, UrlTile, Region } from "react-native-maps";
// import Button from "./ui/Button";
// import { Theme } from "../styles/Theme";

// type Props = {
//   visible: boolean;
//   address: string;
//   onClose: () => void;
//   onConfirm: (data: {
//     latitude: number;
//     longitude: number;
//     resolvedAddress?: string;
//   }) => void;
//   initialCoords?: { latitude: number; longitude: number } | null;
// };

// const DEFAULT_REGION: Region = {
//   latitude: 45.9432, // Romania center-ish
//   longitude: 24.9668,
//   latitudeDelta: 4,
//   longitudeDelta: 4,
// };

// export default function LocationPickerModal({
//   visible,
//   address,
//   onClose,
//   onConfirm,
//   initialCoords,
// }: Props) {
//   const [region, setRegion] = useState<Region>(DEFAULT_REGION);
//   const [markerCoord, setMarkerCoord] = useState<{
//     latitude: number;
//     longitude: number;
//   } | null>(null);
//   const [loading, setLoading] = useState(false);

//   // When opening, try to geocode address or use initial coords
//   useEffect(() => {
//     if (!visible) return;

//     const init = async () => {
//       if (initialCoords) {
//         const r: Region = {
//           latitude: initialCoords.latitude,
//           longitude: initialCoords.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         };
//         setRegion(r);
//         setMarkerCoord(initialCoords);
//         return;
//       }

//       if (!address.trim()) {
//         setRegion(DEFAULT_REGION);
//         setMarkerCoord({
//           latitude: DEFAULT_REGION.latitude,
//           longitude: DEFAULT_REGION.longitude,
//         });
//         return;
//       }

//       try {
//         setLoading(true);
//         const q = encodeURIComponent(address);
//         const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
//         const res = await fetch(url, {
//           headers: { "User-Agent": "LocalVestingApp/1.0" },
//         });
//         const data = await res.json();
//         if (Array.isArray(data) && data.length > 0) {
//           const item = data[0];
//           const lat = parseFloat(item.lat);
//           const lon = parseFloat(item.lon);
//           const r: Region = {
//             latitude: lat,
//             longitude: lon,
//             latitudeDelta: 0.05,
//             longitudeDelta: 0.05,
//           };
//           setRegion(r);
//           setMarkerCoord({ latitude: lat, longitude: lon });
//         } else {
//           setRegion(DEFAULT_REGION);
//           setMarkerCoord({
//             latitude: DEFAULT_REGION.latitude,
//             longitude: DEFAULT_REGION.longitude,
//           });
//         }
//       } catch (err) {
//         console.warn("Geocode error", err);
//         setRegion(DEFAULT_REGION);
//         setMarkerCoord({
//           latitude: DEFAULT_REGION.latitude,
//           longitude: DEFAULT_REGION.longitude,
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     init();
//   }, [visible, address, initialCoords]);

//   const handleConfirm = () => {
//     if (!markerCoord) return;
//     onConfirm({
//       latitude: markerCoord.latitude,
//       longitude: markerCoord.longitude,
//     });
//   };

//   return (
//     <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Adjust Pin Location</Text>
//         <Text style={styles.subtitle}>
//           Click on the map to place the pin exactly where your business /
//           campaign is located
//         </Text>

//         <View style={styles.mapWrapper}>
//           {loading && (
//             <View style={styles.mapOverlay}>
//               <ActivityIndicator />
//             </View>
//           )}

//           <MapView
//             style={StyleSheet.absoluteFillObject}
//             region={region}
//             onRegionChangeComplete={setRegion}
//             onPress={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
//           >
//             {/* OpenStreetMap tiles */}
//             <UrlTile
//               urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               maximumZ={19}
//               flipY={false}
//             />

//             {markerCoord && (
//               <Marker
//                 coordinate={markerCoord}
//                 draggable
//                 onDragEnd={(e) => setMarkerCoord(e.nativeEvent.coordinate)}
//               />
//             )}
//           </MapView>
//         </View>

//         <View style={styles.buttonsRow}>
//           <Button label="Cancel" variant="secondary" onPress={onClose} />
//           <Button label="Confirm Location" onPress={handleConfirm} />
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Theme.colors.surface,
//     paddingTop: Theme.spacing.xl,
//     paddingHorizontal: Theme.spacing.lg,
//     paddingBottom: Theme.spacing.lg,
//   },
//   title: {
//     ...Theme.typography.title,
//     textAlign: "center",
//     marginBottom: Theme.spacing.sm,
//   },
//   subtitle: {
//     ...Theme.typography.subtitle,
//     textAlign: "center",
//     marginBottom: Theme.spacing.md,
//   },
//   mapWrapper: {
//     flex: 1,
//     borderRadius: Theme.radii.lg,
//     overflow: "hidden",
//     borderWidth: 1,
//     borderColor: Theme.colors.border,
//     marginBottom: Theme.spacing.lg,
//   },
//   mapOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 2,
//     backgroundColor: "rgba(255,255,255,0.4)",
//   },
//   buttonsRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     gap: Theme.spacing.md,
//   },
// });
