import React, { useState, useContext } from "react";
import { View, TouchableOpacity, StyleSheet, Image, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { useAuthStore } from "@/store/authStore";
import { AuthContext } from "@/utils/authContext";
import * as ImagePicker from 'expo-image-picker';
import { statusImageMap } from "@/utils/statusImage";
import * as ImageManipulator from 'expo-image-manipulator';
import { WidgetControl } from "@/utils/widgetBridge";

export const ActivityCard = () => {
  const { token } = useAuthStore();
  const authContext = useContext(AuthContext);
  if (!authContext?.user) {
    return null;
  }
  const user = authContext.user;
  const setUser = authContext.setUser;
  const [selectedActivity, setSelectedActivity] = useState(user.status || "sleep");
  //const [thought, setThought] = useState("");
  //const [newThought, setNewThought] = useState("");
  //const [editing, setEditing] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const activities = ["sleep", "study", "relax", "play"];
  const [activityImages, setActivityImages] = useState(user.activityImages || []); // new
  const IMAGE_SIZE = 160;
  const [currentIndex, setCurrentIndex] = useState(0);
  const imageSet = user.statusImageSet || "default";

{/*  const handlePostThought = () => {
    if (newThought.trim()) {
      setThought(newThought.trim());
      setNewThought("");
      setEditing(false);
      // Here you could also send the thought to a backend or store it
      // For now, we just update the local state
    }
  };*/}

  const resizeImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Resize to width of 800px, height auto
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (e) {
      console.log("Image resize error:", e);
      return uri; // Fallback to original if resize fails
    }
  };
  const uploadActivityImages = async (uris) => {
    try {
      if (!uris.length) return;
      const form = new FormData();

      for (let idx = 0; idx < uris.length; idx++) {
        const originalUri = uris[idx];
        const resizedUri = await resizeImage(originalUri); // <-- resize here
        const name = originalUri.split("/").pop() || `activity-${idx}.jpg`;
        const ext = (name.split(".").pop() || "jpg").toLowerCase();
        const type = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
        form.append("activityImages", {
          uri: resizedUri.startsWith("file://") ? resizedUri : `file://${resizedUri}`,
          name,
          type
        });
      }

      const res = await fetch(`${BASE_URL}/api/users/activity-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form
      });
      const data = await res.json();
      if (res.ok && data.uploaded) {
        setActivityImages(prev => {
          // merge unique by id
          const map = new Map(prev.map(i => [i.id, i]));
          data.uploaded.forEach(i => map.set(i.id, i));
          return Array.from(map.values()).sort((a,b)=> new Date(a.createdAt)-new Date(b.createdAt));
        });
        setUser(prev => prev ? { ...prev, activityImages: (prev.activityImages || []).concat(data.uploaded) } : prev);
      } else {
        console.log("Multi upload failed:", data);
      }
    } catch (e) {
      console.log("Upload error", e);
    }
  };
  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission to access photo library is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      allowsEditing: false,
      quality: 0.9
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      await uploadActivityImages(uris);
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
      await uploadActivityImages([result.assets[0].uri]);
    }
  };
  const renderActivityCarousel = () => {
    if (!activityImages.length) {
      return user.status && statusImageMap[imageSet][user.status] ? (
        <Image
          source={statusImageMap[imageSet][user.status]}
          style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 10 }}
          resizeMode="contain"
        />
      ) : (
        <Ionicons name="image-outline" size={72} color="#aaa" />
      );
    }
    return (
      <FlatList
        horizontal
        data={activityImages}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
            const index = Math.round(e.nativeEvent.contentOffset.x / IMAGE_SIZE);
            setCurrentIndex(Math.min(index, activityImages.length - 1));
          }}
        pagingEnabled
        snapToInterval={IMAGE_SIZE + 8}
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, marginRight: 8 }}>
            <Image
              source={{ uri: `${item.url}` }}
              style={{ width: "100%", height: "100%", borderRadius: 10 }}
            />
            <View style={styles.dotsRow}>
              {activityImages.map((_, i)=>(
                <View key={i} style={[styles.dot, i===currentIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        )}
        style={{ maxHeight: IMAGE_SIZE }}
        contentContainerStyle={{ paddingRight: 8 }}
      />
    );
  };
  const handleUpdateActivity = async (activity) => {
    setSelectedActivity(activity);
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
      // Update widget as well
      WidgetControl.updateStatus(data.status).catch((err) => {
        console.error("Failed to update user status on widget:", err);
      });
      if(!user.partner){
        WidgetControl.updatePartnerStatus(data.status).catch((err) => {
          console.error("Failed to update partner status on widget:", err);
        });
      }
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
            {renderActivityCarousel()}
          </View>
          
          <View style={styles.photoButtonRow}>
            <TouchableOpacity onPress={pickImages} style={styles.photoButton}>
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
    minHeight: 160,
    padding: 4,
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
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#555",
    marginHorizontal: 3
  },
  dotActive: {
    backgroundColor: "#c9a4f7"
  }
});
