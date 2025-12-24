// src/components/NavBar.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Theme } from "../styles/Theme";
import { MaterialIcons } from "@expo/vector-icons";

// ✅ fallback signout (in case logout isn't exposed by your AuthContext)
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

type NavItemKey =
  | "browse"
  | "map"
  | "dashboard"
  | "businesses"
  | "support"
  | "admin"
  | "about"
  | "home";

interface NavBarProps {
  active?: NavItemKey;
}

const MOBILE_BREAKPOINT = 860;

const NavBar: React.FC<NavBarProps> = ({ active }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, role } = useAuth() as any; // role optional in your setup
  const { width } = useWindowDimensions();

  const isMobile = width < MOBILE_BREAKPOINT;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const inferredActive: NavItemKey | undefined = (() => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/about")) return "about";
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/map")) return "map";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/mybusinesses")) return "businesses";
    if (pathname.startsWith("/support")) return "support";
    if (pathname.startsWith("/admin")) return "admin";
    return undefined;
  })();

  const current = active ?? inferredActive;

  const isAdmin = role === "admin";

  const items = useMemo(() => {
    // Public navbar (not logged in)
    if (!user) {
      return [
        { key: "home" as const, label: "Home", path: "/" },
        { key: "about" as const, label: "Our story", path: "/about" },
      ];
    }

    // Logged in navbar
    const base = [
      { key: "browse" as const, label: "Browse", path: "/browse" },
      { key: "map" as const, label: "Map", path: "/map" },
      { key: "dashboard" as const, label: "Dashboard", path: "/dashboard" },
      { key: "businesses" as const, label: "My Businesses", path: "/mybusinesses" },
      { key: "support" as const, label: "Support", path: "/support" },
    ];

    return isAdmin
      ? [...base, { key: "admin" as const, label: "Admin Panel", path: "/admin" }]
      : base;
  }, [user, isAdmin]);

  const displayName = user?.displayName || user?.email || "Account";
  const displayRole = (role || "Business") as string;

  const go = (path: string) => {
    setMobileOpen(false);
    router.push(path as any);
  };

  // ✅ FIXED LOGOUT
  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      setMobileOpen(false);

      // Preferred: use your context logout if it exists
      if (typeof logout === "function") {
        await logout();
      } else {
        // Fallback: always sign out of Firebase
        await signOut(auth);
      }

      // After signOut, auth state will become null and gate/landing should update
      router.replace("/" as any);
    } catch (e) {
      console.error("Logout failed", e);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        {/* LEFT: Logo */}
        <Pressable
          onPress={() => go(user ? "/browse" : "/")}
          style={styles.logoContainer}
        >
          <View style={styles.logoPill}>
            <Text style={styles.logoIcon}>📈</Text>
          </View>
          <View>
            <Text style={styles.appTitle}>Local Vesting</Text>
            <Text style={styles.appSubtitle}>Invest in local businesses</Text>
          </View>
        </Pressable>

        {/* DESKTOP: Center nav */}
        {!isMobile && (
          <View style={styles.navItemsContainer}>
            {items.map((item) => {
              const isActive = current === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => go(item.path)}
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
        )}

        {/* RIGHT: Desktop user controls OR mobile hamburger */}
        {!isMobile ? (
          <View style={styles.rightArea}>
            {!user ? (
              <View style={styles.authButtons}>
                <Pressable style={styles.secondaryBtn} onPress={() => go("/login")}>
                  <Text style={styles.secondaryBtnText}>Log in</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={() => go("/login")}>
                  <Text style={styles.primaryBtnText}>Sign up</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.userChip}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {displayName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.userName}>
                      {displayName.length > 18 ? displayName.slice(0, 16) + "…" : displayName}
                    </Text>
                    <Text style={styles.userRole}>{displayRole}</Text>
                  </View>
                </View>

                <Pressable
                  style={[styles.logoutIconBtn, loggingOut && { opacity: 0.6 }]}
                  onPress={handleLogout}
                  disabled={loggingOut}
                >
                  <MaterialIcons name="logout" size={18} color={Theme.colors.textMuted} />
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <Pressable
            onPress={() => setMobileOpen((v) => !v)}
            style={styles.hamburger}
          >
            <MaterialIcons
              name={mobileOpen ? "close" : "menu"}
              size={24}
              color={Theme.colors.text}
            />
          </Pressable>
        )}
      </View>

      {/* MOBILE: dropdown */}
      {isMobile && mobileOpen && (
        <View style={styles.mobilePanel}>
          <View style={styles.mobileLinks}>
            {items.map((item) => {
              const isActive = current === item.key;
              return (
                <Pressable
                  key={item.key}
                  onPress={() => go(item.path)}
                  style={[styles.mobileItem, isActive && styles.mobileItemActive]}
                >
                  <Text
                    style={[
                      styles.mobileItemText,
                      isActive && styles.mobileItemTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!user ? (
            <View style={styles.mobileAuthRow}>
              <Pressable style={styles.secondaryBtnWide} onPress={() => go("/login")}>
                <Text style={styles.secondaryBtnText}>Log in</Text>
              </Pressable>
              <Pressable style={styles.primaryBtnWide} onPress={() => go("/login")}>
                <Text style={styles.primaryBtnText}>Sign up</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.mobileFooter}>
              <View style={styles.mobileUserRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userRole}>{displayRole}</Text>
                </View>
              </View>

              <Pressable
                style={[styles.logoutWide, loggingOut && { opacity: 0.6 }]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                <MaterialIcons name="logout" size={18} color="#DC2626" />
                <Text style={styles.logoutWideText}>Log out</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
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
    gap: 12,
  },

  logoContainer: { flexDirection: "row", alignItems: "center" },
  logoPill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: Theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  logoIcon: { fontSize: 18, color: Theme.colors.primaryText },
  appTitle: { fontSize: 16, fontWeight: "700", color: Theme.colors.text },
  appSubtitle: { fontSize: 11, color: Theme.colors.textSubtle },

  navItemsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 1,
    flexWrap: "wrap",
    gap: 6 as any,
  },
  navItem: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  navItemActive: { backgroundColor: "#E0ECFF" },
  navItemText: { fontSize: 13, color: Theme.colors.textMuted },
  navItemTextActive: { color: Theme.colors.primary, fontWeight: "600" },

  rightArea: { flexDirection: "row", alignItems: "center", gap: 10 },

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
  userAvatarText: { fontSize: 13, fontWeight: "700", color: Theme.colors.primary },
  userName: { fontSize: 11, fontWeight: "600", color: Theme.colors.text },
  userRole: { fontSize: 10, color: Theme.colors.textSubtle },

  logoutIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  hamburger: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  mobilePanel: {
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  mobileLinks: { gap: 8 },
  mobileItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  mobileItemActive: { backgroundColor: "#E0ECFF", borderColor: "#BBD3FF" },
  mobileItemText: { fontSize: 14, color: Theme.colors.text },
  mobileItemTextActive: { color: Theme.colors.primary, fontWeight: "700" },

  authButtons: { flexDirection: "row", gap: 10 },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: { color: Theme.colors.primaryText, fontWeight: "700", fontSize: 13 },
  secondaryBtn: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryBtnText: { color: Theme.colors.text, fontWeight: "600", fontSize: 13 },

  mobileAuthRow: { flexDirection: "row", gap: 10 },
  primaryBtnWide: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnWide: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  mobileFooter: { gap: 10, paddingTop: 6 },
  mobileUserRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  logoutWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8 as any,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
  },
  logoutWideText: { fontWeight: "700", color: "#DC2626", fontSize: 13 },
});

export default NavBar;
