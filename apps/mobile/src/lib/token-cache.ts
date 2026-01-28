/**
 * SecureStore Token Cache for Clerk Authentication
 * 
 * WHY SecureStore?
 * - Encrypted storage (uses Keychain on iOS, Keystore on Android)
 * - Persists across app restarts
 * - Cannot be accessed by other apps
 * 
 * HOW IT WORKS:
 * 1. User signs in → Clerk gives us a JWT token
 * 2. tokenCache.saveToken("__clerk_client_jwt", token) is called
 * 3. Token is encrypted and stored in device's secure storage
 * 4. On next app launch → tokenCache.getToken() retrieves it
 * 5. User is automatically signed in!
 */

import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { TokenCache } from "@clerk/clerk-expo";

// Create a wrapper for web platform (SecureStore is native-only)
const createTokenCache = (): TokenCache => {
  return {
    async getToken(key: string) {
      try {
        // SecureStore only works on native platforms
        if (Platform.OS === "web") {
          return localStorage.getItem(key);
        }
        const item = await SecureStore.getItemAsync(key);
        return item;
      } catch (error) {
        console.error("SecureStore getToken error:", error);
        return null;
      }
    },

    async saveToken(key: string, token: string) {
      try {
        if (Platform.OS === "web") {
          localStorage.setItem(key, token);
          return;
        }
        await SecureStore.setItemAsync(key, token);
      } catch (error) {
        console.error("SecureStore saveToken error:", error);
      }
    },

    async clearToken(key: string) {
      try {
        if (Platform.OS === "web") {
          localStorage.removeItem(key);
          return;
        }
        await SecureStore.deleteItemAsync(key);
      } catch (error) {
        console.error("SecureStore clearToken error:", error);
      }
    },
  };
};

export const tokenCache = createTokenCache();
