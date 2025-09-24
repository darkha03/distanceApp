import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Modal, TextInput } from "react-native";
import { usePartner } from "@/utils/PartnerContext";
import { AuthContext } from "@/utils/authContext";

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
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.label}>Partner:</Text>
            <Text style={styles.value}>{user.partner ? user.partner.name : "No partner"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{user.partner?.status || "Not set"}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{user.partner?.location || "Not set"}</Text>
        </View>
      </View>

      {!user.partner ? (
        <Pressable style={styles.btn} onPress={() => setShowAddModal(true)}>
          <Text style={styles.btnText}>Add Partner</Text>
        </Pressable>
      ) : (
        <Pressable style={[styles.btn, styles.removeBtn]} onPress={() => setShowRemoveModal(true)}>
          <Text style={styles.btnText}>Remove Partner</Text>
        </Pressable>
      )}

      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Partner Code</Text>
            <TextInput
              style={styles.input}
              placeholder="Partner Code"
              value={partnerCode}
              onChangeText={setPartnerCode}
            />
            <Pressable style={styles.btn} onPress={handleAddPartner}>
              <Text style={styles.btnText}>Add</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setShowAddModal(false)}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showRemoveModal} animationType="fade" transparent onRequestClose={() => setShowRemoveModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure?</Text>
            <Pressable style={styles.btn} onPress={handleRemovePartner}>
              <Text style={styles.btnText}>Yes, Remove</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => setShowRemoveModal(false)}>
              <Text style={styles.btnText}>Cancel</Text>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  label: { fontWeight: "bold" },
  value: { color: "#333" },
  btn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  removeBtn: {
    backgroundColor: "#dc3545",
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    marginBottom: 15,
  },
});
