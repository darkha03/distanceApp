import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "@/components/AppButton";
import { AppText } from "@/components/AppText";
import { AppInput } from "@/components/AppInput";
import { usePartner } from "@/utils/PartnerContext";
import { useAuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";

export const AddPartnerCard = () => {
  const [visible, setVisible] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { partner, sendInvite, inviteStatus, acceptInvite, rejectInvite } = usePartner();
  const { inviteRequests, getInvite, getResponseInvite } = usePartner();
  const [inviteVisible, setInviteVisible] = useState(false);
  const { user, setUser } = useAuthContext();
  const { token } = useAuthStore();

    //Fetch invites on mount
    React.useEffect(() => {
        getInvite();
        getResponseInvite();
    }, []);

    // --- Handle adding partner ---

    const onAddPartner = async (code) => {
        try {
        setLoading(true);
        setError("");
        await sendInvite(code); // send invite via context
        setVisible(false);
        setPartnerCode("");
        } catch (err) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    };

    const handleConfirm = () => {
        if (!partnerCode.trim()) {
        setError("Please enter a partner code");
        return;
        }
        onAddPartner(partnerCode);
    };

    // Handle incoming invite request
    React.useEffect(() => {
        if (inviteRequests.length > 0) {
        setInviteVisible(true);
        }
    }, [inviteRequests]);

    const handleInvite = ({status, fromUserId}) => {
        fetch("http://localhost:4000/api/users/respond-invite", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ 
                status: status,
                fromUserId: fromUserId
             }),
        }).then(res => res.json())
        .then(data => {
            console.log("Invite response:", data);
        }).catch(err => {
            console.error("Error responding to invite:", err);
        });
        setInviteVisible(false);
    }

    // Handle successful invite acceptance
    React.useEffect(() => {
        if (inviteStatus === "accepted") {
            // Update user context with new partner info
            setUser((prev) => prev ? { ...prev, partnerId: partner.id } : prev);
            console.log("Partner accepted:", partner);
            setInviteVisible(false);
        }
    }, [inviteStatus]);

    return (
    <>
    {inviteStatus === "pending" && (
        <View style={{ padding: 10, backgroundColor: Colors.light.primary, borderRadius: 8, marginBottom: 12 }}>
            <AppText style={{ color: "white", textAlign: "center" }}>Invite sent! Waiting for partner to accept.</AppText>
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

    {/* Popup Modal */}
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

        {error ? (
            <AppText style={styles.error}>{error}</AppText>
        ) : null}

        {loading ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
        ) : (
            <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
            }}
            >
            <AppButton
                title="Cancel"
                onPress={() => setVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
                color="#ccc"
            />
            <AppButton
                title="Add"
                onPress={handleConfirm}
                style={{ flex: 1, marginLeft: 8 }}
            />
            </View>
        )}
        </View>
    </View>
    </Modal>

    {/* Incoming Invite Modal */}
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
                    {invite.sender.username} has invited you to be partners.
                    </AppText>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <AppButton
                        title="Reject"
                        onPress={() => {
                            rejectInvite(invite.id);    
                            handleInvite({status: "rejected", fromUserId: invite.sender.id});
                        }}
                        style={{ flex: 1, marginRight: 8 }}
                        color="#ccc"
                    />
                    <AppButton
                        title="Accept"
                        onPress={() => {
                            acceptInvite(invite.id);
                            setUser((prev) => prev ? { ...prev, partnerId: invite.sender.id } : prev);
                            console.log("User updated with new partner:", user);
                            handleInvite({status: "accepted", fromUserId: invite.sender.id});                           
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
});
