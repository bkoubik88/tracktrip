import { useOfflineStatus } from "@/hooks/useOfflineStatus";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import "react-native-get-random-values";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreateTaskScreen() {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("");
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { isOffline } = useOfflineStatus();

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Fehler", "Standortberechtigung wurde nicht erteilt.");
      return;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
    setLocation(coords);

    const [place] = await Location.reverseGeocodeAsync(coords);
    if (place) {
      const addressString = `${place.street ?? ""} ${place.name ?? ""}, ${
        place.city ?? ""
      }`;
      setAddress(addressString);
    }
  };

  const handleContinue = () => {
    if (!location || !address) {
      Alert.alert("Fehler", "Bitte wähle einen Standort aus.");
      return;
    }

    router.push({
      pathname: "/task/taskDetails",
      params: {
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        address,
        isOffline: isOffline ? "1" : "0",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Google Places (nicht verändern) */}
          {!isOffline && process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY && (
            <View className="p-4 z-10">
              <GooglePlacesAutocomplete
                placeholder="Adresse suchen"
                fetchDetails={true}
                predefinedPlaces={[]}
                textInputProps={{}}
                autoFillOnNotFound={false}
                currentLocation={false}
                currentLocationLabel="Current location"
                debounce={0}
                disableScroll={false}
                enableHighAccuracyLocation={true}
                enablePoweredByContainer={true}
                filterReverseGeocodingByTypes={[]}
                GooglePlacesDetailsQuery={{}}
                GooglePlacesSearchQuery={{
                  rankby: "distance",
                  type: "restaurant",
                }}
                GoogleReverseGeocodingQuery={{}}
                isRowScrollable={true}
                keyboardShouldPersistTaps="always"
                listUnderlayColor="#c8c7cc"
                listViewDisplayed="auto"
                keepResultsAfterBlur={false}
                minLength={1}
                nearbyPlacesAPI="GooglePlacesSearch"
                numberOfLines={1}
                onFail={() => {}}
                onNotFound={() => {}}
                onTimeout={() =>
                  console.warn("google places autocomplete: request timeout")
                }
                predefinedPlacesAlwaysVisible={false}
                suppressDefaultStyles={false}
                textInputHide={false}
                timeout={20000}
                onPress={(data, details = null) => {
                  if (details?.geometry?.location) {
                    const { lat, lng } = details.geometry.location;
                    const coords = { latitude: lat, longitude: lng };
                    setLocation(coords);
                    setAddress(data.description);
                    mapRef.current?.animateToRegion({
                      ...coords,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  }
                }}
                query={{
                  key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                  language: "de",
                  types: "geocode",
                }}
                styles={{
                  container: { zIndex: 100 },
                  textInput: {},
                  listView: {
                    position: "absolute",
                    top: 48, // direkt unter dem Input
                    left: 0,
                    right: 0,
                    zIndex: 102,
                    elevation: 4,
                    backgroundColor: "white",
                    borderRadius: 8,
                  },
                }}
              />
            </View>
          )}

          {/* 🗺️ Karte – so groß wie möglich */}
          <View
            style={{
              flex: 1,
              marginHorizontal: 16,
              marginBottom: 10,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: location?.latitude || 48.6315,
                longitude: location?.longitude || 9.1302,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              region={
                location
                  ? {
                      latitude: location.latitude,
                      longitude: location.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }
                  : undefined
              }
            >
              {location && <Marker coordinate={location} />}
            </MapView>
          </View>
        </View>
        <View>
          {/* 📍 Adresse */}
          {address ? (
            <Text className="text-center text-gray-600 italic mb-2">
              📍 {address}
            </Text>
          ) : (
            <Text className="text-center text-gray-400 italic mb-2">
              Kein Standort ausgewählt
            </Text>
          )}
        </View>
        {/* 🚀 Weiter-Button unten fixiert */}
        <View className="p-4">
          <Pressable
            onPress={handleContinue}
            className="bg-green-600 p-4 rounded-xl items-center shadow-md"
          >
            <Text className="text-white font-bold text-lg">➡️ Weiter</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
