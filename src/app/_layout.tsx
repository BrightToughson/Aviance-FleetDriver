import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

function InitialLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inTabsGroup = segments[0] === '(driver)';

    setTimeout(() => {
      // Auth is bypassed for development. Always go to the dashboard!
      if (!inTabsGroup) {
        console.log('[Router] Bypassing Auth -> Redirecting to dashboard');
        router.replace('/(driver)/dashboard');
      }
    }, 100);
  }, [segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <InitialLayout />
    </SafeAreaView>
  );
}
