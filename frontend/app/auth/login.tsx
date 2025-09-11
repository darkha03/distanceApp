import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import * as React from "react";
import { Button, TouchableOpacity, View } from "react-native";

export default function LoginScreen() {
  const { setToken } = useAuthStore();
  const router = useRouter();
  const handleLogin = async () => {
    setToken("dummy-token");
    await saveToken("dummy-token");
    router.replace("/dashboard");
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background }}>
      <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Login</AppText>
      <AppInput placeholder="Username" style={{ width: 200, marginBottom: 12 }} />
      <AppInput
        placeholder="Password" style={{ width: 200, marginBottom: 12 }}
        secureTextEntry
      />
      <AppButton title="Login" onPress={() => {
          console.log("Logging in..."); 
          handleLogin();
        }
      } />
      <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push("/auth/register")}>
        <AppText style={{ color: Colors.light.primary }}>Don't have an account? Register</AppText>
      </TouchableOpacity>
      <View style={{ height: 20 }} />
      {/* Temporary navigation button to Dashboard */}
      <AppText style={{ marginBottom: 8 }}>For testing purposes:</AppText>
      <Button title="Login → Dashboard" onPress={() => router.push("/dashboard")} />
    </View>
  );
}
