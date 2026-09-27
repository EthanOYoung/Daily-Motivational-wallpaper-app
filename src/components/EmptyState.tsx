import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface EmptyStateProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon, title, message, children }: EmptyStateProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.root}>
      <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
        <Ionicons name={icon} size={28} color={colors.accent} />
      </View>
      <AppText variant="title" style={styles.center}>
        {title}
      </AppText>
      <AppText variant="callout" tone="secondary" style={styles.center}>
        {message}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxxl * 1.5 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center', maxWidth: 300 },
});
