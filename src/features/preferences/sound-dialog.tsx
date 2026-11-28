import { Modal, Text, View } from "react-native";

import { NoteCard } from "@/components/note-card";

import { SoundSwitches } from "./sound-switches";
import { Pressable } from "@/components/pressable";

type Props = { visible: boolean; onClose: () => void };

/** The sound switches over the game, so nobody has to leave the room to turn the music off. */
export function SoundDialog({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Tutup pengaturan suara"
        className="flex-1 justify-center bg-ink/40 px-6"
      >
        {/* Taps on the card stay on the card. */}
        <Pressable onPress={() => {}} sound={null} accessible={false}>
          <NoteCard className="gap-2 px-5 pb-4 pt-5" accessibilityViewIsModal>
            <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
              Suara & getar
            </Text>
            <View>
              <SoundSwitches />
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              className="self-end rounded-xl border-2 border-ink bg-white px-5 py-2.5 active:bg-highlight-soft"
            >
              <Text className="font-sans-semibold text-base text-ink">Tutup</Text>
            </Pressable>
          </NoteCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
