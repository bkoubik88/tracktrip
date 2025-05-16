import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import { firebaseAuth } from "@/lib/firebase";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { updateProfile } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { isOffline } = useOfflineStatus();
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [localName, setLocalName] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      const storedName = await SecureStore.getItemAsync("userName");
      const storedEmail = await SecureStore.getItemAsync("userEmail");
      const storedPhoto = await SecureStore.getItemAsync("userPhoto");

      if (storedName) {
        setUserName(storedName);
        setLocalName(storedName);
      }
      if (storedEmail) setUserEmail(storedEmail);
      if (storedPhoto) setUserPhoto(storedPhoto);

      const currentUser = firebaseAuth.currentUser;
      if (!isOffline && currentUser) {
        const latestName = currentUser.displayName ?? "";
        const latestEmail = currentUser.email ?? "";
        const latestPhoto = currentUser.photoURL ?? "";

        setUserName(latestName);
        setLocalName(latestName);
        setUserEmail(latestEmail);
        setUserPhoto(latestPhoto);

        await SecureStore.setItemAsync("userName", latestName);
        await SecureStore.setItemAsync("userEmail", latestEmail);
        await SecureStore.setItemAsync("userPhoto", latestPhoto);
      }
    };

    loadUserData();
  }, [isOffline]);

  const handleNameSave = async () => {
    setUserName(localName);
    await SecureStore.setItemAsync("userName", localName);

    if (!isOffline && firebaseAuth.currentUser) {
      await updateProfile(firebaseAuth.currentUser, {
        displayName: localName,
      });
    }

    Alert.alert(
      "✅ Name gespeichert",
      isOffline
        ? "Wird synchronisiert, wenn du online bist."
        : "Synchronisiert mit Firebase."
    );
  };

  const pickImage = async () => {
    // Kamera- und Medienrechte anfragen
    const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!cameraPerm.granted || !mediaPerm.granted) {
      Alert.alert(
        "Zugriff verweigert",
        "Bitte Kamera- und Medienzugriff erlauben."
      );
      return;
    }

    // Nutzer fragen, ob er aufnehmen oder auswählen möchte
    Alert.alert(
      "Bild auswählen",
      "Möchtest du ein neues Foto aufnehmen oder aus der Galerie wählen?",
      [
        {
          text: "Kamera",
          onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });

            if (!result.canceled && result.assets.length > 0) {
              const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
              await saveImage(base64Image);
            }
          },
        },
        {
          text: "Galerie",
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });

            if (!result.canceled && result.assets.length > 0) {
              const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
              await saveImage(base64Image);
            }
          },
        },
        { text: "Abbrechen", style: "cancel" },
      ]
    );
  };

  const saveImage = async (base64Image: string) => {
    setUserPhoto(base64Image);
    await SecureStore.setItemAsync("userPhoto", base64Image);

    if (!isOffline && firebaseAuth.currentUser) {
      await updateProfile(firebaseAuth.currentUser, {
        photoURL: base64Image,
      });
    }

    Alert.alert(
      "📸 Bild gespeichert",
      isOffline
        ? "Offline gespeichert – wird synchronisiert."
        : "Mit Firebase synchronisiert."
    );
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {isOffline && (
          <Text className="text-red-500 text-center mb-2">
            ⚠️ Du bist offline – Änderungen werden lokal gespeichert
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
          <Pressable onPress={pickImage} className="mb-4">
            <Text className="text-blue-500 underline">Profilbild ändern</Text>
          </Pressable>
          <Text className="text-gray-600">{userEmail}</Text>
        </View>

        <View className="bg-gray-100 p-4 rounded-xl space-y-4">
          <Text className="text-lg font-bold">Name</Text>
          <TextInput
            className="bg-white px-4 py-2 rounded border border-gray-300"
            value={localName}
            onChangeText={setLocalName}
            placeholder="Dein Name"
          />
          <Pressable
            onPress={handleNameSave}
            className="bg-blue-500 px-4 py-2 rounded"
          >
            <Text className="text-white text-center font-semibold">
              Speichern
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
