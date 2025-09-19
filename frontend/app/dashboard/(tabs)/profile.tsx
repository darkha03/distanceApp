import { AppButton } from "@/components/AppButton";
import { useAuthStore } from "@/store/authStore";
import { removeToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { ProfileCard } from "@/features/ProfileCard";
import { AppText } from "@/components/AppText";
import { AuthContext } from "@/utils/authContext";


export default function ProfileTab() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("AuthContext is undefined, make sure you are using AuthProvider");
  }
  const { user, setUser} = context;
  if (!user) {
    return ;
  }
  const { clearToken } = useAuthStore();
  const router = useRouter();
  const handleLogout = async () => {
    clearToken();
    await removeToken();
    router.replace("/auth/login");
  }
  
  return (
    
    <View style={{ flex: 1, padding: 16, backgroundColor: "#4b5563", marginTop: 40 }}>
      <ProfileCard user={user} />

      <AppButton
        title="Log Out"
        onPress={handleLogout}
        color="#FF6347"
        style={{ marginTop: 24, }}
      />

    </View>
  );
}
