import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useClockStore } from '@/store/clock';

/** Keeps `useClockStore().today` current while the app is open and when it returns to the foreground. */
export function useDayTicker() {
  useEffect(() => {
    const { refresh } = useClockStore.getState();
    refresh();
    const interval = setInterval(refresh, 60_000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);
}
