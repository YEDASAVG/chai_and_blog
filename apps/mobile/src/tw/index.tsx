/**
 * CSS-enabled React Native components using NativeWind + react-native-css
 * 
 * WHY THIS EXISTS:
 * React Native doesn't understand CSS or className. These wrappers use
 * useCssElement() to convert Tailwind classes into React Native styles.
 * 
 * USAGE:
 * import { View, Text, Pressable } from "@/tw";
 * <View className="flex-1 bg-background p-4">
 *   <Text className="text-white text-lg">Hello!</Text>
 * </View>
 */

import {
  useCssElement,
  useNativeVariable as useFunctionalVariable,
} from "react-native-css";

import { Link as RouterLink } from "expo-router";
import React from "react";
// Note: Animated components commented out until worklets version is resolved
// import Animated from "react-native-reanimated";
import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
  ScrollView as RNScrollView,
  TextInput as RNTextInput,
  FlatList as RNFlatList,
  RefreshControl as RNRefreshControl,
  ActivityIndicator as RNActivityIndicator,
  type ViewProps as RNViewProps,
  type TextProps as RNTextProps,
  type PressableProps as RNPressableProps,
  type ScrollViewProps as RNScrollViewProps,
  type TextInputProps as RNTextInputProps,
} from "react-native";
import {
  SafeAreaView as RNSafeAreaView,
  type NativeSafeAreaViewProps,
} from "react-native-safe-area-context";

// ============================================
// CSS Variable Hook
// ============================================

/**
 * Access CSS variables from JavaScript
 * 
 * @example
 * const primaryColor = useCSSVariable("--color-primary");
 * // Returns "#f97316" or the actual computed value
 */
export const useCSSVariable =
  process.env.EXPO_OS !== "web"
    ? useFunctionalVariable
    : (variable: string) => `var(${variable})`;

// ============================================
// Core Components
// ============================================

export type ViewProps = RNViewProps & { className?: string };

export const View = (props: ViewProps) => {
  return useCssElement(RNView, props, { className: "style" });
};
View.displayName = "CSS(View)";

export type SafeAreaViewProps = NativeSafeAreaViewProps & { className?: string };

export const SafeAreaView = (props: SafeAreaViewProps) => {
  return useCssElement(RNSafeAreaView, props, { className: "style" });
};
SafeAreaView.displayName = "CSS(SafeAreaView)";

export type TextProps = RNTextProps & { className?: string };

export const Text = (props: TextProps) => {
  return useCssElement(RNText, props, { className: "style" });
};
Text.displayName = "CSS(Text)";

export type PressableProps = RNPressableProps & { className?: string };

export const Pressable = (props: PressableProps) => {
  return useCssElement(RNPressable, props, { className: "style" });
};
Pressable.displayName = "CSS(Pressable)";

// ============================================
// Scroll Components
// ============================================

export type ScrollViewProps = RNScrollViewProps & {
  className?: string;
  contentContainerClassName?: string;
};

export const ScrollView = (props: ScrollViewProps) => {
  return useCssElement(RNScrollView, props, {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  });
};
ScrollView.displayName = "CSS(ScrollView)";

// TODO: Re-enable when worklets version is fixed
// export const AnimatedScrollView = (
//   props: ScrollViewProps & { className?: string; contentContainerClassName?: string }
// ) => {
//   return useCssElement(Animated.ScrollView as any, props, {
//     className: "style",
//     contentContainerClassName: "contentContainerStyle",
//   });
// };
// AnimatedScrollView.displayName = "CSS(AnimatedScrollView)";

// ============================================
// Form Components
// ============================================

export type TextInputProps = RNTextInputProps & { className?: string };

export const TextInput = (props: TextInputProps) => {
  return useCssElement(RNTextInput, props, { className: "style" });
};
TextInput.displayName = "CSS(TextInput)";

// ============================================
// Navigation Components
// ============================================

type LinkProps = React.ComponentProps<typeof RouterLink> & { className?: string };

export const Link = (props: LinkProps) => {
  return useCssElement(RouterLink, props, { className: "style" });
};

// TODO: Re-enable when worklets version is fixed
// export const AnimatedView = Animated.createAnimatedComponent(View);
// AnimatedView.displayName = "CSS(AnimatedView)";
// export const AnimatedText = Animated.createAnimatedComponent(Text);
// AnimatedText.displayName = "CSS(AnimatedText)";

// ============================================
// Utility Components
// ============================================

export const ActivityIndicator = (
  props: React.ComponentProps<typeof RNActivityIndicator> & { className?: string }
) => {
  return useCssElement(RNActivityIndicator, props, { className: "style" });
};
ActivityIndicator.displayName = "CSS(ActivityIndicator)";

export const RefreshControl = RNRefreshControl;

// Re-export for convenience
export { RNFlatList as FlatList };
