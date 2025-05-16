import TaskStatusTracker from "@/components/TaskStatusTracker";
import TaskTimeline from "@/components/TaskTimeline";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { db, firebaseAuth } from "@/lib/firebase";
import { sendPushNotification } from "@/lib/sendPushNotification";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<any>(null);
  const router = useRouter();
  const currentUserId = firebaseAuth.currentUser?.uid || null;
  const userRole: "creator" | "driver" | "receiver" = "driver"; // Beispielrolle
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);

  const isOnline = useOfflineStatus();

  useEffect(() => {
    const load = async () => {
      const all = await AsyncStorage.getItem("tasks");
      const list = all ? JSON.parse(all) : [];
      const found = list.find((t: any) => t.id === id);
      if (found) {
        setTask(found);
        setCurrentStatus(found.status); // 👈 Status mitsetzen
      }
    };
    load();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected) {
        const all = await AsyncStorage.getItem("tasks");
        const list = safeParseArray(all);
        const unsynced = list.filter((t: any) => !t.isSynced);

        for (const t of unsynced) {
          try {
            await setDoc(doc(db, "tasks", t.id), t, { merge: true });
            t.isSynced = true;
          } catch (err) {
            console.warn("❌ Firestore-Sync fehlgeschlagen:", err);
          }
        }

        await AsyncStorage.setItem("tasks", JSON.stringify(list));
      }
    });

    return () => unsubscribe();
  }, []);

  const handleStepConfirm = async (nextStatus: string) => {
    const all = await AsyncStorage.getItem("tasks");
    const list = safeParseArray(all);
    const now = new Date().toISOString();
    await sendPushNotification(task.assignedToPushToken, {
      title: "Status geändert",
      body: `Aufgabe ist jetzt ${nextStatus}`,
    });
    const updatedList = list.map((t: any) => {
      if (t.id === id) {
        return {
          ...t,
          status: nextStatus,
          timeline: {
            ...t.timeline,
            [nextStatus]: {
              at: now,
              by: currentUserId,
            },
          },
          isSynced: false, // merken für spätere Sync-Versuche
        };
      }

      return t;
    });

    await AsyncStorage.setItem("tasks", JSON.stringify(updatedList));

    const updatedTask = updatedList.find((t: any) => t.id === id);
    setTask(updatedTask);
    setCurrentStatus(nextStatus);

    // ✅ Wenn online, auch in Firestore speichern
    if (isOnline && updatedTask) {
      try {
        await setDoc(doc(db, "tasks", updatedTask.id), updatedTask, {
          merge: true,
        });
        console.log("✅ In Firestore gespeichert");

        // ✅ Markiere als synchronisiert
        const reloaded = await AsyncStorage.getItem("tasks");
        const parsed = safeParseArray(reloaded);
        const withSync = parsed.map((t: any) =>
          t.id === updatedTask.id ? { ...t, isSynced: true } : t
        );
        await AsyncStorage.setItem("tasks", JSON.stringify(withSync));
      } catch (err) {
        console.warn("❌ Firestore-Speichern fehlgeschlagen:", err);
      }
    }
  };

  const safeParseArray = (val: string | null): any[] => {
    try {
      const parsed = val ? JSON.parse(val) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const handleDelete = async () => {
    Alert.alert("Löschen", "Möchtest du diese Aufgabe löschen?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Löschen",
        style: "destructive",
        onPress: async () => {
          const all = await AsyncStorage.getItem("tasks");
          const list = safeParseArray(all);
          const updated = list.filter((t: any) => t.id !== id);
          await AsyncStorage.setItem("tasks", JSON.stringify(updated));
          router.replace("/task");
        },
      },
    ]);
  };

  if (!task) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text>Lade...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white p-6">
      <Text className="text-2xl font-bold mb-2">{task.title}</Text>
      <Text className="text-gray-700 mb-4">
        {task.description || "Keine Beschreibung"}
      </Text>
      <TaskStatusTracker
        task={task}
        userId={currentUserId as string}
        userRole={userRole}
        currentStatus={currentStatus as string}
        setCurrentStatus={setCurrentStatus}
        onConfirmStep={handleStepConfirm}
      />

      {task.timeline && task.status && (
        <TaskTimeline
          timeline={task.timeline}
          currentStatus={
            currentStatus as
              | "created"
              | "in_progress"
              | "accepted"
              | "delivered"
              | "completed"
          }
          currentUserId={currentUserId || ""}
          onStepConfirm={handleStepConfirm}
        />
      )}
      <View className="h-60 w-full mb-4 rounded-xl overflow-hidden">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: task.latitude || 37.78825,
            longitude: task.longitude || -122.4324,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {task.latitude && task.longitude && (
            <Marker
              coordinate={{
                latitude: task.latitude,
                longitude: task.longitude,
              }}
              title={task.title}
              description={task.description}
            />
          )}
        </MapView>
      </View>

      {task.isOffline && (
        <Text className="text-red-500 mb-4">Offline gespeichert</Text>
      )}

      <Pressable
        onPress={handleDelete}
        className="bg-red-600 px-4 py-3 rounded items-center"
      >
        <Text className="text-white font-semibold">Aufgabe löschen</Text>
      </Pressable>
    </SafeAreaView>
  );
}
