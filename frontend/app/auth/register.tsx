import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, View, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { WidgetControl } from "@/utils/widgetBridge";

export default function RegisterScreen() {
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const router = useRouter();
  const { setToken } = useAuthStore();
  const handleRegister = async () => {
    setLoading(true);
    setError("");
    
    // Check if all fields are filled
    if (!username.trim() || !email.trim() || !name.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
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
      await WidgetControl.setAuthToken(data.token);
      router.replace("/dashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
    }
  } 
  function isValidEmail(email: string) {
    return /^[^@]+@[^@]+\.[^@]+$/.test(email);
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingBottom: 80 }}>
          <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Register</AppText>
          <AppInput
            placeholder="Username"
            style={{ width: 200, marginBottom: 6 }}
            value={username}
            onChangeText={setUsername}
          />
          <AppInput
            placeholder="Email"
            style={{ width: 200, marginBottom: 6 }}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <AppInput
            placeholder="Name"
            style={{ width: 200, marginBottom: 6 }}
            value={name}
            onChangeText={setName}
          />
          <View style={{ width: 200, marginBottom: 6, position: "relative" }}>
            <AppInput
              placeholder="Password"
              style={{ paddingRight: 40 }}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              onPress={() => setShowPassword(v => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: 0,
                height: "100%",
                justifyContent: "center",
                padding: 6,
                zIndex: 2,
              }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#fff"
              />
            </Pressable>
          </View>
          <View style={{ width: 200, marginBottom: 6, position: "relative" }}>
            <AppInput
              placeholder="Confirm Password"
              style={{ paddingRight: 40 }}
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Pressable
              onPress={() => setShowConfirm(v => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: 0,
                height: "100%",
                justifyContent: "center",
                padding: 6,
                zIndex: 2,
              }}
            >
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#fff"
              />
            </Pressable>
          </View>
          <View style={{ width: 200 }}>
            <AppButton
              title="Create Account"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            </AppButton>
          </View>
          {/* Error message */}
          {error !== "" && (
            <AppText style={{ color: "red", marginTop: 12 }}>{error}</AppText>
          )}
        </View>
      </KeyboardAvoidingView>
      <View style={{ position: "absolute", bottom: 40, width: "100%", alignItems: "center" }}>
        <AppButton
          title="Back to Login"
          onPress={() => router.push("/auth/login")}
          style={{ width: 200 }}
        />
      </View>
    </SafeAreaView>
  );
}
