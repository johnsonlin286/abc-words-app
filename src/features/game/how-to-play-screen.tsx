import { router } from "expo-router";
import { RotateCcw } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { Paper } from "@/components/paper";
import { PrimaryButton } from "@/components/primary-button";
import { colors } from "@/theme/tokens";

import { SLIDES, type Slide } from "./how-to-play-slides";

const SIDE_PADDING = 32;

/**
 * Cara bermain, short: six cards to swipe, one picture and one sentence each, so nobody has to
 * read a page of rules. "Aturan lengkap" opens every rule (rules-screen.tsx).
 */
export function HowToPlayScreen() {
  const { width } = useWindowDimensions();
  const list = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const last = index === SLIDES.length - 1;

  // Programmatic scrolls don't always fire onMomentumScrollEnd, so the dots follow here too.
  const goTo = (i: number) => {
    list.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const renderItem: ListRenderItem<Slide> = useCallback(
    ({ item, index: i }) => (
      <View
        style={{ width, paddingHorizontal: SIDE_PADDING }}
        className="justify-center gap-8"
        accessible
        accessibilityLabel={`Langkah ${i + 1} dari ${SLIDES.length}. ${item.title}. ${item.text}`}
      >
        <View className="min-h-[220px] items-center justify-center">
          {/* Remounted when the card comes into view, so its entrance plays again. */}
          <item.Illustration key={i === index ? "active" : "idle"} active={i === index} />
        </View>
        <View className="gap-2">
          <Text className="font-sans-bold text-3xl text-ink">{item.title}</Text>
          <Text className="font-sans text-lg leading-7 text-ink-soft">{item.text}</Text>
        </View>
      </View>
    ),
    [width, index],
  );

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <View className="px-8 pt-2">
          <BackButton />
        </View>

        <FlatList
          ref={list}
          data={SLIDES}
          keyExtractor={(s) => s.key}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          initialNumToRender={2}
          windowSize={3}
          className="flex-1"
        />

        <View className="gap-4 px-8 pb-4">
          <View className="flex-row justify-center gap-2" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {SLIDES.map((s, i) => (
              <View
                key={s.key}
                className={`h-2.5 rounded-full ${i === index ? "w-6 bg-ink" : "w-2.5 bg-ink-faint"}`}
              />
            ))}
          </View>
          <PrimaryButton
            label={last ? "Main sekarang" : "Lanjut"}
            onPress={() => (last ? router.dismissTo("/") : goTo(index + 1))}
          />
          {last ? (
            <Pressable
              onPress={() => goTo(0)}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 rounded-xl border-2 border-ink bg-white px-5 py-2.5 active:bg-highlight-soft"
            >
              <RotateCcw size={18} color={colors.ink} strokeWidth={2.5} />
              <Text className="font-sans-semibold text-base text-ink">Ulangi dari awal</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={() => router.push("/rules")} accessibilityRole="link" hitSlop={8} className="self-center">
            <Text className="font-sans-semibold text-base text-ink underline">Aturan lengkap</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Paper>
  );
}
