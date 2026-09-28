import Ionicons from '@expo/vector-icons/Ionicons';
import { Canvas, Group, Image as SkiaImage, rect, rrect } from '@shopify/react-native-skia';
import {
  ActivityIndicator,
  PixelRatio,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { STYLES, type StyleId } from '@/domain/styles';
import { useStyleThumbnails } from '@/hooks/useStyleThumbnails';
import { radii, spacing, useAppTheme } from '@/theme';
import { getScreenPixelSize } from '@/wallpaper/device';
import type { TextPosition } from '@/wallpaper/draw';

import { AppText } from './AppText';

interface StylePickerProps {
  enabled: readonly StyleId[];
  onToggle: (id: StyleId) => void;
  textPosition: TextPosition;
}

const THUMB_WIDTH = 92;

/** Horizontal row of background styles, each drawn as a small wallpaper, toggled on tap. */
export function StylePicker({ enabled, onToggle, textPosition }: StylePickerProps) {
  const { colors } = useAppTheme();
  const screen = getScreenPixelSize();
  const thumbHeight = Math.round((THUMB_WIDTH * screen.height) / screen.width);
  const scale = PixelRatio.get();
  const images = useStyleThumbnails(
    Math.round(THUMB_WIDTH * scale),
    Math.round(thumbHeight * scale),
    textPosition
  );
  const radius = 14;
  const clip = rrect(rect(0, 0, THUMB_WIDTH, thumbHeight), radius, radius);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {STYLES.map((style) => {
        const on = enabled.includes(style.id);
        const locked = on && enabled.length === 1;
        const image = images[style.id];
        return (
          <Pressable
            key={style.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={`${style.name} background`}
            accessibilityHint={
              locked ? 'At least one background has to stay on' : style.description
            }
            onPress={() => onToggle(style.id)}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View
              style={[
                styles.frame,
                {
                  borderRadius: radius + 4,
                  borderColor: on ? colors.accent : 'transparent',
                },
              ]}
            >
              <View
                style={{
                  width: THUMB_WIDTH,
                  height: thumbHeight,
                  borderRadius: radius,
                  backgroundColor: colors.surfaceAlt,
                  opacity: on ? 1 : 0.4,
                }}
              >
                {image ? (
                  <Canvas style={{ width: THUMB_WIDTH, height: thumbHeight }}>
                    <Group clip={clip}>
                      <SkiaImage
                        image={image}
                        x={0}
                        y={0}
                        width={THUMB_WIDTH}
                        height={thumbHeight}
                        fit="cover"
                      />
                    </Group>
                  </Canvas>
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.center]}>
                    <ActivityIndicator color={colors.accent} size="small" />
                  </View>
                )}
              </View>
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={on ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={on ? colors.accent : colors.textTertiary}
                />
              </View>
            </View>
            <AppText
              variant="caption"
              tone={on ? 'primary' : 'tertiary'}
              maxFontSizeMultiplier={1.4}
            >
              {style.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Bleed to the screen edges so the row scrolls under the page margins.
  scroller: { marginHorizontal: -spacing.xl },
  row: { paddingHorizontal: spacing.xl, gap: spacing.md },
  item: { alignItems: 'center', gap: spacing.sm },
  frame: { borderWidth: 2, padding: 2 },
  center: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: radii.pill,
  },
});
