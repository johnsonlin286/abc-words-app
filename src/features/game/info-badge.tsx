import { useState, type ReactNode } from "react";
import { Modal, Pressable, Text } from "react-native";

import { NoteCard } from "@/components/note-card";

type Props = {
  /** Accessible name of the button, e.g. "Peringatan Andi: 2/3". */
  label: string;
  /** What the badge shows. */
  children: ReactNode;
  explanation: string;
};

/** A small badge next to a player's name that explains itself when tapped; any tap closes it. */
export function InfoBadge({ label, children, explanation }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label} hitSlop={10}>
        {children}
      </Pressable>
      {open ? (
        <Modal transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
          <Pressable onPress={close} accessibilityLabel="Tutup" className="flex-1 justify-center bg-ink/40 px-8">
            <NoteCard className="p-4" accessibilityViewIsModal>
              <Text className="font-sans text-base leading-6 text-ink">{explanation}</Text>
            </NoteCard>
          </Pressable>
        </Modal>
      ) : null}
    </>
  );
}
