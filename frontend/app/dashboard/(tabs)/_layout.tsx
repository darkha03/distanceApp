import { Tabs } from 'expo-router';
import * as React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/utils/AuthProvider';
import { SocketProvider } from '@/utils/SocketContext';
import { PartnerProvider } from '@/utils/PartnerContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider } from '@/utils/NotificationContext';
import { AppState } from "react-native";
import { WidgetControl } from "@/utils/widgetBridge";
import { AuthContext } from '@/utils/authContext';
import { syncPartnerWidgetImage } from '@/utils/updateWidgetImage';
import { useAuthStore } from '@/utils/authStore';

function StatusSyncer() {
  const authContext = React.useContext(AuthContext);
  const { user, setUser } = authContext ?? {};
  const partnerId = user?.partnerId ?? null;
  const token = useAuthStore(s => s.token);
  // Sync widget status into user once (and on resume), but only if changed
  React.useEffect(() => {
    const syncLocalStatus = async () => {
      const status = await WidgetControl.getCurrentStatus();
      if (status && user && user.id && setUser && status !== user.status) {
        setUser({ ...user, status });
      }
    };
    syncLocalStatus();
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") syncLocalStatus();
    });
    return () => sub.remove();
  }, [user?.id, user?.status, setUser]);

  // Fetch partner info (mount + resume), only when we have partnerId + token
  React.useEffect(() => {
    if (!partnerId || !token) return;

    const syncPartnerImage = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/partners/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const latest = data?.partner?.activityImageUrl;
        await syncPartnerWidgetImage(latest, { returnContentUri: true }).catch(() => {});
        
      } catch {}
    };

    syncPartnerImage();
    const sub = AppState.addEventListener("change", s => {
      if (s === "active") syncPartnerImage();
    });
    return () => sub.remove();
  }, [partnerId, token]);
  return null;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

    return (
      <AuthProvider>
        <SocketProvider>
          <PartnerProvider>
            <NotificationProvider>
            <SafeAreaProvider>
            <StatusSyncer />
            <Tabs
            screenOptions={{
              tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
              headerShown: false,
              tabBarButton: HapticTab,
              tabBarBackground: TabBarBackground,
              tabBarStyle: Platform.select({
                ios: {
                  // Use a transparent background on iOS to show the blur effect
                  position: 'absolute',
                },
                default: {},
              }),
            }}>
            <Tabs.Screen
              name="index"
              options={{
                title: 'Home',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: 'Profile',
                tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
              }}
            />
            </Tabs>
            </SafeAreaProvider>
            </NotificationProvider>
          </PartnerProvider>
        </SocketProvider>
    </AuthProvider>
  );
}