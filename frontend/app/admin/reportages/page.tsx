"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import {
  Plus, Camera, Eye, Calendar, Clock, Loader2, Pencil, Trash2,
  Search, Star, AlertCircle, ExternalLink, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Reportage {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  status: "draft" | "review" | "published";
  author_name: string;
  cover_image_url: string | null;
  reading_time: number;
  views_count: number;
  featured: boolean;
  published_at: string | null;
  created_at: string;
}

interface PaginatedResponse {
  count: number;
  page: number;
  page_size: number;
  results: Reportage[];
}

type StatusFilter = "all" | "draft" | "review" | "published";

// ═══════════════════════════════════════════
// Constantes
// ═══════════════════════════════════════════

const STATUS_CONFIG: Record<StatusFilter, { label: string }> = {
  all: { label: "Tous" },
  draft: { label: "Brouillons" },
  review: { label: "En révision" },
  published: { label: "Publiés" },
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-gray-100 text-gray-600" },
  review: { label: "En révision", className: "bg-yellow-100 text-yellow-700" },
  published: { label: "Publié", className: "bg-green-100 text-green-700" },
};

// ═══════════════════════════════════════════
// Hooks Personnalisés
// ═══════════════════════════════════════════

/**
 * Hook pour gérer le debounce de la recherche
 * Évite le filtrage à chaque keystroke
 */
function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ═══════════════════════════════════════════
// Composant Principal
// ═══════════════════════════════════════════

export default function ReportagesListPage() {
  // ─── State ───
  const [reportages, setReportages] = useState<Reportage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Debounced Search ───
  const searchTerm = useDebouncedValue(searchInput, 300);

  // ─── Pagination ───
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 6;

  // ═══════════════════════════════════════════
  // API Calls
  // ═══════════════════════════════════════════

  const fetchReportages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      params.append("page", String(currentPage));
      params.append("page_size", String(PAGE_SIZE));

      const response = await api.get<PaginatedResponse>(
        `/reportages/?${params.toString()}`
      );

      const { count, results } = response.data;

      setReportages(results || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error("❌ Erreur chargement reportages:", err);
      const message =
        err.response?.data?.detail || "Impossible de charger les reportages.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage]);

  // ─── Auto-dismiss success message ───
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // ─── Reset page quand filtre/recherche change ───
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // ─── Fetch reportages ───
  useEffect(() => {
    fetchReportages();
  }, [fetchReportages]);

  // ═══════════════════════════════════════════
  // Actions
  // ═══════════════════════════════════════════

  const handleDelete = async (slug: string, title: string) => {
    if (
      !confirm(`Supprimer définitivement "${title}" ?\n\nCette action est irréversible.`)
    ) {
      return;
    }

    setDeleteLoading(slug);
    try {
      await api.delete(`/reportages/${slug}/`);

      // ✅ Update local state
      setReportages(prev => prev.filter(r => r.slug !== slug));
      setTotalCount(prev => prev - 1);

      // ✅ Success feedback
      setSuccessMessage(`"${title}" supprimé avec succès`);
    } catch (err: any) {
      const message = err.response?.data?.detail || "Erreur lors de la suppression";
      setError(message);
    } finally {
      setDeleteLoading(null);
    }
  };

  // ═══════════════════════════════════════════
  // Computed & Memos (Optimisé)
  // ═══════════════════════════════════════════

  // ✅ useMemo : Filtre seulement quand searchTerm change
  const filteredReportages = useMemo(() => {
    if (!searchTerm.trim()) return reportages;

    const term = searchTerm.toLowerCase();
    return reportages.filter(
      r =>
        r.title.toLowerCase().includes(term) ||
        (r.subtitle?.toLowerCase() || "").includes(term) ||
        r.author_name.toLowerCase().includes(term)
    );
  }, [reportages, searchTerm]);

  // ✅ useMemo : Calcule les counts une seule fois
  const counts = useMemo(
    () => ({
      total: totalCount,
      published: reportages.filter(r => r.status === "published").length,
      draft: reportages.filter(r => r.status === "draft").length,
      review: reportages.filter(r => r.status === "review").length,
      featured: reportages.filter(r => r.featured).length,
    }),
    [totalCount, reportages]
  );

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // ═══════════════════════════════════════════
  // Render - Loading
  // ═══════════════════════════════════════════

  if (loading && reportages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center animate-pulse">
          <Camera size={28} className="text-rose-400" />
        </div>
        <p className="text-sm text-gray-400">Chargement des reportages...</p>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render - Error
  // ═══════════════════════════════════════════

  if (error && reportages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <p className="text-sm text-red-500">{error}</p>
        <Button onClick={fetchReportages} className="h-10 px-4 rounded-xl">
          Réessayer
        </Button>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render - Empty
  // ═══════════════════════════════════════════

  if (reportages.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <Camera size={20} className="text-rose-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reportages</h1>
              <p className="text-sm text-gray-500">Aucun reportage pour le moment</p>
            </div>
          </div>
          <Link href="/admin/reportages/new">
            <Button className="bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold text-sm h-10 px-4 rounded-xl">
              <Plus size={16} className="mr-2" />
              Nouveau reportage
            </Button>
          </Link>
        </div>

        <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 flex items-center justify-center mb-6">
              <Camera size={40} className="text-rose-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Créez votre premier reportage
            </h3>
            <p className="text-sm text-gray-500 max-w-md text-center mb-8">
              Les reportages vous permettent de créer du contenu immersif long format
              avec des blocs de texte, images, vidéos, timelines et plus encore.
            </p>
            <Link href="/admin/reportages/new">
              <Button className="bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold h-11 px-6 rounded-xl">
                <Plus size={18} className="mr-2" />
                Nouveau reportage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // Render - Main
  // ═══════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ─── Success Toast ─── */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 animate-in fade-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <p className="text-sm text-green-700">{successMessage}</p>
        </div>
      )}

      {/* ─── Error Banner (si partial failure) ─── */}
      {error && reportages.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={16} className="text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <Camera size={20} className="text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reportages</h1>
            <p className="text-sm text-gray-500">
              {counts.total} reportage{counts.total !== 1 ? "s" : ""}
              {counts.published > 0 &&
                ` · ${counts.published} publié${counts.published !== 1 ? "s" : ""}`}
              {counts.featured > 0 && ` · ${counts.featured} en avant`}
            </p>
          </div>
        </div>
        <Link href="/admin/reportages/new">
          <Button className="bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold text-sm h-10 px-4 rounded-xl shadow-lg shadow-[#c9a84c]/20 active:scale-95 transition-all">
            <Plus size={16} className="mr-2" />
            Nouveau reportage
          </Button>
        </Link>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Rechercher un reportage..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(Object.keys(STATUS_CONFIG) as StatusFilter[]).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                statusFilter === status
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Grid ─── */}
      {filteredReportages.length === 0 ? (
        <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search size={32} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              Aucun reportage ne correspond à votre recherche
            </p>
            <button
              onClick={() => {
                setSearchInput("");
                setStatusFilter("all");
              }}
              className="text-sm text-[#c9a84c] hover:underline mt-2"
            >
              Réinitialiser les filtres
            </button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReportages.map(reportage => (
              <Card
                key={reportage.id}
                className="group border-gray-100 shadow-none rounded-[1.25rem] overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-44 bg-gray-100 overflow-hidden">
                  {reportage.cover_image_url ? (
                    <img
                      src={reportage.cover_image_url}
                      alt={reportage.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <Camera size={40} className="text-gray-300" />
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_BADGE[reportage.status]?.className
                      }`}
                    >
                      {STATUS_BADGE[reportage.status]?.label}
                    </span>
                    {reportage.featured && (
                      <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-700">
                        <Star size={10} className="inline mr-0.5" />
                        En avant
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 leading-snug">
                    {reportage.title}
                  </h3>
                  {reportage.subtitle && (
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                      {reportage.subtitle}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {reportage.views_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {reportage.reading_time} min
                    </span>
                    {reportage.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(reportage.published_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-400 mb-4">
                    Par{" "}
                    <span className="font-medium text-gray-600">
                      {reportage.author_name}
                    </span>
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                    <Link
                      href={`/admin/reportages/${reportage.slug}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs rounded-lg border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      >
                        <Pencil size={13} className="mr-1.5" />
                        Modifier
                      </Button>
                    </Link>
                    <Link
                      href={`/reportages/${reportage.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Voir le reportage"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <ExternalLink size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 rounded-lg"
                      onClick={() =>
                        handleDelete(reportage.slug, reportage.title)
                      }
                      disabled={deleteLoading === reportage.slug}
                      title="Supprimer"
                    >
                      {deleteLoading === reportage.slug ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ─── Pagination ─── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                {totalCount} reportage{totalCount !== 1 ? "s" : ""} · Page{" "}
                {currentPage} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-9 px-4 rounded-xl text-sm"
                >
                  <ChevronLeft size={14} className="mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-9 px-4 rounded-xl text-sm"
                >
                  Suivant
                  <ChevronRight size={14} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}