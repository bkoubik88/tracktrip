// lib/sendPushNotification.ts

export async function sendPushNotification(
  to: string,
  message: { title: string; body: string }
) {
  if (!to || !to.startsWith("ExponentPushToken")) {
    console.warn("❗ Ungültiger oder fehlender Expo Push Token:", to);
    return;
  }

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        sound: "default",
        title: message.title,
        body: message.body,
      }),
    });
  } catch (error) {
    console.warn("❌ Push-Benachrichtigung fehlgeschlagen:", error);
  }
}
