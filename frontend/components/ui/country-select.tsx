"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Liste des pays courants avec drapeaux et indicatifs
const COUNTRIES = [
  { code: "HT", name: "Haïti", dial: "+509", flag: "🇭🇹" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "US", name: "États-Unis", dial: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "BE", name: "Belgique", dial: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Suisse", dial: "+41", flag: "🇨🇭" },
  { code: "DO", name: "Rép. Dominicaine", dial: "+1", flag: "🇩🇴" },
  { code: "JM", name: "Jamaïque", dial: "+1", flag: "🇯🇲" },
  { code: "CU", name: "Cuba", dial: "+53", flag: "🇨🇺" },
  { code: "MX", name: "Mexique", dial: "+52", flag: "🇲🇽" },
  { code: "BR", name: "Brésil", dial: "+55", flag: "🇧🇷" },
  { code: "GB", name: "Royaume-Uni", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Allemagne", dial: "+49", flag: "🇩🇪" },
  { code: "ES", name: "Espagne", dial: "+34", flag: "🇪🇸" },
  { code: "IT", name: "Italie", dial: "+39", flag: "🇮🇹" },
];

interface CountrySelectProps {
  value: string;
  onChange: (phone: string) => void;
  error?: string;
}

export function CountryPhoneInput({ value, onChange, error }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Haïti par défaut
  const [localNumber, setLocalNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCountrySelect(country: typeof COUNTRIES[0]) {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange(`${country.dial}${localNumber}`);
  }

  function handleNumberChange(num: string) {
    setLocalNumber(num);
    onChange(`${selectedCountry.dial}${num}`);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-1">
        {/* Sélecteur de pays */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1 h-9 px-2 rounded-md border border-input bg-white text-sm",
            "hover:bg-gray-50 transition-colors min-w-[90px]",
            error && "border-red-500"
          )}
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-xs">{selectedCountry.dial}</span>
          <svg className="w-3 h-3 ml-0.5" viewBox="0 0 10 6" fill="none" stroke="currentColor">
            <path d="M1 1l4 4 4-4" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Input numéro */}
        <Input
          className="text-sm h-9 flex-1"
          placeholder="XX XX XX XX"
          value={localNumber}
          onChange={(e) => handleNumberChange(e.target.value)}
        />
      </div>

      {/* Dropdown des pays */}
      {isOpen && (
        <div className="absolute z-50 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left",
                selectedCountry.code === country.code && "bg-gray-50 font-medium"
              )}
            >
              <span className="text-lg">{country.flag}</span>
              <span>{country.name}</span>
              <span className="ml-auto text-gray-400 text-xs">{country.dial}</span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}