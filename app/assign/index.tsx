import CreateUserModal from "@/components/CreateUserModal";
import { db } from "@/lib/firebase";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function AssignTaskScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // 🔁 wenn tasks oder searchTerm sich ändern
  useEffect(() => {
    const filtered = tasks.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [searchTerm, tasks]);

  // ✅ Hierhin verschoben
  const loadData = async () => {
    try {
      const taskSnap = await getDocs(collection(db, "tasks"));
      const loadedTasks = taskSnap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      const sorted = loadedTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTasks(sorted);

      const usersSnap = await getDocs(collection(db, "users"));
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Fehler beim Laden:", err);
      Alert.alert("Fehler", "Daten konnten nicht geladen werden.");
    }
  };

  // 🔁 Initialer Ladevorgang
  useEffect(() => {
    loadData();
  }, []);
  const handleAssign = async (userId: string) => {
    if (!selectedTaskId)
      return Alert.alert("Bitte zuerst eine Aufgabe wählen.");

    try {
      const taskRef = doc(db, "tasks", selectedTaskId);
      await updateDoc(taskRef, { assignedTo: userId });
      Alert.alert("✅ Erfolgreich", "Aufgabe zugewiesen!");
    } catch (err) {
      console.error("❌ Fehler beim Zuweisen:", err);
      Alert.alert("Fehler", "Zuweisung fehlgeschlagen.");
    }
  };

  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-xl font-bold mb-2">1️⃣ Aufgabe wählen:</Text>
      <TextInput
        placeholder="🔍 Aufgabe suchen..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        className="border border-gray-300 rounded px-4 py-2 mb-2 text-black"
      />
      <FlatList
        horizontal
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-gray-500 italic">Keine Aufgaben gefunden.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedTaskId(item.id)}
            className={`w-[120px] h-[80px] mr-2 rounded-xl justify-center items-center ${
              selectedTaskId === item.id ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                selectedTaskId === item.id ? "text-white" : "text-black"
              }`}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </Pressable>
        )}
      />

      <Text className="text-xl font-bold mb-2">2️⃣ Mitarbeitende:</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text className="text-gray-500 italic">
            Keine Mitarbeitenden gefunden.
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row justify-between items-center border-b py-2">
            <View>
              <Text className="font-semibold">{item.name}</Text>
              <Text className="text-gray-500">{item.role ?? "–"}</Text>
            </View>
            <Pressable
              onPress={() => handleAssign(item.id)}
              className="bg-green-600 px-4 py-2 rounded"
            >
              <Text className="text-white font-semibold">Zuweisen</Text>
            </Pressable>
          </View>
        )}
      />
      <CreateUserModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onCreated={loadData} // z. B. useEffect-Auszug oder Refetch
      />
      <Pressable
        onPress={() => setShowModal(true)}
        className="mt-4 bg-purple-600 px-4 py-3 rounded items-center"
      >
        <Text className="text-white font-semibold text-base">
          ➕ Mitarbeiter:in hinzufügen
        </Text>
      </Pressable>
    </View>
  );
}
