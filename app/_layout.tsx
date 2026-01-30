// app/_layout.tsx
import React, { ReactNode, useEffect, useMemo } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import CookieBanner from "../src/components/CookieBanner";
import Navbar from "../src/components/Navbar";

type NavItemKey =
  | "browse"
  | "map"
  | "dashboard"
  | "businesses"
  | "support"
  | "admin"
  | "about"
  | "home";

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = useMemo(() => {
    if (pathname === "/") return true;
    if (pathname.startsWith("/about")) return true;
    if (pathname.startsWith("/login")) return true;

    // legal pages public
    if (pathname.startsWith("/terms")) return true;
    if (pathname.startsWith("/privacy-policy")) return true;
    if (pathname.startsWith("/cookie-policy")) return true;

    return false;
  }, [pathname]);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicRoute) {
      router.replace("/login" as any);
    }
  }, [user, loading, isPublicRoute, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate>
        <RootChrome />
      </AuthGate>
    </AuthProvider>
  );
}

function RootChrome() {
  const pathname = usePathname();

  // ✅ Optional: pass active from layout (NavBar already infers it, but this supports overrides)
  const active: NavItemKey | undefined = useMemo(() => {
    if (pathname === "/") return "home";
    if (pathname.startsWith("/about")) return "about";
    if (pathname.startsWith("/browse")) return "browse";
    if (pathname.startsWith("/map")) return "map";
    if (pathname.startsWith("/dashboard")) return "dashboard";
    if (pathname.startsWith("/mybusinesses")) return "businesses";
    if (pathname.startsWith("/support")) return "support";
    if (pathname.startsWith("/admin")) return "admin";
    return undefined; // terms/privacy/cookies -> no highlight
  }, [pathname]);

  return (
    <>
       <Navbar active={active} /> 

      <Stack screenOptions={{ headerShown: false }} />

      <CookieBanner />
    </>
  );
}
