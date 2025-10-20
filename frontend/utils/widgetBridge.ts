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

  // Update the partner's image set
    updatePartnerImageSet: async (imageSet: string) => {
    try {
      await WidgetControlModule.updatePartnerImageSet(imageSet);
    } catch (err) {
      console.error("WidgetControl.updatePartnerImageSet failed:", err);
    }
  },

  // Update the partner's image url
  updatePartnerImageUrl: async (imageUrl: string) => {
    try {
      await WidgetControlModule.updatePartnerImageUrl(imageUrl);
    } catch (err) {
      console.error("WidgetControl.updatePartnerImageUrl failed:", err);
    }
  },

  // Update the local image path for the partner's image
  updatePartnerImageLocalPath: async (imagePath: string) => {
    try {
      await WidgetControlModule.updatePartnerImageLocalPath(imagePath);
    } catch (err) {
      console.error("WidgetControl.updatePartnerImagePath failed:", err);
    }
  },

  // Set authentication token for secure communication
  setAuthToken: async (token: string) => {
    try {
      await WidgetControlModule.setAuthToken(token);
    } catch (err) {
      console.error("WidgetControl.setAuthToken failed:", err);
    }
    },
  getCurrentStatus: async (): Promise<string | null> => {
    try {
      const status = await WidgetControlModule.getCurrentStatus();
      return status;
    } catch (err) {
      console.error("WidgetControl.getCurrentStatus failed:", err);
      return null;
    }
  },
  getPartnerImageUrl: async (): Promise<string | null> => {
    try {
      const imageUrl = await WidgetControlModule.getPartnerImageUrl();
      return imageUrl;
    } catch (err) {
      console.error("WidgetControl.getPartnerImageUrl failed:", err);
      return null;
    }
  }      
};
export const syncWidgetWithUser = (user:any) => {
  if (!user) return;
  WidgetControl.updateStatus(user.status || "Offline");
  if (user.partner) {
    WidgetControl.updatePartnerStatus(user.partner.status || "Unknown");
    WidgetControl.updatePartnerTimezone(user.partner.timezone || "UTC");
    WidgetControl.updatePartnerImageSet(user.partner.statusImageSet || "default");
  } else {
    WidgetControl.updatePartnerStatus(user.status || "Unknown");
    WidgetControl.updatePartnerTimezone(user.timezone || "UTC");
    WidgetControl.updatePartnerImageSet(user.statusImageSet || "default");
  }
};
