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

function StatusSyncer() {
  const authContext = React.useContext(AuthContext);
  const { user, setUser } = authContext ?? {};
  React.useEffect(() => {
    const syncStatus = async () => {
      const status = await WidgetControl.getCurrentStatus();
      if (status && user && user.id) {
        if (setUser) {
          setUser({ ...user, status });
        }
      }
      
    };
    syncStatus();
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        syncStatus();
      }
    });
    return () => subscription.remove();
  }, [user, setUser]);
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