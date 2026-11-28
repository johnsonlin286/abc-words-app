import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Text } from "react-native";

import { colors } from "@/theme/tokens";
import { Pressable } from "@/components/pressable";

/** "Kembali" like the web: a quiet ghost button; goes home when there is nothing to go back to. */
export function BackButton() {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      accessibilityRole="button"
      accessibilityLabel="Kembali"
      hitSlop={8}
      className="-ml-3 flex-row items-center gap-2 self-start rounded-xl px-3 py-2 active:bg-white"
    >
      <ArrowLeft size={20} color={colors.ink} strokeWidth={2.5} />
      <Text className="font-sans-semibold text-base text-ink">Kembali</Text>
    </Pressable>
  );
}
