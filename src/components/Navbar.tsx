// src/components/Navbar.tsx
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Theme } from "../styles/Theme";
import { logout } from "../firebase/auth";

type NavItemKey =
  | "browse"
  | "map"
  | "dashboard"
  | "businesses"
  | "support"
  | "admin";

interface NavBarProps {
  active?: NavItemKey;
}

const ADMIN_EMAIL = "meeoe49@gmail.com"; // change if needed

const NavBar: React.FC<NavBarProps> = ({ active }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const email = user?.email ?? null;
  const isAdmin = !!email && email === ADMIN_EMAIL;

  // Figure out active tab for logged-in nav
  const inferredActive: NavItemKey | undefined = (() => {
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/map")) return "map";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/mybusinesses")) return "businesses";
    if (pathname.startsWith("/support")) return "support";
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

  const items = isAdmin
    ? [...baseItems, { key: "admin", label: "Admin Panel", path: "/admin" }]
    : baseItems;

  const displayName = user?.displayName || email || "Account";

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed", err);
      alert("Could not log out. Please try again.");
    }
  };

  const goHome = () => router.push("/" as any);
  const goLogin = () => router.push("/login" as any);
  const goSignup = () => router.push("/login" as any); // same screen, different mode inside

  // ---------- PUBLIC NAVBAR (NOT LOGGED IN) ----------
  if (!user) {
    return (
      <View style={styles.root}>
        <View style={styles.inner}>
          {/* LEFT: Logo / brand */}
          <Pressable onPress={goHome} style={styles.logoContainer}>
            <View style={styles.logoPill}>
              <Text style={styles.logoIcon}>📈</Text>
            </View>
            <View>
              <Text style={styles.appTitle}>Local Vesting</Text>
              <Text style={styles.appSubtitle}>
                Invest in local businesses
              </Text>
            </View>
          </Pressable>

          {/* CENTER: Marketing nav links (all go to / for now) */}
          <View style={styles.publicCenterNav}>
            <Pressable onPress={goHome} style={styles.publicNavItem}>
              <Text style={styles.publicNavText}>Home</Text>
            </Pressable>
            <Pressable onPress={goHome} style={styles.publicNavItem}>
              <Text style={styles.publicNavText}>How it works</Text>
            </Pressable>
            <Pressable onPress={goHome} style={styles.publicNavItem}>
              <Text style={styles.publicNavText}>For investors</Text>
            </Pressable>
            <Pressable onPress={goHome} style={styles.publicNavItem}>
              <Text style={styles.publicNavText}>For businesses</Text>
            </Pressable>
          </View>

          {/* RIGHT: Auth CTAs */}
          <View style={styles.publicRight}>
            <Pressable style={styles.loginButton} onPress={goLogin}>
              <Text style={styles.loginButtonLabel}>Log in</Text>
            </Pressable>
            <Pressable style={styles.signupButton} onPress={goSignup}>
              <Text style={styles.signupButtonLabel}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // ---------- AUTHENTICATED NAVBAR ----------
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

        {/* CENTER: App nav items */}
        <View style={styles.navItemsContainer}>
          {items.map((item) => {
            const isActive = current === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.path as any)}
                style={[styles.navItem, isActive && styles.navItemActive]}
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

        {/* RIGHT: User chip + Logout */}
        <View style={styles.rightSection}>
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
              <Text style={styles.userRole}>
                {isAdmin ? "Admin" : "User"}
              </Text>
            </View>
          </View>

          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
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

  // Logo / brand
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

  // Authenticated center nav
  navItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
    gap: 6 as any,
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

  // Right section (logged in)
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
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
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    marginLeft: 4,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Public (logged-out) center nav
  publicCenterNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
    gap: 12 as any,
  },
  publicNavItem: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  publicNavText: {
    fontSize: 13,
    color: Theme.colors.textSubtle,
  },

  // Public (logged-out) right side
  publicRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  loginButtonLabel: {
    fontSize: 13,
    color: Theme.colors.text,
    fontWeight: "500",
  },
  signupButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Theme.colors.primary,
  },
  signupButtonLabel: {
    fontSize: 13,
    color: Theme.colors.primaryText,
    fontWeight: "600",
  },
});

export default NavBar;
