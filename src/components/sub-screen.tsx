import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "./back-button";
import { Paper } from "./paper";

/** A screen one level down (settings, rename, credits): "Kembali", a title, then scrolling content. */
export function SubScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerClassName="gap-5 px-8 pb-8 pt-2"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="gap-1">
              <BackButton />
              <Text accessibilityRole="header" className="font-sans-bold text-3xl text-ink">
                {title}
              </Text>
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Paper>
  );
}
