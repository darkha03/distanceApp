import { AppButton } from "@/components/AppButton";
import { useAuthStore } from "@/store/authStore";
import { removeToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import React from "react";
import { Text, View } from "react-native";

export default function ProfileTab() {
  const { clearToken } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    clearToken();
    await removeToken();
    router.replace("/auth/login");
  }
  return (
    <View style={{ flex: 1, padding: 16, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 8 }}>Username</Text>
      <Text style={{ fontSize: 16, color: "#666", marginBottom: 24 }}>user@example.com</Text>

      <AppButton
        title="Edit Profile"
        onPress={() => console.log("Edit Profile pressed")}
        style={{ marginBottom: 12, width: 200 }}
      />

      <AppButton
        title="Log Out"
        onPress={() => {
          console.log("Log Out pressed"); 
          handleLogout();
        } }
        color="#FF6347"
        style={{ width: 200 }}
      />
    </View>
  );
}
