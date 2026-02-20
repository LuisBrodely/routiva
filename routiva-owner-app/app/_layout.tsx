import '@/global.css';

import { SessionSync } from '@/lib/auth/session-sync';
import { NAV_THEME } from '@/lib/theme';
import { queryClient } from '@/lib/query/query-client';
import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';


export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
          <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <SessionSync />
            <Stack screenOptions={{ headerShown: false }} />
            <PortalHost />
          </SafeAreaView>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
