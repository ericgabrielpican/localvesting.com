// src/components/NavBar.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { Theme } from "../styles/Theme";
import { MaterialIcons } from "@expo/vector-icons";

// ✅ fallback signout (in case logout isn't exposed by your AuthContext)
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";

// ✅ Balance pill + dropdown
import BalanceMenu from "./BalanceMenu";

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
  const { user, logout, role } = useAuth() as any;
  const { width } = useWindowDimensions();

  const isMobile = width < MOBILE_BREAKPOINT;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
const [closeSignal, setCloseSignal] = useState(0);

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
    if (!user) {
      return [
        { key: "home" as const, label: "Home", path: "/" },
        { key: "about" as const, label: "Our story", path: "/about" },
      ];
    }

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
    // ✅ if burger closes, also close the balance menu via its own internal state
    // (we’ll also close burger here)
    setMobileOpen(false);
    router.push(path as any);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      setMobileOpen(false);

      if (typeof logout === "function") {
        await logout();
      } else {
        await signOut(auth);
      }

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
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* RIGHT: controls */}
        <View style={styles.rightArea}>
          {!user ? (
            !isMobile ? (
              <View style={styles.authButtons}>
                <Pressable style={styles.secondaryBtn} onPress={() => go("/login?mode=login")}>
                  <Text style={styles.secondaryBtnText}>Log in</Text>
                </Pressable>
                <Pressable style={styles.primaryBtn} onPress={() => go("/login?mode=signup")}>
                  <Text style={styles.primaryBtnText}>Sign up</Text>
                </Pressable>
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
            )
          ) : (
            <>
              {/* ✅ Balance pill goes HERE (desktop + mobile), so it sits next to right controls */}
{!isMobile && user && (
  <BalanceMenu uid={user.uid} mode="inline" onOpenRequested={() => {}} />
)}

{/* Mobile (absolute next to burger) */}
{isMobile && user && (
  <BalanceMenu
    uid={user.uid}
    mode="absolute"
    anchorTop={0}
    anchorRight={0}
    burgerSize={40}
    gapToBurger={10}
    closeSignal={closeSignal}
    onOpenRequested={() => setMobileOpen(false)}
  />
)}
              {/* Desktop: user chip + logout */}
              {!isMobile ? (
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
              ) : (
                // Mobile: burger button stays on the far right, pill is to its left in same row
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
            </>
          )}
        </View>
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
                  <Text style={[styles.mobileItemText, isActive && styles.mobileItemTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
    // ✅ IMPORTANT: allow dropdown to visually overflow the navbar on web
    overflow: Platform.OS === "web" ? ("visible" as any) : "visible",
    zIndex: 50,
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
    overflow: Platform.OS === "web" ? ("visible" as any) : "visible",
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

  // ✅ keep everything on the right in one row
  rightArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    overflow: Platform.OS === "web" ? ("visible" as any) : "visible",
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
