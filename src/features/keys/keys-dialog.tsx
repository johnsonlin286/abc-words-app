import { Modal, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { NoteCard } from "@/components/note-card";
import { ROOM_KEYS } from "@/shared/game";

import { KeyIcon } from "./key-icon";
import { formatCountdown, useRoomKeys } from "./use-room-keys";
import { Pressable } from "@/components/pressable";

/** What a key is for, how many you have and when the next one comes. */
export function KeysDialog({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { keys, msUntilNext } = useRoomKeys();
  const count = keys?.count ?? 0;
  const max = keys?.max ?? ROOM_KEYS.max;
  const minutes = ROOM_KEYS.regenMinutes[count] ?? ROOM_KEYS.regenMinutes.at(-1);
  const sameEveryStep = ROOM_KEYS.regenMinutes.every((m) => m === ROOM_KEYS.regenMinutes[0]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 justify-center bg-ink/40 px-6">
        <NoteCard className="gap-4 p-5" accessibilityViewIsModal>
          <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
            Kunci room
          </Text>

          <View
            className="flex-row justify-center gap-3"
            accessible
            accessibilityLabel={`Kamu punya ${count} dari ${max} kunci`}
          >
            {Array.from({ length: max }, (_, i) => (
              <Animated.View key={i} entering={visible ? ZoomIn.delay(i * 70).springify() : undefined}>
                <KeyIcon used={i >= count} size={34} />
              </Animated.View>
            ))}
          </View>

          <View className="self-center rounded-sm bg-highlight-soft px-3 py-0.5" style={{ transform: [{ rotate: "-1deg" }] }}>
            <Text className="font-hand text-lg text-ink">
              {keys === null
                ? "Memuat…"
                : msUntilNext === null
                  ? "Kuncimu penuh!"
                  : `Kunci berikutnya dalam ${formatCountdown(msUntilNext)}`}
            </Text>
          </View>

          <View className="gap-1.5">
            <Text className="font-sans text-base leading-6 text-ink-soft">
              1 kunci = 1 permainan. Kunci terpakai saat kamu menekan{" "}
              <Text className="font-sans-semibold text-ink">Mulai</Text> sebagai host.
            </Text>
            <Text className="font-sans text-base leading-6 text-ink-soft">
              Tanpa kunci kamu belum bisa membuat room. Ikut room teman selalu gratis.
            </Text>
            <Text className="font-sans text-sm leading-5 text-ink-faint">
              {sameEveryStep
                ? `Kunci baru datang setiap ${minutes} menit, maksimal ${max}.`
                : `Kunci baru datang sendiri, maksimal ${max}. Kunci berikutnya butuh ${minutes} menit.`}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            className="items-center rounded-xl border-2 border-ink bg-white px-5 py-2.5 active:bg-highlight-soft"
          >
            <Text className="font-sans-semibold text-base text-ink">Oke</Text>
          </Pressable>
        </NoteCard>
      </View>
    </Modal>
  );
}
