import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, Image } from "react-native";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";
import * as Location from "expo-location";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const [avatar, setAvatar] = useState("https://via.placeholder.com/100"); // placeholder avatar
  const authContext = React.useContext(AuthContext);
  const [message, setMessage] = useState("");
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const { token } = useAuthStore();
  if (!authContext?.user) {
    return null;
  }
  const [locLoading, setLocLoading] = useState(false);
  const { user } = authContext;
  const [form, setForm] = useState({
    name: user.name || "",
    location: user.location || "",
    avatar: avatar || "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    timezone: user.timezone || ""
  });

  const useDeviceLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMessage("Location permission denied");
        setTimeout(() => setMessage(""), 2500);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      const { latitude, longitude } = pos.coords;

      // Reverse geocode (may return array)
      const places = await Location.reverseGeocodeAsync({ latitude, longitude });
      console.log("Reverse geocoded places:", places);
      const place = places[0];
      const city = place?.city || place?.subregion || "";
      const country = place?.country || "";
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Detected timezone:", tz);

      setForm(prev => ({
        ...prev,
        location: [city, country].filter(Boolean).join(", "),
        latitude,
        longitude,
        timezone: tz
      }));
      setMessage("Location captured");
      setTimeout(() => setMessage(""), 2000);
    } catch (e) {
      console.log(e);
      setMessage("Failed to get location");
      setTimeout(() => setMessage(""), 2500);
    } finally {
      setLocLoading(false);
    }
  };
  
  const handleSave = async () => {
    // TODO: send update to backend
    try {
      const res = await fetch(`${BASE_URL}/api/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
      });
      if (res.ok) {
        setMessage("Profile updated successfully");
        authContext.setUser({ ...user, ...form });
      } else {
        setMessage("Failed to update profile");
      }
    } catch (e) {
      console.error("Failed to update profile", e);
      setMessage("Failed to update profile");
    }
    setEditMode(false);
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <View style={styles.container}>
      {message !== "" && (
        <View style={styles.messageBox}>
          <AppText style={styles.messageText}>{message}</AppText>
        </View>
      )}
      <View style={styles.table}>
        <View style={styles.row}>
          <AppText style={styles.label}>Avatar:</AppText>
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </View>
        <View style={styles.row}>
          <AppText style={styles.label}>Name:</AppText>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(AppText) => setForm({ ...form, name: AppText })}
            />
          ) : (
            <AppText style={styles.value}>{form.name}</AppText>
          )}
        </View>
        <View style={styles.row}>
          <AppText style={styles.label}>Location:</AppText>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText= {(AppText) => setForm({ ...form, location: AppText })}
            />
          ) : (
            <AppText style={styles.value}>{user.location || "Not set"}</AppText>
          )}
        </View>
        <View className="row" style={styles.row}>
          <AppText style={styles.label}>Timezone:</AppText>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.timezone || ""}
              onChangeText={t => setForm({ ...form, timezone: t })}
              placeholder="e.g. Europe/Paris"
            />
          ) : (
            <AppText style={styles.value}>{user.timezone || form.timezone || "Not set"}</AppText>
          )}
        </View>
        {editMode && (
          <View style={styles.row}>
            <AppText style={styles.label}>Coordinates:</AppText>
            <AppText style={styles.value}>
              {form.latitude && form.longitude
                ? `${form.latitude.toFixed(3)}, ${form.longitude.toFixed(3)}`
                : "Not set"}
            </AppText>
          </View>
        )}
      </View>
      {editMode && (
        <Pressable style={[styles.btn, { backgroundColor: "#17a2b8" }]} onPress={useDeviceLocation} disabled={locLoading}>
          <AppText style={styles.btnText}>{locLoading ? "Locating..." : "Use Device Location"}</AppText>
        </Pressable>
      )}

      {!editMode ? (
        <Pressable style={styles.btn} onPress={() => setEditMode(true)}>
          <AppText style={styles.btnText}>Edit</AppText>
        </Pressable>
      ) : (
        <View style={styles.editActions}>
          <Pressable style={styles.btn} onPress={handleSave}>
            <AppText style={styles.btnText}>Save</AppText>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => setEditMode(false)}
          >
            <AppText style={styles.btnText}>Cancel</AppText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: Colors.light.background,
  },
  messageBox: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.success,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 10,
  },
  messageText: {
    color: Colors.light.text,
    fontWeight: "bold",
    fontSize: 16,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
  },
  value: {
    color: Colors.light.text,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 6,
    padding: 8,
    width: 150,
    textAlign: "right",
    color: Colors.light.text,
  },
  btn: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: Colors.light.secondary,
  },
  btnText: {
    color: Colors.light.text,
    fontWeight: "bold",
  },
  editActions: {
    width: "100%",
  },
});
