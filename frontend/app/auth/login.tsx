import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import * as React from "react";
import { Button, TouchableOpacity, View, ActivityIndicator } from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const { setToken } = useAuthStore();
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
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
      setError("Username or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

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
      <AppButton 
        title="Login" 
        onPress={() => {
          console.log("Logging in..."); 
          handleLogin();
        }} 
        disabled={loading}
      >
        {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
      </AppButton>
      {/* Error message */}
      {error !== "" && (
        <AppText style={{ color: "red", marginTop: 12 }}>{error}</AppText>
      )}
      <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.push("/auth/register")}>
        <AppText style={{ color: Colors.light.primary }}>Don't have an account? Register</AppText>
      </TouchableOpacity>
    </View>
  );
}
