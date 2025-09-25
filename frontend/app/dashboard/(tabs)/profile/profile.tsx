import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Image } from "react-native";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";
import * as Location from "expo-location";

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
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.label}>Avatar:</Text>
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          ) : (
            <Text style={styles.value}>{form.name}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText= {(text) => setForm({ ...form, location: text })}
            />
          ) : (
            <Text style={styles.value}>{user.location || "Not set"}</Text>
          )}
        </View>
        <View className="row" style={styles.row}>
          <Text style={styles.label}>Timezone:</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.timezone || ""}
              onChangeText={t => setForm({ ...form, timezone: t })}
              placeholder="e.g. Europe/Paris"
            />
          ) : (
            <Text style={styles.value}>{user.timezone || form.timezone || "Not set"}</Text>
          )}
        </View>
        {editMode && (
          <View style={styles.row}>
            <Text style={styles.label}>Coords:</Text>
            <Text style={styles.value}>
              {form.latitude && form.longitude
                ? `${form.latitude.toFixed(3)}, ${form.longitude.toFixed(3)}`
                : "Not set"}
            </Text>
          </View>
        )}
      </View>
      {editMode && (
        <Pressable style={[styles.btn, { backgroundColor: "#17a2b8" }]} onPress={useDeviceLocation} disabled={locLoading}>
          <Text style={styles.btnText}>{locLoading ? "Locating..." : "Use Device Location"}</Text>
        </Pressable>
      )}

      {!editMode ? (
        <Pressable style={styles.btn} onPress={() => setEditMode(true)}>
          <Text style={styles.btnText}>Edit</Text>
        </Pressable>
      ) : (
        <View style={styles.editActions}>
          <Pressable style={styles.btn} onPress={handleSave}>
            <Text style={styles.btnText}>Save</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => setEditMode(false)}
          >
            <Text style={styles.btnText}>Cancel</Text>
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
    backgroundColor: "#fff",
  },
  messageBox: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    zIndex: 10,
  },
  messageText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
  },
  value: {
    color: "#333",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    width: 150,
    textAlign: "right",
  },
  btn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  editActions: {
    width: "100%",
  },
});
