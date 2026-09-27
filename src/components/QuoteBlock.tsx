import { StyleSheet, View } from 'react-native';

import { getCategory } from '@/domain/categories';
import type { Quote } from '@/domain/types';
import { fonts, spacing } from '@/theme';

import { AppText } from './AppText';

interface QuoteBlockProps {
  quote: Quote;
  size?: 'large' | 'medium';
  showCategory?: boolean;
}

/** A quote set in the serif face with its author and source underneath. */
export function QuoteBlock({ quote, size = 'large', showCategory = true }: QuoteBlockProps) {
  const large = size === 'large';
  const author = quote.author.trim();
  const category = getCategory(quote.category).label;
  return (
    <View
      style={styles.root}
      accessible
      accessibilityLabel={[quote.text, author && `— ${author}`, showCategory && category]
        .filter(Boolean)
        .join('. ')}
    >
      <AppText
        variant="quote"
        style={large ? styles.large : styles.medium}
        maxFontSizeMultiplier={1.6}
      >
        {quote.text}
      </AppText>
      <View style={styles.meta}>
        {author ? (
          <AppText variant="callout" tone="secondary">
            — {author}
            {quote.source ? (
              <AppText variant="callout" tone="tertiary" style={styles.source}>
                {`, ${quote.source}`}
              </AppText>
            ) : null}
          </AppText>
        ) : null}
        {showCategory ? (
          <AppText variant="label" tone="accent" uppercase>
            {quote.isCustom ? `${category} · Your quote` : category}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  large: { fontSize: 24, lineHeight: 34 },
  medium: { fontSize: 19, lineHeight: 27 },
  source: { fontFamily: fonts.serifItalic },
  meta: { gap: spacing.sm },
});
