import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from "react-native";
import * as React from "react"; 
import { AppCard } from "@/components/AppCard";
import { AppText } from "@/components/AppText";
import { PartnerInfoCard } from "@/features/PartnerInfoCard";
import { ActivityCard } from "@/features/ActivityCard";
import { AuthContext } from "@/utils/authContext";

export default function DashboardScreen() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("AuthContext is undefined, make sure you are using AuthProvider");
  }
  const { user, setUser} = context;

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0f0f0" }}>
        <AppText style={{ fontSize: 18, color: "#888" }}>Loading user data...</AppText>
      </View>
    );
  }
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} 
      behavior= {Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView style={styles.container}>
        {/* Partner Info */}
        {user.partnerId && <PartnerInfoCard/> }
        
        {/* My Activity */}
        <ActivityCard />

        {/* Special Events */}
        <AppCard style={styles.card} title="Special Events">
          <View style={styles.section}>
            <AppText>Anniversary 🎉 - in 5 days</AppText>
          </View>
        </AppCard>
      </ScrollView>
    </KeyboardAvoidingView>
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
