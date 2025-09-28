import React, { useState } from "react";
import { View, StyleSheet, Pressable, Modal, TextInput, Image } from "react-native";
import { usePartner } from "@/utils/PartnerContext";
import { AuthContext } from "@/utils/authContext";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

export default function PartnerScreen() {
  const partnerContext = usePartner();
  if (!partnerContext) return null;
  const { sendInvite, removePartner } = partnerContext;
  const [showAddModal, setShowAddModal] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const authContext = React.useContext(AuthContext);
  if (!authContext?.user) return null;
  const { user } = authContext;


  const handleAddPartner = async () => {
    try {
      await sendInvite(partnerCode.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setShowAddModal(false);
    }
  };

  const handleRemovePartner = async () => {
    try {
      await removePartner();
    } catch (e) {
      console.error(e);
    } finally {
      setShowRemoveModal(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {/* Replace with actual avatar image if available */}
        <View style={styles.avatarCircle}>
          <Ionicons name="person-circle" size={120} color={Colors.light.text} />
        </View>
      </View>
      {/* Username pill */}
      <View style={styles.pill}>
        <AppText style={styles.pillText}>{user.partner ? user.partner.name : "Username"}</AppText>
      </View>
      {/* Status pill */}
      <View style={styles.pillSmall}>
        <AppText style={styles.pillText}>{user.partner?.status || "Status"}</AppText>
      </View>
      {/* Info rows */}
      <View style={styles.infoRow}>
        <AppText style={styles.infoLabel}>Anniversary</AppText>
        <AppText style={styles.infoValue}>Not set</AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText style={styles.infoLabel}>Birthday</AppText>
        <AppText style={styles.infoValue}>Not set</AppText>
      </View>
      <View style={styles.infoRow}>
        <AppText style={styles.infoLabel}>Location</AppText>
        <AppText style={styles.infoValue}>{user.partner?.location || "Not set"}</AppText>
      </View>
      {/* Button */}
      {!user.partner ? (
        <Pressable style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <AppText style={styles.addBtnText}>Add Partner</AppText>
        </Pressable>
      ) : (
        <Pressable style={styles.addBtn} onPress={() => setShowRemoveModal(true)}>
          <AppText style={styles.addBtnText}>Remove Partner</AppText>
        </Pressable>
      )}

      {/* Modals unchanged */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Enter Partner Code</AppText>
            <TextInput
              style={styles.input}
              placeholder="Partner Code"
              value={partnerCode}
              onChangeText={setPartnerCode}
            />
            <Pressable style={styles.addBtn} onPress={handleAddPartner}>
              <AppText style={styles.addBtnText}>Add</AppText>
            </Pressable>
            <Pressable style={[styles.addBtn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
              <AppText style={styles.addBtnText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={showRemoveModal} animationType="fade" transparent onRequestClose={() => setShowRemoveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Are you sure?</AppText>
            <Pressable style={styles.addBtn} onPress={handleRemovePartner}>
              <AppText style={styles.addBtnText}>Yes, Remove</AppText>
            </Pressable>
            <Pressable style={[styles.addBtn, styles.cancelBtn]} onPress={() => setShowRemoveModal(false)}>
              <AppText style={styles.addBtnText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 40,
    backgroundColor: "#000",
  },
  avatarWrapper: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: "#c9a4f7",
    backgroundColor: "#ddd",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  pill: {
    backgroundColor: "#c9a4f7",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 32,
    marginBottom: 8,
    alignSelf: "center",
  },
  pillSmall: {
    backgroundColor: "#c9a4f7",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignSelf: "center",
  },
  pillText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: 260,
    borderWidth: 2,
    borderColor: "#c9a4f7",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#111",
  },
  infoLabel: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  infoValue: {
    color: "#fff",
    fontSize: 15,
  },
  addBtn: {
    backgroundColor: "#f48ca3",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 32,
    width: 220,
    alignItems: "center",
    alignSelf: "center",
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
    color: "#222",
  },
});