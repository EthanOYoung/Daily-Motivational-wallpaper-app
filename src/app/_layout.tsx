import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';

import { ToastHost } from '@/components/Toast';
import { useDayTicker } from '@/hooks/useDayTicker';
import { usePlanSync } from '@/hooks/usePlanSync';
import { useWallpaperPipeline } from '@/hooks/useWallpaperPipeline';
import { useStoresHydrated } from '@/store/hydration';
import { useAppTheme } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppEffects() {
  useDayTicker();
  usePlanSync();
  useWallpaperPipeline();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Lora_400Regular: require('../../assets/fonts/Lora_400Regular.ttf'),
    Lora_400Regular_Italic: require('../../assets/fonts/Lora_400Regular_Italic.ttf'),
    Lora_600SemiBold: require('../../assets/fonts/Lora_600SemiBold.ttf'),
  });
  const hydrated = useStoresHydrated();
  const { scheme, colors } = useAppTheme();
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.accent,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [scheme, colors]);

  if (!ready) return null;

  const headerOptions = {
    headerShown: true,
    headerBackTitle: 'Back',
    headerTintColor: colors.accent,
    headerTitleStyle: { color: colors.text },
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppEffects />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="shortcut-guide"
          options={{ ...headerOptions, title: 'Automatic wallpaper' }}
        />
        <Stack.Screen
          name="quote-editor"
          options={{ ...headerOptions, title: 'New quote', presentation: 'modal' }}
        />
      </Stack>
      <ToastHost />
    </ThemeProvider>
  );
}
