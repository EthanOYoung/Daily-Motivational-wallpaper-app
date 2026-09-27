import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ActionButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { QuoteBlock } from '@/components/QuoteBlock';
import { Screen } from '@/components/Screen';
import { formatDateKey } from '@/domain/dates';
import { useClockStore } from '@/store/clock';
import { selectDay, useDailyStore } from '@/store/daily';
import { spacing } from '@/theme';

export default function TodayScreen() {
  const today = useClockStore((s) => s.today);
  const entry = useDailyStore(selectDay(today));
  const regenerate = useDailyStore((s) => s.regenerate);

  return (
    <Screen title="Today" subtitle={formatDateKey(today)}>
      {entry ? (
        <>
          <Card style={styles.card}>
            <QuoteBlock quote={entry.quote} />
          </Card>
          <View style={styles.actions}>
            <ActionButton label="New quote" icon="refresh" onPress={() => regenerate(today)} />
          </View>
        </>
      ) : (
        <Card>
          <AppText tone="secondary">Pick at least one category in Settings to get started.</AppText>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    marginTop: spacing.xxl,
  },
});
