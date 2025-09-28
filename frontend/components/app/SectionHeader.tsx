import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";

export const SectionHeader = ({ title, editing, onEdit }: { title: string; editing: boolean; onEdit: () => void }) => (
  <View style={styles.sectionHeader}>
    <AppText style={styles.sectionTitle}>{title}</AppText>
    {!editing && (
      <Pressable hitSlop={8} onPress={onEdit}>
        <AppText style={styles.editLink}>Edit</AppText>
      </Pressable>
    )}
  </View>
);

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    marginBottom: 6,
  },
  sectionTitle: { color: "#fff", fontWeight: "600", fontSize: 15 },
  editLink: { color: Colors.light.primary, fontWeight: "600" },
});