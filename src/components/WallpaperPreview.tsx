import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Canvas,
  Group,
  Image as SkiaImage,
  rect,
  rrect,
  type SkImage,
} from '@shopify/react-native-skia';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface WallpaperPreviewProps {
  image: SkImage | null;
  loading: boolean;
  error?: Error | null;
  width: number;
  /** Screen width divided by height. */
  aspectRatio: number;
  accessibilityLabel: string;
  /** Makes the preview tappable, e.g. to open it full screen. */
  onPress?: () => void;
  accessibilityHint?: string;
}

/** The day's wallpaper shown inside a phone-shaped frame. */
export function WallpaperPreview({
  image,
  loading,
  error,
  width,
  aspectRatio,
  accessibilityLabel,
  onPress,
  accessibilityHint,
}: WallpaperPreviewProps) {
  const { colors } = useAppTheme();
  const height = Math.round(width / aspectRatio);
  const radius = width * 0.1;
  // Clip inside Skia so the corners stay rounded on every platform.
  const clip = rrect(rect(0, 0, width, height), radius, radius);

  const frame = {
    width: width + 12,
    height: height + 12,
    borderRadius: radius + 6,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };
  const content = (
    <View style={{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt }}>
      {image ? (
        <Canvas style={{ width, height }}>
          <Group clip={clip}>
            <SkiaImage image={image} x={0} y={0} width={width} height={height} fit="cover" />
          </Group>
        </Canvas>
      ) : null}
      {loading || error ? (
        <View style={[StyleSheet.absoluteFill, styles.center]}>
          {error ? (
            <AppText variant="caption" tone="danger" style={styles.error}>
              {"Couldn't draw this wallpaper. Try a new quote."}
            </AppText>
          ) : (
            <ActivityIndicator color={colors.accent} />
          )}
        </View>
      ) : null}
      {onPress && image ? (
        <View style={styles.expand}>
          <Ionicons name="expand-outline" size={15} color="#fff" />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        style={[styles.frame, frame]}
      >
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.frame, frame, { opacity: pressed ? 0.85 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  error: { textAlign: 'center', paddingHorizontal: spacing.lg },
  expand: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
});
