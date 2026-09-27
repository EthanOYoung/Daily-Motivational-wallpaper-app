import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

/** A card holding settings rows separated by hairlines. */
export function ListGroup({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          ) : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

interface ListRowProps {
  label: string;
  detail?: string;
  value?: string;
  onPress?: () => void;
  /** Custom control shown on the right, e.g. a picker. */
  accessory?: ReactNode;
  tone?: 'primary' | 'danger' | 'accent';
  accessibilityHint?: string;
}

export function ListRow({
  label,
  detail,
  value,
  onPress,
  accessory,
  tone = 'primary',
  accessibilityHint,
}: ListRowProps) {
  const { colors } = useAppTheme();
  const content = (
    <>
      <View style={styles.text}>
        <AppText variant="body" tone={tone}>
          {label}
        </AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="body" tone="secondary">
          {value}
        </AppText>
      ) : null}
      {accessory}
      {onPress && !accessory ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      ) : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      {content}
    </Pressable>
  );
}

interface SwitchRowProps {
  label: string;
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function SwitchRow({ label, detail, value, onValueChange, disabled }: SwitchRowProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="body">{label}</AppText>
        {detail ? (
          <AppText variant="caption" tone="secondary">
            {detail}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.accent, false: colors.surfaceAlt }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={colors.surfaceAlt}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  text: { flex: 1, gap: 2 },
});
