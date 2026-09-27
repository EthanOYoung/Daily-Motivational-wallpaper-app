import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { QuoteBlock } from '@/components/QuoteBlock';
import { Screen } from '@/components/Screen';
import { TextAction } from '@/components/TextAction';
import { showToast } from '@/components/Toast';
import { shareQuoteText, showQuoteToday } from '@/services/quoteActions';
import { useLibraryStore } from '@/store/library';
import { spacing } from '@/theme';

export default function FavouritesScreen() {
  const favourites = useLibraryStore((s) => s.favourites);
  const toggleFavourite = useLibraryStore((s) => s.toggleFavourite);

  const count = favourites.length;
  return (
    <Screen title="Favourites" subtitle={count ? `${count} saved` : undefined}>
      {count === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="No favourites yet"
          message="Tap the heart on the Today screen to keep quotes you love here."
        />
      ) : (
        <View style={styles.list}>
          {favourites.map(({ quote }) => (
            <Card key={quote.id} style={styles.card}>
              <QuoteBlock quote={quote} size="medium" />
              <View style={styles.actions}>
                <TextAction
                  label="Use today"
                  icon="phone-portrait-outline"
                  onPress={() => showQuoteToday(quote)}
                  accessibilityLabel={`Use “${quote.text}” for today's wallpaper`}
                />
                <TextAction
                  label="Share"
                  icon="share-outline"
                  tone="secondary"
                  onPress={() => void shareQuoteText(quote)}
                />
                <View style={styles.spacer} />
                <TextAction
                  label="Remove"
                  icon="heart-dislike-outline"
                  tone="secondary"
                  onPress={() => {
                    toggleFavourite(quote);
                    showToast('Removed from favourites');
                  }}
                  accessibilityLabel={`Remove “${quote.text}” from favourites`}
                />
              </View>
            </Card>
          ))}
          <AppText variant="caption" tone="tertiary" style={styles.footer}>
            Favourites stay on this device.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: -spacing.sm },
  spacer: { flex: 1 },
  footer: { textAlign: 'center', marginTop: spacing.md },
});
