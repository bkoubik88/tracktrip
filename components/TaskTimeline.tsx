import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Pressable, Text, View } from "react-native";

const statusSteps = [
  { key: "created", label: "Erstellt" },
  { key: "in_progress", label: "In Bearbeitung" },
  { key: "accepted", label: "Angenommen" },
  { key: "delivered", label: "In Zustellung" },
  { key: "completed", label: "Abgeschlossen" },
];

type StepInfo = {
  at: string;
  by: string;
};

type TaskTimelineProps = {
  timeline: {
    created: StepInfo;
    in_progress: StepInfo | null;
    accepted: StepInfo | null;
    delivered: StepInfo | null;
    completed: StepInfo | null;
  };
  currentStatus:
    | "created"
    | "in_progress"
    | "accepted"
    | "delivered"
    | "completed";
  currentUserId: string;
  onStepConfirm: (nextStatus: string) => void;
  isAdmin?: boolean;
};

export default function TaskTimeline({
  timeline,
  currentStatus,
  currentUserId,
  onStepConfirm,
  isAdmin = false,
}: TaskTimelineProps) {
  return (
    <View className="p-4 bg-white rounded-xl shadow">
      <Text className="text-xl font-bold mb-4">📋 Fortschritt</Text>

      {statusSteps.map((step, index) => {
        const info = timeline[step.key as keyof typeof timeline];

        const isCompleted = !!info;
        const isNext =
          !isCompleted &&
          statusSteps.findIndex((s) => s.key === currentStatus) + 1 === index;

        return (
          <View key={step.key} className="mb-4">
            <View className="flex-row items-center justify-between">
              <Text
                className={`font-semibold ${
                  isCompleted ? "text-green-600" : "text-gray-700"
                }`}
              >
                {step.label}
              </Text>

              {isCompleted && info ? (
                <Text className="text-sm text-gray-500">
                  {format(new Date(info.at), "dd.MM.yyyy HH:mm", {
                    locale: de,
                  })}{" "}
                  ✅
                </Text>
              ) : isNext ? (
                <Pressable
                  onPress={() => onStepConfirm(step.key)}
                  className="bg-blue-600 px-3 py-1 rounded"
                >
                  <Text className="text-white text-sm">Bestätigen</Text>
                </Pressable>
              ) : (
                <Text className="text-sm text-gray-400">Offen</Text>
              )}
            </View>

            {info?.by && (
              <Text className="text-xs text-gray-500 mt-1">
                von: {info.by === currentUserId ? "Du" : info.by}
              </Text>
            )}

            {index < statusSteps.length - 1 && (
              <View className="h-[1px] bg-gray-300 my-2 ml-1" />
            )}
          </View>
        );
      })}
    </View>
  );
}
