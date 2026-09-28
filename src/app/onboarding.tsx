import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CategoryPicker } from '@/components/CategoryPicker';
import { ListGroup } from '@/components/ListGroup';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextAction } from '@/components/TextAction';
import { TimeRow } from '@/components/TimeRow';
import { WallpaperPreview } from '@/components/WallpaperPreview';
import { CATEGORIES } from '@/domain/categories';
import { buildQuotePool, countQuotesByCategory } from '@/domain/quotes';
import { useDayWallpaper } from '@/hooks/useDayWallpaper';
import { canSetWallpaper } from '@/scheduling/android';
import { useClockStore } from '@/store/clock';
import { selectDay, useDailyStore } from '@/store/daily';
import { useSettingsStore } from '@/store/settings';
import { radii, spacing, useAppTheme } from '@/theme';
import { getScreenPixelSize } from '@/wallpaper/device';

import type { WallpaperTarget } from '../../modules/daily-wallpaper';

const STEPS = ['welcome', 'categories', 'time'] as const;
type Step = (typeof STEPS)[number];

const TITLES: Record<Step, string> = {
  welcome: 'A new wallpaper every morning',
  categories: 'Choose your themes',
  time: 'When should it change?',
};

const TARGET_OPTIONS = [
  { value: 'lock', label: 'Lock screen' },
  { value: 'home', label: 'Home screen' },
  { value: 'both', label: 'Both' },
] as const satisfies readonly { value: WallpaperTarget; label: string }[];

function StepDots({ index }: { index: number }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={styles.dots}
      accessible
      accessibilityLabel={`Step ${index + 1} of ${STEPS.length}`}
    >
      {STEPS.map((step, i) => (
        <View
          key={step}
          style={[
            styles.dot,
            {
              width: i === index ? 22 : 8,
              backgroundColor: i <= index ? colors.accent : colors.border,
            },
          ]}
        />
      ))}
    </View>
  );
}

function Heading({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.heading}>
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="body" tone="secondary">
        {body}
      </AppText>
    </View>
  );
}

function WelcomeStep() {
  const today = useClockStore((s) => s.today);
  const entry = useDailyStore(selectDay(today));
  const wallpaper = useDayWallpaper(entry);
  const window = useWindowDimensions();
  const screen = getScreenPixelSize();
  const aspectRatio = screen.width / screen.height;
  const width = Math.round(Math.min(window.width * 0.5, window.height * 0.4 * aspectRatio));

  return (
    <>
      <WallpaperPreview
        image={wallpaper.image}
        loading={wallpaper.loading}
        error={wallpaper.error}
        width={width}
        aspectRatio={aspectRatio}
        accessibilityLabel={
          entry ? `Today's wallpaper: ${entry.quote.text}` : "Today's wallpaper is being drawn"
        }
      />
      <View style={styles.welcomeText}>
        <Heading
          title={TITLES.welcome}
          body="Each day brings a quote from the themes you choose, set on a calm background made for your screen. None repeat until you've seen them all."
        />
      </View>
    </>
  );
}

function CategoriesStep() {
  const selected = useSettingsStore((s) => s.selectedCategories);
  const toggleCategory = useSettingsStore((s) => s.toggleCategory);
  const counts = useMemo(() => countQuotesByCategory(), []);
  const poolSize = useMemo(() => buildQuotePool(selected).length, [selected]);

  return (
    <>
      <Heading
        title={TITLES.categories}
        body="Quotes only come from the themes you keep on. You can change them any time in Settings."
      />
      <AppText variant="caption" tone="tertiary" style={styles.count}>
        {selected.length} of {CATEGORIES.length} on · {poolSize} quotes
      </AppText>
      <CategoryPicker selected={selected} onToggle={toggleCategory} counts={counts} />
    </>
  );
}

function PlatformNote({
  icon,
  children,
}: {
  icon: 'flash-outline' | 'phone-portrait-outline';
  children: ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.note}>
      <View style={styles.noteRow}>
        <Ionicons name={icon} size={20} color={colors.accent} style={styles.noteIcon} />
        <View style={styles.noteText}>{children}</View>
      </View>
    </Card>
  );
}

function TimeStep() {
  const dailyTime = useSettingsStore((s) => s.dailyTime);
  const setDailyTime = useSettingsStore((s) => s.setDailyTime);
  const target = useSettingsStore((s) => s.wallpaperTarget);
  const setTarget = useSettingsStore((s) => s.setWallpaperTarget);

  return (
    <>
      <Heading
        title={TITLES.time}
        body="Your wallpaper switches to the day's quote at this time each morning."
      />
      <ListGroup>
        <TimeRow label="Change time" value={dailyTime} onChange={setDailyTime} />
      </ListGroup>

      {Platform.OS === 'android' && canSetWallpaper ? (
        <>
          <AppText variant="caption" tone="secondary" style={styles.subhint}>
            Show the quote on
          </AppText>
          <SegmentedControl
            accessibilityLabel="Screens to set"
            options={TARGET_OPTIONS}
            value={target}
            onChange={setTarget}
          />
          <PlatformNote icon="phone-portrait-outline">
            <AppText variant="callout" tone="secondary">
              The app sets it for you, even when it&apos;s closed. If this time has already passed
              today, today&apos;s wallpaper goes on as soon as you start.
            </AppText>
          </PlatformNote>
        </>
      ) : null}

      {Platform.OS === 'android' && !canSetWallpaper ? (
        <PlatformNote icon="phone-portrait-outline">
          <AppText variant="callout" tone="secondary">
            Setting the wallpaper automatically needs the development build. Until then you can save
            each day&apos;s wallpaper and set it yourself.
          </AppText>
        </PlatformNote>
      ) : null}

      {Platform.OS === 'ios' ? (
        <PlatformNote icon="flash-outline">
          <AppText variant="callout" tone="secondary">
            iPhone apps can&apos;t change the wallpaper by themselves, so a Shortcuts automation
            does it for you. It takes about a minute to set up, now or later from Settings.
          </AppText>
          <Button
            size="small"
            variant="secondary"
            label="Show me how"
            icon="book-outline"
            onPress={() => router.push('/shortcut-guide')}
            style={styles.noteButton}
          />
        </PlatformNote>
      ) : null}
    </>
  );
}

/** First-launch introduction. Finishing it flips `onboarded`, which switches to the tabs. */
export default function OnboardingScreen() {
  const { colors } = useAppTheme();
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const [step, setStep] = useState<Step>('welcome');
  const index = STEPS.indexOf(step);
  const last = index === STEPS.length - 1;

  const goTo = (target: Step) => {
    setStep(target);
    // The content swaps in place, so tell screen reader users where they are.
    AccessibilityInfo.announceForAccessibility(
      `Step ${STEPS.indexOf(target) + 1} of ${STEPS.length}: ${TITLES[target]}`
    );
  };

  const next = () => {
    if (last) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setOnboarded(true);
      return;
    }
    goTo(STEPS[index + 1]!);
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View style={styles.topBar}>
        <View style={styles.topSide}>
          {index > 0 ? (
            <TextAction label="Back" icon="chevron-back" onPress={() => goTo(STEPS[index - 1]!)} />
          ) : null}
        </View>
        <StepDots index={index} />
        <View style={styles.topSide} />
      </View>

      <ScrollView
        key={step}
        contentContainerStyle={[styles.content, step === 'welcome' && styles.welcome]}
      >
        {step === 'welcome' ? <WelcomeStep /> : null}
        {step === 'categories' ? <CategoriesStep /> : null}
        {step === 'time' ? <TimeStep /> : null}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <Button
          label={step === 'welcome' ? 'Get started' : last ? 'Start' : 'Continue'}
          icon={last ? 'checkmark' : undefined}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  topSide: { width: 88 },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { height: 8, borderRadius: radii.pill },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  welcome: { flexGrow: 1, justifyContent: 'center' },
  welcomeText: { marginTop: spacing.xxxl },
  heading: { gap: spacing.sm, marginBottom: spacing.xl },
  count: { marginTop: -spacing.sm, marginBottom: spacing.md, paddingHorizontal: spacing.xs },
  subhint: { marginTop: spacing.xl, marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
  note: { marginTop: spacing.xl },
  noteRow: { flexDirection: 'row', gap: spacing.md },
  noteIcon: { marginTop: 1 },
  noteText: { flex: 1, gap: spacing.md },
  noteButton: { alignSelf: 'flex-start' },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
