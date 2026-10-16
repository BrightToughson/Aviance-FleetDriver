import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

let globalClerkToken: string | null = null;
let getClerkToken: (() => Promise<string | null>) | null = null;

export const setGlobalClerkToken = (token: string | null) => {
  globalClerkToken = token;
};

export const setClerkTokenGetter = (getter: () => Promise<string | null>) => {
  getClerkToken = getter;
};

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  const customOptions = { ...options };
  
  let token = globalClerkToken;
  if (getClerkToken) {
    try {
      token = await getClerkToken();
    } catch (e) {
      console.error('Error fetching Clerk token', e);
    }
  }

  if (token) {
    const headers = new Headers(customOptions.headers);
    headers.set('Authorization', `Bearer ${token}`);
    customOptions.headers = headers;
  }
  return fetch(url, customOptions);
};

const customStorageAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
});
