import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import type { StatusText } from '@/scheduling/statusText';
import { spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';

interface WallpaperStatusProps {
  text: StatusText;
  icon: 'time-outline' | 'checkmark-circle-outline' | 'phone-portrait-outline' | 'flash-outline';
  children?: React.ReactNode;
}

/** Small card under the preview explaining when and how the wallpaper changes. */
export function WallpaperStatus({ text, icon, children }: WallpaperStatusProps) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Ionicons name={icon} size={20} color={colors.accent} style={styles.icon} />
        <View style={styles.text}>
          <AppText variant="heading">{text.title}</AppText>
          {text.detail ? (
            <AppText variant="callout" tone="secondary">
              {text.detail}
            </AppText>
          ) : null}
          {text.warning ? (
            <AppText variant="caption" tone="danger">
              {text.warning}
            </AppText>
          ) : null}
        </View>
      </View>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xxl, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  icon: { marginTop: 1 },
  text: { flex: 1, gap: spacing.xs },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
