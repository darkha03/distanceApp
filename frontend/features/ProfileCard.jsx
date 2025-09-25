import React, { useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppButton } from "@/components/AppButton";
import { Colors } from "@/constants/Colors";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";

export const ProfileCard = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { setUser } = React.useContext(AuthContext);
  const { token } = useAuthStore();
  const [form, setForm] = useState({
    email: user.email || "",
    username: user.username || "",
    name: user.name || "",
    location: user.location || "",
    password: "",
  });
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  const handleSave = () => {
    console.log("Profile updated:", form);
    setIsEditing(false);
    fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // assuming token is passed in user prop
        },
        body: JSON.stringify(form),
    })
    .then((res) => res.json()) 
    .then((data) => {
        console.log("Update response:", data);
        setUser(data); // update context with new user data
    })
    .catch((err) => {
        console.error("Update failed:", err);
    });
  };

  return (
    <AppCard style={styles.card}>
      {!isEditing ? (
        <>
          <AppText style={styles.label}>Email</AppText>
          <AppText style={styles.value}>{form.email}</AppText>

          <AppText style={styles.label}>Username</AppText>
          <AppText style={styles.value}>{form.username}</AppText>

          <AppText style={styles.label}>Name</AppText>
          <AppText style={styles.value}>{form.name || "Not set"}</AppText>

          <AppText style={styles.label}>Location</AppText>
          <AppText style={styles.value}>{form.location || "Not set"}</AppText>

          <AppButton
            title="Edit Profile"
            onPress={() => setIsEditing(true)}
            style={{ marginTop: 16 }}
          />
        </>
      ) : (
        <>
          {/* Email (disabled) */}
          <AppText style={styles.label}>Email</AppText>
          <TextInput
            style={[styles.input, styles.disabled]}
            value={form.email}
            editable={false}
          />

          {/* Username (disabled) */}
          <AppText style={styles.label}>Username</AppText>
          <TextInput
            style={[styles.input, styles.disabled]}
            value={form.username}
            editable={false}
          />

          {/* Editable Name */}
          <AppText style={styles.label}>Name</AppText>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(t) => setForm({ ...form, name: t })}
          />

          {/* Editable Location */}
          <AppText style={styles.label}>Location</AppText>
          <TextInput
            style={styles.input}
            value={form.location}
            onChangeText={(t) => setForm({ ...form, location: t })}
          />

          {/* Change password */}
          <AppText style={styles.label}>Change Password</AppText>
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Enter new password"
            value={form.password}
            onChangeText={(t) => setForm({ ...form, password: t })}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <AppButton
              title="Save"
              onPress={handleSave}
              style={{ flex: 1, marginRight: 8 }}
            />
            <AppButton
              title="Cancel"
              onPress={() => setIsEditing(false)}
              color="#999"
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    color: Colors.light.text,
  },
  value: {
    fontSize: 16,
    marginBottom: 6,
    color: "#555",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 8,
    color: Colors.light.text,
  },
  disabled: {
    backgroundColor: "#f0f0f0",
    color: "#888",
  },
  actions: {
    flexDirection: "row",
    marginTop: 16,
  },
});
