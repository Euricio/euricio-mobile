import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, I18nContextValue, LOCALE_DATE_FORMATS } from './types';
import de from './locales/de';
import es from './locales/es';
import en from './locales/en';

const STORAGE_KEY = '@euricio/locale';
const DEFAULT_LOCALE: Locale = 'de';

const translations: Record<Locale, typeof de> = { de, es, en };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  // Load saved locale on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved && (saved === 'de' || saved === 'es' || saved === 'en')) {
          setLocaleState(saved as Locale);
        }
      })
      .finally(() => setIsReady(true));
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = translations[locale];
      let value = (dict as Record<string, string>)[key];
      if (value === undefined) {
        // Fallback to German, then to the key itself
        value = (de as Record<string, string>)[key] ?? key;
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }
      return value;
    },
    [locale],
  );

  const formatDate = useCallback(
    (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      const localeCode = LOCALE_DATE_FORMATS[locale];
      return d.toLocaleDateString(localeCode, options);
    },
    [locale],
  );

  const formatPrice = useCallback(
    (price: number | null, currency = 'EUR'): string => {
      if (price == null) return '—';
      const localeCode = LOCALE_DATE_FORMATS[locale];
      return new Intl.NumberFormat(localeCode, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      }).format(price);
    },
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, formatDate, formatPrice }),
    [locale, setLocale, t, formatDate, formatPrice],
  );

  // Don't render until locale is loaded from storage
  if (!isReady) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
