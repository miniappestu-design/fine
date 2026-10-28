import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale } from '../types';
import { translations, SUPPORTED_LOCALES } from './translations';

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: (keyPath: string, fallback?: string) => string;
  tObj: (keyPath: string) => any;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'fitencasa_user_locale';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.some((l) => l.code === stored)) {
        return stored as SupportedLocale;
      }
    } catch {
      // ignore
    }
    return 'es'; // default language
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch (e) {
      console.warn('Could not save locale to localStorage', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Nested property getter with fallback
  const getNestedValue = (obj: any, path: string): any => {
    if (!obj) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  };

  const t = (keyPath: string, fallback?: string): string => {
    const activeDict = translations[locale];
    let val = getNestedValue(activeDict, keyPath);
    if (val !== undefined && typeof val === 'string') {
      return val;
    }
    // fallback to es
    const fallbackDict = translations['es'];
    val = getNestedValue(fallbackDict, keyPath);
    if (val !== undefined && typeof val === 'string') {
      return val;
    }
    return fallback || keyPath;
  };

  const tObj = (keyPath: string): any => {
    const activeDict = translations[locale];
    let val = getNestedValue(activeDict, keyPath);
    if (val !== undefined) return val;
    return getNestedValue(translations['es'], keyPath);
  };

  const formatDate = (dateInput: Date | string, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
      const defaultOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      };
      return new Intl.DateTimeFormat(locale, options || defaultOptions).format(d);
    } catch {
      return String(dateInput);
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t, tObj, formatDate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
