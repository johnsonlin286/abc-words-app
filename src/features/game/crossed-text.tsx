import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/tokens";

/** A used letter or a failed answer: faint, with a diagonal red-pen stroke from bottom left to top right, a little past it. */
export function CrossedText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <View>
      <Text className={`font-sans-bold text-ink-faint ${className}`}>{text}</Text>
      <View pointerEvents="none" style={{ position: "absolute", top: 3, bottom: 3, left: -3, right: -3 }}>
        <Svg width="100%" height="100%" viewBox="0 0 10 10" preserveAspectRatio="none">
          <Path
            d="M1 9.2 Q5 5.4 9 0.8"
            fill="none"
            stroke={colors.redpen}
            strokeWidth={3}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </Svg>
      </View>
    </View>
  );
}
