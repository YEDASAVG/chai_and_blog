/**
 * Root Layout - The backbone of the mobile app
 * 
 * WHAT THIS DOES:
 * 1. Imports global.css → Enables Tailwind classes everywhere
 * 2. Wraps with ClerkProvider → Auth available in all screens
 * 3. Configures status bar → Matches our dark theme
 * 4. Handles fonts → Uses system fonts for native feel
 * 
 * EXPO ROUTER LAYOUT HIERARCHY:
 * app/_layout.tsx         ← We're here (wraps everything)
 *   └── app/(tabs)/_layout.tsx  ← Tab navigation (coming later)
 *         ├── app/(tabs)/index.tsx    ← Feed
 *         ├── app/(tabs)/write.tsx    ← Create blog
 *         └── app/(tabs)/profile.tsx  ← User profile
 */

// CRITICAL: Import CSS first - this enables Tailwind classes!
import "../src/global.css";

import { ClerkProvider } from "@clerk/clerk-expo";
import { Slot, SplashScreen } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { tokenCache } from "@/lib/token-cache";
import { useEffect } from "react";

// Prevent splash screen from auto-hiding
// We'll hide it manually after auth check
SplashScreen.preventAutoHideAsync();

// Get Clerk publishable key from environment
const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. " +
      "Create apps/mobile/.env with EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_..."
  );
}

export default function RootLayout() {
  // Hide splash screen after layout mounts
  useEffect(() => {
    // Small delay to ensure auth state is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Light icons on dark background */}
      <StatusBar style="light" />

      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        {/* Slot renders the current route's component */}
        <Slot />
      </ClerkProvider>
    </>
  );
}
