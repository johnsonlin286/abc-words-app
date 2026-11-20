/**
 * "Buku tulis" design tokens, kept in step with client/src/app/globals.css (web).
 * Custom fonts on Android need one family per weight, so weights are separate font classes
 * (font-sans, font-sans-semibold, ...) rather than font-bold.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // One light theme. "class" also stops NativeWind on web from throwing when the scheme is forced.
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#fdfbf4",
        "paper-line": "#cfddf0",
        margin: "#eba0a0",
        ink: "#1d2b5c",
        "ink-soft": "#4e5a82",
        "ink-faint": "#8d95b3",
        redpen: "#d1362a",
        highlight: "#ffe34d",
        "highlight-soft": "#fff4b0",
        success: "#1f7a4d",
      },
      fontFamily: {
        "sans-regular": ["Fredoka_400Regular"],
        sans: ["Fredoka_500Medium"],
        "sans-semibold": ["Fredoka_600SemiBold"],
        "sans-bold": ["Fredoka_700Bold"],
        hand: ["Kalam_700Bold"],
      },
    },
  },
  plugins: [],
};
