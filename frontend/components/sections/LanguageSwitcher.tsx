"use client";

import { useState } from "react";

const languages = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "ht", label: "Kreyòl", flag: "🇭🇹" },
];

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState(languages[0]);

  const changeLanguage = (lang: typeof languages[number]) => {
    setCurrent(lang);

    // Exemple : sauvegarder la langue
    localStorage.setItem("language", lang.code);

    // Ici tu pourras recharger les articles
    // router.refresh() ou fetch avec ?language=lang.code
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <span>{current.flag}</span>
        <span>{current.label}</span>
      </button>

      <div className="absolute right-0 mt-2 hidden w-48 rounded-lg border bg-white shadow-lg group-hover:block">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang)}
            className="flex w-full items-center gap-3 px-4 py-3 hover:bg-gray-100"
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}