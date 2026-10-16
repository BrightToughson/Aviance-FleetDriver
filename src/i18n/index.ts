import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import tw from './locales/tw.json';
import ga from './locales/ga.json';
import ha from './locales/ha.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  tw: { translation: tw },
  ga: { translation: ga },
  ha: { translation: ha },
  fr: { translation: fr },
  ar: { translation: ar },
  es: { translation: es },
};

import { Platform } from 'react-native';

const LANGUAGE_STORE_KEY = '@app_language';

const initI18n = async () => {
  let savedLanguage = 'en';

  try {
    if (Platform.OS !== 'web' || typeof window !== 'undefined') {
      const stored = await AsyncStorage.getItem(LANGUAGE_STORE_KEY);
      if (stored) {
        savedLanguage = stored;
      } else {
        const locales = Localization.getLocales();
        if (locales && locales.length > 0) {
          const deviceLanguage = locales[0].languageCode;
          savedLanguage = deviceLanguage && resources[deviceLanguage as keyof typeof resources] ? deviceLanguage : 'en';
        }
      }
    }
  } catch (e) {
    console.log('Failed to fetch language from storage', e);
  }

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
