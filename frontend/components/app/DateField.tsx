import React, { useState } from "react";
import { Pressable, View, Modal, Platform, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";

export const formatDate = (d?: string | Date) => {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

export const DateField = ({
  value,
  onChange,
  placeholder,
  editable,
}: {
  value?: string;
  onChange: (val: string) => void;
  placeholder: string;
  editable: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const parsed = value ? new Date(value) : new Date();
  const display = value ? formatDate(value) : "Not set";

  return (
    <>
      {editable ? (
        <Pressable
          onPress={() => setOpen(true)}
          style={[styles.dateButton, !value && styles.dateButtonEmpty]}
        >
          <AppText style={styles.dateButtonText}>{display || placeholder}</AppText>
        </Pressable>
      ) : (
        <AppText style={styles.valueText}>{display || "Not set"}</AppText>
      )}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <AppText style={styles.title}>{placeholder}</AppText>
            <DateTimePicker
              value={parsed}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(e, date) => {
                if (Platform.OS === "android") setOpen(false);
                if (date) onChange(formatDate(date));
              }}
              maximumDate={new Date(2100, 11, 31)}
              minimumDate={new Date(1900, 0, 1)}
              style={{ alignSelf: "center" }}
            />
            {Platform.OS === "ios" && (
              <Pressable style={styles.done} onPress={() => setOpen(false)}>
                <AppText style={styles.doneText}>Done</AppText>
              </Pressable>
            )}
            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <AppText style={styles.cancelText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    minWidth: 140,
  },
  dateButtonEmpty: { opacity: 0.7 },
  dateButtonText: { color: Colors.light.text, fontSize: 14 },
  valueText: { color: Colors.light.text, fontSize: 14 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    padding: 20,
    alignItems: "center",
  },
  title: { color: Colors.light.text, fontWeight: "600", marginBottom: 8, fontSize: 16 },
  done: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
  },
  doneText: { color: Colors.light.text, fontWeight: "600" },
  cancel: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12 },
  cancelText: { color: "#bbb" },
});