import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { addDoc, collection } from "firebase/firestore";
import { useState } from "react";
import { Alert, Modal, Pressable, Text, TextInput, View } from "react-native";

export default function CreateUserModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const isOnline = useOfflineStatus();

  const [name, setName] = useState("");
  const [role, setRole] = useState("Mitarbeiter");

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Fehler", "Name ist erforderlich.");

    const user = {
      name: name.trim(),
      role,
      createdAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        await addDoc(collection(db, "users"), user);
        Alert.alert("✅ Erstellt", "Mitarbeiter wurde online hinzugefügt.");
      } else {
        const raw = await AsyncStorage.getItem("offlineUsers");
        const offlineUsers = raw ? JSON.parse(raw) : [];
        offlineUsers.push(user);
        await AsyncStorage.setItem(
          "offlineUsers",
          JSON.stringify(offlineUsers)
        );
        Alert.alert(
          "📦 Offline gespeichert",
          "Wird synchronisiert, sobald Internet verfügbar."
        );
      }

      setName("");
      setRole("Mitarbeiter");
      onCreated(); // Reload triggern
      onClose();
    } catch (err) {
      console.error("❌ Fehler beim Speichern", err);
      Alert.alert("Fehler", "Konnte nicht speichern.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-center items-center bg-black/50 px-4">
        <View className="bg-white p-5 rounded-xl w-full max-w-md">
          <Text className="text-xl font-bold mb-3">👤 Neuer Mitarbeiter</Text>

          <TextInput
            placeholder="Name"
            value={name}
            onChangeText={setName}
            className="border border-gray-300 rounded px-4 py-2 mb-3 text-black"
          />
          <Picker
            selectedValue={role}
            onValueChange={(itemValue) => setRole(itemValue)}
            style={{ marginBottom: 16 }}
          >
            <Picker.Item label="Mitarbeiter" value="Mitarbeiter" />
            <Picker.Item label="Admin" value="Admin" />
            <Picker.Item label="Supervisor" value="Supervisor" />
          </Picker>

          <View className="flex-row justify-end">
            <Pressable onPress={onClose} className="mr-3">
              <Text className="text-gray-500">Abbrechen</Text>
            </Pressable>
            <Pressable
              onPress={handleCreate}
              className="bg-green-600 px-4 py-2 rounded"
            >
              <Text className="text-white font-semibold">Erstellen</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
