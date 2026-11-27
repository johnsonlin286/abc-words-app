import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

/** Paper left visible above (or below) what is brought into view. */
const MARGIN = 8;
/** Time for a new phase to be laid out before scrolling to it. */
const SETTLE_MS = 80;

/**
 * Each new game phase, or a change in `key` generally, brings the game area (the score row with the
 * card under it) to the top of the screen, so the players and the controls are in view without
 * scrolling; the room code and letters stay a scroll away. `null` (the waiting room) goes back to
 * the top of the page.
 */
export function useFocusGameCard(key: string | null) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const areaRef = useRef<ComponentRef<typeof View>>(null);
  const areaY = useRef(0);
  const scrollY = useRef(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  // Also kept in a ref, so the scroll helpers stay the same functions when the keyboard resizes the
  // screen; otherwise every user of them would run (and scroll) again.
  const viewport = useRef(0);
  const reduceMotion = useReducedMotion();
  const animated = !reduceMotion;
  // During a game a change of height (the keyboard closing) brings the area back too: while the page
  // grows, Android pulls the scroll position towards the top.
  const gameHeight = key === null ? 0 : viewportHeight;

  useEffect(() => {
    const timer = setTimeout(() => {
      const y = key === null ? 0 : Math.max(areaY.current - MARGIN, 0);
      scrollRef.current?.scrollTo({ y, animated });
    }, SETTLE_MS);
    return () => clearTimeout(timer);
  }, [key, animated, gameHeight]);

  const onScrollLayout = useCallback((e: LayoutChangeEvent) => {
    viewport.current = e.nativeEvent.layout.height;
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);
  const onAreaLayout = useCallback((e: LayoutChangeEvent) => {
    areaY.current = e.nativeEvent.layout.y;
  }, []);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
  }, []);

  /** For something that opens under a tap: scrolls down only when the bottom of `target` is cut off. */
  const keepInView = useCallback(
    (target: ComponentRef<typeof View> | null) => {
      if (!target || !areaRef.current) return;
      target.measureLayout(areaRef.current, (_x, y, _width, height) => {
        const needed = areaY.current + y + height + MARGIN - viewport.current;
        if (needed > scrollY.current) scrollRef.current?.scrollTo({ y: needed, animated });
      });
    },
    [animated],
  );

  /** Scrolls past the top of the game area only as far as needed to show `target` (inside it) whole. */
  const showInArea = useCallback(
    (target: ComponentRef<typeof View> | null) => {
      if (!target || !areaRef.current) return;
      target.measureLayout(areaRef.current, (_x, y, _width, height) => {
        const needed = areaY.current + y + height + MARGIN - viewport.current;
        scrollRef.current?.scrollTo({ y: Math.max(areaY.current - MARGIN, needed, 0), animated });
      });
    },
    [animated],
  );

  // During a game the area gets a full screen of room, so even a short one can reach the top.
  const areaMinHeight = key === null ? undefined : viewportHeight;

  return { scrollRef, onScrollLayout, onScroll, areaRef, onAreaLayout, areaMinHeight, showInArea, keepInView };
}
