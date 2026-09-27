import { useEffect } from 'react';

import { useClockStore } from '@/store/clock';
import { useDailyStore } from '@/store/daily';
import { useSettingsStore } from '@/store/settings';

/** Re-plans the upcoming days whenever the day changes or the quote settings change. */
export function usePlanSync() {
  const today = useClockStore((s) => s.today);
  const categories = useSettingsStore((s) => s.selectedCategories);
  const styles = useSettingsStore((s) => s.enabledStyles);

  useEffect(() => {
    useDailyStore.getState().sync(today);
  }, [today, categories, styles]);
}
