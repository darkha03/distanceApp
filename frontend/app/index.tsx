import { useAuthStore } from "@/utils/authStore";
import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function IndexScreen() {
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace("/dashboard/(tabs)");
    } else {
      router.replace("/auth/login");
    }
  }, [token]);

  return null; // Or a loading spinner
}