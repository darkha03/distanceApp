import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { saveToken } from "@/utils/storage";
import { useRouter } from "expo-router";
import * as React from "react";
import { Pressable, Image, View, ActivityIndicator, Dimensions} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const { setToken } = useAuthStore();
  const router = useRouter();
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const screenHeight = Dimensions.get("window").height;
  const logoTop = Math.max(40, screenHeight / 3 - 50); // 1/3 down, offset for logo height
  const handleLogin = async () => {
    setLoading(true);
    setError("");
    // Check if all fields are filled
    if (!username.trim() || !password.trim()) {
      setError("Please fill in both username and password.");
      setLoading(false);
      return;
    }
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={{ flex: 1 }}>
        {/* Top 1/3 for logo */}
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 12,
              borderRadius: 16,
            }}
            resizeMode="contain"
          />
        </View>
        {/* Bottom 2/3 for login form */}
        <View style={{ flex: 2, justifyContent: "flex-start", alignItems: "center" }}>
          <AppText style={{ fontSize: 24, fontWeight: "700", marginBottom: 24 }}>Login</AppText>
          <AppInput 
            placeholder="Username" 
            style={{ width: 200, marginBottom: 12 }}
            value={username}
            onChangeText={setUsername}
          />
          <View style={{ width: 200, marginBottom: 12, position: "relative" }}>
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
          <View style={{ width: 200}} >
            <AppButton 
              title="Login" 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
            </AppButton>
          </View>
          <View style={{ width:"100%", alignItems: "center" , marginTop: 32 }}>
            {error !== "" && (
              <AppText style={{ color: "red", marginTop: 12 }}>{error}</AppText>
            )}
          </View>
        </View>
        {/* Create Account button at the bottom */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <AppButton
            title="Create an Account"
            onPress={() => router.push("/auth/register")}
            style={{ width: 200 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
