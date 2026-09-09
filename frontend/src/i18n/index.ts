import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import enAdmin from "./en/admin.json";
import enAuth from "./en/auth.json";
import enCommon from "./en/common.json";
import enExam from "./en/exam.json";
import enLanding from "./en/landing.json";
import enProfile from "./en/profile.json";
import frAdmin from "./fr/admin.json";
import frAuth from "./fr/auth.json";
import frCommon from "./fr/common.json";
import frExam from "./fr/exam.json";
import frLanding from "./fr/landing.json";
import frProfile from "./fr/profile.json";

const LANG_KEY = "pyexam_lang";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { common: frCommon, auth: frAuth, exam: frExam, admin: frAdmin, profile: frProfile, landing: frLanding },
      en: { common: enCommon, auth: enAuth, exam: enExam, admin: enAdmin, profile: enProfile, landing: enLanding },
    },
    fallbackLng: "fr",
    supportedLngs: ["fr", "en"],
    defaultNS: "common",
    ns: ["common", "auth", "exam", "admin", "profile", "landing"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANG_KEY,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
