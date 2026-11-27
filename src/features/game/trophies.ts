/**
 * Gold, silver and bronze stickers for ranks 1-3. They are drawn at different sizes on purpose
 * (silver and bronze smaller than gold), so keep their own heights relative to gold.
 */
export const TROPHIES = {
  gold: { source: require("@/assets/trophies/gold.webp"), width: 168, height: 192 },
  silver: { source: require("@/assets/trophies/silver.webp"), width: 151, height: 181 },
  bronze: { source: require("@/assets/trophies/bronze.webp"), width: 134, height: 162 },
} as const;

export type TrophyKind = keyof typeof TROPHIES;

/** Trophy for a rank, best first; ranks after 3 have none. */
export const TROPHY_BY_RANK: readonly TrophyKind[] = ["gold", "silver", "bronze"];

/** Size of a trophy when gold is `goldHeight` tall. */
export function trophySize(kind: TrophyKind, goldHeight: number) {
  const height = (TROPHIES[kind].height / TROPHIES.gold.height) * goldHeight;
  return { height, width: (height * TROPHIES[kind].width) / TROPHIES[kind].height };
}
