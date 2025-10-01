import React, { useState, useContext } from "react";
import { View, StyleSheet, Image, Modal, Pressable, TextInput, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import * as Location from "expo-location";
import { AuthContext } from "@/utils/authContext";
import { useAuthStore } from "@/store/authStore";
import { AppText } from "@/components/AppText";
import { Colors } from "@/constants/Colors";
import {SectionHeader} from "@/components/app/SectionHeader";
import { FieldRow } from "@/components/app/FieldRow";
import { DateField } from "@/components/app/DateField";
import * as ImagePicker from 'expo-image-picker';

export default function ProfileScreen() {
  const authCtx = useContext(AuthContext);
  const { token } = useAuthStore();
  if (!authCtx?.user) return null;
  const user = authCtx.user;
  const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:4000").replace(/\/$/,"");

  const [profileEdit, setProfileEdit] = useState(false);
  const [statusEdit, setStatusEdit] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(user.avatarUrl || "https://via.placeholder.com/200");
  const [avatarModal, setAvatarModal] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    birthday: user.birthday || "",
    location: user.location || "",
    timezone: user.timezone || "",
    anniversary: user.anniversary || "",
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
    avatar: avatar
  });

  const setField = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  // Convert date string to ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
  const toIsoDate = (d?: string | Date) => d ? new Date(d).toISOString() : null;

  const apiSave = async (partial?: Record<string, any>) => {
    try {
      const body = { ...form,
        birthday: form.birthday ? toIsoDate(form.birthday) : null,
        anniversary: form.anniversary ? toIsoDate(form.anniversary) : null,
        ...(partial || {}) };
      const resAnni = await fetch(`${BASE_URL}/api/users/anniversary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ anniversary: toIsoDate(form.anniversary) })
        }); 
      const res = await fetch(`${BASE_URL}/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      console.log("Save response", res.status);
      if (res.ok && resAnni.ok) {
        authCtx.setUser({ 
          ...user, 
          ...body, 
          birthday: body.birthday ? new Date(body.birthday) : undefined,
          anniversary: body.anniversary ? new Date(body.anniversary) : undefined
        });
        setMessage("Saved");
      } else setMessage("Update profile failed");
    } catch (e : any) {
      setMessage("Failed");
      console.log("Save error", e.error || e);
    }
    setTimeout(()=>setMessage(""),2000);
  };

  const saveProfile = async () => {
    await apiSave();
    setProfileEdit(false);
  };
  const saveStatus = async () => {
    await apiSave();
    setStatusEdit(false);
  };

  const cancelProfile = () => {
    setForm(f => ({ ...f, name: user.name || "", birthday: user.birthday || "" }));
    setProfileEdit(false);
  };
  const cancelStatus = () => {
    setForm(f => ({
      ...f,
      location: user.location || "",
      timezone: user.timezone || "",
      anniversary: user.anniversary || "",
      latitude: user.latitude ?? null,
      longitude: user.longitude ?? null
    }));
    setStatusEdit(false);
  };

  const useDeviceLocation = async () => {
    try {
      setLocLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMessage("Location denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const loc = await revesedGeoCode(latitude, longitude);
      setField("location", loc);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setField("latitude", latitude);
      setField("longitude", longitude);
      setField("timezone", tz);
      setMessage("Location set");
    } catch {
      setMessage("Location error");
    } finally {
      setTimeout(()=>setMessage(""),2000);
      setLocLoading(false);
    }
  };

  const revesedGeoCode = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
      const data = await res.json();
      if (data.city && data.countryName) return `${data.city}, ${data.countryName}`;
    } catch (e) {
      console.log("Reverse geo error", e);
    }
    return "";
  };

  const uploadAvatar = async (uri: string) => {
    try {
      const name = uri.split("/").pop() || "avatar.jpg";
      const ext = (name.split(".").pop() || "jpg").toLowerCase();
      const mime = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
      const formData = new FormData();
      formData.append("avatar", {
        uri: uri.startsWith("file://") ? uri : `file://${uri}`,
        name,
        type: mime
      } as any);
      const res = await fetch(`${BASE_URL}/api/users/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        const relative = data.avatarUrl;
        setAvatar(`${BASE_URL}${data.avatarUrl}`);
        setField("avatar", relative);
        authCtx.setUser({ ...user, avatarUrl: relative });
        setMessage("Avatar updated");
      } else {
        setMessage("Upload failed");
      }
    } catch (e) {
      console.log("Avatar upload error", e);
      setMessage("Upload error");
    } finally {
      setTimeout(()=>setMessage(""),2000);
    }
  };

  const pickAvatarFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setMessage("Library denied");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1,1],
        quality: 1
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        await uploadAvatar(uri);
      }
    } finally {
      setAvatarModal(false);
    }
  };

  const captureAvatarWithCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setMessage("Camera denied");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1,1],
        quality: 1
      });
      if (!result.canceled) {
        const uri = result.assets[0].uri;
        await uploadAvatar(uri);
      }
    } finally {
      setAvatarModal(false);
    }
  };
  const handleChangeAvatar = () => {
    setAvatarModal(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor:Colors.light.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // tweak if header present
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

        {/* Avatar Section */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Image source={{ uri: `${BASE_URL}${avatar}` }} style={styles.avatarImg} />
          </View>
          <Pressable style={styles.changeAvatarBtn} onPress={handleChangeAvatar}>
            <AppText style={styles.changeAvatarText}>Change Avatar</AppText>
          </Pressable>
        </View>

        {/* My Profile Section */}
        <SectionHeader
          title="My profile"
          editing={profileEdit}
          onEdit={() => setProfileEdit(true)}
        />
        <View style={styles.box}>
          <FieldRow
            left="Name"
            rightComponent={
              profileEdit ? (
                <TextInput
                  style={styles.input}
                  value={form.name}
                  onChangeText={(t)=>setField("name", t)}
                  placeholder="Name"
                  placeholderTextColor="#888"
                />
              ) : (
                <AppText style={styles.valueText}>{form.name || "Not set"}</AppText>
              )
            }
            isLast={false}
          />
          <FieldRow
            left="Birthday"
            rightComponent={
              <DateField
                value={form.birthday as string}
                onChange={(val)=>setField("birthday", val)}
                placeholder="Select date"
                editable={profileEdit}
              />
            }
            isLast
          />
        </View>
        {profileEdit && (
          <View style={styles.actionRow}>
            <Pressable style={styles.saveBtn} onPress={saveProfile}>
              <AppText style={styles.actionText}>Save</AppText>
            </Pressable>
            <Pressable style={[styles.saveBtn, styles.cancelBtn]} onPress={cancelProfile}>
              <AppText style={styles.actionText}>Cancel</AppText>
            </Pressable>
          </View>
        )}

        {/* My Status Section */}
        <SectionHeader
            title="My status"
            editing={statusEdit}
            onEdit={() => setStatusEdit(true)}
        />
        <View style={styles.box}>
          <FieldRow
            left="Location"
            rightComponent={
              statusEdit ? (
                <TextInput
                  style={styles.input}
                  value={form.location}
                  onChangeText={(t)=>setField("location", t)}
                  placeholder="City, Country"
                  placeholderTextColor="#888"
                />
              ) : (
                <AppText style={styles.valueText}>{form.location || "Not set"}</AppText>
              )
            }
            isLast={false}
          />
          <FieldRow
            left="Timezone"
            rightComponent={
              statusEdit ? (
                <TextInput
                  style={styles.input}
                  value={form.timezone}
                  onChangeText={(t)=>setField("timezone", t)}
                  placeholder="e.g. Europe/Paris"
                  placeholderTextColor="#888"
                />
              ) : (
                <AppText style={styles.valueText}>{form.timezone || "Not set"}</AppText>
              )
            }
            isLast={false}
          />
          {user.partner && (
            <FieldRow
            left="Anniversary"
            rightComponent={
               <DateField
                value={form.anniversary as string}
                onChange={(val)=>setField("anniversary", val)}
                placeholder="Select date"
                editable={statusEdit}
              />
            }
            isLast
          />
          )}
        </View>
        {statusEdit && (
          <>
            <Pressable style={styles.locBtn} onPress={useDeviceLocation} disabled={locLoading}>
              <AppText style={styles.locBtnText}>{locLoading ? "Locating..." : "Use Device Location"}</AppText>
            </Pressable>
            <View style={styles.actionRow}>
              <Pressable style={styles.saveBtn} onPress={saveStatus}>
                <AppText style={styles.actionText}>Save</AppText>
              </Pressable>
              <Pressable style={[styles.saveBtn, styles.cancelBtn]} onPress={cancelStatus}>
                <AppText style={styles.actionText}>Cancel</AppText>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
      {/* Avatar Modal */}
      <Modal visible={avatarModal} transparent animationType="fade" onRequestClose={()=>setAvatarModal(false)}>
        <View style={styles.avatarModalOverlay}>
          <View style={styles.avatarModalCard}>
            <AppText style={styles.avatarModalTitle}>Update Avatar</AppText>
            <Pressable style={styles.avatarModalBtn} onPress={pickAvatarFromLibrary}>
              <AppText style={styles.avatarModalBtnText}>Choose from Library</AppText>
            </Pressable>
            <Pressable style={styles.avatarModalBtn} onPress={captureAvatarWithCamera}>
              <AppText style={styles.avatarModalBtnText}>Take Photo</AppText>
            </Pressable>
            <Pressable style={[styles.avatarModalBtn, styles.avatarModalCancel]} onPress={()=>setAvatarModal(false)}>
              <AppText style={styles.avatarModalBtnText}>Cancel</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: {alignItems:"center", padding:20, paddingBottom:40, flexGrow:1 },
  toast: {
    backgroundColor:"#1e1e1e",
    borderColor:Colors.light.primary,
    borderWidth:1,
    paddingVertical:6,
    paddingHorizontal:14,
    borderRadius:14,
    marginBottom:16
  },
  toastText:{ color:Colors.light.primary, fontWeight:"600" },
  avatarWrap:{ alignItems:"center", marginBottom:28 },
  avatarRing:{
    width:180, height:180, borderRadius:90,
    borderWidth:8, borderColor:Colors.light.primary,
    alignItems:"center", justifyContent:"center",
    backgroundColor:"#ddd"
  },
  avatarImg:{ width:160, height:160, borderRadius:80 },
  changeAvatarBtn:{
    marginTop:14,
    backgroundColor:Colors.light.primary,
    paddingHorizontal:28,
    paddingVertical:10,
    borderRadius:16
  },
  changeAvatarText:{ color:"#222", fontWeight:"600", fontSize:14 },
  box:{
    width:"100%",
    borderWidth:2,
    borderColor:Colors.light.primary,
    borderRadius:14,
    overflow:"hidden",
    marginBottom:18,
    backgroundColor:"#050505"
  },
  valueText:{ color:"#fff", fontSize:14 },
  input:{
    borderWidth:1,
    borderColor:Colors.light.primary,
    borderRadius:8,
    paddingVertical:4,
    paddingHorizontal:10,
    minWidth:140,
    color:"#fff",
    fontSize:14
  },
  actionRow:{
    flexDirection:"row",
    justifyContent:"center",
    gap:14,
    width:"100%",
    marginTop:-4,
    marginBottom:10
  },
  saveBtn:{
    backgroundColor:Colors.light.primary,
    paddingHorizontal:28,
    paddingVertical:10,
    borderRadius:16
  },
  cancelBtn:{ backgroundColor:"#444" },
  actionText:{ color:"#fff", fontWeight:"600" },
  locBtn:{
    backgroundColor:"#222",
    borderWidth:1,
    borderColor:Colors.light.primary,
    paddingVertical:10,
    paddingHorizontal:20,
    borderRadius:14,
    marginBottom:14
  },
  locBtnText:{ color:Colors.light.primary, fontWeight:"600" },
    avatarModalOverlay:{
    flex:1,
    backgroundColor:"rgba(0,0,0,0.55)",
    justifyContent:"center",
    alignItems:"center",
    padding:24
  },
  avatarModalCard:{
    width:"100%",
    maxWidth:320,
    backgroundColor:"#111",
    borderRadius:18,
    borderWidth:1,
    borderColor:Colors.light.primary,
    padding:20
  },
  avatarModalTitle:{ color:"#fff", fontWeight:"600", fontSize:16, marginBottom:12, textAlign:"center" },
  avatarModalBtn:{
    backgroundColor:Colors.light.primary,
    borderRadius:12,
    paddingVertical:10,
    paddingHorizontal:16,
    marginBottom:10
  },
  avatarModalCancel:{
    backgroundColor:"#444",
    marginTop:4
  },
  avatarModalBtnText:{ color:"#fff", textAlign:"center", fontWeight:"600" }
});
