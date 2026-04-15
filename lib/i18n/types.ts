export type Locale = 'de' | 'es' | 'en';

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
};

export const LOCALE_DATE_FORMATS: Record<Locale, string> = {
  de: 'de-DE',
  es: 'es-ES',
  en: 'en-GB',
};
