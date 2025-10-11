import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { AuthContext } from "./authContext";
import { SocketContext } from "./SocketContext";
import type {ActivityImage} from "./authContext";
import { WidgetControl } from "./widgetBridge";

export interface PartnerData {
  id: string;
  username?: string;
  name?: string;
  status?: string;
  location?: string;
  timezone?: string;
  birthday?: Date;
  anniversary?: Date;
  activityImageUrl?: string;
  avatarUrl?: string;
  activityImages?: { id: string; url: string; createdAt: string }[];
}

export interface Invite {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: { id: string; username: string };
}

interface PartnerContextType {
  inviteStatus: string;
  inviteRequests: Invite[];
  sendInvite: (code: string) => Promise<any>;
  getInvite: () => Promise<Invite[]>;
  getResponseInvite: () => Promise<any>;
  acceptInvite: (inviteId: string) => void;
  rejectInvite: (inviteId: string) => void;
  removePartner: () => Promise<any>;
}

const PartnerContext = createContext<PartnerContextType | null>(null);

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  const authCtx = useContext(AuthContext);
  if (!authCtx) throw new Error("AuthContext missing");
  const { user, setUser } = authCtx;
  const socket = useContext(SocketContext) as import("socket.io-client").Socket | null;
  const [inviteStatus, setInviteStatus] = useState("idle");
  const [inviteRequests, setInviteRequests] = useState<Invite[]>([]);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  const sendInvite = async (code: string) => {
    const res = await fetch(`${BASE_URL}/api/users/add-partner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ partnerCode: code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteStatus("rejected");
      throw new Error(data.error || "Failed to send invite");
    }
    setInviteStatus("pending");
    return data;
  };

  const getInvite = async () => {
    const res = await fetch(`${BASE_URL}/api/users/add-partner`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) return [];
    const arr = Array.isArray(data) ? data : [];
    setInviteRequests(arr);
    return arr;
  };

  const getResponseInvite = async () => {
    const res = await fetch(`${BASE_URL}/api/users/respond-invite`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.status) setInviteStatus(data.status);
    return data;
  };

  const acceptInvite = (inviteId: string) => {
    setInviteRequests((prev) => prev.filter((i) => i.id !== inviteId));
  };
  const rejectInvite = (inviteId: string) => {
    setInviteRequests((prev) => prev.filter((i) => i.id !== inviteId));
  };

  const removePartner = async () => {
    if (!user?.partnerId) return;
    const res = await fetch(`${BASE_URL}/api/partners/${user.partnerId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to remove partner");
    setUser((prev) => (prev ? { ...prev, partner: null, partnerId: undefined } : prev));
    setInviteStatus("idle");
    console.log("PartnerScreen render user.partner =", user?.partner);
    return data;
  };

  function mergePartner(prev: any, incoming: any) {
    if (!prev) return incoming;
    return {
      ...prev,
      ...incoming,                 // incoming overwrites only provided keys
    };
  }


  // (Optional) load invites on mount
  useEffect(() => {
    if (token) {
      getInvite().catch(() => {});
      getResponseInvite().catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (!socket) return;

    const safeSet = setUser;

    const patchPartner = (partial: any) => {
      safeSet(prev => {
        if (!prev) return prev;
        const currentPartnerId = prev.partnerId;
        // If partial has an id and doesn't match current partner, ignore.
        if (partial.id && currentPartnerId && String(partial.id) !== String(currentPartnerId)) {
          return prev;
        }
        return {
          ...prev,
          partnerId: partial.id || currentPartnerId,
          partner: mergePartner(prev.partner, partial),
        };
      });
    };

    socket.on("partner:invite", (invite) => {
      setInviteRequests(prev => [...prev, invite]);
    });

    socket.on("partner:accepted", (partnerData) => {
      setUser(prev => prev ? { ...prev, partner: partnerData, partnerId: partnerData.id } : prev);
      setInviteStatus("accepted");
    });

    socket.on("partner:rejected", () => {
      setInviteStatus("rejected");
    });

    socket.on("partner:removed", () => {
      setUser(prev => prev ? { ...prev, partner: null, partnerId: undefined } : prev);
      setInviteStatus("idle");
    });

    socket.on("partner:status", ({ partnerId, status }) => {
      patchPartner({ id: partnerId, status });
      // Also update widget if partner status changes
      WidgetControl.updatePartnerStatus(status).catch((err) => {
        console.error("Failed to update partner status on widget:", err);
      });
    });

    socket.on("partner:activityImages", ({ userId, images }) => {
      patchPartner((prevPartner: any) => {
        // If no previous images, just use incoming
        const prevImages = prevPartner?.activityImages || [];
        // Merge by id, keeping unique and sorting by createdAt
        const map = new Map<string, any>();
        prevImages.forEach((img: ActivityImage) => map.set(img.id, img));
        images.forEach((img: ActivityImage)  => map.set(img.id, img));
        const mergedImages = Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return { id: userId, activityImages: mergedImages };
      });
    });

    socket.on("activityImages:expired", ({ expiredImageIds }) => {
      patchPartner((prevPartner: any) => {
        if (!prevPartner?.activityImages) return prevPartner;
        const filteredImages = prevPartner.activityImages.filter(
          (img: ActivityImage) => !expiredImageIds.includes(img.id)
        );
        return { activityImages: filteredImages };
      });
    });

    socket.on("partner:update", (partnerData) => {
      patchPartner(partnerData);
      if (partnerData.timezone) {
        WidgetControl.updatePartnerTimezone(partnerData.timezone).catch((err) => {
          console.error("Failed to update partner timezone on widget:", err);
        });
      }
    });

    socket.on("partner:anniversary", ({userId, anniversary }) => {
      patchPartner({ id: userId, anniversary  });
      setUser(prev =>
        prev && prev.partner && prev.partnerId === userId
          ? { ...prev, anniversary }
          : prev
      );
    });

    return () => {
      socket.off("partner:invite");
      socket.off("partner:accepted");
      socket.off("partner:rejected");
      socket.off("partner:removed");
      socket.off("partner:status");
      socket.off("partner:activityImages");
      socket.off("partner:update");
      socket.off("partner:anniversary");
    };
  }, [socket, setUser]);

  return (
    <PartnerContext.Provider
      value={{
        inviteStatus,
        inviteRequests,
        sendInvite,
        getInvite,
        getResponseInvite,
        acceptInvite,
        rejectInvite,
        removePartner,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export function usePartner(): PartnerContextType {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used within PartnerProvider");
  return ctx;
}
