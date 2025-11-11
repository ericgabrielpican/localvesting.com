// src/components/Navbar.tsx
import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { logout } from "../firebase/auth";

const Navbar: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login" as any);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Logout error", e?.message ?? "Could not log out.");
    }
  };

  return (
    <View className="flex-row justify-between items-center px-4 py-3 bg-white border-b border-gray-200">
      <TouchableOpacity onPress={() => router.push("/browse" as any)}>
        <Text className="text-xl font-semibold text-primary">LocalVesting</Text>
      </TouchableOpacity>

      <View className="flex-row items-center space-x-4">
        <TouchableOpacity onPress={() => router.push("/browse" as any)}>
          <Text className="text-gray-700">Browse</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/dashboard" as any)}>
          <Text className="text-gray-700">Dashboard</Text>
        </TouchableOpacity>

        {/* Admin entry – for now visible when logged in; later we can gate this by isAdmin from Firestore */}
        {user && (
          <TouchableOpacity onPress={() => router.push("/admin" as any)}>
            <Text className="text-gray-700">Admin</Text>
          </TouchableOpacity>
        )}

        {user && (
          <TouchableOpacity onPress={handleLogout}>
            <Text className="text-gray-400 text-sm">Logout</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Navbar;
