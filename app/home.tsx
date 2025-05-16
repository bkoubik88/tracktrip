import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { firebaseAuth } from "@/lib/firebase";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signOut } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
  }),
});

export default function Dashboard() {
  const router = useRouter();
  const { isOffline } = useOfflineStatus();
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [expoPushToken, setExpoPushToken] = useState("");
  const [channels, setChannels] = useState<Notifications.NotificationChannel[]>(
    []
  );
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    registerForPushNotificationsAsync().then(
      (token) => token && setExpoPushToken(token)
    );

    if (Platform.OS === "android") {
      Notifications.getNotificationChannelsAsync().then((value) =>
        setChannels(value ?? [])
      );
    }
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          const storedEmail = await SecureStore.getItemAsync("userEmail");
          const storedName = await SecureStore.getItemAsync("userName");
          const storedPhoto = await SecureStore.getItemAsync("userPhoto");

          if (storedEmail) setUserEmail(storedEmail);
          if (storedName) setUserName(storedName);
          if (storedPhoto) setUserPhoto(storedPhoto);

          const currentUser = firebaseAuth.currentUser;
          if (currentUser) {
            const latestEmail = currentUser.email ?? "";
            const latestName = currentUser.displayName ?? "";
            const latestPhoto = currentUser.photoURL ?? "";

            setUserEmail(latestEmail);
            setUserName(latestName);
            setUserPhoto(latestPhoto);

            await SecureStore.setItemAsync("userEmail", latestEmail);
            await SecureStore.setItemAsync("userName", latestName);
            await SecureStore.setItemAsync("userPhoto", latestPhoto);
          }
        } catch (e) {
          console.warn("Fehler beim Laden lokaler Nutzerdaten", e);
        }
      };

      loadUserData();
    }, [])
  );

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    await SecureStore.deleteItemAsync("userToken");
    await SecureStore.deleteItemAsync("userEmail");
    await SecureStore.deleteItemAsync("userName");
    await SecureStore.deleteItemAsync("userPhoto");
    router.replace("/signin");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {isOffline && (
          <Text className="text-red-500 text-center mb-2">
            ⚠️ Du bist offline
          </Text>
        )}

        <View className="items-center mb-8">
          {userPhoto ? (
            <Image
              source={{ uri: userPhoto }}
              className="w-24 h-24 rounded-full mb-4"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-300 mb-4 justify-center items-center">
              <Text className="text-xl text-white">👤</Text>
            </View>
          )}

          <Text className="text-xl font-bold text-black">
            {userName || "Unbekannter Nutzer"}
          </Text>
          <Text className="text-gray-500">{userEmail}</Text>
        </View>
        <View className="space-y-4">
          <View className="bg-white p-4 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black">Profil</Text>
            <Text className="text-gray-500">Persönliche Einstellungen</Text>
            <Pressable
              onPress={() => router.push("/profile")}
              className="mt-3 bg-blue-500 px-4 py-2 rounded"
            >
              <Text className="text-white text-center font-semibold">
                Profil öffnen
              </Text>
            </Pressable>
          </View>

          <View className="bg-white p-4 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black">
              Neue Aufgabe
            </Text>
            <Text className="text-gray-500">Erstelle eine neue Aktion</Text>
            <Pressable
              onPress={() => router.push("/task/create")}
              className="mt-3 bg-green-500 px-4 py-2 rounded"
            >
              <Text className="text-white text-center font-semibold">
                Aufgabe hinzufügen
              </Text>
            </Pressable>
          </View>

          <View className="bg-white p-4 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black">Alle</Text>
            <Text className="text-gray-500">Ziege alle Aufgaben</Text>
            <Pressable
              onPress={() => router.push("/task")}
              className="mt-3 bg-yellow-200 px-4 py-2 rounded"
            >
              <Text className="text-white text-center font-semibold">
                Alle Aufgaben
              </Text>
            </Pressable>
          </View>

          <View className="bg-white p-4 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black">Zuteilen</Text>
            <Text className="text-gray-500">Aufgabe zuteilen</Text>
            <Pressable
              onPress={() => router.push("/assign")}
              className="mt-3 bg-purple-500 px-4 py-2 rounded"
            >
              <Text className="text-white text-center font-semibold">
                Aufgabe hinzufügen
              </Text>
            </Pressable>
          </View>
          <View className="bg-white p-4 rounded-xl shadow">
            <Text className="text-lg font-semibold text-black">Abmelden</Text>
            <Text className="text-gray-500">Zurück zum Login</Text>
            <Pressable
              onPress={handleLogout}
              className="mt-3 bg-red-600 px-4 py-2 rounded"
            >
              <Text className="text-white text-center font-semibold">
                Abmelden
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("myNotificationChannel", {
      name: "A channel is needed for the permissions prompt to appear",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    // Learn more about projectId:
    // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
    // EAS projectId is used here.
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error("Project ID not found");
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}
