import type { NextConfig } from "next";
import { withLingo } from "@lingo.dev/compiler/next";

const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/translations/:locale.json",
        destination: "/translations/:locale",
      },
    ];
  },
};

// Wrap with Lingo.dev Compiler for automatic multilingual support
async function createConfig(): Promise<NextConfig> {
  return await withLingo(baseConfig, {
    sourceRoot: "./src/app",
    lingoDir: ".lingo",
    sourceLocale: "en",
    targetLocales: [
      "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "uk", "sv",
      "ja", "ko", "zh", "hi", "th", "vi", "id", "ar", "tr", "he",
    ],
    useDirective: false,
    models: "lingo.dev",
    pluralization: {
      enabled: false,
      model: "lingo.dev",
    },
    dev: {
      usePseudotranslator: false,
    },
    buildMode: "lazy",
  });
}

export default createConfig;
