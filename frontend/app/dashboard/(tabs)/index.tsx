import { View, StyleSheet, TouchableOpacity } from "react-native";
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PartnerInfoCard } from "@/features/PartnerInfoCard";
import { ActivityCard } from "@/features/ActivityCard";

export default function DashboardScreen() {

  return (
    <View style={styles.container}>
      {/* Partner Info */}
      <PartnerInfoCard />

      {/* My Activity */}
      <ActivityCard />

      {/* Special Events */}
      <AppCard style={styles.card} title="Special Events">
        <View style={styles.section}>
          <AppText>Anniversary 🎉 - in 5 days</AppText>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#4b5563", // will later change dynamically
    marginTop: 40,
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#000", // dark gray for contrast
  },
  section: {
    marginTop: 12,
  },
});
