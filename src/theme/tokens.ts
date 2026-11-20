/**
 * "Buku tulis" colours for places a className can't reach (SVG strokes, StatusBar, shadows).
 * Same values as tailwind.config.js and the web client's globals.css.
 */
export const colors = {
  paper: "#fdfbf4",
  paperLine: "#cfddf0",
  margin: "#eba0a0",
  ink: "#1d2b5c",
  inkSoft: "#4e5a82",
  inkFaint: "#8d95b3",
  redpen: "#d1362a",
  highlight: "#ffe34d",
  highlightSoft: "#fff4b0",
  success: "#1f7a4d",
} as const;

/** The hard offset shadow of `.note-card` on the web (4px 4px 0 ink). */
export const cardShadow = `4px 4px 0 ${colors.ink}`;
