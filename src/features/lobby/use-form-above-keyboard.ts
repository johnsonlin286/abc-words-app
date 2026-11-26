import { useCallback, useEffect, useRef, type RefObject } from "react";
import { Keyboard, type FlatList, type LayoutChangeEvent } from "react-native";

/** Space left between the card and the keyboard. */
const GAP = 12;
/** Android first scrolls just far enough to show the focused field; scroll after that. */
const SETTLE_MS = 100;

/**
 * Keeps the bottom of the form card (the field being filled and its button) above the keyboard:
 * the list shrinks when the keyboard opens, and the card grows when a password field appears.
 * Android may resize the list before or after reporting the keyboard, so both are watched.
 */
export function useFormAboveKeyboard<T>(listRef: RefObject<FlatList<T> | null>, listTop: number) {
  const listHeight = useRef(0);
  const cardBottom = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const reveal = useCallback(() => {
    cancel();
    timer.current = setTimeout(() => {
      if (!Keyboard.isVisible() || listHeight.current === 0) return;
      const offset = Math.max(listTop + cardBottom.current + GAP - listHeight.current, 0);
      listRef.current?.scrollToOffset({ offset, animated: true });
    }, SETTLE_MS);
  }, [cancel, listRef, listTop]);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", reveal);
    return () => {
      subscription.remove();
      cancel();
    };
  }, [cancel, reveal]);

  return {
    onListLayout: (event: LayoutChangeEvent) => {
      listHeight.current = event.nativeEvent.layout.height;
      reveal();
    },
    /** For a card that is a direct child of the list header. */
    onCardLayout: (event: LayoutChangeEvent) => {
      const { y, height } = event.nativeEvent.layout;
      cardBottom.current = y + height;
      reveal();
    },
  };
}
