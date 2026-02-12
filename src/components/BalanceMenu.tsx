import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { Theme } from "../styles/Theme";

type WalletType = "live" | "demo";

type Props = {
  uid: string;

  /** Mobile overlay placement */
  anchorTop?: number; // px from top of navbar area
  anchorRight?: number; // px from screen right (same as burger right padding)

  /** Burger sizing so pill can sit to the left of it without moving it */
  burgerSize?: number; // default 40
  gapToBurger?: number; // default 10

  enabled?: boolean;
  closeSignal?: number;

  /** inline = desktop (in-flow). absolute = mobile overlay (out-of-flow) */
  mode?: "inline" | "absolute";

  /** parent can close burger when balance opens */
  onOpenRequested?: () => void;
};

export default function BalanceMenu({
  uid,
  anchorTop = 10,
  anchorRight = 16,
  burgerSize = 40,
  gapToBurger = 10,
  enabled = true,
  closeSignal = 0,
  mode = "absolute",
  onOpenRequested,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();
  const isAbsolute = mode === "absolute";

  const [open, setOpen] = useState(false);

  const [walletLive, setWalletLive] = useState<number>(0);
  const [walletDemo, setWalletDemo] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // Always start on LIVE
  const [walletType, setWalletType] = useState<WalletType>("live");

  const [customAmount, setCustomAmount] = useState("");
  const [showMore, setShowMore] = useState(false);

  // Close when parent tells us (burger closed, route change, etc.)
  useEffect(() => {
    setOpen(false);
  }, [closeSignal]);

  // If disabled, force close
  useEffect(() => {
    if (!enabled) setOpen(false);
  }, [enabled]);

  // Wallet realtime
  useEffect(() => {
    if (!uid) return;

    setWalletLoading(true);
    const ref = doc(db, "users", uid, "wallet", "main");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setWalletLive(0);
          setWalletDemo(0);
          setWalletLoading(false);
          return;
        }
        const data: any = snap.data();
        const live = Number(data?.liveBalance ?? 0);
        const demo = Number(data?.demoBalance ?? 0);

        setWalletLive(Number.isFinite(live) ? Math.max(0, live) : 0);
        setWalletDemo(Number.isFinite(demo) ? Math.max(0, demo) : 0);
        setWalletLoading(false);
      },
      () => {
        setWalletLive(0);
        setWalletDemo(0);
        setWalletLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const selectedBalance = walletType === "live" ? walletLive : walletDemo;

  const pillText = useMemo(() => {
    if (walletLoading) return "Balance…";
    const label = walletType === "live" ? "Balance" : "Balance";
    return `${label}: ${formatMoney(selectedBalance)}`;
  }, [walletLoading, selectedBalance, walletType]);

  const quickAmounts = showMore
    ? [25, 50, 100, 250, 500, 1000, 2000, 5000]
    : [25, 50, 100, 250];

  // Clamp dropdown width for mobile
  const dropdownWidth = Math.min(340, Math.max(260, screenWidth - 24));

  /**
   * PILL placement:
   * - Desktop (inline): in-flow, no absolute offsets
   * - Mobile (absolute): OUT of flow so it never moves the burger.
   *   We place it to the LEFT of the burger:
   *   pillRight = anchorRight + burgerSize + gapToBurger
   */
  const pillRight = anchorRight + burgerSize + gapToBurger;

  const wrapStyle = isAbsolute
    ? [styles.wrapAbsolute, { top: anchorTop, right: pillRight }]
    : styles.wrapInline;

  /**
   * DROPDOWN placement:
   * - Desktop (inline): right: 0 under pill
   * - Mobile (absolute): align dropdown to SCREEN right by shifting it
   *   back by (pillRight - anchorRight) = burgerSize + gapToBurger
   *   => right: -(burgerSize + gapToBurger)
   */
  const dropdownStyle = [
    styles.dropdown,
    { width: dropdownWidth, maxWidth: dropdownWidth },
    isAbsolute ? ({ right: -(burgerSize + gapToBurger) } as any) : null,
  ];

  return (
    <View style={wrapStyle} pointerEvents="box-none">
      {/* Pill */}
      <View style={styles.pillRow} pointerEvents="auto">
        <Pressable
          onPress={() => {
            if (!enabled) return;

            // If opening, request parent to close burger
            if (!open) onOpenRequested?.();

            setOpen((v) => !v);
          }}
          style={({ pressed }) => [
            styles.pill,
            pressed ? { opacity: 0.92 } : null,
            !enabled ? { opacity: 0.6 } : null,
          ]}
        >
          <Text style={styles.pillText} numberOfLines={1}>
            {pillText}
          </Text>
        </Pressable>
      </View>

      {/* Dropdown */}
      {open && enabled ? (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            pointerEvents="auto"
          />

          <View style={dropdownStyle} pointerEvents="auto">
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Add funds</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.toggleRow}>
              <Pressable
                onPress={() => setWalletType("live")}
                style={[
                  styles.toggleBtn,
                  walletType === "live" && styles.toggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    walletType === "live" && styles.toggleTextActive,
                  ]}
                >
                  Live
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setWalletType("demo")}
                style={[
                  styles.toggleBtn,
                  walletType === "demo" && styles.toggleBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    walletType === "demo" && styles.toggleTextActive,
                  ]}
                >
                  Demo
                </Text>
              </Pressable>
            </View>

            <View style={styles.balanceBox}>
              <View style={styles.balanceLine}>
                <Text style={styles.balanceLabel}>Live</Text>
                <Text style={styles.balanceValue}>€{formatMoney(walletLive)}</Text>
              </View>
              <View style={styles.balanceLine}>
                <Text style={styles.balanceLabel}>Demo</Text>
                <Text style={styles.balanceValue}>€{formatMoney(walletDemo)}</Text>
              </View>

              <Text style={styles.balanceHint}>
                Selected:{" "}
                <Text style={styles.balanceStrong}>{walletType.toUpperCase()}</Text>
              </Text>
            </View>

            <ScrollView
              style={styles.amountsScroll}
              contentContainerStyle={styles.amountsScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionTitle}>Quick amounts</Text>

              <View style={styles.amountGrid}>
                {quickAmounts.map((amt) => (
                  <Pressable
                    key={amt}
                    style={styles.amountChip}
                    onPress={() => setCustomAmount(String(amt))}
                  >
                    <Text style={styles.amountChipText}>€{amt}</Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => setShowMore((v) => !v)}
                style={styles.moreLessBtn}
              >
                <Text style={styles.moreLessText}>
                  {showMore ? "Show less" : "Show more"}
                </Text>
              </Pressable>

              <View style={styles.customBox}>
                <Text style={styles.customLabel}>Custom amount</Text>
                <View style={styles.customRow}>
                  <Text style={styles.customEuro}>€</Text>
                  <TextInput
                    value={customAmount}
                    onChangeText={setCustomAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Theme.colors.textSubtle}
                    style={styles.customInput}
                  />
                  <Pressable
                    style={styles.customConfirmBtn}
                    onPress={() => setOpen(false)}
                  >
                    <Text style={styles.customConfirmText}>Continue</Text>
                  </Pressable>
                </View>

                <Text style={styles.smallNote}>
                  (UI-only for now. Connect Stripe / Revolut / Netopia next.)
                </Text>
              </View>
            </ScrollView>
          </View>
        </>
      ) : null}
    </View>
  );
}

function formatMoney(v: any) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return `${n.toLocaleString("en-US")}`;
}

const styles = StyleSheet.create({
  // Mobile overlay: OUT OF FLOW (won't move burger)
  wrapAbsolute: {
    position: "absolute",
    zIndex: 9999,
    pointerEvents: "box-none" as any,
  },

  // Desktop inline: in-flow inside navbar rightArea
  wrapInline: {
    position: "relative",
    zIndex: 20,
    pointerEvents: "box-none" as any,
    alignSelf: "center",
  },

  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  pill: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 260,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pillText: {
    fontSize: 12,
    color: Theme.colors.text,
    fontWeight: "500",
    flexShrink: 1,
  },

  backdrop: {
    ...(Platform.OS === "web"
      ? ({ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 } as any)
      : ({
          position: "absolute",
          top: -2000,
          left: -2000,
          right: -2000,
          bottom: -2000,
        } as any)),
    backgroundColor: "rgba(15, 23, 42, 0.18)",
    zIndex: 9998,
  },

  dropdown: {
    position: "absolute",
    top: "100%" as any,
    marginTop: 10,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: "hidden",
    zIndex: 9999,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    maxHeight: 420,
  },

  dropdownHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFF",
  },
  dropdownTitle: { fontSize: 13, color: Theme.colors.text, fontWeight: "500" },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  closeBtnText: { color: Theme.colors.textMuted, fontWeight: "500" },

  toggleRow: { flexDirection: "row", gap: 10, paddingHorizontal: 12, paddingTop: 10 },
  toggleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleBtnActive: { borderColor: Theme.colors.primary, backgroundColor: "#E0ECFF" },
  toggleText: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "500" },
  toggleTextActive: { color: Theme.colors.primary, fontWeight: "500" },

  balanceBox: {
    marginTop: 10,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    padding: 10,
    backgroundColor: "#FFFBEB",
  },
  balanceLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  balanceLabel: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "500" },
  balanceValue: { fontSize: 12, color: Theme.colors.text, fontWeight: "500" },
  balanceHint: { marginTop: 6, fontSize: 11, color: Theme.colors.textMuted, fontWeight: "500" },
  balanceStrong: { color: Theme.colors.text, fontWeight: "500" },

  amountsScroll: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12 },
  amountsScrollContent: { paddingBottom: 12 },

  sectionTitle: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "500", marginBottom: 8 },
  amountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  amountChip: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  amountChipText: { fontSize: 12, color: Theme.colors.text, fontWeight: "500" },

  moreLessBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  moreLessText: { fontSize: 12, color: Theme.colors.primary, fontWeight: "500" },

  customBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.border, paddingTop: 12 },
  customLabel: { fontSize: 12, color: Theme.colors.textMuted, fontWeight: "500", marginBottom: 8 },
  customRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  customEuro: { fontSize: 14, color: Theme.colors.textMuted, fontWeight: "500" },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Theme.colors.text,
    backgroundColor: "#FFFFFF",
    fontWeight: "500",
  },
  customConfirmBtn: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customConfirmText: { color: Theme.colors.primaryText, fontWeight: "500", fontSize: 12 },
  smallNote: { marginTop: 8, fontSize: 10, color: Theme.colors.textSubtle, fontWeight: "500" },
});
