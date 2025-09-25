import React, { useState } from "react";
import { View, Text, StyleSheet, Button, Modal, TextInput, Pressable } from "react-native";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";

export default function AccountScreen() {
  const [changePassVisible, setChangePassVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const { token } = useAuthStore();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const authContext = React.useContext(AuthContext);
  if (!authContext?.user) {
    return null;
  }
  const { user } = authContext;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Call backend API to change password
    try {
    const res = await fetch(`${BASE_URL}/api/users/password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to change password");
    }
    else {
      setError("");
      setChangePassVisible(false);
      setNewPassword("");
      setConfirmPassword("");
    }
    } catch (e) {
    console.log("Password change failed", e);
    setError("Password change failed");
    return;
    }
  }

  return (
    <View style={styles.container}>
      {/* Table */}
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Username:</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>
      </View>

      {/* Change Password Button */}
      <Pressable style={styles.btn} onPress={() => setChangePassVisible(true)}>
        <Text style={styles.btnText}>Change Password</Text>
      </Pressable>

      {/* Delete Account Button */}
      <Pressable style={[styles.btn, styles.deleteBtn]} onPress={() => setDeleteVisible(true)}>
        <Text style={styles.btnText}>Delete Account</Text>
      </Pressable>

      {/* Change Password Modal */}
      <Modal transparent visible={changePassVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}
            <Pressable style={styles.btn} onPress={() => handleChangePassword()}>
              <Text style={styles.btnText}>Confirm</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setChangePassVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal transparent visible={deleteVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to delete your account?</Text>
            <Pressable style={styles.btn} onPress={() => setDeleteVisible(false)}>
              <Text style={styles.btnText}>Yes, Delete</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setDeleteVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
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
    justifyContent: "center", // center vertically
    alignItems: "center", // center horizontally
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
  label: {
    fontWeight: "bold",
  },
  value: {
    color: "#333",
  },
  btn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 10,
  },
  cancelBtn: {
    marginTop: 10,
  },
  cancelText: {
    color: "#555",
  },
});
