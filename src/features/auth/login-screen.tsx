import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CategoryNote, Sparks } from "@/components/doodles";
import { GoogleButton } from "@/components/google-button";
import { NoteCard } from "@/components/note-card";
import { Paper } from "@/components/paper";

const logo = require("@/assets/images/logo.png");

type Props = {
  onGooglePress: () => void;
  loading?: boolean;
  /** A failed sign-in, in the teacher's red pen under the button. */
  error?: string | null;
  /** Why the player was signed out without choosing to; shown above the button. */
  notice?: string | null;
};

/**
 * The app's front door, laid out like the web hero on a phone: "Main / logo / Online!", the
 * red-pen tagline and the ticked category note in the corner, then one card with the only action:
 * sign in with Google.
 * One orchestrated moment: the headline rises, the note drops in and is ticked, then the card. Reanimated skips
 * these entering animations when the system's reduce-motion setting is on.
 * Animated.* components don't take NativeWind classes, so they only animate; plain views inside
 * carry the styling.
 */
export function LoginScreen({ onGooglePress, loading = false, error = null, notice = null }: Props) {
  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow justify-between gap-6 px-8 pt-4 pb-4"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View className="gap-1 pt-14">
              <Animated.View entering={FadeInUp.duration(600)} style={{ alignSelf: "flex-start" }}>
                <Text className="font-sans-bold text-5xl leading-[56px] text-ink">Main</Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(200).duration(600)}>
                <Image
                  source={logo}
                  accessibilityLabel="ABC Lima Dasar"
                  style={{ width: "100%", aspectRatio: 800 / 164 }}
                  contentFit="contain"
                />
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(400).duration(600)} style={{ alignSelf: "flex-start" }}>
                <View
                  className="absolute -left-2 -right-2 bottom-1 top-[38%] bg-highlight"
                  style={{
                    transform: [{ rotate: "-1deg" }],
                    borderTopLeftRadius: 19,
                    borderTopRightRadius: 10,
                    borderBottomRightRadius: 24,
                    borderBottomLeftRadius: 12,
                  }}
                />
                <Text className="font-sans-bold text-5xl leading-[56px] text-ink">Online!</Text>
              </Animated.View>
            </View>

            <Animated.View entering={FadeInUp.delay(550).duration(500)} style={{ marginTop: 20 }}>
              <View
                className="self-start rounded-sm bg-highlight-soft px-3 py-1"
                style={{ transform: [{ rotate: "-1deg" }] }}
              >
                <Sparks style={{ top: -16, left: -20 }} />
                <Text className="font-hand text-xl leading-7 text-ink">
                  Permainan kata legendaris era 90-an, kini online!
                </Text>
              </View>
            </Animated.View>

            {/* Pinned in the corner beside "Main", at the web hero's phone scale. */}
            <CategoryNote
              delay={350}
              style={{
                position: "absolute",
                top: -16,
                right: 4,
                transform: [{ scale: 0.58 }],
                transformOrigin: "top right",
              }}
            />
          </View>

          <Animated.View entering={FadeInDown.delay(750).duration(500)}>
            <NoteCard className="gap-4 p-5">
              <View className="gap-1.5">
                <Text className="font-sans-bold text-2xl text-ink">Masuk dulu, yuk!</Text>
                <Text className="font-sans text-base leading-6 text-ink-soft">
                  Cukup pakai akun Google-mu. Tanpa isi formulir, tanpa kata sandi baru.
                </Text>
              </View>
              {notice ? (
                <View
                  accessibilityLiveRegion="polite"
                  className="rounded-xl border-2 border-dashed border-ink-soft bg-highlight-soft px-3.5 py-2.5"
                >
                  <Text className="font-sans text-sm leading-5 text-ink">{notice}</Text>
                </View>
              ) : null}
              <GoogleButton onPress={onGooglePress} loading={loading} />
              {error ? (
                <Text accessibilityRole="alert" className="font-sans-semibold text-sm text-redpen">
                  {error}
                </Text>
              ) : null}
            </NoteCard>
          </Animated.View>

          <Text className="text-center font-sans-regular text-sm leading-5 text-ink-soft">
            Dengan masuk, kamu setuju dengan{" "}
            <Text className="font-sans-semibold text-ink underline">{"Syarat\u00a0&\u00a0Ketentuan"}</Text> dan{" "}
            <Text className="font-sans-semibold text-ink underline">Kebijakan Privasi</Text>.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Paper>
  );
}
