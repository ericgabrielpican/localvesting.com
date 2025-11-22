// app/_layout.tsx
import React, { ReactNode, useEffect } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const isPublicRoute = pathname === "/login" || pathname === "/";

  useEffect(() => {
    // If not logged in and trying to access a protected page → go to login
    if (!user && !isPublicRoute) {
      router.replace("/login" as any);
    }
  }, [user, isPublicRoute, router]);

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
