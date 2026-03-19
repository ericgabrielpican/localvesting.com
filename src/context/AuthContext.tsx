// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { View, ActivityIndicator } from "react-native";
import { User } from "firebase/auth";
import { subscribeToAuth } from "../firebase/auth";

import { db, auth } from "../firebase/config";
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { ensureUserWallet } from "../firebase/wallet";


type UserRole = "admin" | "business" | "investor" | null;

interface AuthContextValue {
  user: User | null;
  role: UserRole;
  roleLoading: boolean;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  roleLoading: true,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // auth init loading
  const [loading, setLoading] = useState(true);

  // role + role loading
  const [role, setRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // 1) Subscribe to Firebase Auth
  useEffect(() => {
    const unsub = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2) Subscribe to Firestore user doc for role (live)
  useEffect(() => {
    if (!user) {
      setRole(null);
      setRoleLoading(false);
      return;
    }

    setRoleLoading(true);
    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(
        ref,
        async (snap) => {
          // If the document doesn't exist yet, CREATE IT HERE
          if (!snap.exists()) {
            try {
              await setDoc(ref, {
                uid: user.uid,
                email: user.email ?? null,
                // role: null,
                createdAt: serverTimestamp(),
              });
              // Note: After setDoc succeeds, this onSnapshot will automatically
              // trigger again with the new data, so we don't need to do anything else here!
            } catch (e) {
              console.warn("Could not create users doc / wallet:", e);
              setRole(null);
              setRoleLoading(false);
            }
            return;
          }

          // If the document DOES exist, read the role and finish loading
          const data = snap.data();
          setRole(data.role ?? null);
          setRoleLoading(false);
        },
        (error) => {
          console.error("Error listening to user doc:", error);
          setRoleLoading(false);
        }
    );

    return unsub;
  }, [user]); // Make sure 'user' is in the dependency array



  const logout = async () => {
    await signOut(auth);
    // user will become null via subscribeToAuth
  };

  const value = useMemo(
    () => ({
      user,
      role,
      roleLoading,
      loading,
      logout,
    }),
    [user, role, roleLoading, loading]
  );

  // Keep the global “spinner while checking auth” behavior
  // ✅ If you want to also wait for role before rendering the app, use:
  // if (loading || (user && roleLoading)) { ... }
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
