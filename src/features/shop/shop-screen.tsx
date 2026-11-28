import { router } from "expo-router";
import { Store } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { NoteCard } from "@/components/note-card";
import { Pressable } from "@/components/pressable";
import { SubScreen } from "@/components/sub-screen";
import { KeyIcon, KeyRow } from "@/features/keys/key-icon";
import { useRoomKeys } from "@/features/keys/use-room-keys";
import { ROOM_KEYS } from "@/shared/game";
import { colors } from "@/theme/tokens";

type Pack = { id: string; keys: number; price: string; tag?: string };

/**
 * PREVIEW ONLY (2026-11-28): the shop has no billing yet (CLAUDE.md "In-app shop"). Real prices
 * will come from Google Play, already in rupiah for the player; these are examples to judge the layout.
 */
const PREVIEW_PACKS: Pack[] = [
  { id: "keys_5", keys: 5, price: "Rp5.000" },
  { id: "keys_15", keys: 15, price: "Rp12.000", tag: "Paling laris" },
  { id: "keys_40", keys: 40, price: "Rp25.000", tag: "Paling hemat" },
];

function SectionTitle({ children }: { children: string }) {
  return <Text className="font-sans-bold text-xl text-ink">{children}</Text>;
}

/** A few keys fanned out, more for a bigger pack. */
function PackKeys({ keys }: { keys: number }) {
  const shown = keys >= 40 ? 3 : keys >= 15 ? 2 : 1;
  return (
    <View className="h-12 w-14 items-center justify-center">
      {Array.from({ length: shown }, (_, i) => (
        <View
          key={i}
          style={{
            position: shown > 1 ? "absolute" : "relative",
            transform: [{ rotate: `${(i - (shown - 1) / 2) * 18}deg` }, { translateX: (i - (shown - 1) / 2) * 8 }],
          }}
        >
          <KeyIcon size={30} />
        </View>
      ))}
    </View>
  );
}

function PackRow({ pack, last, onBuy }: { pack: Pack; last: boolean; onBuy: () => void }) {
  return (
    <View className={`flex-row items-center gap-3 py-3 ${last ? "" : "border-b border-paper-line"}`}>
      <PackKeys keys={pack.keys} />
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-bold text-lg text-ink">{pack.keys} kunci</Text>
        {pack.tag ? (
          <View className="self-start rounded-sm bg-highlight-soft px-1.5" style={{ transform: [{ rotate: "-1deg" }] }}>
            <Text className="font-hand text-sm text-ink">{pack.tag}</Text>
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onBuy}
        accessibilityRole="button"
        accessibilityLabel={`Beli ${pack.keys} kunci, ${pack.price}`}
      >
        {({ pressed }) => (
          <View
            className="min-w-[104px] items-center rounded-xl border-2 border-ink bg-highlight px-3.5 py-2"
            style={{
              boxShadow: `${pressed ? 1 : 3}px ${pressed ? 1 : 3}px 0 ${colors.ink}`,
              transform: [{ translateX: pressed ? 2 : 0 }, { translateY: pressed ? 2 : 0 }],
            }}
          >
            <Text className="font-sans-semibold text-base text-ink">{pack.price}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/**
 * Toko: key packs to buy (Google Play); no ads and cosmetics come later. UI only for now:
 * buying shows a "coming soon" line. Bought keys ("kunci cadangan") are a separate balance that never
 * expires, used after the regular keys run out.
 */
export function ShopScreen() {
  const { keys } = useRoomKeys();
  const [notice, setNotice] = useState<string | null>(null);
  const count = keys?.count ?? 0;
  const max = keys?.max ?? ROOM_KEYS.max;
  const stored = 0;

  return (
    <SubScreen title="Toko">
      <NoteCard className="gap-3 p-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-sans text-base text-ink-soft">Kunci</Text>
          <KeyRow count={count} max={max} size={20} />
        </View>
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-sans text-base text-ink-soft">Kunci cadangan</Text>
          <View className="flex-row items-center gap-1.5">
            <KeyIcon size={20} />
            <Text className="font-sans-bold text-lg text-ink">{stored}</Text>
          </View>
        </View>
        <Text className="font-sans text-sm leading-5 text-ink-faint">
          Kunci cadangan tidak hangus dan baru dipakai setelah kuncimu habis.
        </Text>
      </NoteCard>

      <View className="gap-2">
        <SectionTitle>Paket kunci</SectionTitle>
        <NoteCard className="px-4 py-1">
          {PREVIEW_PACKS.map((pack, i) => (
            <PackRow
              key={pack.id}
              pack={pack}
              last={i === PREVIEW_PACKS.length - 1}
              onBuy={() => setNotice("Pembelian lewat Google Play segera hadir.")}
            />
          ))}
        </NoteCard>
        {notice ? (
          <Text accessibilityLiveRegion="polite" className="font-hand text-base text-redpen">
            {notice}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-start gap-2">
        <Store size={16} color={colors.inkFaint} strokeWidth={2.5} style={{ marginTop: 2 }} />
        <Text className="flex-1 font-sans text-sm leading-5 text-ink-faint">
          Pembayaran lewat Google Play. Kunci tidak bisa ditukar dengan uang.{" "}
          <Text
            accessibilityRole="link"
            suppressHighlighting
            onPress={() => router.push({ pathname: "/legal", params: { doc: "syarat" } })}
            className="font-sans-semibold text-ink-soft underline"
          >
            Syarat & Ketentuan
          </Text>
        </Text>
      </View>
    </SubScreen>
  );
}
