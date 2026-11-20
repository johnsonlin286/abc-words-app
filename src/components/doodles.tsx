import { Check } from "lucide-react-native";
import { Text, View, type ViewStyle } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import Svg, { G, Path, Rect } from "react-native-svg";

import { colors } from "@/theme/tokens";

/** Three short pen strokes fanning out from a corner: the "look here!" mark from a kid's notebook. */
export function Sparks({ style, color = colors.redpen }: { style?: ViewStyle; color?: string }) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute", width: 24, height: 24 }, style]}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <G stroke={color} strokeWidth={2.6} strokeLinecap="round" fill="none">
          <Path d="M4 14 1 13" />
          <Path d="M7 8 4 4" />
          <Path d="M13 6 14 1" />
        </G>
      </Svg>
    </View>
  );
}

/** A yellow pencil lying across the corner of the category note. */
function Pencil({ style }: { style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={style}>
      <Svg width={37} height={112} viewBox="0 0 40 120">
        <G stroke={colors.ink} strokeWidth={2.5} strokeLinejoin="round">
          <Rect x={8} y={2} width={24} height={16} rx={5} fill="#f4a3b4" />
          <Rect x={8} y={16} width={24} height={8} fill="#c9ced9" />
          <Path d="M8 24h24v66H8z" fill={colors.highlight} />
          <Path d="M20 24v66" fill="none" />
          <Path d="M8 90 20 116 32 90z" fill="#f6dcb0" />
          <Path d="m16.5 108.5 3.5 7.5 3.5-7.5z" fill={colors.ink} />
        </G>
      </Svg>
    </View>
  );
}

// Three of the room categories; Profesi instead of the web hero's Kota, as the owner chose for the
// app. Labels come from shared/game.ts once the rule constants are copied over.
const LISTED = ["Hewan", "Negara", "Profesi"];

/**
 * A torn-off note of the categories a room can play, ticked in red pen with a pencil on it
 * (web: components/home/doodles.tsx). Decoration only, hidden from screen readers.
 * It drops in tilted, then the ticks pop one by one.
 */
export function CategoryNote({ style, delay = 0 }: { style?: ViewStyle; delay?: number }) {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={style}
    >
      <Animated.View entering={FadeInDown.delay(delay).duration(600).springify()}>
        <View
          className="w-52 rounded-2xl border-2 border-ink bg-white px-5 pb-5 pt-6"
          style={{ boxShadow: `4px 4px 0 ${colors.ink}`, transform: [{ rotate: "3deg" }] }}
        >
          {/* Spiral holes along the top */}
          <View className="absolute -top-1.5 left-4 right-4 flex-row justify-between">
            {Array.from({ length: 7 }, (_, i) => (
              <View key={i} className="h-3 w-1.5 rounded-full border-2 border-ink bg-paper" />
            ))}
          </View>
          <View className="mb-3 self-start rounded-sm bg-highlight px-2">
            <Text className="font-sans-bold text-xl text-ink">Kategori</Text>
          </View>
          <View className="gap-2">
            {LISTED.map((label, i) => (
              <View key={label} className="flex-row items-center gap-2.5 border-b border-paper-line pb-1">
                <View className="h-5 w-5 rounded-[4px] border-2 border-ink">
                  <Animated.View
                    entering={ZoomIn.delay(delay + 500 + i * 90).springify()}
                    style={{ position: "absolute", top: -6, right: -6 }}
                  >
                    <Check size={20} color={colors.redpen} strokeWidth={3.5} />
                  </Animated.View>
                </View>
                <Text className="font-hand text-lg text-ink">{label}</Text>
              </View>
            ))}
          </View>
        </View>
        <Pencil style={{ position: "absolute", right: -20, bottom: -24, transform: [{ rotate: "28deg" }] }} />
      </Animated.View>
    </View>
  );
}
