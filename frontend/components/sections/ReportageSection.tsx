// components/sections/ReportageSection.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Container from "@/components/ui/Container";
import { OptimizedImage } from "@/components/reportage/OptimizedImage";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;

// Icônes SVG
const Icons = {
  Camera: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
  Calendar: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>,
  Film: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect width="20" height="20" x="2" y="2" rx="2.18"/><path d="M7 2v20"/><path d="M17 2v20"/><path d="M2 12h20"/><path d="M2 7h5"/><path d="M2 17h5"/><path d="M17 17h5"/><path d="M17 7h5"/></svg>,
};

// ✅ CORRIGÉ: Interface alignée avec l'API réelle
interface Reportage {
  slug: string;
  title: string;
  subtitle: string;
  cover_image_url: string | null;
  meta_description: string;
  published_at: string;
  views_count: number;
  featured: boolean;
  status: string;
  reading_time: number;
}

export default function ReportageSection() {
  const router = useRouter();
  const [reportages, setReportages] = useState<Reportage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/reportages/?page_size=4`)
      .then((r) => {
        if (!r.ok) throw new Error("Erreur API");
        return r.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setReportages(list);
      })
      .catch((err) => {
        console.error("Erreur reportages:", err);
        setReportages([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="reportages" className="py-16 sm:py-20 md:py-28 bg-gradient-to-b from-[#fafaf8] to-white">
      <Container>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 sm:mb-14 md:mb-16"
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full 
              bg-[#c9a84c]/10 text-[10px] sm:text-[11px] font-bold tracking-[0.15em] uppercase mb-4 sm:mb-6
            border border-[#c9a84c]/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a84c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a84c]" />
            </span>
            Reportages
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#1c1c2e] tracking-[-0.5px] sm:tracking-[-1px] mb-3 sm:mb-4">
            Nos{" "}
            <span className="relative inline-block">
              <span className="text-[#c9a84c]">reportages</span>
              <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-[#c9a84c]/20 rounded-full" />
            </span>{" "}
            exclusifs
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-500 max-w-xl mx-auto px-4 leading-relaxed">
            Des enquêtes de terrain, des interviews et des documentaires vidéo
          </p>
        </motion.div>

        {/* Grille */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="h-52 sm:h-64 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded-full w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : reportages.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-5">
              <Icons.Film />
            </div>
            <p className="text-sm font-medium">Aucun reportage pour le moment.</p>
            <p className="text-xs text-gray-300 mt-1">Revenez bientôt pour nos enquêtes exclusives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            {reportages.map((reportage, i) => (
              <motion.article
                key={reportage.slug}  
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-white border border-gray-100/80 rounded-2xl sm:rounded-3xl overflow-hidden
                  shadow-sm hover:shadow-2xl hover:shadow-gray-200/60 hover:-translate-y-1
                  transition-all duration-500 ease-out cursor-pointer"
                onClick={() => {
                  if (reportage.slug) {
                    router.push(`/reportages/${reportage.slug}`);
                  }
                }}
              >
                {/* Image - UTILISE OptimizedImage */}
                <div className="relative h-52 sm:h-64 overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
                  {reportage.cover_image_url ? (  
                    <OptimizedImage
                      src={reportage.cover_image_url}  
                      alt={reportage.title}
                      fill
                      className="w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
                      objectFit="cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <Icons.Film />
                    </div>
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1c1c2e]/50 via-transparent to-transparent" />

                  {/* Status badge */}
                  <span className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-md 
                    rounded-full text-[11px] font-bold text-[#1c1c2e] shadow-sm">
                    {reportage.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>

                  {/* Overlay hover */}
                  <div className="absolute inset-0 bg-[#1c1c2e]/70 opacity-0 group-hover:opacity-100 
                    transition-all duration-500 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 
                      flex items-center justify-center text-white scale-75 group-hover:scale-100 
                      transition-all duration-500 shadow-2xl">
                      <Icons.ArrowRight />
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="p-5 sm:p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-3 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="text-red-400">
                        <Icons.Calendar />
                      </span>
                      {new Date(reportage.published_at).toLocaleDateString("fr-FR", { 
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1.5 text-blue-400">
                      📖 {reportage.reading_time} min
                    </span>
                  </div>

                  {/* Titre */}
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#1c1c2e] mb-2.5 
                    group-hover:text-red-600 transition-colors duration-300 line-clamp-2 leading-snug">
                    {reportage.title}
                  </h3>

                  {/* Extrait */}
                  <p className="text-[13px] sm:text-sm text-gray-500 line-clamp-2 mb-5 leading-relaxed">
                    {reportage.meta_description || reportage.subtitle}  {/* ✅ CORRIGÉ */}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                      <Icons.Eye /> {reportage.views_count.toLocaleString("fr-FR")} vues
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 
                      group-hover:gap-2.5 transition-all duration-300">
                      Voir le reportage
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        <Icons.ArrowRight />
                      </span>
                    </span>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}