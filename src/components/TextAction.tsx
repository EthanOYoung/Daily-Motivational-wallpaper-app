import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface TextActionProps {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  tone?: 'accent' | 'secondary' | 'danger' | 'heart';
  accessibilityLabel?: string;
}

/** A small inline action (icon + label) for cards and list items. */
export function TextAction({
  label,
  icon,
  onPress,
  tone = 'accent',
  accessibilityLabel,
}: TextActionProps) {
  const { colors } = useAppTheme();
  const color =
    tone === 'heart'
      ? colors.heart
      : tone === 'danger'
        ? colors.danger
        : tone === 'secondary'
          ? colors.textSecondary
          : colors.accent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.root, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      {icon ? <Ionicons name={icon} size={17} color={color} /> : null}
      <AppText variant="callout" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
});
