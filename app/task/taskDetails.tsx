import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { db, firebaseAuth } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

export default function TaskDetailsScreen() {
  const { latitude, longitude, address } = useLocalSearchParams();
  const router = useRouter();
  // Netzwerkstatus prüfen
  const isOnline = useOfflineStatus();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const currentUserId = firebaseAuth.currentUser?.uid || null;
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [assignedToPushToken, setAssignedToPushToken] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const users = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        pushToken: doc.data().pushToken || null,
      }));

      // Beispiel: ersten User als Empfänger setzen
      const first = users[0];
      if (first) {
        setAssignedTo(first.id);
        setAssignedToPushToken(first.pushToken);
      }

      // Optional: users in eigener State, Dropdown-UI
    };
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Titel ein.");
      return;
    }

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),

      latitude: latitude ? parseFloat(latitude.toString()) : null,
      longitude: longitude ? parseFloat(longitude.toString()) : null,
      address: address || null,

      status: "created",

      timeline: {
        created: {
          at: new Date().toISOString(),
          by: currentUserId,
        },
        in_progress: null,
        accepted: null,
        delivered: null,
        completed: null,
      },

      // 🆕 Empfänger
      assignedTo,
      assignedToPushToken,

      confirmation: {
        photoUrl: null,
        signatureUrl: null,
      },
    };

    try {
      // Lokale Speicherung
      const existing = await AsyncStorage.getItem("tasks");
      const tasks = existing ? JSON.parse(existing) : [];
      tasks.push(newTask);
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

      if (isOnline) {
        await addDoc(collection(db, "tasks"), newTask);
        Alert.alert("Gespeichert", "In Firebase & lokal gespeichert");
      } else {
        Alert.alert(
          "Offline",
          "Lokal gespeichert. Wird später synchronisiert."
        );
      }

      router.push("/home");
    } catch (error) {
      Alert.alert("Fehler", "Konnte nicht speichern.");
      console.error(error);
    }
  };

  return (
    <View className="p-4 space-y-4">
      <Text className="text-lg font-bold">Adresse:</Text>
      <Text className="text-gray-700">{address}</Text>

      <Text className="text-lg font-bold">Koordinaten:</Text>
      <Text className="text-gray-700">
        {latitude}, {longitude}
      </Text>

      <TextInput
        placeholder="Titel"
        value={title}
        onChangeText={setTitle}
        className="border border-gray-300 rounded px-4 py-2 text-black"
      />

      <TextInput
        placeholder="Beschreibung"
        value={description}
        onChangeText={setDescription}
        className="border border-gray-300 rounded px-4 py-2 text-black"
      />

      <TextInput
        placeholder="Sonstiges (optional)"
        value={notes}
        onChangeText={setNotes}
        className="border border-gray-300 rounded px-4 py-2 text-black"
      />

      <Pressable
        onPress={handleSave}
        className="bg-green-600 p-4 rounded-xl items-center mt-4"
      >
        <Text className="text-white font-bold text-base">
          💾 Aufgabe speichern
        </Text>
      </Pressable>
    </View>
  );
}
