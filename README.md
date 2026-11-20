# ABC Lima Dasar — Android app

React Native (Expo) client for ABC Lima Dasar. Same NESIO backend as the web client
(github.com/johnsonlin286/abc-words, `client/`).

## Stack

Expo SDK 58 · Expo Router · NativeWind 4 (Tailwind v3) · Reanimated 4 · react-native-svg ·
Zustand · TanStack Query · socket.io-client · expo-audio / expo-haptics · Fredoka + Kalam.

## Commands

```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_URL
npx expo start                # dev server
npx tsc --noEmit              # typecheck
npm run lint
npx expo-doctor
npx expo install <package>    # always, instead of npm install, for SDK-compatible versions
```

Design tokens live in `tailwind.config.js` and `src/theme/tokens.ts`; keep them in step with
the web client's `globals.css`.
