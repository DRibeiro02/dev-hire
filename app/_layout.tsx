import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/src/supabase';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [estaLogado, setEstaLogado] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEstaLogado(!!data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEstaLogado(!!session);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (estaLogado === null) return;

    const noApp = segments[0] === '(tabs)';

    if (!estaLogado && noApp) {
      router.replace('/');
    } else if (estaLogado && !noApp) {
      router.replace('/(tabs)/feed');
    }
  }, [estaLogado, segments, router]);

  if (estaLogado === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0E17', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#00D1FF" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}