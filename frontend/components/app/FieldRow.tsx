import React from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";

export const FieldRow = ({
  left,
  rightComponent,
  isLast,
}: {
  left: string;
  rightComponent: React.ReactNode;
  isLast?: boolean;
}) => (
  <View style={[styles.row, isLast && styles.lastRow]}>
    <AppText style={styles.rowLabel}>{left}</AppText>
    <View style={styles.rightWrap}>{rightComponent}</View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.primary,
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { color: "#fff", fontWeight: "500", fontSize: 14, flex: 1 },
  rightWrap: { flexShrink: 1, maxWidth: "55%", alignItems: "flex-end" },
});