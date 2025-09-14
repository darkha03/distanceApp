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
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { setToken } = useAuthStore();
  const router = useRouter();
  const handleLogin = async () => {
    try {
    const res = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      throw new Error("Invalid credentials");
    }

    const data = await res.json();
    setToken(data.token);
    await saveToken(data.token);
    router.replace("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    alert("Login failed. Please check your credentials.");
  }
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background }}>
      <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Login</AppText>
      <AppInput 
        placeholder="Username" 
        style={{ width: 200, marginBottom: 12 }}
        value={username}
        onChangeText={setUsername}
      />
      <AppInput
        placeholder="Password" 
        style={{ width: 200, marginBottom: 12 }}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
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
