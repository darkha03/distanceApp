import { AppButton } from "@/components/AppButton";
import { AppCard } from "@/components/AppCard";
import { Spacing } from "@/constants/Spacing";
import * as React from "react";
import { ScrollView, Text, View } from "react-native";

export default function HomeTab() {
  const dummyPlans = [
    { title: "Plan 1", description: "Shared expense plan" },
    { title: "Plan 2", description: "Vacation trip plan" },
  ];

  return (
    <ScrollView style={{ flex: 1, padding: Spacing.md, marginTop: Spacing.lg }}>
      <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 16 }}>
        Welcome, User!
      </Text>

      {dummyPlans.map((plan, index) => (
        <AppCard
          key={index}
          title={plan.title}
          description={plan.description}
          onPress={() => console.log(`Clicked ${plan.title}`)}
        />
      ))}

      <View style={{ marginTop: 16 }}>
        <AppButton title="Create New Plan" onPress={() => console.log("Create new plan")} />
      </View>
    </ScrollView>
  );
}
