import { useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";

const STATUSES = [
  { key: "created", label: "Erstellt" },
  { key: "in_progress", label: "In Bearbeitung" },
  { key: "accepted", label: "Übernommen" },
  { key: "delivering", label: "In Zustellung" },
  { key: "completed", label: "Abgeschlossen" },
];

type Props = {
  task: any;
  userId: string;
  userRole: "creator" | "driver" | "receiver";
  currentStatus: string;
  setCurrentStatus: (status: string) => void;
  onConfirmStep: (nextStatus: string) => void;
};

export default function TaskStatusTracker({
  task,
  userId,
  userRole,
  currentStatus,
  setCurrentStatus,
  onConfirmStep,
}: Props) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  };

  const stopProgress = () => {
    progressAnim.stopAnimation();
    progressAnim.setValue(0);
    setPressedKey(null);
  };

  return (
    <View className="p-4">
      {STATUSES.map((s, index) => {
        const isActive = currentStatus === s.key;
        const isPast =
          index < STATUSES.findIndex((st) => st.key === currentStatus);
        const isPressed = pressedKey === s.key;

        return (
          <Pressable
            key={s.key}
            onPressIn={() => {
              setPressedKey(s.key);
              startProgress();
              timeoutRef.current = setTimeout(() => {
                setCurrentStatus(s.key);
                onConfirmStep(s.key);
                stopProgress();
              }, 1500);
            }}
            onPressOut={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                stopProgress();
              }
            }}
            className={`mb-2 p-3 rounded-xl ${
              isActive ? "bg-blue-600" : isPast ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <Text className="text-white font-semibold">{s.label}</Text>

            {/* Nur der aktuell gedrückte zeigt Ladebalken */}
            {isPressed && (
              <Animated.View
                style={{
                  height: 6,
                  backgroundColor: "green",
                  marginTop: 6,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
