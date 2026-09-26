import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const memoryTokenCache: Record<string, string> = {};

const createTokenCache = () => {
  return {
    async getToken(key: string) {
      try {
        const item = await SecureStore.getItemAsync(key, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        if (item) {
          console.log(`[TokenCache] ${key} was successfully retrieved 🔐 (length: ${item.length})`);
          return item;
        }
        console.log(`[TokenCache] ${key} is empty! Using memory fallback.`);
        return memoryTokenCache[key] || null;
      } catch (error) {
        console.error('[TokenCache] SecureStore get item error: ', error);
        return memoryTokenCache[key] || null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        console.log(`[TokenCache] Saving token for ${key}...`);
        memoryTokenCache[key] = value; // Fallback
        await SecureStore.setItemAsync(key, value, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        console.log(`[TokenCache] Successfully saved token for ${key}`);
      } catch (err) {
        console.error(`[TokenCache] Failed to save token for ${key}:`, err);
        return;
      }
    },
  };
};

export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;
