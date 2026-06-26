"use client";

import { Category } from "@/types";

interface Props {
  categories: Category[];
  activeCategory: string;
  onSelect: (value: string) => void;
}

export default function CategoryFilter({ categories, activeCategory, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3 mb-8 pb-5 border-b border-gray-200">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={`px-5 py-2 text-sm font-medium transition-all duration-200 ${
            activeCategory === cat.value
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500"
          }`}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}