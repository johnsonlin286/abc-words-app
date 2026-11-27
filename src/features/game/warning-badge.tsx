import { Image } from "expo-image";
import { Text, View } from "react-native";

import { formatPoints, LONE_REJECTION_WARNINGS, POINTS } from "@/shared/game";

import { InfoBadge } from "./info-badge";

/** Lone rejections counted on the badge: 2/3 is the warning, 3/3 means points are being taken. */
const LONE_REJECTION_LIMIT = LONE_REJECTION_WARNINGS + 1;

/** "2/3" or "3/3"; stays at 3/3 after more lone rejections. */
export function strikeLabel(count: number): string {
  return `${Math.min(count, LONE_REJECTION_LIMIT)}/${LONE_REJECTION_LIMIT}`;
}

/** Explanation for a warning, about someone else (`name`) or the viewer (`null`); same words as the web. */
export function warningText(count: number, name: string | null): string {
  const who = name ?? "Kamu";
  const penalty = `${formatPoints(POINTS.loneRejection)} poin`;
  if (count <= LONE_REJECTION_WARNINGS) {
    return `${who} sudah ${count}× menolak sendirian jawaban yang tetap lolos. Sekali lagi dianggap sengaja: ${penalty}.`;
  }
  return `${who} sudah ${count}× menolak sendirian jawaban yang tetap lolos, dianggap sengaja. Setiap tolakan sendirian berikutnya ${penalty}.`;
}

/** The warning triangle, the same picture on every device. */
export function WarningIcon() {
  return <Image source={require("@/assets/icons/warning.webp")} style={{ width: 14, height: 12 }} contentFit="contain" />;
}

/** Warning next to a player who rejected alone at least twice in this game. */
export function WarningBadge({ count, name }: { count: number; name: string }) {
  if (count < LONE_REJECTION_WARNINGS) return null;
  return (
    <InfoBadge label={`Peringatan ${name}: ${strikeLabel(count)}`} explanation={warningText(count, name)}>
      <View className="flex-row items-center gap-1">
        <WarningIcon />
        <Text className="font-sans-bold text-xs text-ink">{strikeLabel(count)}</Text>
      </View>
    </InfoBadge>
  );
}
