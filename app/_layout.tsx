// app/_layout.tsx
import React, { ReactNode, useEffect, useMemo } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const isPublicRoute = useMemo(() => {
    if (pathname === "/") return true;
    if (pathname.startsWith("/about")) return true;
    if (pathname.startsWith("/login")) return true;
    return false;
  }, [pathname]);

  useEffect(() => {
    // Wait until Firebase auth finishes initializing
    if (loading) return;

    // If user is not logged in and route is protected → redirect to login
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
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </AuthProvider>
  );
}
