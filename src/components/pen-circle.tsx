import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

import { colors } from "@/theme/tokens";

const LOOP = "M92 18C74 4 34 6 18 30C3 53 12 88 46 98C80 108 112 88 110 54C108 30 92 14 66 12";
/** Length of `LOOP` in viewBox units, rounded up. */
const LOOP_LENGTH = 328;
const DRAW_MS = 600;

const AnimatedPath = Animated.createAnimatedComponent(Path);
const STROKE = { d: LOOP, fill: "none", stroke: colors.redpen, strokeWidth: 5, strokeLinecap: "round" } as const;

/** The loop drawn in by the pen after `delay` ms. */
function DrawnLoop({ delay }: { delay: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(1, { duration: DRAW_MS })));
  }, [delay, progress]);
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: LOOP_LENGTH * (1 - progress.get()),
    // Hidden until it starts: the round line cap would otherwise leave a dot.
    opacity: progress.get() > 0 ? 1 : 0,
  }));
  return <AnimatedPath {...STROKE} strokeDasharray={[LOOP_LENGTH, LOOP_LENGTH]} animatedProps={animatedProps} />;
}

/**
 * The teacher's hand-drawn red loop around a letter (web components/pen-circle.tsx). Place it in a
 * parent with `position: relative`; `inset` is how far the loop reaches past the letter's box.
 * `drawDelay` draws it in after that many ms (shown at once under reduce motion).
 */
export function PenCircle({ inset = 12, style, drawDelay }: { inset?: number; style?: ViewStyle; drawDelay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <View pointerEvents="none" style={[{ position: "absolute", top: -inset, left: -inset, right: -inset, bottom: -inset }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 120 110" preserveAspectRatio="none">
        {drawDelay === undefined || reduceMotion ? <Path {...STROKE} /> : <DrawnLoop delay={drawDelay} />}
      </Svg>
    </View>
  );
}
