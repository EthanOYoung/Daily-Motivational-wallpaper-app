# Daily Quote Wallpaper

A calm, minimal React Native (Expo) app that makes a new phone wallpaper every day with a
motivational quote from the categories you choose.

- **Categories:** Self Love, Happiness, Ambition, Family, Resilience, Gratitude, Mindfulness,
  Confidence. Pick any combination; quotes only come from those.
- **No repeats:** a quote comes back only after every quote in your selected categories has been
  shown.
- **Local only:** settings, favourites and history stay on the device. No account, no backend.

## Requirements

- Node.js 20 or newer and npm
- A phone with **Expo Go** (stages 1–2) and, from stage 3, a **development build** of this app

## Getting started

```sh
npm install
npx expo start --go   # stages 1–2: open in Expo Go
```

Scan the QR code with the Camera app (iPhone) or with Expo Go (Android). The phone and computer
must be on the same Wi-Fi; if they can't see each other, use `npx expo start --go --tunnel`.

## Testing each stage on your phone

### Stage 1 — quote library and category selection

1. Run `npx expo start --go` and open the app in Expo Go.
2. **Today** shows today's quote with its author, source and category.
3. Tap **New quote** a few times: each tap shows a different quote.
4. Open **Settings → Categories**, turn off everything except one category (for example
   Gratitude). Go back to **Today**: the quote is now from Gratitude, and **New quote** only
   gives Gratitude quotes. The last remaining category can't be turned off.
5. Switch **Appearance** between System, Light and Dark.
6. Close the app completely and reopen it: your categories, theme and today's quote are still
   there.

### Stage 2 — wallpaper rendering

1. Run `npx expo start --go` and open the app in Expo Go.
2. **Today** now shows a phone-shaped preview of today's wallpaper. The quote sits in the
   middle-to-lower part of the screen, clear of the lock screen clock and widgets, with the
   author underneath.
3. Tap **New quote**: the quote changes and so does the background (six styles: Dawn, Sea Glass,
   Sage, Midnight, Linen, Dusk). Tap it a few times to see them all.
4. Tap **Save** and allow photo access. A "Saved to Photos" message appears. In Photos (iPhone) or
   Gallery/Google Photos (Android), open the image and check its details: it matches your screen
   resolution (for example 1179 × 2556 on an iPhone 15, 1080 × 2400 on many Android phones).
5. Tap **Share**: the system share sheet opens with the image.
6. In **Settings → Wallpaper**, switch **Text position** between Lower third and Middle; the Today
   preview redraws.
7. Optional, on your computer: `npm run render:samples` draws every style at iPhone and Android
   resolutions into `samples/` (including `contact-sheet.jpg`) and reports text contrast, using
   the same drawing code as the app. `npm run web` opens a browser preview of the app.

### Stage 3 — daily scheduling and wallpaper setting

From here on you need a **development build**: Expo Go can't include the app's own Android
wallpaper module. Build it once (pick one), then use `npx expo start` as before and open the
project from the development build instead of Expo Go.

| Phone   | Easiest                                                                                                                                        | Without an Expo account                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Android | `npx eas-cli@latest build --profile development --platform android`, then open the link on the phone and install the APK                       | Android Studio + USB debugging: `npx expo run:android --device` |
| iPhone  | Needs a paid Apple Developer account: `npx eas-cli@latest device:create`, then `npx eas-cli@latest build --profile development --platform ios` | A Mac with Xcode: `npx expo run:ios --device`                   |

The first EAS build asks you to log in (`npx eas-cli@latest login`) and to link the project.

**Android**

1. **Settings → Daily wallpaper**: set **Change time** to two minutes from now, keep **Set
   wallpaper automatically** on and choose **Both** under "Show the quote on".
2. On Android 12 and later you may see "Exact timing is off". Tap **Allow exact timing** and turn
   on **Alarms & reminders** so the change happens on the minute (without it, Android may run it a
   few minutes late).
3. Lock the phone and wait: at the chosen time the lock screen and home screen change to today's
   wallpaper. **Today** then shows "On your lock and home screens since …".
4. Tap **New quote**: a moment later the wallpaper on your phone updates too (after today's change
   time, the app keeps the screen in sync with today's quote). **Set now** applies it immediately
   at any time.
5. Restart the phone and repeat step 1: it still changes, because the alarm is re-armed after a
   reboot, an app update, or a time zone change.
6. Optional, with a USB cable: `adb shell dumpsys alarm | grep -A3 dailywallpaper` shows the next
   scheduled change.

**iPhone** (apps can't set the wallpaper themselves, so a Shortcuts automation does it)

1. Open the app once. It prepares the next 14 days of wallpapers (and tops them up whenever it
   runs, including background refreshes when iOS allows).
2. In the **Files** app, open **On My iPhone → Daily Quote Wallpaper → Wallpapers**: there is one
   image per date.
3. In the app, **Settings → Set up automatic wallpaper** walks you through the automation. The
   **From Files** method is recommended: it reads the file named after today's date, so it works
   even on days you don't open the app. Set the automation time two minutes ahead, lock the
   phone, and watch it change.
4. The **From Photos** method (as originally specified): turn on **Save to Photos album** and
   allow **Full Access**. Photos gets a "Daily Quote Wallpaper" album with today's image, and the
   automation uses the newest photo in it. The image is added when you open the app or when iOS
   runs the background refresh (usually overnight while charging), so on days when neither
   happens the automation shows the previous day's quote.

## Development

```sh
npm test                # unit tests: quote library, no-repeat rotation, planning, dates, and
                        # the wallpaper renderer (layout and contrast, run on CanvasKit)
npm run typecheck       # TypeScript (app and scripts)
npm run lint            # ESLint
npm run render:samples  # sample wallpapers for every style in samples/
```

### Project structure

```
src/app/            Expo Router screens (tabs: Today, Settings)
src/data/           quotes.json — the bundled quote library
src/domain/         Pure TypeScript logic: categories, quote pool, no-repeat picker, daily plan
src/wallpaper/      Skia renderer: six styles, text layout, device fonts, image files
src/store/          Zustand stores persisted to AsyncStorage
src/scheduling/     Pre-rendering upcoming days, background task, Android and iOS hand-off
src/services/       Saving to Photos and sharing
modules/daily-wallpaper/  Local Expo module (Kotlin): sets the Android wallpaper, daily alarm, reboot handling
src/components/     Shared UI (text, buttons, cards, category picker, wallpaper preview)
src/theme/          Colours for light/dark mode, spacing and typography
scripts/            Sample renderer (Node + CanvasKit) and web helpers
assets/fonts/       Bundled fonts (SIL Open Font License, see OFL.txt)
```

## How wallpapers are drawn

`src/wallpaper/draw.ts` draws each wallpaper with [React Native Skia](https://shopify.github.io/react-native-skia/)
onto a CPU-backed surface at the phone's exact screen resolution, then saves it as a JPEG.
Because it only uses the Skia API object it is given, the same code runs on the phone, in
background tasks (no screen needed) and in Node through CanvasKit, which is how the tests and
`npm run render:samples` check layout and contrast.

- **Styles** (`src/wallpaper/styles.ts`): three soft gradients, two solid colours with a gentle
  glow, and a paper texture, each with fine grain so gradients don't band.
- **Text**: a serif quote with balanced line lengths, sized to its length, and the author in small
  tracked capitals under a short rule. The block stays between 44% and 80% of the screen height
  (36–74% with the Middle position).
- **Readability**: tests render every style and check that quote text keeps at least 4.5:1
  contrast against the pixels behind it, and author text at least 3.5:1.

## How the daily change works

1. Whenever the app runs (launch, returning to the foreground, a settings change, or a background
   refresh scheduled with `expo-background-task`), it plans the next days' quotes and renders any
   missing wallpapers to `Documents/Wallpapers/<YYYY-MM-DD>.jpg` (7 days ahead on Android, 14 on
   iOS).
2. **Android:** a native alarm (`AlarmManager`, exact when "Alarms & reminders" is allowed) fires
   at the chosen time and sets that day's file with `WallpaperManager`. No JavaScript has to run at
   that moment. The alarm is re-armed after reboots, app updates and clock or time zone changes, and
   the app catches up if a change was missed.
3. **iOS:** the date-named files are visible in the Files app, and each day's image can also be
   added to the "Daily Quote Wallpaper" album. A Shortcuts automation (explained in the app) sets
   the wallpaper.

## Quote library

`src/data/quotes.json` has 285 quotes (33–38 per category). Each entry has `id`, `text`,
`author`, `category` and, when known, `source`. They come mainly from public-domain works (for
example the George Long translation of Marcus Aurelius, Richard Gummere's Seneca and Max Müller's
Dhammapada), traditional proverbs and US presidential addresses. Every quote is credited to its
author, with the source work where known. A unit test checks that each category has at least 30 quotes, that there are no
duplicates, and that every quote is short enough to fit on a wallpaper.
