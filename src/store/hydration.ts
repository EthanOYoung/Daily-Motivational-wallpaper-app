import { useSyncExternalStore } from 'react';

import { useDailyStore } from './daily';
import { useLibraryStore } from './library';
import { useRenderStore } from './renders';
import { useSchedulingStore } from './scheduling';
import { useSettingsStore } from './settings';

interface PersistApi {
  hasHydrated: () => boolean;
  onFinishHydration: (listener: () => void) => () => void;
}

const persisted: PersistApi[] = [
  useSettingsStore.persist,
  useDailyStore.persist,
  useRenderStore.persist,
  useSchedulingStore.persist,
  useLibraryStore.persist,
];

/** Registers another persisted store so startup waits for it too. */
export function registerPersistedStore(api: PersistApi) {
  if (!persisted.includes(api)) persisted.push(api);
}

const allHydrated = () => persisted.every((p) => p.hasHydrated());

function subscribe(onChange: () => void) {
  const unsubscribers = persisted.map((p) => p.onFinishHydration(onChange));
  return () => unsubscribers.forEach((u) => u());
}

/** True once every persisted store has loaded from device storage. */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated, allHydrated);
}

/** Resolves once all stores are loaded; used by background tasks before touching state. */
export function waitForStoresHydrated(): Promise<void> {
  return new Promise((resolve) => {
    let unsubscribe = () => {};
    const check = () => {
      if (!allHydrated()) return;
      unsubscribe();
      resolve();
    };
    unsubscribe = subscribe(check);
    // A store may have finished between the first check and subscribing.
    check();
  });
}
