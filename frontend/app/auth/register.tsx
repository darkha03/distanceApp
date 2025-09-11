import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { router } from "expo-router";
import * as React from "react";
import { Button, TouchableOpacity, View } from "react-native";

export default function RegisterScreen() {
  const { setToken } = useAuthStore();
  const handleRegister = async () => {
    setToken("dummy-token");
    await saveToken("dummy-token");
    router.replace("/dashboard");
  } 
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Register</AppText>
      <AppInput placeholder="Username" style={{ width: 200, marginBottom: 12 }} />
      <AppInput placeholder="Email" style={{ width: 200, marginBottom: 12 }} keyboardType="email-address" />
      <AppInput placeholder="Password" style={{ width: 200, marginBottom: 12 }} secureTextEntry />
      <AppInput placeholder="Confirm Password" style={{ width: 200, marginBottom: 12 }} secureTextEntry />
      <AppButton title="Register" onPress={() => handleRegister()} />
      <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push("/auth/login")}>
        <AppText style={{ color: Colors.light.primary }}>Already have an account? Login</AppText>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
      {/* Temporary navigation button to Dashboard */}
      <AppText style={{ marginBottom: 8 }}>For testing purposes:</AppText>
      <Button title="Register → Dashboard" onPress={() => router.push("/dashboard")} />
    </View>
  );
}
