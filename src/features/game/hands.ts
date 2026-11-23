// Children's hands showing 1–10 (same images as the web's public/hands, drawn for the number picker).
// 1–5 are one left hand; 6–10 add the open right hand on the viewer's left.
export const HANDS = [
  require("@/assets/hands/1.webp"),
  require("@/assets/hands/2.webp"),
  require("@/assets/hands/3.webp"),
  require("@/assets/hands/4.webp"),
  require("@/assets/hands/5.webp"),
  require("@/assets/hands/6.webp"),
  require("@/assets/hands/7.webp"),
  require("@/assets/hands/8.webp"),
  require("@/assets/hands/9.webp"),
  require("@/assets/hands/10.webp"),
] as const;

/** Width / height of each image (all 160 px tall), so a hand never stretches. */
export const HAND_RATIOS = [83, 80, 80, 93, 119, 196, 193, 193, 206, 232].map((w) => w / 160);
