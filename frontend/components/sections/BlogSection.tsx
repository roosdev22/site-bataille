// components/sections/BlogSection.tsx
"use client";

import { useState } from "react";
import { usePosts } from "@/hooks/usePosts";
import { CATEGORIES } from "@/utils/constants";
import Container from "@/components/ui/Container";
import PostGrid from "@/components/blog/PostGrid";
import Pagination from "@/components/ui/Pagination";

// Icônes SVG pour les catégories
const CategoryIcons: Record<string, () => React.ReactNode> = {
  medical: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  travel: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  technology: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  education: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z"/><path d="M8 7h6M8 11h4"/>
    </svg>
  ),
  lifestyle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/><path d="M10 9h4"/>
    </svg>
  ),
  science: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 5 3.5 6.5l-1 3h9l-1-3c2-1.5 3.5-4 3.5-6.5A7 7 0 0 0 12 2z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/><path d="M9 15c.83.67 2 1 3 1s2.17-.33 3-1"/>
    </svg>
  ),
  legal: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 6.5v1L12 15 2 9.5v-1L12 2z"/><path d="M2 15l10 5.5L22 15"/><path d="M2 11.5L12 17l10-5.5"/><path d="M12 17v5"/><path d="M8 20h8"/>
    </svg>
  ),
  finance: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10l4 4 4-4"/>
    </svg>
  ),
};

const SearchIcon = () => (
  <svg className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
);

const ZapIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

export default function BlogSection() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { posts, totalPages, loading } = usePosts({ category, search, page });

  return (
    <section id="articles" className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-white to-[#fafaf8]">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 sm:gap-6 mb-8 sm:mb-10 md:mb-12">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
              bg-[#c9a84c]/10 text-[#c9a84c] text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase">
              <ZapIcon />
              Blog & Actualités
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1c1c2e] tracking-[-0.3px] sm:tracking-[-0.5px]">
              Articles <span className="text-[#c9a84c]">récents</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md">
              Découvrez nos derniers articles sur la médecine, la tech, le voyage et bien plus.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-56 lg:w-64">
            <SearchIcon />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-11 pr-4 sm:pr-5 py-3 sm:py-3.5 bg-white border-2 border-gray-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm
                outline-none focus:border-[#c9a84c]/40 focus:ring-4 focus:ring-[#c9a84c]/5
                transition-all duration-300 placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2.5 mb-8 sm:mb-10">
          {CATEGORIES.map((cat) => {
            const Icon = CategoryIcons[cat.value];
            const isActive = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setPage(1); }}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[11px] sm:text-[13px] font-semibold
                  transition-all duration-300 border-2
                  ${isActive
                    ? "bg-[#1c1c2e] text-white border-[#1c1c2e] shadow-lg sm:shadow-xl shadow-[#1c1c2e]/15"
                    : "bg-white text-gray-500 border-gray-100 hover:border-[#c9a84c]/30 hover:text-[#1c1c2e] hover:shadow-md"
                  }`}
              >
                {Icon && (
                  <span className={isActive ? "text-[#c9a84c]" : "text-gray-400"}>
                    <Icon />
                  </span>
                )}
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Posts Grid */}
        <PostGrid posts={posts} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 sm:mt-10 md:mt-12">
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Container>
    </section>
  );
}