import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Canvas,
  Group,
  Image as SkiaImage,
  rect,
  rrect,
  type SkImage,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, PixelRatio, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { showToast } from '@/components/Toast';
import { getCategory } from '@/domain/categories';
import { describePastDate } from '@/domain/dates';
import type { DayEntry } from '@/domain/plan';
import { isStyleId } from '@/domain/styles';
import type { DateKey } from '@/domain/types';
import { NO_TEXT, useStyleThumbnails } from '@/hooks/useStyleThumbnails';
import { useClockStore } from '@/store/clock';
import { useDailyStore } from '@/store/daily';
import { selectIsFavourite, useLibraryStore } from '@/store/library';
import { radii, spacing, useAppTheme } from '@/theme';
import { getScreenPixelSize } from '@/wallpaper/device';

const SWATCH_WIDTH = 44;

function Swatch({ image, height }: { image: SkImage | null; height: number }) {
  const { colors } = useAppTheme();
  const radius = 8;
  return (
    <View
      style={[
        styles.swatch,
        {
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceAlt,
          borderColor: colors.border,
        },
      ]}
    >
      {image ? (
        <Canvas style={{ width: SWATCH_WIDTH, height }}>
          <Group clip={rrect(rect(0, 0, SWATCH_WIDTH, height), radius, radius)}>
            <SkiaImage image={image} x={0} y={0} width={SWATCH_WIDTH} height={height} fit="cover" />
          </Group>
        </Canvas>
      ) : null}
    </View>
  );
}

interface RowProps {
  entry: DayEntry;
  today: DateKey;
  swatch: SkImage | null;
  swatchHeight: number;
}

function HistoryRow({ entry, today, swatch, swatchHeight }: RowProps) {
  const { colors } = useAppTheme();
  const isFavourite = useLibraryStore(selectIsFavourite(entry.quote.id));
  const toggleFavourite = useLibraryStore((s) => s.toggleFavourite);
  const when = describePastDate(entry.date, today);
  const author = entry.quote.author.trim();
  const category = getCategory(entry.quote.category).label;

  const onFavourite = () => {
    const added = toggleFavourite(entry.quote);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast(added ? 'Added to favourites' : 'Removed from favourites');
  };

  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={[when, entry.quote.text, author].filter(Boolean).join('. ')}
        accessibilityHint="Shows that day's wallpaper full screen"
        onPress={() => router.push({ pathname: '/preview', params: { date: entry.date } })}
        style={({ pressed }) => [styles.main, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Swatch image={swatch} height={swatchHeight} />
        <View style={styles.text}>
          <AppText variant="label" tone="tertiary" uppercase>
            {when}
          </AppText>
          <AppText variant="quote" style={styles.quote} numberOfLines={4}>
            {entry.quote.text}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {author ? `— ${author} · ${category}` : category}
          </AppText>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Favourite"
        accessibilityState={{ selected: isFavourite }}
        onPress={onFavourite}
        hitSlop={10}
        style={styles.heart}
      >
        <Ionicons
          name={isFavourite ? 'heart' : 'heart-outline'}
          size={22}
          color={isFavourite ? colors.heart : colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

/** Past days' quotes, newest first. Tap one to see its wallpaper again. */
export default function HistoryScreen() {
  const { colors } = useAppTheme();
  const today = useClockStore((s) => s.today);
  const days = useDailyStore((s) => s.days);
  const past = useMemo(() => days.filter((d) => d.date < today).reverse(), [days, today]);

  const screen = getScreenPixelSize();
  const swatchHeight = Math.round((SWATCH_WIDTH * screen.height) / screen.width);
  const scale = PixelRatio.get();
  const swatches = useStyleThumbnails(
    Math.round(SWATCH_WIDTH * scale),
    Math.round(swatchHeight * scale),
    'lower',
    NO_TEXT
  );

  return (
    <FlatList
      data={past}
      keyExtractor={(entry) => entry.date}
      renderItem={({ item }) => (
        <HistoryRow
          entry={item}
          today={today}
          swatch={(isStyleId(item.styleId) && swatches[item.styleId]) || null}
          swatchHeight={swatchHeight}
        />
      )}
      ItemSeparatorComponent={Separator}
      ListEmptyComponent={
        <EmptyState
          icon="time-outline"
          title="No past wallpapers yet"
          message="Each day's quote is kept here, so you can look back or keep one you loved."
        />
      }
      ListFooterComponent={
        past.length ? (
          <AppText variant="caption" tone="tertiary" style={styles.footer}>
            The last {past.length === 1 ? 'day is' : `${past.length} days are`} kept on this device,
            up to about a year.
          </AppText>
        ) : null
      }
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl * 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingLeft: spacing.md,
  },
  main: { flex: 1, flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md },
  swatch: { width: SWATCH_WIDTH, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  text: { flex: 1, gap: spacing.xs },
  quote: { fontSize: 17, lineHeight: 24 },
  heart: { padding: spacing.md },
  separator: { height: spacing.md },
  footer: { textAlign: 'center', marginTop: spacing.xl },
});
