import { useCallback, useEffect, useRef, useState, type ComponentRef, type RefObject } from "react";
import type { LayoutChangeEvent, View } from "react-native";

/** A row counts as seen once this much of its bottom edge, at most, is still below the screen. */
const TOLERANCE = 4;
/** "Lihat N Lagi" moves down this share of the screen, so the last answers seen stay in view. */
const STEP = 0.75;
/** Paper left under the last answer after the final step. */
const MARGIN = 8;

type Focus = {
  areaRef: RefObject<ComponentRef<typeof View> | null>;
  visibleArea: () => { top: number; bottom: number };
  onViewChange: (listener: () => void) => () => void;
  scrollAreaTo: (y: number) => void;
};

/**
 * Voting: how many answers are still below the screen, and whether the player has seen the last one
 * this round. The footer shows "Lihat N Lagi" instead of "Selesai Menilai" until then, so
 * nobody finishes judging without seeing every answer. `round` is set while voting, else null.
 *
 * The list reports its layout with the round it belongs to, so a new round starts from nothing
 * without depending on when effects run.
 */
export function useAnswersBelow(
  { areaRef, visibleArea, onViewChange, scrollAreaTo }: Focus,
  round: string | null,
  answerCount: number,
) {
  const listRef = useRef<ComponentRef<typeof View>>(null);
  /** The round the measurements below belong to. */
  const measuredRound = useRef<string | null>(null);
  /** Top of the answer list in the game area; null until measured (then nothing is counted). */
  const listY = useRef<number | null>(null);
  /** Each answer row's bottom edge, relative to the list. */
  const rowBottoms = useRef(new Map<string, number>());
  const [below, setBelow] = useState(0);
  /** The round in which the last answer has been on screen. */
  const [seenIn, setSeenIn] = useState<string | null>(null);
  // Rows are measured one by one; counting before the last one arrives would call the list seen.
  const expectedRows = useRef(answerCount);
  useEffect(() => {
    expectedRows.current = answerCount;
  }, [answerCount]);

  /** Starts over when the layout comes from a new round. */
  const forRound = useCallback((layoutRound: string) => {
    if (measuredRound.current === layoutRound) return;
    measuredRound.current = layoutRound;
    listY.current = null;
    rowBottoms.current.clear();
  }, []);

  const update = useCallback(() => {
    if (listY.current === null || rowBottoms.current.size < Math.max(expectedRows.current, 1)) return;
    const { bottom } = visibleArea();
    let count = 0;
    for (const rowBottom of rowBottoms.current.values()) {
      if (listY.current + rowBottom > bottom + TOLERANCE) count += 1;
    }
    setBelow(count);
    if (count === 0) setSeenIn(measuredRound.current);
  }, [visibleArea]);

  useEffect(() => (round === null ? undefined : onViewChange(update)), [round, onViewChange, update]);

  const onListLayout = useCallback(
    (layoutRound: string) => {
      forRound(layoutRound);
      if (!listRef.current || !areaRef.current) return;
      listRef.current.measureLayout(areaRef.current, (_x, y) => {
        if (measuredRound.current !== layoutRound) return;
        listY.current = y;
        update();
      });
    },
    [areaRef, forRound, update],
  );

  const onRowLayout = useCallback(
    (layoutRound: string, answerUserId: string, e: LayoutChangeEvent) => {
      forRound(layoutRound);
      const { y, height } = e.nativeEvent.layout;
      rowBottoms.current.set(answerUserId, y + height);
      update();
    },
    [forRound, update],
  );

  /** Scrolls on to the next answers, ending with the last one just above the footer. */
  const showMore = useCallback(() => {
    if (listY.current === null || rowBottoms.current.size === 0) return;
    const { top, bottom } = visibleArea();
    const last = listY.current + Math.max(...rowBottoms.current.values());
    scrollAreaTo(Math.min(top + (bottom - top) * STEP, last + MARGIN - (bottom - top)));
  }, [visibleArea, scrollAreaTo]);

  const seenAll = round !== null && seenIn === round;
  return {
    listRef,
    onListLayout,
    onRowLayout,
    /** Answers still below the screen that this player hasn't seen yet; 0 once all were seen. */
    below: round === null || seenAll ? 0 : below,
    showMore,
  };
}
