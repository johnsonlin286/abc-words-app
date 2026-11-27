import { Text, View } from "react-native";

import { CrossedText } from "./crossed-text";

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

/**
 * The 26 letters of the game in two rows; letters already drawn are crossed out in red pen. `used` is
 * a string ("ABK") rather than an array, so the strip only redraws when a letter is added.
 */
export function AlphabetStrip({ used }: { used: string }) {
  return (
    <View className="gap-1">
      <View
        accessible
        accessibilityLabel={used.length > 0 ? `Huruf yang sudah keluar: ${[...used].join(", ")}` : "Belum ada huruf yang keluar"}
        className="flex-row flex-wrap gap-y-1"
      >
        {LETTERS.map((letter) => (
          <View key={letter} className="items-center" style={{ width: `${100 / 13}%` }}>
            {used.includes(letter) ? (
              <CrossedText text={letter} className="text-2xl leading-8" />
            ) : (
              <Text className="font-sans-bold text-2xl leading-8 text-ink">{letter}</Text>
            )}
          </View>
        ))}
      </View>
      <Text className="font-sans text-xs text-ink-soft">Huruf yang sudah keluar dicoret di sini.</Text>
    </View>
  );
}
