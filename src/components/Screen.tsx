import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Extra element aligned with the title, e.g. an icon button. */
  headerAccessory?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: ViewStyle;
}

export function Screen({
  title,
  subtitle,
  headerAccessory,
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: ScreenProps) {
  const { colors } = useAppTheme();

  const header = title ? (
    <View style={styles.header}>
      <View style={styles.headerText}>
        {subtitle ? (
          <AppText variant="label" tone="tertiary" uppercase>
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="display" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {headerAccessory}
    </View>
  ) : null;

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>
          {header}
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerText: { flex: 1, gap: spacing.xs },
});
