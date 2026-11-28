import { Pressable as NativePressable, type PressableProps } from "react-native";

import { playSound, type SoundName } from "@/lib/sounds";

type Props = PressableProps & {
  /** Played on press when "Efek suara" is on ("tap" by default); null for no sound. */
  sound?: SoundName | null;
};

/**
 * Every tappable thing in the app. Android's own touch click is turned off and our tap sound plays
 * instead, so the "Efek suara" switch silences every press (owner, 2026-11-28).
 */
export function Pressable({ sound = "tap", onPress, ...props }: Props) {
  return (
    <NativePressable
      android_disableSound
      {...props}
      onPress={
        onPress
          ? (event) => {
              if (sound) playSound(sound);
              onPress(event);
            }
          : undefined
      }
    />
  );
}
