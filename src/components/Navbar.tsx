// src/components/NavBar.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Theme } from "../styles/Theme";

type NavItemKey =
  | "browse"
  | "map"
  | "dashboard"
  | "businesses"
  | "support"
  | "admin";

interface NavBarProps {
  /** Which item should be highlighted as active */
  active?: NavItemKey;
  /** Show Admin Panel tab (for admin users only) */
  showAdmin?: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ active, showAdmin }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Infer active tab from current route if prop not passed
  const inferredActive: NavItemKey | undefined = (() => {
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/map")) return "map";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/admin")) return "admin";
    return undefined;
  })();

  const current = active ?? inferredActive;

  const baseItems: { key: NavItemKey; label: string; path: string }[] = [
    { key: "browse", label: "Browse", path: "/browse" },
    { key: "map", label: "Map", path: "/map" },
    { key: "dashboard", label: "Dashboard", path: "/dashboard" },
    { key: "businesses", label: "My Businesses", path: "/mybusinesses" },
    { key: "support", label: "Support", path: "/support" }, 
  ];

  const items = showAdmin
    ? [...baseItems, { key: "admin", label: "Admin Panel", path: "/admin" }]
    : baseItems;

  const displayName = user?.displayName || user?.email || "Account";

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        {/* LEFT: Logo pill + text */}
        <Pressable
          onPress={() => router.push("/browse" as any)}
          style={styles.logoContainer}
        >
          <View style={styles.logoPill}>
            <Text style={styles.logoIcon}>📈</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>Local Vesting</Text>
            <Text style={styles.appSubtitle}>P2P Lending Marketplace</Text>
          </View>
        </Pressable>

        {/* CENTER: Nav items */}
        <View style={styles.navItemsContainer}>
          {items.map((item) => {
            const isActive = current === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.path as any)}
                style={[
                  styles.navItem,
                  isActive && styles.navItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.navItemText,
                    isActive && styles.navItemTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* RIGHT: User chip */}
        <View style={styles.userChip}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.userName}>
              {displayName.length > 18
                ? displayName.slice(0, 16) + "…"
                : displayName}
            </Text>
            <Text style={styles.userRole}>Business</Text>
            {/* later you can change this based on role (Investor / Business / Admin) */}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: "100%",
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  inner: {
    maxWidth: 1200,
    width: "100%",
    marginHorizontal: "auto" as any,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  // Left logo/title
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoIcon: {
    fontSize: 18,
    color: Theme.colors.primaryText,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Theme.colors.text,
  },
  appSubtitle: {
    fontSize: 11,
    color: Theme.colors.textSubtle,
  },

  // Center nav items
  navItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
    gap: 6 as any, // RN web will accept this, native ignores
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  navItemActive: {
    backgroundColor: "#E0ECFF",
  },
  navItemText: {
    fontSize: 13,
    color: Theme.colors.textMuted,
  },
  navItemTextActive: {
    color: Theme.colors.primary,
    fontWeight: "600",
  },

  // Right user chip
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  userAvatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: Theme.colors.primary,
  },
  userName: {
    fontSize: 11,
    fontWeight: "600",
    color: Theme.colors.text,
  },
  userRole: {
    fontSize: 10,
    color: Theme.colors.textSubtle,
  },
});

export default NavBar;
