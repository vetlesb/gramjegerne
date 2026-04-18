'use client';

import {createContext, useContext, useEffect, useState, useCallback} from 'react';
import en from './en';
import nb from './nb';
import type {Translations} from './en';

type Language = 'en' | 'nb';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
}

const translations: Record<Language, Translations> = {en, nb};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved && translations[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{language, setLanguage, t}}>
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
