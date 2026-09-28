import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface ToastState {
  message: string | null;
  id: number;
  show: (message: string) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>()((set) => ({
  message: null,
  id: 0,
  show: (message) => set((s) => ({ message, id: s.id + 1 })),
  hide: () => set({ message: null }),
}));

/** Shows a short, self-dismissing message at the bottom of the screen. */
export function showToast(message: string) {
  useToastStore.getState().show(message);
  // Screen readers don't notice a view appearing, so read the message out.
  AccessibilityInfo.announceForAccessibility(message);
}

/** Renders the current toast; mount once near the root. */
export function ToastHost() {
  const { message, id, hide } = useToastStore();
  const { colors, scheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() =>
        hide()
      );
    }, 2600);
    return () => clearTimeout(timer);
  }, [id, message, hide, opacity]);

  if (!message) return null;
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + 72,
          opacity,
          backgroundColor: scheme === 'dark' ? colors.surfaceAlt : colors.text,
        },
      ]}
    >
      <AppText
        variant="callout"
        style={{ color: scheme === 'dark' ? colors.text : colors.surface }}
      >
        {message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '88%',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
});
