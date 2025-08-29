import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const supportedLocales = ['en', 'ko'];

interface I18nContextType {
  locale: string;
  t: (key: string, options?: Record<string, string | number>) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

const getBestLocale = (): string => {
  const browserLang = navigator.language.split('-')[0];
  return supportedLocales.includes(browserLang) ? browserLang : 'en';
};

const deepGet = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<string>('en');
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      const bestLocale = getBestLocale();
      setLocale(bestLocale);
      
      try {
        const response = await fetch(`/locales/${bestLocale}.json`);
        if (!response.ok) {
            throw new Error(`Failed to fetch locale file: ${response.statusText}`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(`Could not load locale: ${bestLocale}, falling back to English.`, error);
        try {
            const enResponse = await fetch(`/locales/en.json`);
            if (!enResponse.ok) throw new Error(`Failed to fetch fallback locale file: ${enResponse.statusText}`);
            const enData = await enResponse.json();
            setTranslations(enData);
            setLocale('en');
        } catch (fallbackError) {
             console.error('Fatal: Could not load fallback English locale.', fallbackError);
        }
      } finally {
        setReady(true);
      }
    };
    loadTranslations();
  }, []);

  const t = (key: string, options?: Record<string, string | number>): string => {
    let translation = deepGet(translations, key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    if (options) {
      Object.keys(options).forEach(optionKey => {
        const regex = new RegExp(`{{${optionKey}}}`, 'g');
        translation = translation.replace(regex, String(options[optionKey]));
      });
    }

    return translation;
  };

  const value = { locale, t, ready };

  // FIX: Replaced JSX with React.createElement to support .ts file extension.
  return React.createElement(I18nContext.Provider, { value: value }, children);
};
