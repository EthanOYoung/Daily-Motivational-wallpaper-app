import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

import { AppText } from '@/components/AppText';
import { ActionButton, Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Screen } from '@/components/Screen';
import { showToast } from '@/components/Toast';
import { WallpaperPreview } from '@/components/WallpaperPreview';
import { WallpaperStatus } from '@/components/WallpaperStatus';
import { getCategory } from '@/domain/categories';
import { formatDateKey } from '@/domain/dates';
import { getStyleInfo } from '@/domain/styles';
import { useAndroidStatus } from '@/hooks/useAndroidStatus';
import { useDayWallpaper } from '@/hooks/useDayWallpaper';
import { canSetWallpaper, setWallpaperNow } from '@/scheduling/android';
import { describeAndroidStatus, describeIosStatus } from '@/scheduling/statusText';
import { PermissionDeniedError, saveWallpaperToPhotos, shareWallpaper } from '@/services/share';
import { useClockStore } from '@/store/clock';
import { selectDay, useDailyStore } from '@/store/daily';
import { selectIsFavourite, useLibraryStore } from '@/store/library';
import { useSchedulingStore } from '@/store/scheduling';
import { useSettingsStore } from '@/store/settings';
import { spacing, useAppTheme } from '@/theme';
import { getScreenPixelSize } from '@/wallpaper/device';

type Busy = 'save' | 'share' | 'set' | null;

export default function TodayScreen() {
  const today = useClockStore((s) => s.today);
  const entry = useDailyStore(selectDay(today));
  const regenerate = useDailyStore((s) => s.regenerate);
  const wallpaper = useDayWallpaper(entry);
  const isFavourite = useLibraryStore(selectIsFavourite(entry?.quote.id));
  const toggleFavourite = useLibraryStore((s) => s.toggleFavourite);
  const { colors } = useAppTheme();
  const [busy, setBusy] = useState<Busy>(null);
  const settings = useSettingsStore(
    useShallow((s) => ({
      autoApply: s.autoApply,
      dailyTime: s.dailyTime,
      target: s.wallpaperTarget,
      saveToAlbum: s.saveToAlbum,
    }))
  );
  const savedToAlbumToday = useSchedulingStore((s) => !!s.albumSaves[today]);
  const { status: androidStatus, refresh: refreshAndroid } = useAndroidStatus();

  const window = useWindowDimensions();
  const screen = getScreenPixelSize();
  const aspectRatio = screen.width / screen.height;
  const previewWidth = Math.round(
    Math.min(window.width * 0.62, window.height * 0.56 * aspectRatio)
  );
  const ready = !!wallpaper.uri && !wallpaper.loading;

  const run = async (kind: Exclude<Busy, null>, action: () => Promise<void>) => {
    setBusy(kind);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const onRegenerate = () => {
    Haptics.selectionAsync().catch(() => {});
    regenerate(today);
  };

  const onFavourite = () => {
    if (!entry) return;
    const added = toggleFavourite(entry.quote);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    showToast(added ? 'Added to favourites' : 'Removed from favourites');
  };

  const onSave = () =>
    run('save', async () => {
      try {
        await saveWallpaperToPhotos(wallpaper.uri!, today);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showToast('Saved to Photos');
      } catch (error) {
        showToast(
          error instanceof PermissionDeniedError
            ? 'Allow photo access in Settings to save wallpapers'
            : "Couldn't save the wallpaper"
        );
      }
    });

  const onShare = () =>
    run('share', async () => {
      try {
        await shareWallpaper(wallpaper.uri!, today);
      } catch {
        showToast("Couldn't open the share sheet");
      }
    });

  const onSetNow = () =>
    run('set', async () => {
      try {
        await setWallpaperNow(wallpaper.uri!, today);
        refreshAndroid();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        showToast('Wallpaper set');
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Couldn't set the wallpaper");
      }
    });

  if (!entry) {
    return (
      <Screen title="Today" subtitle={formatDateKey(today)}>
        <Card>
          <AppText tone="secondary">Pick at least one category in Settings to get started.</AppText>
        </Card>
      </Screen>
    );
  }

  const historyButton = (
    <IconButton
      icon="time-outline"
      variant="secondary"
      accessibilityLabel="Past wallpapers"
      onPress={() => router.push('/history')}
    />
  );

  return (
    <Screen title="Today" subtitle={formatDateKey(today)} headerAccessory={historyButton}>
      <WallpaperPreview
        image={wallpaper.image}
        loading={wallpaper.loading}
        error={wallpaper.error}
        width={previewWidth}
        aspectRatio={aspectRatio}
        accessibilityLabel={`Today's wallpaper: ${entry.quote.text}${
          entry.quote.author ? ` — ${entry.quote.author}` : ''
        }`}
        accessibilityHint="Shows it full screen under a lock screen clock"
        onPress={() => router.push({ pathname: '/preview', params: { date: today } })}
      />
      <AppText variant="caption" tone="tertiary" style={styles.caption}>
        {getCategory(entry.quote.category).label} · {getStyleInfo(entry.styleId).name}
        {entry.quote.isCustom ? ' · Your quote' : ''}
        {entry.quote.source ? ` · ${entry.quote.source}` : ''}
      </AppText>

      <View style={styles.actions}>
        <ActionButton label="New quote" icon="refresh" onPress={onRegenerate} />
        <ActionButton
          label="Favourite"
          icon={isFavourite ? 'heart' : 'heart-outline'}
          onPress={onFavourite}
          active={isFavourite}
          activeColor={colors.heart}
        />
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

      {Platform.OS === 'android' ? (
        <WallpaperStatus
          icon={
            androidStatus?.lastAppliedDate === today ? 'checkmark-circle-outline' : 'time-outline'
          }
          text={describeAndroidStatus(androidStatus, {
            today,
            now: new Date(),
            autoApply: settings.autoApply,
            dailyTime: settings.dailyTime,
            target: settings.target,
          })}
        >
          {canSetWallpaper ? (
            <Button
              size="small"
              variant="secondary"
              label="Set it now"
              icon="phone-portrait-outline"
              onPress={onSetNow}
              disabled={!ready}
              loading={busy === 'set'}
            />
          ) : null}
        </WallpaperStatus>
      ) : null}

      {Platform.OS === 'ios' ? (
        <WallpaperStatus
          icon="flash-outline"
          text={describeIosStatus({ saveToAlbum: settings.saveToAlbum, savedToAlbumToday })}
        >
          <Button
            size="small"
            variant="secondary"
            label="How to set it up"
            icon="book-outline"
            onPress={() => router.push('/shortcut-guide')}
          />
        </WallpaperStatus>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  caption: { textAlign: 'center', marginTop: spacing.md },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
