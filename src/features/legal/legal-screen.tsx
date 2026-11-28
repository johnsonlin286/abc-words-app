import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import { Check, Copy, Settings } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BackButton } from "@/components/back-button";
import { Paper } from "@/components/paper";
import { Pressable } from "@/components/pressable";
import { SecondaryButton } from "@/components/secondary-button";
import { useAuthStore } from "@/features/auth/auth-store";
import { CONTACT_EMAIL, LEGAL_DOCS, UPDATED_AT, type LegalPath } from "@/shared/legal-content";
import { colors } from "@/theme/tokens";

function docOf(param: string | string[] | undefined) {
  const path = `/${typeof param === "string" ? param : "privasi"}` as LegalPath;
  return LEGAL_DOCS[path] ?? LEGAL_DOCS["/privasi"];
}

/** The contact address with a copy button beside it (web `copy-email.tsx`). */
function CopyEmail() {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1_500);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <View className="flex-row flex-wrap items-center gap-1">
      <Text className="font-sans-semibold text-base text-ink">{CONTACT_EMAIL}</Text>
      <Pressable
        onPress={() => void Clipboard.setStringAsync(CONTACT_EMAIL).then(() => setCopied(true))}
        accessibilityRole="button"
        accessibilityLabel={copied ? "Alamat email tersalin" : `Salin ${CONTACT_EMAIL}`}
        hitSlop={6}
        className="h-8 w-8 items-center justify-center rounded-lg active:bg-highlight-soft"
      >
        {copied ? (
          <Check size={16} color={colors.success} strokeWidth={3} />
        ) : (
          <Copy size={16} color={colors.inkSoft} strokeWidth={2.5} />
        )}
      </Pressable>
      {copied ? <Text className="font-sans-semibold text-sm text-success">Tersalin!</Text> : null}
    </View>
  );
}

/**
 * Kebijakan Privasi, Syarat & Ketentuan or Hapus akun (`/legal?doc=privasi|syarat|hapus-akun`): the
 * same text and layout as the web pages (shared/legal-content.ts, web `legal-page.tsx`), shown in the
 * app so it reads offline and before signing in. Hapus akun ends with a button to Pengaturan (where
 * the account is deleted) instead of the web's email button; the address is still there to copy.
 */
export function LegalScreen() {
  const { doc: param } = useLocalSearchParams<{ doc?: string }>();
  const doc = docOf(param);
  const deletion = doc.path === "/hapus-akun";
  // Pengaturan is only there for a signed-in player with a name (before that, only the email).
  const canOpenSettings = useAuthStore((s) => s.status === "signedIn" && Boolean(s.user?.displayName));
  const settingsButton = deletion && canOpenSettings;

  return (
    <Paper>
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="gap-8 px-8 pb-10 pt-2" showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            <BackButton />
            <View className="self-start">
              <View
                className="absolute -left-2 -right-2 bottom-1 top-[42%] bg-highlight"
                style={{
                  transform: [{ rotate: "-1deg" }],
                  borderTopLeftRadius: 19,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 24,
                  borderBottomLeftRadius: 12,
                }}
              />
              <Text accessibilityRole="header" className="font-sans-bold text-4xl leading-[46px] text-ink">
                {doc.title}
              </Text>
            </View>
            <Text className="font-sans text-sm text-ink-faint">Diperbarui {UPDATED_AT}</Text>
            <Text className="font-sans text-lg leading-7 text-ink-soft">{doc.intro}</Text>
          </View>

          {doc.sections.map((section) => (
            <View key={section.heading} className="gap-2">
              <Text accessibilityRole="header" className="font-sans-bold text-2xl text-ink">
                {section.heading}
              </Text>
              {section.paragraphs?.map((p) => (
                <Text key={p} className="font-sans text-base leading-6 text-ink-soft">
                  {p}
                </Text>
              ))}
              {section.items ? (
                <View className="gap-1.5">
                  {section.items.map((item, i) => (
                    <View key={item} className="flex-row gap-2 pl-1">
                      {section.heading === "Dari aplikasi" ? (
                        <Text className="w-5 font-sans-bold text-base leading-6 text-ink-faint">{`${i + 1}.`}</Text>
                      ) : (
                        <Text className="font-sans-bold text-base leading-6 text-ink-faint">•</Text>
                      )}
                      <Text className="flex-1 font-sans text-base leading-6 text-ink-soft">{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {section.note ? <Text className="font-sans text-base leading-6 text-ink-soft">{section.note}</Text> : null}
              {section.link ? (
                <Pressable
                  onPress={() => router.push({ pathname: "/legal", params: { doc: section.link!.path.slice(1) } })}
                  accessibilityRole="link"
                  hitSlop={8}
                  className="self-start active:opacity-60"
                >
                  <Text className="font-sans-semibold text-base text-ink underline">{section.link.label}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}

          <View className="gap-3 border-t-2 border-dashed border-ink-faint pt-6">
            <Text className="font-sans-bold text-xl text-ink">
              {deletion ? "Mau hapus akun?" : "Ada pertanyaan?"}
            </Text>
            {/* Inside the app there is no need for an email: the button is in Pengaturan. */}
            {settingsButton ? (
              <SecondaryButton
                label="Buka Pengaturan"
                icon={<Settings size={20} color={colors.ink} strokeWidth={2.5} />}
                onPress={() => router.dismissTo("/settings")}
              />
            ) : null}
            <View className="gap-0.5">
              <Text className="font-sans text-base leading-6 text-ink-soft">
                {settingsButton ? "atau tulis email ke" : "Tulis email ke"}
              </Text>
              <CopyEmail />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Paper>
  );
}
