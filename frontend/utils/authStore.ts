import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { WidgetControl } from "@/utils/widgetBridge";

const secureStorage = {
  getItem: async (k: string) => (await SecureStore.getItemAsync(k)) ?? null,
  setItem: async (k: string, v: string) => { await SecureStore.setItemAsync(k, v); },
  removeItem: async (k: string) => { await SecureStore.deleteItemAsync(k); },
};

type AuthState = {
  token: string | null;
  setToken: (t: string | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (t) => {
        set({ token: t });
        WidgetControl.setAuthToken(t ?? "");
      },
      logout: () => {
        set({ token: null });
        WidgetControl.setAuthToken("");
      },
    }),
    {
      name: "auth_token",
      storage: createJSONStorage(() => secureStorage),
      partialize: (s) => ({ token: s.token }),
      onRehydrateStorage: () => (state) => {
        const t = state?.token ?? null;
        WidgetControl.setAuthToken(t ?? "");
      },
    }
  )
);