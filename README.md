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

## Development

```sh
npm test            # unit tests (quote library, no-repeat rotation, planning, dates)
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

### Project structure

```
src/app/            Expo Router screens (tabs: Today, Settings)
src/data/           quotes.json — the bundled quote library
src/domain/         Pure TypeScript logic: categories, quote pool, no-repeat picker, daily plan
src/store/          Zustand stores persisted to AsyncStorage
src/components/     Shared UI (text, buttons, cards, category picker)
src/theme/          Colours for light/dark mode, spacing and typography
assets/fonts/       Bundled fonts (SIL Open Font License, see OFL.txt)
```

## Quote library

`src/data/quotes.json` has 285 quotes (33–38 per category). Each entry has `id`, `text`,
`author`, `category` and, when known, `source`. They come mainly from public-domain works (for
example the George Long translation of Marcus Aurelius, Richard Gummere's Seneca and Max Müller's
Dhammapada), traditional proverbs and US presidential addresses. Every quote is credited to its
author, with the source work where known. A unit test checks that each category has at least 30 quotes, that there are no
duplicates, and that every quote is short enough to fit on a wallpaper.
