import useLoadTasks from "@/components/useLoadTasks";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TaskListScreen() {
  const router = useRouter();
  const { tasks, loading, reload } = useLoadTasks(); // reload ist dein Refresher
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapView>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload(); // 🔁 deine Load-Logik neu ausführen
    setRefreshing(false);
  }, [reload]);

  if (loading) return <Text className="p-4">Lade Aufgaben...</Text>;

  return (
    <SafeAreaView className="flex-1 bg-white p-4">
      <Text className="text-2xl font-bold mb-4">Deine Aufgaben</Text>

      {/* Karte */}
      <View className="h-60 w-full mb-4 rounded-xl overflow-hidden">
        <MapView
          ref={mapRef} // richtig!
          style={{ flex: 1 }}
          initialRegion={{
            latitude: tasks[0]?.latitude || 48.6315,
            longitude: tasks[0]?.longitude || 9.1302,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {tasks.slice(0, 5).map((task) =>
            task.latitude && task.longitude ? (
              <Marker
                key={task.id}
                coordinate={{
                  latitude: task.latitude,
                  longitude: task.longitude,
                }}
                title={task.title}
                description={task.description}
              />
            ) : null
          )}
        </MapView>
      </View>

      {/* Aufgabenliste */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text className="text-center text-gray-500">
            Keine Aufgaben vorhanden.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.push({
                pathname: "/task/details/[id]",
                params: {
                  id: item.id,
                  latitude: item.latitude,
                  longitude: item.longitude,
                  address: item.address,
                  isOffline: item.isOffline ? "1" : "0",
                },
              });
            }}
            className="p-4 border-b border-gray-200"
          >
            <Text className="text-lg font-semibold">{item.title}</Text>
            <Text className="text-gray-500 text-sm">
              {item.description || "Keine Beschreibung"}
            </Text>
            {item.isOffline && (
              <Text className="text-red-500 text-xs mt-1">
                Offline gespeichert
              </Text>
            )}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
