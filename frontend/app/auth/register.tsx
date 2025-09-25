import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import * as React from "react";
import { Button, TouchableOpacity, View, ActivityIndicator } from "react-native";

export default function RegisterScreen() {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const router = useRouter();
  const { setToken } = useAuthStore();
  const handleRegister = async () => {
    setLoading(true);
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, name }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.error || "Registration failed");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setToken(data.token);
      await saveToken(data.token);
      router.replace("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    }
  } 
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Register</AppText>
      <AppInput 
        placeholder="Username" 
        style={{ width: 200, marginBottom: 12 }} 
        value={username}
        onChangeText={setUsername}
      />
      <AppInput 
        placeholder="Email" 
        style={{ width: 200, marginBottom: 12 }} 
        keyboardType="email-address" 
        value={email}
        onChangeText={setEmail}
      />
      <AppInput
        placeholder="Name"
        style={{ width: 200, marginBottom: 12 }}
        value={name}
        onChangeText={setName}
      />
      <AppInput 
        placeholder="Password" 
        style={{ width: 200, marginBottom: 12 }}
        secureTextEntry 
        value={password}
        onChangeText={setPassword}  
      />
      <AppInput 
        placeholder="Confirm Password"
        style={{ width: 200, marginBottom: 12 }} 
        secureTextEntry 
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <AppButton 
        title="Register" 
        onPress={() => handleRegister()} 
        disabled={loading}
      >
        {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
      </AppButton>
      {/* Error message */}
      {error !== "" && (
        <AppText style={{ color: "red", marginTop: 12 }}>{error}</AppText>
      )}
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
