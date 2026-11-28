import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

import { usePreferences } from "@/features/preferences/preferences-store";

/**
 * Game sound effects (Kenney "Interface Sounds", "UI Audio" and "Music Jingles", CC0; picked by the
 * owner, 2026-11-28), at full volume over the soft music except the jingles. Players are created once the player is
 * signed in (`loadSounds`). Every sound checks the "Efek suara" switch.
 */
const SOURCES = {
  /** A number picked. */
  pick: require("../../assets/sounds/pick.mp3"),
  /** A button pressed. */
  tap: require("../../assets/sounds/tap.mp3"),
  /** Each of the last 3 seconds of a phase. */
  tick: require("../../assets/sounds/tick.mp3"),
  /** The letter stamped on the reveal. */
  stamp: require("../../assets/sounds/stamp.mp3"),
  /** An answer rejected by this player. */
  reject: require("../../assets/sounds/reject.mp3"),
  /** This player's answer taken by the server. */
  sent: require("../../assets/sounds/sent.mp3"),
  /** This player's answer refused by the server. */
  refused: require("../../assets/sounds/refused.mp3"),
  /** This player's answer passed (result). */
  passed: require("../../assets/sounds/passed.mp3"),
  chatOpen: require("../../assets/sounds/chat-open.mp3"),
  chatClose: require("../../assets/sounds/chat-close.mp3"),
  /** Final scores, for a player with a rank. */
  jingleRanked: require("../../assets/sounds/jingle-ranked.mp3"),
  /** Final scores, for a player without one. */
  jingleUnranked: require("../../assets/sounds/jingle-unranked.mp3"),
} as const;

export type SoundName = keyof typeof SOURCES;

/** The jingles are much louder than the clicks and startled the owner (2026-11-28); the rest stay full. */
const VOLUME: Partial<Record<SoundName, number>> = { jingleRanked: 0.35, jingleUnranked: 0.35 };


/** How long the music is turned down under a jingle. */
const JINGLE_MS: Partial<Record<SoundName, number>> = { jingleRanked: 1_200, jingleUnranked: 2_000 };

const players = new Map<SoundName, AudioPlayer>();
let duckListener: ((ms: number) => void) | null = null;

/** Other apps' music keeps playing; set once when the app starts. */
export function setUpAudio(): void {
  void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: "mixWithOthers" }).catch(() => {});
}

/** Creates every player, so the first sound of a game isn't late. */
export function loadSounds(): void {
  for (const name of Object.keys(SOURCES) as SoundName[]) {
    if (players.has(name)) continue;
    const player = createAudioPlayer(SOURCES[name]);
    player.volume = VOLUME[name] ?? 1;
    players.set(name, player);
  }
}

export function releaseSounds(): void {
  for (const player of players.values()) {
    player.pause();
    player.remove();
  }
  players.clear();
}

export function playSound(name: SoundName): void {
  if (!usePreferences.getState().sound) return;
  const player = players.get(name);
  if (!player) return;
  const duck = JINGLE_MS[name];
  if (duck) duckListener?.(duck);
  void player
    .seekTo(0)
    .then(() => player.play())
    .catch(() => {});
}

/** The background music registers here to be turned down while a jingle plays. */
export function onDuck(listener: ((ms: number) => void) | null): void {
  duckListener = listener;
}
