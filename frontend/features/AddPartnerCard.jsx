import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { usePartner } from "@/utils/PartnerContext";
import { useAuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/utils/authStore";

export const AddPartnerCard = () => {
  const [visible, setVisible] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const {
    sendInvite,
    inviteStatus,
    acceptInvite,
    rejectInvite,
    inviteRequests,
    getInvite,
    getResponseInvite,
  } = usePartner(); // single call
  const { user, setUser } = useAuthContext();
  const { token } = useAuthStore();
  const [inviteVisible, setInviteVisible] = useState(false);
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';

  useEffect(() => {
    getInvite().catch(()=>{});
    getResponseInvite().catch(()=>{});
  }, []);

  useEffect(() => {
    if (inviteRequests.length > 0) setInviteVisible(true);
  }, [inviteRequests]);

  const onAddPartner = async () => {
    if (!partnerCode.trim()) {
      setError("Please enter a partner code");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await sendInvite(partnerCode.trim());
      setVisible(false);
      setPartnerCode("");
    } catch (e) {
      setError(e.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const respond = async (invite, status) => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/respond-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      if (status === "accepted") {
        // data.user is the updated current user, data.partner is partner details
        setUser(prev => prev ? { ...prev, ...data.user, partner: data.partner } : prev);
      }
    } catch (e) {
      console.log("Respond error:", e);
    } finally {
      setInviteVisible(false);
    }
  };

  return (
    <>
      {inviteStatus === "pending" && (
        <View style={styles.notice}>
          <AppText style={{ color: "white", textAlign: "center" }}>
            Invite sent! Waiting for partner to accept.
          </AppText>
          <View style={styles.iconWrapper}>
            <ActivityIndicator size="small" color="white" style={{ marginTop: 8 }} />
          </View>
        </View>
      )}

      {inviteStatus !== "pending" && (
        <TouchableOpacity style={styles.card} onPress={() => setVisible(true)}>
          <AppText style={styles.cardText}>ADD YOUR PARTNER HERE</AppText>
          <View style={styles.iconWrapper}>
            <Ionicons name="add-circle" size={48} color={Colors.light.primary} />
          </View>
        </TouchableOpacity>
      )}

      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <AppText style={styles.title}>Enter Partner Code</AppText>
            <AppInput
              style={styles.input}
              placeholder="Partner Code"
              value={partnerCode}
              onChangeText={setPartnerCode}
              editable={!loading}
            />
            {!!error && <AppText style={styles.error}>{error}</AppText>}
            {loading ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <View style={styles.rowBtns}>
                <AppButton title="Cancel" onPress={() => setVisible(false)} style={{ flex: 1, marginRight: 8 }} color="#ccc" />
                <AppButton title="Add" onPress={onAddPartner} style={{ flex: 1, marginLeft: 8 }} />
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={inviteVisible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.popup}>
            <AppText style={styles.title}>Partner Invites</AppText>
            {inviteRequests.length === 0 ? (
              <AppText>No invites.</AppText>
            ) : (
              inviteRequests.map(invite => (
                <View key={invite.id} style={{ marginBottom: 16 }}>
                  <AppText style={{ marginBottom: 12 }}>
                    {invite.sender?.username || "Someone"} has invited you to be partners.
                  </AppText>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <AppButton
                      title="Reject"
                      onPress={() => {
                        rejectInvite(invite.id);
                        respond(invite, "rejected");
                      }}
                      style={{ flex: 1, marginRight: 8 }}
                      color="#ccc"
                    />
                    <AppButton
                      title="Accept"
                      onPress={() => {
                        acceptInvite(invite.id);
                        respond(invite, "accepted");
                      }}
                      style={{ flex: 1, marginLeft: 8 }}
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.background,
  },
  cardText: {
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "80%",
    padding: 20,
    borderRadius: 12,
    backgroundColor: "black",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  error: {
    color: "red",
    fontSize: 14,
    marginTop: 4,
  },
  notice: {
    padding: 10,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginBottom: 12
  },
  rowBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12
  },
});
