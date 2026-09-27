import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { AppText } from '@/components/AppText';
import { ActionButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { WallpaperPreview } from '@/components/WallpaperPreview';
import { getCategory } from '@/domain/categories';
import { formatDateKey } from '@/domain/dates';
import { getStyleInfo } from '@/domain/styles';
import { useDayWallpaper } from '@/hooks/useDayWallpaper';
import { PermissionDeniedError, saveWallpaperToPhotos, shareWallpaper } from '@/services/share';
import { useClockStore } from '@/store/clock';
import { selectDay, useDailyStore } from '@/store/daily';
import { spacing } from '@/theme';
import { getScreenPixelSize } from '@/wallpaper/device';

export default function TodayScreen() {
  const today = useClockStore((s) => s.today);
  const entry = useDailyStore(selectDay(today));
  const regenerate = useDailyStore((s) => s.regenerate);
  const wallpaper = useDayWallpaper(entry);
  const [busy, setBusy] = useState<'save' | 'share' | null>(null);

  const window = useWindowDimensions();
  const screen = getScreenPixelSize();
  const aspectRatio = screen.width / screen.height;
  const previewWidth = Math.round(
    Math.min(window.width * 0.62, window.height * 0.56 * aspectRatio)
  );
  const ready = !!wallpaper.uri && !wallpaper.loading;

  const onRegenerate = () => {
    Haptics.selectionAsync().catch(() => {});
    regenerate(today);
  };

  const onSave = async () => {
    if (!wallpaper.uri) return;
    setBusy('save');
    try {
      await saveWallpaperToPhotos(wallpaper.uri, today);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      showToast('Saved to Photos');
    } catch (error) {
      showToast(
        error instanceof PermissionDeniedError
          ? 'Allow photo access in Settings to save wallpapers'
          : "Couldn't save the wallpaper"
      );
    } finally {
      setBusy(null);
    }
  };

  const onShare = async () => {
    if (!wallpaper.uri) return;
    setBusy('share');
    try {
      await shareWallpaper(wallpaper.uri, today);
    } catch {
      showToast("Couldn't open the share sheet");
    } finally {
      setBusy(null);
    }
  };

  if (!entry) {
    return (
      <Screen title="Today" subtitle={formatDateKey(today)}>
        <Card>
          <AppText tone="secondary">Pick at least one category in Settings to get started.</AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Today" subtitle={formatDateKey(today)}>
      <WallpaperPreview
        image={wallpaper.image}
        loading={wallpaper.loading}
        error={wallpaper.error}
        width={previewWidth}
        aspectRatio={aspectRatio}
        accessibilityLabel={`Today's wallpaper: ${entry.quote.text} — ${entry.quote.author}`}
      />
      <AppText variant="caption" tone="tertiary" style={styles.caption}>
        {getCategory(entry.quote.category).label} · {getStyleInfo(entry.styleId).name}
        {entry.quote.source ? ` · ${entry.quote.source}` : ''}
      </AppText>

      <View style={styles.actions}>
        <ActionButton label="New quote" icon="refresh" onPress={onRegenerate} />
        <ActionButton
          label="Save"
          icon="download-outline"
          onPress={onSave}
          disabled={!ready}
          busy={busy === 'save'}
        />
        <ActionButton
          label="Share"
          icon="share-outline"
          onPress={onShare}
          disabled={!ready}
          busy={busy === 'share'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { textAlign: 'center', marginTop: spacing.md },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.xl,
  },
});
