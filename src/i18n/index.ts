import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar.json";
import en from "./locales/en.json";

const STORAGE_KEY = "biolens-lang";

function applyDocumentLang(lang: string) {
  if (typeof document === "undefined") return;
  const isAr = lang === "ar";
  document.documentElement.dir = isAr ? "rtl" : "ltr";
  document.documentElement.lang = isAr ? "ar" : "en";
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
    },
    lng: localStorage.getItem(STORAGE_KEY) ?? "ar",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

applyDocumentLang(i18n.language);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  applyDocumentLang(lng);
});

export default i18n;
