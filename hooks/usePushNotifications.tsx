import { db, firebaseAuth } from "@/lib/firebase";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export default function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    const setup = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);

        // 🔐 Optional: in Firestore speichern
        const user = firebaseAuth.currentUser;
        if (user?.uid) {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              pushToken: token,
            });
            console.log("✅ Push-Token in Firestore gespeichert");
          } catch (error) {
            console.warn("❌ Fehler beim Speichern des Push-Tokens:", error);
          }
        }
      }
    };

    setup();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("🔔 Benachrichtigung empfangen:", notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("📬 Benutzer hat reagiert:", response);
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    alert("Push-Benachrichtigungen funktionieren nur auf echten Geräten.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    alert("Benachrichtigungen wurden nicht erlaubt.");
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  if (!token.startsWith("ExponentPushToken")) {
    console.warn("❗ Ungültiger Expo Push-Token:", token);
    return null;
  }

  return token;
}
