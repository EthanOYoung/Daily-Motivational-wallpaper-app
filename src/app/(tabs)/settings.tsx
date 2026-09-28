import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Linking, Platform, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card, SectionHeader } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ListGroup, ListRow, SwitchRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StylePicker } from '@/components/StylePicker';
import { TimeRow } from '@/components/TimeRow';
import { showToast } from '@/components/Toast';
import { buildQuotePool, countQuotesByCategory } from '@/domain/quotes';
import { STYLES, type StyleId } from '@/domain/styles';
import { useAndroidStatus } from '@/hooks/useAndroidStatus';
import { requestAlbumAccess } from '@/scheduling/album';
import { canSetWallpaper, openExactAlarmSettings } from '@/scheduling/android';
import { useSettingsStore, type ThemePreference } from '@/store/settings';
import { spacing } from '@/theme';
import type { TextPosition } from '@/wallpaper/draw';

import type { WallpaperTarget } from '../../../modules/daily-wallpaper';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const POSITION_OPTIONS = [
  { value: 'lower', label: 'Lower third' },
  { value: 'center', label: 'Middle' },
] as const satisfies readonly { value: TextPosition; label: string }[];

const TARGET_OPTIONS = [
  { value: 'lock', label: 'Lock screen' },
  { value: 'home', label: 'Home screen' },
  { value: 'both', label: 'Both' },
] as const satisfies readonly { value: WallpaperTarget; label: string }[];

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const { status } = useAndroidStatus();

  const counts = useMemo(() => countQuotesByCategory(), []);
  const poolSize = useMemo(
    () => buildQuotePool(settings.selectedCategories).length,
    [settings.selectedCategories]
  );

  const onToggleAlbum = async (enabled: boolean) => {
    if (!enabled) {
      settings.setSaveToAlbum(false);
      return;
    }
    const access = await requestAlbumAccess();
    if (access === 'full') {
      settings.setSaveToAlbum(true);
      return;
    }
    showToast(
      access === 'limited'
        ? 'Choose “Full Access” so the app can keep its own album'
        : 'Allow photo access in Settings to use the album'
    );
    Linking.openSettings().catch(() => {});
  };

  const onToggleStyle = (id: StyleId) => {
    if (settings.enabledStyles.length === 1 && settings.enabledStyles[0] === id) {
      showToast('Keep at least one background on');
      return;
    }
    Haptics.selectionAsync().catch(() => {});
    settings.toggleStyle(id);
  };

  const needsExactAccess =
    Platform.OS === 'android' &&
    settings.autoApply &&
    !!status?.exactAlarmSettingsAvailable &&
    !status.canScheduleExactAlarms;

  return (
    <Screen title="Settings">
      <SectionHeader first title="Categories" detail={`${poolSize} quotes in rotation`} />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Quotes only come from the categories you pick. None repeat until every one of them has been
        shown.
      </AppText>
      <CategoryPicker
        selected={settings.selectedCategories}
        onToggle={settings.toggleCategory}
        counts={counts}
      />

      <SectionHeader title="Daily wallpaper" />
      <ListGroup>
        <TimeRow
          label="Change time"
          detail="When the new wallpaper takes over each day"
          value={settings.dailyTime}
          onChange={settings.setDailyTime}
        />
        {Platform.OS === 'android' ? (
          <SwitchRow
            label="Set wallpaper automatically"
            detail={
              canSetWallpaper
                ? 'Changes your wallpaper at the time above'
                : 'Needs the development build (not available in Expo Go)'
            }
            value={settings.autoApply && canSetWallpaper}
            onValueChange={settings.setAutoApply}
            disabled={!canSetWallpaper}
          />
        ) : null}
        {Platform.OS === 'ios' ? (
          <ListRow
            label="Set up automatic wallpaper"
            detail="A one-time Shortcuts automation"
            onPress={() => router.push('/shortcut-guide')}
          />
        ) : null}
        {Platform.OS === 'ios' ? (
          <SwitchRow
            label="Save to Photos album"
            detail="Adds each day's wallpaper to the “Daily Quote Wallpaper” album"
            value={settings.saveToAlbum}
            onValueChange={onToggleAlbum}
          />
        ) : null}
      </ListGroup>

      {Platform.OS === 'android' ? (
        <>
          <AppText variant="caption" tone="secondary" style={styles.subhint}>
            Show the quote on
          </AppText>
          <SegmentedControl
            accessibilityLabel="Screens to set"
            options={TARGET_OPTIONS}
            value={settings.wallpaperTarget}
            onChange={settings.setWallpaperTarget}
          />
        </>
      ) : null}

      {needsExactAccess ? (
        <Card style={styles.notice}>
          <AppText variant="callout" tone="secondary">
            Exact timing is off, so Android may change the wallpaper a few minutes late. Allow
            “Alarms & reminders” to change it right on time.
          </AppText>
          <Button
            size="small"
            variant="secondary"
            label="Allow exact timing"
            icon="alarm-outline"
            onPress={() => void openExactAlarmSettings()}
          />
        </Card>
      ) : null}

      <SectionHeader title="Wallpaper" />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Where the quote sits. Both keep it clear of the lock screen clock and widgets.
      </AppText>
      <SegmentedControl
        accessibilityLabel="Text position"
        options={POSITION_OPTIONS}
        value={settings.textPosition}
        onChange={settings.setTextPosition}
      />

      <SectionHeader
        title="Backgrounds"
        detail={`${settings.enabledStyles.length} of ${STYLES.length} in rotation`}
      />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Each day uses the next background that&apos;s on. Tap one to turn it off or on.
      </AppText>
      <StylePicker
        enabled={settings.enabledStyles}
        onToggle={onToggleStyle}
        textPosition={settings.textPosition}
      />

      <SectionHeader title="Appearance" />
      <SegmentedControl
        accessibilityLabel="Theme"
        options={THEME_OPTIONS}
        value={settings.themePreference}
        onChange={settings.setThemePreference}
      />

      <SectionHeader title="About" />
      <ListGroup>
        <ListRow
          label="Show the introduction again"
          detail="Walks through themes, time and set-up"
          onPress={() => settings.setOnboarded(false)}
        />
      </ListGroup>
      <Card style={styles.about}>
        <AppText variant="callout" tone="secondary">
          Daily Quote Wallpaper {Constants.expoConfig?.version ?? ''}. Quotes come mainly from
          public-domain works, traditional proverbs and public speeches, each credited to its
          author. Everything you choose stays on this device.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  subhint: { marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  notice: { marginTop: spacing.lg, gap: spacing.md },
  about: { marginTop: spacing.md },
});
