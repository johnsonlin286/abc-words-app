import { cssInterop } from "nativewind";
import Animated from "react-native-reanimated";

// NativeWind only maps `className` on components it knows. Register Reanimated's animated views so
// `<Animated.View className=…>` styles like a plain View (without this, the classes are dropped).
cssInterop(Animated.View, { className: "style" });
cssInterop(Animated.Text, { className: "style" });
