import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // 🚫 hide header only for index
          title: "Home",
        }}
      />
      <Stack.Screen
        name="myprofile"
        options={{
          title: "Profile Settings",
        }}
      />
      <Stack.Screen
        name="account"
        options={{
          title: "Account Settings",
        }}
      />
      <Stack.Screen
        name="partner"
        options={{
          title: "Partner Settings",
        }}
      />
    </Stack>
  );
}
