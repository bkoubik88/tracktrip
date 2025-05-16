import { firebaseAuth } from "@/lib/firebase";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const tryAutoLogin = async () => {
      const token = await SecureStore.getItemAsync("userToken");

      if (token) {
        router.replace("/home");
      } else {
        setIsLoading(false); // <-- wichtig!
      }
    };
    tryAutoLogin();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Fehler", "Bitte E-Mail und Passwort eingeben.");
      return;
    }

    const net = await NetInfo.fetch();

    if (!net.isConnected) {
      // Offline-Login: gespeicherte Daten vergleichen
      const storedEmail = await SecureStore.getItemAsync("userEmail");
      const storedPass = await SecureStore.getItemAsync("userPassword"); // <- speichern wir unten beim Login
      if (storedEmail === email && storedPass === password) {
        router.replace("/home");
      } else {
        Alert.alert("Offline", "Zugangsdaten nicht verfügbar.");
      }
      return;
    }

    // Online Login mit Firebase
    try {
      const res = await signInWithEmailAndPassword(
        firebaseAuth,
        email,
        password
      );
      const token = await res.user.getIdToken();

      // Speichern für späteren Offline-Login
      await SecureStore.setItemAsync("userToken", token);
      await SecureStore.setItemAsync("userEmail", res.user.email ?? "");
      await SecureStore.setItemAsync("userName", res.user.displayName ?? "");
      await SecureStore.setItemAsync("userPhoto", res.user.photoURL ?? "");
      await SecureStore.setItemAsync("userPassword", password); // 🔐 Achtung: optional, nur für Offline-Login

      router.replace("/home");
    } catch (err: any) {
      Alert.alert("Login fehlgeschlagen", err.message);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Lade...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-white px-6">
      <Text className="text-2xl font-bold mb-6">Anmelden</Text>

      <TextInput
        placeholder="E-Mail"
        value={email}
        onChangeText={setEmail}
        className="border border-gray-300 w-full p-4 rounded mb-4 text-black"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Passwort"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="border border-gray-300 w-full p-4 rounded mb-6 text-black"
      />

      <Pressable
        onPress={handleLogin}
        className="bg-blue-600 w-full p-4 rounded items-center"
      >
        <Text className="text-white font-semibold">Einloggen</Text>
      </Pressable>
    </View>
  );
}
