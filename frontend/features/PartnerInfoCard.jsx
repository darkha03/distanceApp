import { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { Ionicons } from "@expo/vector-icons";

export function PartnerInfoCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <AppCard style={styles.card}>
      {/* Date + Time */}
      <View style={styles.centered}>
        <AppText style={styles.day}>Tuesday, Oct 2 2025</AppText>
        <View style={styles.timeRow}>
            <View>
                <AppText style={styles.time}>19:10</AppText>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
                <Ionicons 
                name="person-circle-outline"
                size={72}
                color="#888" // placeholder gray        
                />
            </View>
        </View>
      </View>

      {/* Expandable Section */}
      {expanded && (
        <View style={styles.moreInfo}>
          <AppText style={styles.label}>Weather: ☁️ 12°C</AppText>
          <AppText style={styles.label}>Timezone: UTC+1</AppText>
        </View>
      )}

      {/* Expand/Collapse Arrow */}
      <TouchableOpacity
        style={styles.arrowContainer}
        onPress={() => setExpanded(!expanded)}
      >
        <AppText style={styles.arrow}>{expanded ? "▲" : "▼"}</AppText>
      </TouchableOpacity>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  centered: {
   width: "100%",
  },
  day: {
    fontSize: 16,
    fontWeight: "600",
    color: "#aaa",
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  time: {
    fontSize: 64,
    fontWeight: "700",
    color: "#fff",
    textAlign: "left",
  },
  activityImage: {
    width: 48,
    height: 48,
    marginLeft: 12,
  },
  moreInfo: {
    marginTop: 16,
    alignItems: "center",
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 6,
  },
  arrowContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  arrow: {
    fontSize: 20,
    color: "#a78bfa", // purple accent
    fontWeight: "600",
  },
});
