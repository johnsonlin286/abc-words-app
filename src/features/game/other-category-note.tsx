import { Text } from "react-native";

import { categoryName } from "@/shared/game";

/**
 * An answer from another category's word list ("Jepang" in Hewan): failed by the word lists, not by
 * a vote, so it says which list it came from in the teacher's red pen (web other-category-note.tsx).
 */
export function OtherCategoryNote({ category }: { category: string }) {
  return <Text className="font-hand text-base leading-5 text-redpen">Bukan kategori ({categoryName(category)})</Text>;
}
