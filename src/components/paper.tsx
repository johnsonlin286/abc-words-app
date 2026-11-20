import { StyleSheet, useWindowDimensions, View, type ViewProps } from "react-native";

import { colors } from "@/theme/tokens";

/** One ruled line every 32 px, like the web's `--rule: 2rem`. */
export const RULE = 32;
/** Left edge of the pink margin line (web: `--margin-x: 1.25rem` on phones). */
export const MARGIN_X = 20;

/**
 * The notebook sheet behind every screen: blue rules across the whole width and a pink margin
 * line near the left edge (web `.paper`). The lines are plain views, drawn once per screen height.
 */
export function Paper({ children, className, ...props }: ViewProps) {
  const { height } = useWindowDimensions();
  const count = Math.ceil(height / RULE) + 1;

  return (
    <View className={`flex-1 bg-paper ${className ?? ""}`} {...props}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={[styles.rule, { top: (i + 1) * RULE - 1 }]} />
        ))}
        <View style={styles.margin} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: colors.paperLine },
  margin: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: MARGIN_X - 1,
    width: 2,
    backgroundColor: colors.margin,
  },
});
