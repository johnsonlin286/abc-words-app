import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Music, sound effects and vibration, set in Pengaturan and kept on this phone (not tied to the
 * account). All on by default; every sound and buzz in the app checks them before it plays.
 */
type Preferences = {
  /** Background music (app only). */
  music: boolean;
  /** Game sound effects and the host's call. */
  sound: boolean;
  vibration: boolean;
};

export const usePreferences = create<Preferences>()(
  persist((): Preferences => ({ music: true, sound: true, vibration: true }), {
    name: "preferences",
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

export function setMusic(music: boolean) {
  usePreferences.setState({ music });
}

export function setSound(sound: boolean) {
  usePreferences.setState({ sound });
}

export function setVibration(vibration: boolean) {
  usePreferences.setState({ vibration });
}
