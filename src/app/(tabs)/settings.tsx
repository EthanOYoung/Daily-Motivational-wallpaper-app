import Constants from 'expo-constants';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card, SectionHeader } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { buildQuotePool, countQuotesByCategory } from '@/domain/quotes';
import { useSettingsStore, type ThemePreference } from '@/store/settings';
import type { TextPosition } from '@/wallpaper/draw';
import { spacing } from '@/theme';

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const POSITION_OPTIONS = [
  { value: 'lower', label: 'Lower third' },
  { value: 'center', label: 'Middle' },
] as const satisfies readonly { value: TextPosition; label: string }[];

export default function SettingsScreen() {
  const selected = useSettingsStore((s) => s.selectedCategories);
  const toggleCategory = useSettingsStore((s) => s.toggleCategory);
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const textPosition = useSettingsStore((s) => s.textPosition);
  const setTextPosition = useSettingsStore((s) => s.setTextPosition);

  const counts = useMemo(() => countQuotesByCategory(), []);
  const poolSize = useMemo(() => buildQuotePool(selected).length, [selected]);

  return (
    <Screen title="Settings">
      <SectionHeader first title="Categories" detail={`${poolSize} quotes in rotation`} />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Quotes only come from the categories you pick. None repeat until every one of them has been
        shown.
      </AppText>
      <CategoryPicker selected={selected} onToggle={toggleCategory} counts={counts} />

      <SectionHeader title="Wallpaper" />
      <AppText variant="caption" tone="secondary" style={styles.hint}>
        Where the quote sits. Both keep it clear of the lock screen clock and widgets.
      </AppText>
      <SegmentedControl
        accessibilityLabel="Text position"
        options={POSITION_OPTIONS}
        value={textPosition}
        onChange={setTextPosition}
      />

      <SectionHeader title="Appearance" />
      <SegmentedControl
        accessibilityLabel="Theme"
        options={THEME_OPTIONS}
        value={themePreference}
        onChange={setThemePreference}
      />

      <SectionHeader title="About" />
      <Card>
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
});
