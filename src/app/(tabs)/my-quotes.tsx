import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { QuoteBlock } from '@/components/QuoteBlock';
import { Screen } from '@/components/Screen';
import { TextAction } from '@/components/TextAction';
import { getCategory } from '@/domain/categories';
import { showQuoteToday } from '@/services/quoteActions';
import { useLibraryStore } from '@/store/library';
import { useSettingsStore } from '@/store/settings';
import { spacing, useAppTheme } from '@/theme';

function AddButton() {
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Add a quote"
      onPress={() => router.push('/quote-editor')}
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: colors.accent, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name="add" size={24} color={colors.onAccent} />
    </Pressable>
  );
}

export default function MyQuotesScreen() {
  const customQuotes = useLibraryStore((s) => s.customQuotes);
  const selected = useSettingsStore((s) => s.selectedCategories);

  return (
    <Screen
      title="My Quotes"
      subtitle={customQuotes.length ? `${customQuotes.length} of your own` : undefined}
      headerAccessory={customQuotes.length ? <AddButton /> : null}
    >
      {customQuotes.length === 0 ? (
        <EmptyState
          icon="create-outline"
          title="Add your own words"
          message="Quotes you add here join the daily rotation in the category you choose."
        >
          <Button
            label="Add a quote"
            icon="add"
            onPress={() => router.push('/quote-editor')}
            style={styles.emptyButton}
          />
        </EmptyState>
      ) : (
        <View style={styles.list}>
          {customQuotes.map((quote) => {
            const inRotation = selected.includes(quote.category);
            return (
              <Card key={quote.id} style={styles.card}>
                <QuoteBlock quote={quote} size="medium" />
                {!inRotation ? (
                  <AppText variant="caption" tone="tertiary">
                    {getCategory(quote.category).label} is turned off in Settings, so this quote
                    isn&apos;t in the rotation.
                  </AppText>
                ) : null}
                <View style={styles.actions}>
                  <TextAction
                    label="Use today"
                    icon="phone-portrait-outline"
                    onPress={() => showQuoteToday(quote)}
                  />
                  <TextAction
                    label="Edit"
                    icon="create-outline"
                    tone="secondary"
                    onPress={() =>
                      router.push({ pathname: '/quote-editor', params: { id: quote.id } })
                    }
                    accessibilityLabel={`Edit “${quote.text}”`}
                  />
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: -spacing.sm },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyButton: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
