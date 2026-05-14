import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  Locale,
  I18nContextValue,
  LOCALE_DATE_FORMATS,
  LOCALE_FALLBACK_CHAIN,
} from './types';
import { supabase } from '../supabase';
import de from './locales/de';
import es from './locales/es';
import en from './locales/en';
import ca from './locales/ca';
import eu from './locales/eu';

const STORAGE_KEY = 'euricio_locale';
const DEFAULT_LOCALE: Locale = 'de';

const VALID_LOCALES: Locale[] = ['de', 'es', 'en', 'ca', 'eu'];

/**
 * Normalize incoming locale strings to one of our supported short codes.
 *
 * Inputs can be:
 *  - bare codes from our own store: "de", "es", "en", "ca", "eu"
 *  - region-tagged codes possibly persisted by other surfaces or arriving
 *    from device/OS settings: "ca-ES", "eu-ES", "es-ES", "es-419", "en-GB",
 *    "en-US", "de-DE", "de-AT", "ca-AD" (Andorra), etc.
 *  - case/separator variants: "ca_ES", "CA-es", "CA"
 *
 * The canonical *persisted* locale we store internally is the 2-letter code
 * (`ca`, `eu`, `es`, `de`, `en`). The canonical *display/format* locale that
 * we feed into Intl/toLocale* APIs is built from `LOCALE_DATE_FORMATS` and
 * uses the region-tagged forms `ca-ES` and `eu-ES` for the Spanish regional
 * languages, matching the project's locale-code decision.
 */
export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  // Split on either "-" or "_" and take the language portion only.
  const lang = trimmed.split(/[-_]/)[0].toLowerCase();
  if ((VALID_LOCALES as string[]).includes(lang)) return lang as Locale;
  return null;
}

function isValidLocale(value: string | null | undefined): value is Locale {
  return value != null && (VALID_LOCALES as string[]).includes(value as Locale);
}

const translations: Record<Locale, Record<string, string>> = { de, es, en, ca, eu };

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isReady, setIsReady] = useState(false);

  // Load saved locale on mount — try local storage first, then Supabase profile
  useEffect(() => {
    async function loadLocale() {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        const normalizedSaved = normalizeLocale(saved);
        if (normalizedSaved) {
          setLocaleState(normalizedSaved);
          // If the persisted value was a legacy/region-tagged form we just
          // normalized, write the canonical short code back so we don't keep
          // re-normalizing on every cold start.
          if (saved !== normalizedSaved) {
            await SecureStore.setItemAsync(STORAGE_KEY, normalizedSaved).catch(() => {});
          }
          return;
        }

        // Fallback: check Supabase profile for cross-device sync
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .single();
          const normalizedProfile = normalizeLocale(profile?.language);
          if (normalizedProfile) {
            setLocaleState(normalizedProfile);
            // Cache locally for next startup
            await SecureStore.setItemAsync(STORAGE_KEY, normalizedProfile);
          }
        }
      } catch {
        // Silently fall back to default locale
      } finally {
        setIsReady(true);
      }
    }
    loadLocale();
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!isValidLocale(newLocale)) return;
    setLocaleState(newLocale);

    // Persist locally
    SecureStore.setItemAsync(STORAGE_KEY, newLocale).catch(() => {});

    // Persist to Supabase profile (fire-and-forget)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        supabase
          .from('profiles')
          .update({ language: newLocale })
          .eq('id', session.user.id)
          .then(() => {});
      }
    }).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value: string | undefined = translations[locale]?.[key];
      if (value === undefined) {
        // Walk the configured fallback chain, then default to the key itself.
        for (const fb of LOCALE_FALLBACK_CHAIN[locale] ?? []) {
          const candidate = translations[fb]?.[key];
          if (candidate !== undefined) {
            value = candidate;
            break;
          }
        }
        if (value === undefined) value = key;
      }
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = (value as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
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
      try {
        return d.toLocaleDateString(localeCode, options);
      } catch {
        // JS engines without full ICU data may not know ca-ES / eu-ES. Fall
        // back to Spanish formatting which is the closest culturally for
        // Catalonia and the Basque Country.
        return d.toLocaleDateString(LOCALE_DATE_FORMATS.es, options);
      }
    },
    [locale],
  );

  const formatPrice = useCallback(
    (price: number | null, currency = 'EUR'): string => {
      if (price == null) return '—';
      const localeCode = LOCALE_DATE_FORMATS[locale];
      try {
        return new Intl.NumberFormat(localeCode, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(price);
      } catch {
        return new Intl.NumberFormat(LOCALE_DATE_FORMATS.es, {
          style: 'currency',
          currency,
          maximumFractionDigits: 0,
        }).format(price);
      }
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
