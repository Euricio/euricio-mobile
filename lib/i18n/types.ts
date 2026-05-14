export type Locale = 'de' | 'es' | 'en' | 'ca' | 'eu';

export type TranslationKey = string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatPrice: (price: number | null, currency?: string) => string;
}

export const LOCALE_LABELS: Record<Locale, string> = {
  de: 'Deutsch',
  es: 'Español',
  en: 'English',
  ca: 'Català',
  eu: 'Euskara',
};

export const LOCALE_DATE_FORMATS: Record<Locale, string> = {
  de: 'de-DE',
  es: 'es-ES',
  en: 'en-GB',
  ca: 'ca-ES',
  eu: 'eu-ES',
};

// Fallback chain used by t() when a key is missing in the active locale.
// Catalan / Basque fall back to Spanish first (regional co-official languages
// in Spain), then to German (the legacy default the app shipped with), then
// to the key itself.
export const LOCALE_FALLBACK_CHAIN: Record<Locale, Locale[]> = {
  de: ['en', 'es'],
  es: ['en', 'de'],
  en: ['de', 'es'],
  ca: ['es', 'en', 'de'],
  eu: ['es', 'en', 'de'],
};
