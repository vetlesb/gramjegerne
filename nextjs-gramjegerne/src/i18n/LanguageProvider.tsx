'use client';

import {createContext, useContext, useEffect, useState, useCallback} from 'react';
import en from './en';
import nb from './nb';
import type {Translations} from './en';

type Language = 'en' | 'nb';
type Currency = 'NOK' | 'SEK' | 'DKK' | 'USD' | 'EUR';

const currencyLocales: Record<Currency, string> = {
  NOK: 'nb-NO',
  SEK: 'sv-SE',
  DKK: 'da-DK',
  USD: 'en-US',
  EUR: 'de-DE',
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (price: number) => string;
  currencyLabel: string;
  t: Translations;
}

const translations: Record<Language, Translations> = {en, nb};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<Language>('en');
  const [currency, setCurrencyState] = useState<Currency>('NOK');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && translations[savedLang]) {
      setLanguageState(savedLang);
    }
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && currencyLocales[savedCurrency]) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const setCurrency = useCallback((cur: Currency) => {
    setCurrencyState(cur);
    localStorage.setItem('currency', cur);
  }, []);

  const formatPrice = useCallback(
    (price: number): string => {
      return new Intl.NumberFormat(currencyLocales[currency], {
        style: 'currency',
        currency,
      }).format(price);
    },
    [currency],
  );

  const currencyLabel = currency;

  const t = translations[language];

  return (
    <LanguageContext.Provider
      value={{language, setLanguage, currency, setCurrency, formatPrice, currencyLabel, t}}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
