import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import { useAuthStore } from "@/store/authStore";
import { getToken,removeToken } from "@/utils/storage";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true); // Replace with actual loading logic if needed
  const { token, setToken, clearToken } = useAuthStore();
  const colorScheme = useColorScheme();
  const bgColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;
useEffect(() => {
  async function loadToken() {
    const storedToken = await getToken();
    if (storedToken) {
      try {
        const res = await fetch("http://192.168.1.176:4000/api/auth/verify", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${storedToken}`,
          },
        });
        if (res.ok) {
          setToken(storedToken);
        } else {
          await removeToken(); // clear AsyncStorage
          clearToken(); // clear Zustand store
        }
      } catch (err) {
        console.error("Token verification failed:", err);
        clearToken();
      }
    }
    setIsLoading(false);
  }
  loadToken();
}, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false, 
      headerStyle: { backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' },
      headerTitleStyle: { color: colorScheme === 'dark' ? '#fff' : '#000' },
      contentStyle: { backgroundColor: bgColor }
    }}>
      {token ? (
          <Stack.Screen name="dashboard/(tabs)" options={{ title: "Dashboard" }} /> 
        ) : null}
      {!token &&  <Stack.Screen name="auth/login" options={{ title: "Login" }} />}
      {!token && <Stack.Screen name="auth/register" options={{ title: "Register" }} />}
      <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
    </Stack>
  );
}
