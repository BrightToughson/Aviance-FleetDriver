import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, Alert, View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClerkProvider, ClerkLoaded, useAuth, useUser } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import '../i18n';

const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') return sessionStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        sessionStorage.setItem(key, value);
        return;
      }
      return SecureStore.setItemAsync(key, value);
    } catch {
      return;
    }
  },
};

WebBrowser.maybeCompleteAuthSession();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY');
}

import { supabase, setClerkTokenGetter, setGlobalClerkToken } from '../lib/supabase';

function InitialLayout() {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          setGlobalClerkToken(token);
          return token;
        }
      } catch (e) {
        console.warn('Clerk supabase template token fetch failed, trying default token:', e);
      }
      try {
        const fallback = await getToken();
        if (fallback) setGlobalClerkToken(fallback);
        return fallback;
      } catch (e) {
        return null;
      }
    };

    setClerkTokenGetter(fetchToken);
    if (isSignedIn) {
      fetchToken();
    } else {
      setGlobalClerkToken(null);
    }
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isAuthLoaded || (isSignedIn && !isUserLoaded)) return;

    const isPublic = (segments[0] as string) === 'public';
    // Expo Router segments might sometimes strip groups or nest differently. Check array explicitly.
    const inAuthGroup = segments.includes('(auth)') || segments.includes('sign-in') || segments.includes('sign-up');
    const isCompletingProfile = segments.includes('complete-profile');

    if (isSignedIn && user?.id) {
      const verifyAndRoute = async () => {
        let role = user?.unsafeMetadata?.role;

        // If not in Clerk metadata, verify against Supabase profiles table
        if (!role) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.role) {
              role = profile.role;
              if (typeof (user as any).updateMetadata === 'function') {
                (user as any).updateMetadata({ unsafeMetadata: { role: profile.role } }).catch(() => {});
              } else {
                user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: profile.role } }).catch(() => {});
              }
            }
          } catch (e) {
            console.error('Error checking profile role:', e);
          }
        }

        // 1. Block registered Managers
        if (role === 'manager' || role === 'admin') {
          if (Platform.OS === 'web') {
            window.alert('Access Denied: You are registered as a Manager. Please use the Manager App.');
          } else {
            Alert.alert('Access Denied', 'You are registered as a Manager. Please use the Manager App.');
          }
          signOut();
          return;
        }

        // 2. Automatically assign Driver role if user has no role yet (e.g. Google Sign-In or new registration)
        if (!role) {
          role = 'driver';
          if (typeof (user as any).updateMetadata === 'function') {
            await (user as any).updateMetadata({ unsafeMetadata: { role: 'driver' } }).catch(() => {});
          } else {
            await user.update({ unsafeMetadata: { ...user.unsafeMetadata, role: 'driver' } }).catch(() => {});
          }
        } else if (role !== 'driver') {
          if (Platform.OS === 'web') {
            window.alert('Access Denied: Your account does not have an assigned Driver role.');
          } else {
            Alert.alert('Access Denied', 'Your account does not have an assigned Driver role.');
          }
          signOut();
          return;
        }

        // 3. User is an authorized Driver - check profile completion
        const profileCompleted = user?.unsafeMetadata?.profileCompleted === true;

        if (!profileCompleted && !isCompletingProfile) {
          router.replace('/(auth)/complete-profile');
        } else if (profileCompleted && inAuthGroup) {
          router.replace('/(driver)/dashboard');
        }
      };

      verifyAndRoute();
    } else if (!isSignedIn && !inAuthGroup && !isPublic) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, segments, isAuthLoaded, isUserLoaded, router, user, signOut]);

  if (!isAuthLoaded || (isSignedIn && !isUserLoaded)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#043094" />
        <Text style={{ marginTop: 16, fontSize: 15, fontWeight: '600', color: '#1F2937' }}>
          Loading Aviance Driver...
        </Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <>
      <title>Aviance FleetDriver</title>
      <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <SafeAreaView style={{ flex: 1 }}>
          <InitialLayout />
        </SafeAreaView>
      </ClerkLoaded>
    </ClerkProvider>
    </>
  );
}
