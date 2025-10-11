import { NativeModules } from "react-native";

const { WidgetControlModule } = NativeModules;

if (!WidgetControlModule) {
  console.warn("⚠️ WidgetControlModule is not linked. Make sure native code is properly registered.");
}

/**
 * JS Bridge for interacting with the Android home widget.
 * Provides helper methods to update status, partner info, etc.
 */
export const WidgetControl = {
  /**
   * Update the user's current status shown on the widget.
   */
  updateStatus: async (status: string) => {
    try {
      await WidgetControlModule.updateStatus(status);
    } catch (err) {
      console.error("WidgetControl.updateStatus failed:", err);
    }
  },

  /**
   * Update the partner's current status.
   */
  updatePartnerStatus: async (partnerStatus: string) => {
    try {
      await WidgetControlModule.updatePartnerStatus(partnerStatus);
    } catch (err) {
      console.error("WidgetControl.updatePartnerStatus failed:", err);
    }
  },

  /**
   * Update the partner's timezone.
   */
  updatePartnerTimezone: async (partnerTimezone: string) => {
    try {
      await WidgetControlModule.updatePartnerTimezone(partnerTimezone);
    } catch (err) {
      console.error("WidgetControl.updatePartnerTimezone failed:", err);
    }
  },
};
