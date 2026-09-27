import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
    >
      {children}
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  detail?: string;
  /** Drops the top margin for the first section under a screen title. */
  first?: boolean;
}

export function SectionHeader({ title, detail, first }: SectionHeaderProps) {
  return (
    <View style={[styles.section, first && styles.first]}>
      <AppText variant="label" tone="tertiary" uppercase accessibilityRole="header">
        {title}
      </AppText>
      {detail ? (
        <AppText variant="caption" tone="tertiary">
          {detail}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  section: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  first: { marginTop: 0 },
});
