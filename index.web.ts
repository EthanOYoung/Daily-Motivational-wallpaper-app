// Web entry: Skia on the web needs CanvasKit (WebAssembly) loaded before any Skia code runs.
// Metro only evaluates a module when it is first required, so requiring the router inside the
// callback keeps every Skia import waiting until CanvasKit is ready. `npm run web` copies
// canvaskit.wasm into public/.
import '@expo/metro-runtime';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { App } = require('expo-router/build/qualified-entry');
  const { renderRootComponent } = require('expo-router/build/renderRootComponent');
  /* eslint-enable @typescript-eslint/no-require-imports */
  renderRootComponent(App);
});
