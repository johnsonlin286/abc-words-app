import { router, useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { Pressable } from "@/components/pressable";
import { SubScreen } from "@/components/sub-screen";
import { CONTACT_EMAIL, LEGAL_DOCS, UPDATED_AT, type LegalPath } from "@/shared/legal-content";

function docOf(param: string | string[] | undefined) {
  const path = `/${typeof param === "string" ? param : "privasi"}` as LegalPath;
  return LEGAL_DOCS[path] ?? LEGAL_DOCS["/privasi"];
}

/**
 * Kebijakan Privasi, Syarat & Ketentuan or Hapus akun (`/legal?doc=privasi|syarat|hapus-akun`): the
 * same text as the web pages (shared/legal-content.ts), shown in the app so it reads offline.
 */
export function LegalScreen() {
  const { doc: param } = useLocalSearchParams<{ doc?: string }>();
  const doc = docOf(param);

  return (
    <SubScreen title={doc.title}>
      <View className="gap-2">
        <Text className="font-sans text-sm text-ink-faint">Diperbarui {UPDATED_AT}</Text>
        <Text className="font-sans-regular text-lg leading-7 text-ink-soft">{doc.intro}</Text>
      </View>

      {doc.sections.map((section) => (
        <View key={section.heading} className="gap-2">
          <Text accessibilityRole="header" className="font-sans-bold text-xl text-ink">
            {section.heading}
          </Text>
          {section.paragraphs?.map((p) => (
            <Text key={p} className="font-sans-regular text-base leading-6 text-ink-soft">
              {p}
            </Text>
          ))}
          {section.items?.map((item, i) => (
            <View key={item} className="flex-row gap-2 pl-1">
              {section.heading === "Dari aplikasi" ? (
                <Text className="w-5 font-sans-bold text-base leading-6 text-ink-faint">{`${i + 1}.`}</Text>
              ) : (
                <Text className="font-sans-bold text-base leading-6 text-ink-faint">•</Text>
              )}
              <Text className="flex-1 font-sans-regular text-base leading-6 text-ink-soft">{item}</Text>
            </View>
          ))}
          {section.note ? (
            <Text className="font-sans-regular text-base leading-6 text-ink-soft">{section.note}</Text>
          ) : null}
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

      <View className="gap-1 border-t-2 border-dashed border-ink-faint pt-5">
        <Text className="font-sans-bold text-lg text-ink">Ada pertanyaan?</Text>
        <Pressable
          onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          accessibilityRole="link"
          hitSlop={8}
          className="self-start active:opacity-60"
        >
          <Text className="font-sans-semibold text-base text-ink underline">{CONTACT_EMAIL}</Text>
        </Pressable>
      </View>
    </SubScreen>
  );
}
