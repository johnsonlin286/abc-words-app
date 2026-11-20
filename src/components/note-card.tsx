import { View, type ViewProps } from "react-native";

import { cardShadow } from "@/theme/tokens";

/** An index card on the notebook: white, ink border, hard offset shadow (web `.note-card`). */
export function NoteCard({ className, style, ...props }: ViewProps) {
  return (
    <View
      className={`rounded-2xl border-2 border-ink bg-white ${className ?? ""}`}
      style={[{ boxShadow: cardShadow }, style]}
      {...props}
    />
  );
}
