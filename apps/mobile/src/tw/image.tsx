/**
 * CSS-enabled Image component using expo-image
 * 
 * WHY expo-image over React Native Image?
 * - Automatic caching (memory + disk)
 * - Progressive loading with blur placeholders
 * - Better memory management
 * - WebP/AVIF support
 * - Smooth fade-in transitions
 * 
 * @example
 * import { Image } from "@/tw/image";
 * <Image
 *   source={{ uri: blog.coverImage }}
 *   className="w-full h-48 rounded-lg"
 *   contentFit="cover"
 *   placeholder={blog.coverImageBlurHash}
 * />
 */

import { useCssElement } from "react-native-css";
import { Image as ExpoImage, type ImageProps as ExpoImageProps } from "expo-image";

export type ImageProps = ExpoImageProps & { className?: string };

export const Image = (props: ImageProps) => {
  return useCssElement(ExpoImage, props, { className: "style" });
};
Image.displayName = "CSS(Image)";

// Re-export types for convenience
export type { ImageContentFit, ImageStyle } from "expo-image";
