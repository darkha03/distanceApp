import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "expo-router";
import { AuthContext } from "@/utils/authContext";
import * as Clipboard from 'expo-clipboard';
import React from "react";

export default function ProfileScreen() {
  const { clearToken, token } = useAuthStore();
  const router = useRouter();
  const authContext = React.useContext(AuthContext);
  const [copied, setCopied] = React.useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  if (!token || !authContext?.user) {
    return null;
  }
  const { user } = authContext;
  // Fake invite code from token (later decode from JWT or API)
  const inviteCode = authContext.user.code || "N/A";

  const copyCode = async () => {
  try {
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  } catch (e) {
    console.log("Copy failed", e);
  }
};

  const handleLogout = async () => {
    clearToken();
    router.replace("/auth/login");
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {user.avatarUrl ? (
          <Image source={{ uri: `${BASE_URL}${user.avatarUrl}` }} style={styles.avatarImg} />
        ) : (
          <Ionicons name="person-circle-outline" size={120} color={Colors.light.text} />
        )}
      </View>

      {/* Invite code */}
      <View style={styles.inviteWrapper}>
        <AppText style={styles.inviteLabel}>Your Invite Code</AppText>
        <View style={styles.inviteRow}>
          <AppText style={styles.inviteCode}>{inviteCode}</AppText>
          <TouchableOpacity onPress={copyCode}>
            {copied ? (
              <Ionicons name="checkmark-outline" size={20} color={Colors.light.primary} />
            ) : (
              <Ionicons name="copy-outline" size={20} color={Colors.light.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings list */}
      <View style={styles.settingsWrapper}>
        <TouchableOpacity
          style={styles.settingsItem}
          onPress={() => router.push("/dashboard/(tabs)/profile/account")}
        >
          <Ionicons name="settings-outline" size={22} color={Colors.light.text} />
          <AppText style={styles.settingsText}>Account Settings</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsItem}
          onPress={() => router.push("/dashboard/(tabs)/profile/myprofile")}
        >
          <Ionicons name="person-outline" size={22} color={Colors.light.text} />
          <AppText style={styles.settingsText}>Profile Settings</AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsItem}
          onPress={() => router.push("/dashboard/(tabs)/profile/partner")}
        >
          <Ionicons name="heart-outline" size={22} color={Colors.light.text} />
          <AppText style={styles.settingsText}>Partner Settings</AppText>
        </TouchableOpacity>
      </View>

      {/* Logout button */}
      <View style={styles.footer}>
        <AppButton
          title="Log Out"
          onPress={handleLogout}
          style={{ width: "100%", backgroundColor: Colors.light.primary }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#000", marginTop: 40 },

  avatarWrapper: { alignItems: "center", marginBottom: 20 },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  inviteWrapper: { alignItems: "center", marginBottom: 30 },
  inviteLabel: { fontSize: 14, color: Colors.light.primary, marginBottom: 4 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  inviteCode: { fontSize: 20, fontWeight: "bold", color: Colors.light.text },

  settingsWrapper: { marginBottom: 40 },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  settingsText: { fontSize: 16, marginLeft: 12 },

  footer: { marginTop: "auto" },
});
