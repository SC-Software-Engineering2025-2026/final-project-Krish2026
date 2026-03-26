import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import frTranslations from '../locales/fr.json';
import itTranslations from '../locales/it.json';
import zhTranslations from '../locales/zh.json';
import jaTranslations from '../locales/ja.json';

// Define available languages
export const AVAILABLE_LANGUAGES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  zh: '中文',
  ja: '日本語'
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      it: { translation: itTranslations },
      zh: { translation: zhTranslations },
      ja: { translation: jaTranslations }
    },
    // Default language
    lng: localStorage.getItem('userLanguage') || 'en',
    // Fallback language
    fallbackLng: 'en',
    // Namespace configuration
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // React already protects from xss
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
