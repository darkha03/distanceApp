import React, { useState } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";

export const ActivityCard = () => {
  const [selectedActivity, setSelectedActivity] = useState("sleep");
  const [thought, setThought] = useState("");
  const [newThought, setNewThought] = useState("");
  const [editing, setEditing] = useState(false);

  const activities = ["sleep", "study", "relax", "playing"];

  const handlePostThought = () => {
    if (newThought.trim()) {
      setThought(newThought.trim());
      setNewThought("");
      setEditing(false);
      // Here you could also send the thought to a backend or store it
      // For now, we just update the local state
    }
  };

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
              onPress={() => setSelectedActivity(activity)}
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
          <Ionicons name="image-outline" size={72} color="#aaa" />
        </View>
      </View>

      {/* Bottom - Thought input or bubble */}
      <View style={styles.thoughtSection}>
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
      </View>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
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
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
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
    backgroundColor: "#f5f5f5",
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
});
