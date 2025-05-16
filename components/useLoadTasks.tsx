import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function useLoadTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isOnline = useOfflineStatus();

  const load = async () => {
    setLoading(true);

    if (isOnline) {
      try {
        const snapshot = await getDocs(collection(db, "tasks"));
        const firebaseTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as {
            title: string;
            description: string;
            createdAt: string;
            address?: string;
            latitude?: number;
            longitude?: number;
          }),
        }));

        const sorted = firebaseTasks.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // 🔁 Eindeutige Tasks (nach id)
        const deduped = sorted.filter(
          (item, index, self) =>
            index === self.findIndex((t) => t.id === item.id)
        );

        setTasks(deduped);
        await AsyncStorage.setItem("tasks", JSON.stringify(deduped));
      } catch (err) {
        console.warn("Fehler beim Laden aus Firebase", err);
        await loadFromStorage();
      }
    } else {
      await loadFromStorage();
    }

    setLoading(false);
  };

  const loadFromStorage = async () => {
    const raw = await AsyncStorage.getItem("tasks");
    const parsed = raw ? JSON.parse(raw) : [];
    const deduped = parsed.filter(
      (item: any, index: number, self: any[]) =>
        index === self.findIndex((t) => t.id === item.id)
    );
    setTasks(deduped.reverse());
  };

  useEffect(() => {
    load();
  }, []);

  return { tasks, loading, reload: load };
}
