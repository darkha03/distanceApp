import React, { useState, useContext } from "react";
import { View, StyleSheet, Modal, TextInput, Pressable, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";
import { Colors } from "@/constants/Colors";
import { AppText } from "@/components/AppText";
import { SectionHeader } from "@/components/app/SectionHeader";
import { FieldRow } from "@/components/app/FieldRow";
import { router } from "expo-router";
import { removeToken } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";

const BORDER = Colors.light.primary;

export default function AccountScreen() {
  const { token, clearToken } = useAuthStore();
  const authCtx = useContext(AuthContext);
  const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/,"");
  if (!authCtx?.user) return null;
  const user = authCtx.user;

  const [changePassVisible, setChangePassVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const clearMessageSoon = () => setTimeout(()=>setMessage(""),2000);

  const handleChangePassword = async () => {
    if (newPassword.trim().length < 6) {
      setError("Min 6 chars");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/users/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
      } else {
        setError("");
        setChangePassVisible(false);
        setNewPassword("");
        setConfirmPassword("");
        setMessage("Password updated");
        clearMessageSoon();
      }
    } catch {
      setError("Request failed");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDeleteVisible(false);
        clearToken();
        removeToken();
        router.replace("/auth/login");
      } else {
        setMessage("Delete failed");
        clearMessageSoon();
      }
    } catch {
      setMessage("Delete failed");
      clearMessageSoon();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex:1, backgroundColor:"#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {message !== "" && (
          <View style={styles.toast}>
            <AppText style={styles.toastText}>{message}</AppText>
          </View>
        )}

        {/* Top immutable account info box */}
        <SectionHeader title="Account" editing={true} onEdit={()=>{}} />
        <View style={styles.box}>
          <FieldRow
            left="Email"
            rightComponent={<AppText style={styles.valueText}>{user.email}</AppText>}
            isLast={false}
          />
          <FieldRow
            left="Username"
            rightComponent={<AppText style={styles.valueText}>{user.username}</AppText>}
            isLast
          />
        </View>

        {/* Security section */}
        <SectionHeader title="Security" editing={true} onEdit={()=>{}} />
        <View style={styles.box}>
          <FieldRow
            left="Password"
            rightComponent={
              <Pressable style={styles.inlineBtn} onPress={()=>setChangePassVisible(true)}>
                <AppText style={styles.inlineBtnText}>Change</AppText>
              </Pressable>
            }
            isLast={false}
          />
          <FieldRow
            left="Delete Account"
            rightComponent={
              <Pressable style={[styles.inlineBtn, styles.dangerInline]} onPress={()=>setDeleteVisible(true)}>
                <AppText style={styles.dangerInlineText}>Delete</AppText>
              </Pressable>
            }
            isLast
          />
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal transparent visible={changePassVisible} animationType="fade" onRequestClose={()=>setChangePassVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>Change Password</AppText>
            <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#777"
              secureTextEntry = {!showPassword}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#fff"
            />
            </Pressable>
            </View>
            <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#777"
              secureTextEntry = {!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={22}
              color="#fff"
            />
          </Pressable>
          </View>
            {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
            <Pressable style={styles.modalBtnPrimary} onPress={handleChangePassword}>
              <AppText style={styles.modalBtnPrimaryText}>Confirm</AppText>
            </Pressable>
            <Pressable style={styles.modalBtnSecondary} onPress={()=>setChangePassVisible(false)}>
              <AppText style={styles.modalBtnSecondaryText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal */}
      <Modal transparent visible={deleteVisible} animationType="fade" onRequestClose={()=>setDeleteVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <AppText style={styles.modalTitle}>Delete Account?</AppText>
            <AppText style={styles.warnText}>This action cannot be undone.</AppText>
            <Pressable style={[styles.modalBtnPrimary, styles.dangerBtn]} onPress={handleDeleteAccount}>
              <AppText style={styles.modalBtnPrimaryText}>Yes, Delete</AppText>
            </Pressable>
            <Pressable style={styles.modalBtnSecondary} onPress={()=>setDeleteVisible(false)}>
              <AppText style={styles.modalBtnSecondaryText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:{ padding:20, paddingBottom:60, backgroundColor:"#000" },
  toast:{
    backgroundColor:"#1e1e1e",
    borderColor:BORDER,
    borderWidth:1,
    paddingVertical:6,
    paddingHorizontal:14,
    borderRadius:14,
    marginBottom:16,
    alignSelf:"center"
  },
  toastText:{ color:BORDER, fontWeight:"600" },
  box:{
    width:"100%",
    borderWidth:2,
    borderColor:BORDER,
    borderRadius:14,
    overflow:"hidden",
    marginBottom:24,
    backgroundColor:"#050505"
  },
  valueText:{ color:"#fff", fontSize:14 },
  inlineBtn:{
    backgroundColor:BORDER,
    paddingVertical:6,
    paddingHorizontal:14,
    borderRadius:12
  },
  inlineBtnText:{ color:"#222", fontWeight:"600", fontSize:12 },
  dangerInline:{
    backgroundColor:Colors.light.danger
  },
  dangerInlineText:{ color:"#fff", fontWeight:"600", fontSize:12 },
  modalOverlay:{
    flex:1,
    backgroundColor:"rgba(0,0,0,0.55)",
    justifyContent:"center",
    alignItems:"center",
    padding:24
  },
  modalCard:{
    width:"100%",
    maxWidth:360,
    backgroundColor:"#111",
    borderRadius:18,
    borderWidth:1,
    borderColor:BORDER,
    padding:20
  },
  modalTitle:{ color:"#fff", fontWeight:"600", fontSize:18, marginBottom:10, textAlign:"center" },
  warnText:{ color:"#bbb", fontSize:13, textAlign:"center", marginBottom:16 },
    inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  eyeBtn: {
    position: "absolute",
    right: 8,
    top: -5,
    height: "100%",
    justifyContent: "center",
    padding: 6,
    zIndex: 2,
  },  
  input:{
    borderWidth:1,
    borderColor:BORDER,
    borderRadius:10,
    paddingVertical:10,
    paddingHorizontal:12,
    color:"#fff",
    fontSize:14,
    marginBottom:10,
    flex:1
  },
  errorText:{ color:Colors.light.danger, marginBottom:8, fontSize:13 },
  modalBtnPrimary:{
    backgroundColor:BORDER,
    paddingVertical:12,
    borderRadius:14,
    alignItems:"center",
    marginTop:4
  },
  dangerBtn:{ backgroundColor:Colors.light.danger },
  modalBtnPrimaryText:{ color:"#fff", fontWeight:"600" },
  modalBtnSecondary:{
    backgroundColor:"#333",
    paddingVertical:10,
    borderRadius:14,
    alignItems:"center",
    marginTop:10
  },
  modalBtnSecondaryText:{ color:"#fff", fontWeight:"500" }
});
