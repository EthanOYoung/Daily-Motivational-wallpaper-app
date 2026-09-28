import Ionicons from '@expo/vector-icons/Ionicons';
import { Canvas, Image as SkiaImage } from '@shopify/react-native-skia';
import { getCalendars } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { formatClockTime, formatDateKey } from '@/domain/dates';
import type { DateKey } from '@/domain/types';
import { useDayWallpaper } from '@/hooks/useDayWallpaper';
import { useClockStore } from '@/store/clock';
import { selectDay, useDailyStore } from '@/store/daily';
import { parseHex, relativeLuminance } from '@/wallpaper/color';
import { getWallpaperStyle } from '@/wallpaper/styles';

function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

/** Fades the "tap to close" hint out after a moment (at once with Reduce Motion on). */
function useFadingHint(): Animated.Value {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;
      if (reduceMotion) opacity.setValue(0);
      else Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start();
    }, 2500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [opacity]);
  return opacity;
}

/** The day's wallpaper full screen, with a lock screen clock on top to show the quote clears it. */
export default function PreviewScreen() {
  const params = useLocalSearchParams<{ date?: string }>();
  const today = useClockStore((s) => s.today);
  const date: DateKey = params.date ?? today;
  const entry = useDailyStore(selectDay(date));
  const wallpaper = useDayWallpaper(entry);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const now = useNow(15_000);
  const hintOpacity = useFadingHint();

  const style = getWallpaperStyle(entry?.styleId ?? 'dawn');
  const color = style.quoteColor;
  const lightText = relativeLuminance(parseHex(color)) > 0.5;
  const uses24Hour = getCalendars()[0]?.uses24hourClock ?? false;
  const clockSize = Math.round(window.width * 0.23);
  const shadow = lightText ? styles.shadow : null;
  const close = () => router.back();

  return (
    <Pressable
      onPress={close}
      accessibilityRole="button"
      accessibilityLabel={
        entry
          ? `Full-screen wallpaper preview: ${entry.quote.text}`
          : 'Full-screen wallpaper preview'
      }
      accessibilityHint="Closes the preview"
      // Dark wallpapers use light text; match that while the image loads.
      style={[styles.root, { backgroundColor: lightText ? '#000' : '#fff' }]}
    >
      <StatusBar style={lightText ? 'light' : 'dark'} />
      {wallpaper.image ? (
        <Canvas style={StyleSheet.absoluteFill}>
          <SkiaImage
            image={wallpaper.image}
            x={0}
            y={0}
            width={window.width}
            height={window.height}
            fit="cover"
          />
        </Canvas>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          <ActivityIndicator color={color} />
        </View>
      )}

      <View
        pointerEvents="none"
        style={[styles.clock, { top: insets.top + (Platform.OS === 'ios' ? 24 : 48) }]}
      >
        <AppText style={[styles.date, shadow, { color }]}>
          {formatDateKey(date, { weekday: 'long', day: 'numeric', month: 'long' })}
        </AppText>
        <AppText
          style={[
            styles.time,
            shadow,
            {
              color,
              fontSize: clockSize,
              lineHeight: Math.round(clockSize * 1.12),
              fontWeight: Platform.OS === 'ios' ? '600' : '300',
            },
          ]}
        >
          {formatClockTime(now, uses24Hour)}
        </AppText>
      </View>

      {Platform.OS === 'ios' ? (
        <View pointerEvents="none" style={[styles.corners, { bottom: insets.bottom + 28 }]}>
          {(['flashlight', 'camera'] as const).map((icon) => (
            <View
              key={icon}
              style={[
                styles.cornerButton,
                { backgroundColor: lightText ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.45)' },
              ]}
            >
              <Ionicons name={icon} size={22} color={color} />
            </View>
          ))}
        </View>
      ) : null}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.hint,
          {
            bottom: insets.bottom + (Platform.OS === 'ios' ? 96 : 40),
            opacity: hintOpacity,
            backgroundColor: lightText ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)',
          },
        ]}
      >
        <AppText variant="caption" style={{ color }}>
          Tap anywhere to close
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  clock: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  date: { fontSize: 19, lineHeight: 24, fontWeight: '600' },
  time: { letterSpacing: -1, marginTop: 2 },
  shadow: {
    textShadowColor: 'rgba(0,0,0,0.18)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  corners: {
    position: 'absolute',
    left: 46,
    right: 46,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cornerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
});
