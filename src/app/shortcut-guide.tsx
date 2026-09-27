import { useState } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ListGroup, SwitchRow } from '@/components/ListGroup';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { showToast } from '@/components/Toast';
import { formatTimeOfDay } from '@/domain/dates';
import { ALBUM_TITLE, requestAlbumAccess } from '@/scheduling/album';
import { PLAN_HORIZON_DAYS } from '@/store/daily';
import { useSettingsStore } from '@/store/settings';
import { radii, spacing, useAppTheme } from '@/theme';

type Method = 'files' | 'photos';

// Illustrations of each step. Replace these files with real screenshots if you like; keep the names.
const IMAGES = {
  automation: { source: require('../../assets/guide/step-automation.png'), ratio: 1.0141 },
  time: { source: require('../../assets/guide/step-time.png'), ratio: 0.72 },
  files: { source: require('../../assets/guide/step-files.png'), ratio: 0.7912 },
  folder: { source: require('../../assets/guide/step-folder.png'), ratio: 0.9836 },
  photos: { source: require('../../assets/guide/step-photos.png'), ratio: 1.0876 },
  options: { source: require('../../assets/guide/step-options.png'), ratio: 1.1009 },
} satisfies Record<string, { source: ImageSourcePropType; ratio: number }>;

interface Step {
  title: string;
  body: string[];
  image?: keyof typeof IMAGES;
  imageLabel?: string;
}

function commonSteps(time: string): Step[] {
  return [
    {
      title: 'Create a Time of Day automation',
      body: ['Open the Shortcuts app, go to the Automation tab and tap +.', 'Choose Time of Day.'],
      image: 'automation',
      imageLabel: 'Shortcuts Automation tab with the plus button and the Time of Day option',
    },
    {
      title: 'Choose when it runs',
      body: [
        `Set the time to ${time} (your change time in this app), and Repeat to Daily.`,
        'Select Run Immediately so it works without asking, then tap Next.',
      ],
      image: 'time',
      imageLabel: 'Time of Day settings: 6:00 AM, repeat daily, run immediately',
    },
  ];
}

function filesSteps(time: string): Step[] {
  return [
    ...commonSteps(time),
    {
      title: 'Add three actions',
      body: [
        'Tap New Blank Automation, then add:',
        '1. Format Date — tap Date and pick Current Date. Set Date Format to Custom and Format String to yyyy-MM-dd.',
        '2. Get File (listed as “Get File from Folder”) — for the folder choose On My iPhone › Daily Quote Wallpaper › Wallpapers. For the path, insert the Formatted Date variable and type .jpg right after it.',
        '3. Set Wallpaper Photo (called “Set Wallpaper” on older iOS) — choose Lock Screen, Home Screen or both, and use the File from the step before.',
      ],
      image: 'files',
      imageLabel:
        'Actions: Format Current Date, Get file from Wallpapers at path Formatted Date .jpg, Set wallpaper photo to File',
    },
    {
      title: 'Where the files come from',
      body: [
        `The app keeps the next ${PLAN_HORIZON_DAYS} days of wallpapers in this folder, one per date, so the automation finds today's even if you haven't opened the app.`,
      ],
      image: 'folder',
      imageLabel: 'Files app showing the Wallpapers folder with one image per date',
    },
    {
      title: 'Turn off the preview',
      body: [
        'Tap the arrow on Set Wallpaper Photo and turn off Show Preview and Crop to Subject.',
        'Tap Done.',
      ],
      image: 'options',
      imageLabel: 'Set wallpaper photo options with Show Preview and Crop to Subject turned off',
    },
    {
      title: 'Try it once',
      body: [
        'Open the automation and tap the play button to run it now. If iOS asks whether Shortcuts may access the folder, tap Always Allow.',
      ],
    },
  ];
}

function photosSteps(time: string): Step[] {
  return [
    ...commonSteps(time),
    {
      title: 'Add two actions',
      body: [
        'Tap New Blank Automation, then add:',
        `1. Find Photos — add the filter Album is ${ALBUM_TITLE}. Sort by Creation Date, Order Latest First, and turn on Limit with 1 photo.`,
        '2. Set Wallpaper Photo (called “Set Wallpaper” on older iOS) — choose Lock Screen, Home Screen or both, and use the Photos from the step before.',
      ],
      image: 'photos',
      imageLabel:
        'Actions: Find Photos where Album is Daily Quote Wallpaper, latest first, limit 1, then Set wallpaper photo',
    },
    {
      title: 'Turn off the preview',
      body: [
        'Tap the arrow on Set Wallpaper Photo and turn off Show Preview and Crop to Subject.',
        'Tap Done, then open the automation and tap play to try it.',
      ],
      image: 'options',
      imageLabel: 'Set wallpaper photo options with Show Preview and Crop to Subject turned off',
    },
  ];
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const image = step.image ? IMAGES[step.image] : null;
  // Screen and card padding on both sides; explicit sizes lay out the same on every platform.
  const imageWidth = Math.min(windowWidth, 560) - spacing.xl * 2 - spacing.lg * 2;
  return (
    <Card style={styles.step}>
      <View style={styles.stepHeader}>
        <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
          <AppText variant="callout" tone="accent">
            {index + 1}
          </AppText>
        </View>
        <AppText variant="heading" style={styles.stepTitle}>
          {step.title}
        </AppText>
      </View>
      {step.body.map((line) => (
        <AppText key={line} variant="callout" tone="secondary">
          {line}
        </AppText>
      ))}
      {image ? (
        <Image
          source={image.source}
          accessibilityLabel={step.imageLabel}
          resizeMode="contain"
          style={[
            styles.image,
            {
              width: imageWidth,
              height: Math.round(imageWidth / image.ratio),
              backgroundColor: colors.surfaceAlt,
            },
          ]}
        />
      ) : null}
    </Card>
  );
}

export default function ShortcutGuideScreen() {
  const [method, setMethod] = useState<Method>('files');
  const dailyTime = useSettingsStore((s) => s.dailyTime);
  const saveToAlbum = useSettingsStore((s) => s.saveToAlbum);
  const setSaveToAlbum = useSettingsStore((s) => s.setSaveToAlbum);
  const time = formatTimeOfDay(dailyTime);
  const steps = method === 'files' ? filesSteps(time) : photosSteps(time);

  const onToggleAlbum = async (enabled: boolean) => {
    if (!enabled) return setSaveToAlbum(false);
    const access = await requestAlbumAccess();
    if (access === 'full') return setSaveToAlbum(true);
    showToast('Allow full photo access so the app can keep its own album');
    Linking.openSettings().catch(() => {});
  };

  return (
    <Screen edges={[]}>
      <AppText variant="callout" tone="secondary" style={styles.intro}>
        iPhone doesn&apos;t let apps change the wallpaper by themselves, but a Shortcuts automation
        can do it for you every morning. Set it up once and you&apos;re done.
      </AppText>

      <SegmentedControl
        accessibilityLabel="Setup method"
        options={[
          { value: 'files', label: 'From Files' },
          { value: 'photos', label: 'From Photos' },
        ]}
        value={method}
        onChange={setMethod}
      />

      <AppText variant="caption" tone="tertiary" style={styles.methodNote}>
        {method === 'files'
          ? 'Recommended. Uses the wallpapers the app prepares ahead of time, so it works even on days you don’t open the app.'
          : `Uses the newest image in your “${ALBUM_TITLE}” album. The app adds each day's image when you open it, or when iOS lets it refresh in the background (usually overnight while charging). If neither has happened since midnight, you'll see yesterday's quote again.`}
      </AppText>

      {method === 'photos' ? (
        <ListGroup>
          <SwitchRow
            label="Save to Photos album"
            detail="Needed for this method. Asks for full photo access."
            value={saveToAlbum}
            onValueChange={onToggleAlbum}
          />
        </ListGroup>
      ) : null}

      {steps.map((step, index) => (
        <StepCard key={step.title} step={step} index={index} />
      ))}

      <Card style={styles.step}>
        <AppText variant="heading">If it doesn&apos;t change</AppText>
        <AppText variant="callout" tone="secondary">
          Check the automation is set to Run Immediately and is turned on. Open this app once so it
          can prepare the coming days. Screens in these pictures are illustrations and may look a
          little different on your iOS version.
        </AppText>
        <Button
          size="small"
          variant="secondary"
          label="Open Shortcuts"
          icon="open-outline"
          onPress={() =>
            Linking.openURL('shortcuts://').catch(() => showToast('Shortcuts is not installed'))
          }
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { marginTop: spacing.lg, marginBottom: spacing.lg },
  methodNote: { marginTop: spacing.sm, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
  step: { marginTop: spacing.lg, gap: spacing.sm },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stepTitle: { flex: 1 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { borderRadius: radii.md, marginTop: spacing.sm, alignSelf: 'center' },
});
