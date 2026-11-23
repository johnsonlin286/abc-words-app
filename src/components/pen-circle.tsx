import { View, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/tokens";

/**
 * The teacher's hand-drawn red loop around a letter (web components/pen-circle.tsx). Place it in a
 * parent with `position: relative`; `inset` is how far the loop reaches past the letter's box.
 */
export function PenCircle({ inset = 12, style }: { inset?: number; style?: ViewStyle }) {
  return (
    <View pointerEvents="none" style={[{ position: "absolute", top: -inset, left: -inset, right: -inset, bottom: -inset }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 120 110" preserveAspectRatio="none">
        <Path
          d="M92 18C74 4 34 6 18 30C3 53 12 88 46 98C80 108 112 88 110 54C108 30 92 14 66 12"
          fill="none"
          stroke={colors.redpen}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
