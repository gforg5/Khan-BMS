import { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { ur } from '../locales/ur';
import { ps } from '../locales/ps';
import type { TranslationKeys } from '../locales/en';

type Language = 'en' | 'ur' | 'ps';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
  dir: 'ltr' | 'rtl';
}

const translations = {
  en,
  ur,
  ps,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    const dir = language === 'en' ? 'ltr' : 'rtl';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const value = {
    language,
    setLanguage,
    t: translations[language],
    dir: language === 'en' ? 'ltr' : 'rtl',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
