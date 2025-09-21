import React, { createContext, useState, useContext, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { SocketContext } from "@/utils/SocketContext";

export const PartnerContext = createContext(null);

export const PartnerProvider = ({ children }) => {
  const { token } = useAuthStore();
  const socket = useContext(SocketContext);

  const [partner, setPartner] = useState(null);
  const [inviteStatus, setInviteStatus] = useState("idle"); // idle | pending | accepted | rejected
  const [inviteRequests, setInviteRequests] = useState([]);
  // --- Send invite (API + notify socket) ---
  const sendInvite = async (partnerCode) => {
    try {
      setInviteStatus("pending");

      const res = await fetch("http://localhost:4000/api/users/add-partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ partnerCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      return data;
    } catch (err) {
      setInviteStatus("rejected");
      throw err;
    }
  };
  // --- Fetch incoming invites ---
  const getInvite = async () => {
    try {
        const res = await fetch("http://localhost:4000/api/users/add-partner", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch invite");
        setInviteRequests(data);
        return data || [];
    } catch (err) {
        console.error("Error fetching invite:", err);
        return [];
    }
    };
  
  // --- Fetch invite response (accepted/rejected) ---
  const getResponseInvite = async () => {
    try {
        const res = await fetch("http://localhost:4000/api/users/respond-invite", {
            method: "GET",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch invite response");
        setInviteStatus(data.status || "idle");
        return data;
    } catch (err) {
        console.error("Error fetching invite response:", err);
        return null;
    }
  };
  
  // --- Accept or reject incoming invite ---
  const acceptInvite = (inviteId) => {
    setInviteRequests(prev => prev.filter(invite => invite.id !== inviteId));
  };

  const rejectInvite = (inviteId) => {
    setInviteRequests(prev => prev.filter(invite => invite.id !== inviteId));
  };

  // --- Listen for socket events ---
  useEffect(() => {
    if (!socket) return;

    // Someone sent you an invite
    socket.on("partner:invite", (invite) => {
      console.log("📩 Incoming invite:", invite);
      setInviteRequests(prev => [...prev, invite]); // store invite details (e.g., fromUser, code)
    });

    // Your invite was accepted
    socket.on("partner:accepted", (partnerData) => {
      console.log("✅ Invite accepted:", partnerData);
      setPartner(partnerData);
      setInviteStatus("accepted");
    });

    // Your invite was rejected
    socket.on("partner:rejected", () => {
      console.log("❌ Invite rejected");
      setInviteStatus("rejected");
    });

    return () => {
      socket.off("partner:invite");
      socket.off("partner:accepted");
      socket.off("partner:rejected");
    };
  }, [socket]);

  return (
    <PartnerContext.Provider
      value={{
        partner,
        inviteStatus,
        inviteRequests,
        sendInvite,
        getInvite,
        getResponseInvite,
        acceptInvite,
        rejectInvite,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};

export const usePartner = () => useContext(PartnerContext);
