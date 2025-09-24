import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Image } from "react-native";
import { AuthContext } from "@/utils/authContext";

export default function ProfileScreen() {
  const [editMode, setEditMode] = useState(false);
  const [avatar, setAvatar] = useState("https://via.placeholder.com/100"); // placeholder avatar
  const authContext = React.useContext(AuthContext);
  if (!authContext?.user) {
    return null;
  }
  const { user } = authContext;
  const [form, setForm] = useState({
    name: user.name || "",
    location: user.location || "",
    avatar: avatar || "",
  });
  const handleSave = () => {
    // TODO: send update to backend
    fetch(`http://localhost:4000/api/users/${user.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    })
    setEditMode(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.label}>Avatar:</Text>
          <Image source={{ uri: avatar }} style={styles.avatar} />
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />
          ) : (
            <Text style={styles.value}>{form.name}</Text>
          )}
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Location:</Text>
          {editMode ? (
            <TextInput
              style={styles.input}
              value={form.location}
              onChangeText= {(text) => setForm({ ...form, location: text })}
            />
          ) : (
            <Text style={styles.value}>{user.location || "Not set"}</Text>
          )}
        </View>
      </View>

      {!editMode ? (
        <Pressable style={styles.btn} onPress={() => setEditMode(true)}>
          <Text style={styles.btnText}>Edit</Text>
        </Pressable>
      ) : (
        <View style={styles.editActions}>
          <Pressable style={styles.btn} onPress={handleSave}>
            <Text style={styles.btnText}>Save</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.cancelBtn]}
            onPress={() => setEditMode(false)}
          >
            <Text style={styles.btnText}>Cancel</Text>
          </Pressable>
        </View>
      )}
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
    alignItems: "center",
  },
  label: {
    fontWeight: "bold",
  },
  value: {
    color: "#333",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
    width: 150,
    textAlign: "right",
  },
  btn: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#6c757d",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
  editActions: {
    width: "100%",
  },
});
