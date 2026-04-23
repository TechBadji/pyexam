import { useTranslation } from "react-i18next";

const LANGS = ["fr", "en"] as const;

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language.startsWith("fr") ? "fr" : "en";

  const toggle = (lang: (typeof LANGS)[number]) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("pyexam_lang", lang);
  };

  return (
    <div className="flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-600 p-0.5">
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => toggle(lang)}
          className={`px-2 py-0.5 rounded text-sm font-medium transition-colors ${
            current === lang
              ? "bg-brand-600 text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
