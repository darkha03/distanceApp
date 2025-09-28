import React, { useState, useContext } from "react";
import { View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { useAuthStore } from "@/store/authStore";
import { AuthContext } from "@/utils/authContext";
import * as ImagePicker from 'expo-image-picker';
import { statusImageMap } from "@/utils/statusImage";

export const ActivityCard = () => {
  const { token } = useAuthStore();
  const authContext = useContext(AuthContext);
  if (!authContext?.user) {
    return null;
  }
  const user = authContext.user;
  const setUser = authContext.setUser;
  const [selectedActivity, setSelectedActivity] = useState(user.status || "sleep");
  const [thought, setThought] = useState("");
  const [newThought, setNewThought] = useState("");
  const [editing, setEditing] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const [activityImage, setActivityImage] = useState(null);
  // Example activities
  const activities = ["sleep", "study", "relax", "play"];

  const handlePostThought = () => {
    if (newThought.trim()) {
      setThought(newThought.trim());
      setNewThought("");
      setEditing(false);
      // Here you could also send the thought to a backend or store it
      // For now, we just update the local state
    }
  };
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access photo library is required!');
        return;
      }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      const uri = asset.uri;
      console.log("Picked image URI:", uri);
      await uploadActivityImage(uri);
      setActivityImage(uri);
    }
  };

  const uploadActivityImage = async (uri) => {
    try {
      const name = uri.split("/").pop() || "activity.jpg";
      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;

      const form = new FormData();
      form.append("activityImage", {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name,
        type
      });
      console.log("Uploading image with form data:", name, type, ext);

      const res = await fetch(`${BASE_URL}/api/users/activity-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });

      const data = await res.json();
      if (res.ok) {
        setUser(prev => prev ? { ...prev, activityImageUrl: data.activityImageUrl } : prev);
        setActivityImage(`${BASE_URL}${data.activityImageUrl}`);
      } else {
        console.log("Upload failed:", data);
      }
    } catch (e) {
      console.log("Upload error", e);
    }
  };


  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access camera is required!');
        return;
      }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri; 
      setActivityImage(uri);
      await uploadActivityImage(uri);
    }
  };
  const handleUpdateActivity = async (activity) => {
    setSelectedActivity(activity);
    // Here you could also send the status to a backend or store it
    try {
      const res = await fetch(`${BASE_URL}/api/users/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: activity }),
      });
      if (!res.ok) {
        console.error("Failed to update activity status");
      }
      const data = await res.json();
      setUser({ ...user, status: data.status });
    }
    catch (error) {
      console.error("Error updating activity:", error);
    }
  }
  return (
    <AppCard style={styles.card}>
      {/* Row: Left (options) + Right (placeholder image) */}
      <View style={styles.row}>
        {/* Left column - activity options */}
        <View style={styles.optionsColumn}>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity}
              style={[
                styles.optionButton,
                selectedActivity === activity && styles.selectedOption,
              ]}
              onPress={() => handleUpdateActivity(activity)}
            >
              <AppText
                style={[
                  styles.optionText,
                  selectedActivity === activity && styles.selectedOptionText,
                ]}
              >
                {activity}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Right column - placeholder */}
        <View style={styles.imagePlaceholder}>
          <View style={{ justifyContent: 'center', alignItems: 'center', minHeight: 160 }}>
            {activityImage ? (
              <Image
                source={{ uri: activityImage }}
                style={{ width: 160, height: 160, borderRadius: 10 }}
              />
            ) : user.activityImageUrl ? (
              <Image
                source={{ uri: `${BASE_URL}${user.activityImageUrl}` }}
                style={{ width: 160, height: 160, borderRadius: 10 }}
              />
            ) : statusImageMap[user.status] ? (
              <Image
                source={statusImageMap[user.status]}
                style={{ width: 160, height: 160, borderRadius: 10 }}
                resizeMode="contain"
              />
            ) : (
              <Ionicons name="image-outline" size={72} color="#aaa" />
            )}
          </View>
          
          <View style={styles.photoButtonRow}>
            <TouchableOpacity onPress={pickImage} style={styles.photoButton}>
            <Ionicons name="images-outline" size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={takePhoto} style={styles.photoButton}>
            <Ionicons name="camera-outline" size={20} color={Colors.light.text} />
          </TouchableOpacity>
          </View>
        </View>
      
      </View>

      {/* Bottom - Thought input or bubble */}
      {/*<View style={styles.thoughtSection}>
        {thought && !editing ? (
          <View style={styles.thoughtBubble}>
            <AppText style={styles.thoughtText}>{thought}</AppText>
            <TouchableOpacity onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={20} color={Colors.light.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <AppInput
            style={styles.input}
            placeholder="What’s on your mind?"
            placeholderTextColor="#999"
            value={editing ? thought : newThought}
            onChangeText={editing ? setThought : setNewThought}
            onSubmitEditing={editing ? () => setEditing(false) : handlePostThought}
            returnKeyType="done"
          />
        )}
      </View>*/}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 5,
    borderColor: Colors.light.primary,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  optionsColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: 16,
  },
  optionButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: Colors.light.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    minWidth: 100,
    alignItems: "center",
  },
  optionText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  selectedOption: {
    backgroundColor: Colors.light.primary,
  },
  selectedOptionText: {
    color: "#fff",
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 120,
  },
  thoughtSection: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.light.primary,
    backgroundColor: Colors.light.secondary,
  },
  thoughtBubble: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  thoughtText: {
    fontSize: 16,
    color: Colors.light.text,
    flex: 1,
    marginRight: 8,
  },
  photoButtonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 8, // if using RN >= 0.71, otherwise use marginRight on first button
  },
  photoButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
});
