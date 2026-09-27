import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  size?: 'regular' | 'small';
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  accessibilityHint,
  size = 'regular',
}: ButtonProps) {
  const { colors } = useAppTheme();
  const background =
    variant === 'primary'
      ? colors.accent
      : variant === 'secondary'
        ? colors.surface
        : 'transparent';
  const foreground = variant === 'primary' ? colors.onAccent : colors.accent;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'small' && styles.small,
        {
          backgroundColor: background,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          opacity: inactive ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={foreground} size="small" />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={foreground} />
        ) : null}
        <AppText variant={size === 'small' ? 'callout' : 'heading'} style={{ color: foreground }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

interface ActionButtonProps {
  label: string;
  icon: IconName;
  onPress: () => void;
  active?: boolean;
  activeColor?: string;
  disabled?: boolean;
  busy?: boolean;
}

/** Round icon button with a caption, used for the Today screen actions. */
export function ActionButton({
  label,
  icon,
  onPress,
  active,
  activeColor,
  disabled,
  busy,
}: ActionButtonProps) {
  const { colors } = useAppTheme();
  const tint = active ? (activeColor ?? colors.accent) : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, selected: !!active, busy: !!busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={({ pressed }) => [styles.action, { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 }]}
    >
      <View
        style={[
          styles.actionCircle,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.accent} size="small" />
        ) : (
          <Ionicons name={icon} size={22} color={tint} />
        )}
      </View>
      <AppText variant="caption" tone="secondary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: radii.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: { minHeight: 38, paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  action: { alignItems: 'center', gap: spacing.xs, minWidth: 64 },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
