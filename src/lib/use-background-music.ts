import { createAudioPlayer } from "expo-audio";
import { useEffect } from "react";
import { AppState } from "react-native";

import { usePreferences } from "@/features/preferences/preferences-store";

import { onDuck } from "./sounds";

const bgm = require("../../assets/sounds/bgm.mp3");

/** Well under the game's sounds (owner, 2026-11-28: the effects were lost under 25%). */
const VOLUME = 0.15;
const DUCKED = 0.05;

/**
 * Background music for the whole signed-in app (the web has none): loops while the app is in the
 * foreground and the "Musik" switch is on, paused otherwise, and turned down under a jingle. The
 * player exists only while the music is on.
 */
export function useBackgroundMusic(): void {
  const music = usePreferences((s) => s.music);
  useEffect(() => {
    if (!music) return;
    const player = createAudioPlayer(bgm);
    player.loop = true;
    player.volume = VOLUME;
    let timer: ReturnType<typeof setTimeout> | undefined;
    onDuck((ms) => {
      clearTimeout(timer);
      player.volume = DUCKED;
      timer = setTimeout(() => {
        player.volume = VOLUME;
      }, ms);
    });
    const unsubscribe = AppState.addEventListener("change", (state) => {
      if (state === "active") player.play();
      else player.pause();
    });
    if (AppState.currentState === "active") player.play();
    return () => {
      unsubscribe.remove();
      onDuck(null);
      clearTimeout(timer);
      // remove() alone leaves the track playing on Android.
      player.pause();
      player.remove();
    };
  }, [music]);
}
