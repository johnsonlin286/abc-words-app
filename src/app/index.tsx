import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Ellipse } from "react-native-svg";

import { NoteCard } from "@/components/note-card";
import { colors } from "@/theme/tokens";

/** Setup check: tokens, fonts, card, highlighter button and an SVG pen circle. Replaced later. */
export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-1 justify-center gap-6 px-5">
        <Text className="text-center font-sans-bold text-4xl text-ink">ABC Lima Dasar</Text>

        <NoteCard className="items-center gap-3 p-5">
          <Text className="font-sans text-base text-ink-soft">Huruf ronde ini</Text>
          <View className="h-24 w-24 items-center justify-center">
            <Svg width={96} height={96} viewBox="0 0 96 96" style={{ position: "absolute" }}>
              <Ellipse cx={48} cy={48} rx={40} ry={36} stroke={colors.redpen} strokeWidth={4} fill="none" />
            </Svg>
            <Text className="font-sans-bold text-6xl text-redpen">K</Text>
          </View>
          <Text className="font-hand text-lg text-redpen">Bagus, lanjutkan!</Text>
        </NoteCard>

        <Pressable className="items-center rounded-2xl border-2 border-ink bg-highlight py-3 active:bg-highlight-soft">
          <Text className="font-sans-semibold text-lg text-ink">Main sekarang</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
