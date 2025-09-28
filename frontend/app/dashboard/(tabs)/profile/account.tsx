import React, { useState } from "react";
import { View, StyleSheet, Modal, TextInput, Pressable } from "react-native";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/constants/Colors";
import { AppText } from "@/components/AppText";

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
          <AppText style={styles.label}>Email:</AppText>
          <AppText style={styles.value}>{user.email}</AppText>
        </View>
        <View style={styles.row}>
          <AppText style={styles.label}>Username:</AppText>
          <AppText style={styles.value}>{user.username}</AppText>
        </View>
      </View>

      {/* Change Password Button */}
      <Pressable style={styles.btn} onPress={() => setChangePassVisible(true)}>
        <AppText style={styles.btnText}>Change Password</AppText>
      </Pressable>

      {/* Delete Account Button */}
      <Pressable style={[styles.btn, styles.deleteBtn]} onPress={() => setDeleteVisible(true)}>
        <AppText style={styles.btnText}>Delete Account</AppText>
      </Pressable>

      {/* Change Password Modal */}
      <Modal transparent visible={changePassVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Change Password</AppText>
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
            {error ? <AppText style={{ color: 'red' }}>{error}</AppText> : null}
            <Pressable style={styles.btn} onPress={() => handleChangePassword()}>
              <AppText style={styles.btnText}>Confirm</AppText>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setChangePassVisible(false)}>
              <AppText style={styles.cancelText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal transparent visible={deleteVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <AppText style={styles.modalTitle}>Are you sure you want to delete your account?</AppText>
            <Pressable style={styles.btn} onPress={() => setDeleteVisible(false)}>
              <AppText style={styles.btnText}>Yes, Delete</AppText>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={() => setDeleteVisible(false)}>
              <AppText style={styles.cancelText}>Cancel</AppText>
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
    backgroundColor: Colors.light.background,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  label: {
    fontWeight: "bold",
  },
  value: {
    color: Colors.light.text,
  },
  btn: {
    backgroundColor: Colors.light.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: Colors.light.danger,
  },
  btnText: {
    color: Colors.light.text,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.light.background,
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
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 10,
    width: "100%",
    marginBottom: 10,
    color: Colors.light.text,
  },
  cancelBtn: {
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelText: {
    color: Colors.light.text,
    fontWeight: "bold",
  },
});
