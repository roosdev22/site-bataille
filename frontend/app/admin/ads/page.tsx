"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Play, Pause, Archive, Search, RefreshCw,
  ChevronLeft, ChevronRight, Plus, Trash2, BarChart2, Pencil,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES & TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Ad {
  id: string;
  title: string;
  advertiser_name: string;
  format: string;
  target_category: string;
  status: string;
  priority: number;
  impressions_count: number;
  clicks_count: number;
  ctr: number;
  start_date: string;
  end_date: string | null;
}

interface PaginatedAds {
  count: number;
  results: Ad[];
}

// 1️⃣ État d'erreur structuré
interface ErrorState {
  message: string;
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  draft: "bg-gray-50 text-gray-600 border-gray-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  expired: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-slate-50 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  draft: "Brouillon",
  paused: "En pause",
  expired: "Expirée",
  archived: "Archivée",
};

const FORMAT_LABELS: Record<string, string> = {
  banner_top: "Bannière haut",
  banner_bottom: "Bannière bas",
  sidebar: "Sidebar",
  in_content: "Dans article",
  sticky_footer: "Footer collant",
};

const PAGE_SIZE = 20;

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function AdminAdsPage() {
  const router = useRouter();

  // ─── État ───
  const [ads, setAds] = useState<Ad[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [actionLoading, setAction] = useState<string | null>(null);
  const [deleteAd, setDeleteAd] = useState<Ad | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);  // ✅ État d'erreur

  // ═══════════════════════════════════════════════════════════════════════════
  // 2️⃣ Récupération des données avec gestion d'erreur
  // ═══════════════════════════════════════════════════════════════════════════

  const fetchAds = useCallback(async () => {
    setLoading(true);
    setError(null);  // ✅ Réinitialiser l'erreur avant nouvelle tentative
    
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(PAGE_SIZE),
    });
    
    if (search.trim()) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    try {
      const { data } = await api.get<PaginatedAds>(`/admin/ads/?${params}`);
      setAds(data.results ?? []);
      setCount(data.count ?? 0);
    } catch (err: any) {
      // ✅ Extraction intelligente du message d'erreur
      const message = err.response?.data?.detail 
        || err.message 
        || "Erreur lors du chargement des publicités";
      
      // ✅ Logging console pour débogage
      console.error("Error fetching ads:", err);
      
      // ✅ Stockage pour affichage UI
      setError({ message, timestamp: Date.now() });
      setAds([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // ─── Charger les données au montage ───
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3️⃣ Actions sur les publicités avec gestion d'erreur
  // ═══════════════════════════════════════════════════════════════════════════

  async function handleAdAction(adId: string, action: string) {
    const actionKey = `${adId}:${action}`;
    setAction(actionKey);
    setError(null);  // ✅ Réinitialiser

    try {
      const response = await api.post(`/admin/ads/${adId}/${action}/`, {});
      
      // ✅ Feedback utilisateur explicite
      const successMsg = response.data?.detail 
        || `Action « ${action} » exécutée avec succès.`;
      console.log(`Ad action successful: ${action} on ${adId}`, response.data);
      
      // ✅ Recharger les données
      await fetchAds();
    } catch (err: any) {
      // ✅ Message d'erreur avec contexte
      const message = err.response?.data?.detail 
        || err.message 
        || `Erreur lors de l'action « ${action} »`;
      
      // ✅ Logging console avec contexte
      console.error(`Error performing action '${action}' on ad ${adId}:`, err);
      
      // ✅ Affichage UI
      setError({ message, timestamp: Date.now() });
    } finally {
      setAction(null);
    }
  }

  // ─── Suppression ───
  async function handleDelete() {
    if (!deleteAd) return;
    
    const actionKey = `${deleteAd.id}:delete`;
    setAction(actionKey);
    setError(null);

    try {
      await api.delete(`/admin/ads/${deleteAd.id}/`);
      console.log(`Ad deleted: ${deleteAd.id} (${deleteAd.title})`);
      
      setDeleteAd(null);
      await fetchAds();
    } catch (err: any) {
      const message = err.response?.data?.detail 
        || err.message 
        || "Erreur lors de la suppression de la publicité";
      
      console.error(`Error deleting ad ${deleteAd.id}:`, err);
      setError({ message, timestamp: Date.now() });
    } finally {
      setAction(null);
    }
  }

  // ─── Calculs ───
  const totalPages = Math.ceil(count / PAGE_SIZE);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">

      {/* ─── En-tête ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#1c1c2e]">Publicités</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{count} publicités au total</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={fetchAds} 
            disabled={loading}
            title="Rafraîchir"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Link href="/admin/ads/new">
            <Button 
              size="sm" 
              className="h-8 text-xs bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white gap-1.5"
            >
              <Plus size={13} /> Nouvelle pub
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Message d'erreur ─── */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Erreur</p>
            <p className="text-[13px] text-red-600 mt-0.5">{error.message}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── Filtres ─── */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Rechercher par titre, annonceur…" 
            className="pl-8 h-8 text-xs"
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="paused">En pause</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
            <SelectItem value="archived">Archivées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ─── Tableau des publicités ─── */}
      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="text-left px-3 py-2.5 font-medium">Titre</th>
              <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Annonceur</th>
              <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Format</th>
              <th className="text-left px-3 py-2.5 font-medium">Statut</th>
              <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Imp.</th>
              <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Clics</th>
              <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">CTR</th>
              <th className="text-right px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-t border-gray-50">
                  <td colSpan={8} className="px-3 py-3">
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  </td>
                </tr>
              ))
            ) : ads.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400 text-xs">
                  {search || statusFilter !== "all" 
                    ? "Aucune publicité ne correspond à votre recherche"
                    : "Aucune publicité créée pour le moment"
                  }
                </td>
              </tr>
            ) : (
              ads.map((ad) => (
                <tr key={ad.id} className="border-t border-gray-50 hover:bg-gray-50/40 transition-colors">
                  <td className="px-3 py-2.5 max-w-[160px]">
                    <p className="font-medium truncate text-[#1c1c2e]">{ad.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Priorité {ad.priority}</p>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">
                    {ad.advertiser_name}
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 hidden lg:table-cell">
                    {FORMAT_LABELS[ad.format] ?? ad.format}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[ad.status] ?? ""}`}
                    >
                      {STATUS_LABELS[ad.status] ?? ad.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 hidden sm:table-cell">
                    {ad.impressions_count.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 hidden sm:table-cell">
                    {ad.clicks_count.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-3 py-2.5 text-gray-400 hidden lg:table-cell">
                    {ad.ctr}%
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      {/* ── Modifier ── */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        title="Modifier"
                        onClick={() => router.push(`/admin/ads/${ad.id}/edit`)}
                      >
                        <Pencil size={11} />
                      </Button>

                      {/* ── Activer ── */}
                      {(ad.status === "draft" || ad.status === "paused") && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-green-600 hover:bg-green-50"
                          title="Activer" 
                          disabled={actionLoading === `${ad.id}:activate`}
                          onClick={() => handleAdAction(ad.id, "activate")}
                        >
                          <Play size={11} />
                        </Button>
                      )}

                      {/* ── Pause ── */}
                      {ad.status === "active" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-amber-500 hover:bg-amber-50"
                          title="Mettre en pause" 
                          disabled={actionLoading === `${ad.id}:pause`}
                          onClick={() => handleAdAction(ad.id, "pause")}
                        >
                          <Pause size={11} />
                        </Button>
                      )}

                      {/* ── Archiver ── */}
                      {ad.status !== "archived" && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-500 hover:bg-slate-50"
                          title="Archiver" 
                          disabled={actionLoading === `${ad.id}:archive`}
                          onClick={() => handleAdAction(ad.id, "archive")}
                        >
                          <Archive size={11} />
                        </Button>
                      )}

                      {/* ── Réinitialiser stats ── */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-blue-400 hover:bg-blue-50"
                        title="Réinitialiser les statistiques" 
                        disabled={actionLoading === `${ad.id}:reset_stats`}
                        onClick={() => handleAdAction(ad.id, "reset_stats")}
                      >
                        <BarChart2 size={11} />
                      </Button>

                      {/* ── Supprimer ── */}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Supprimer" 
                        onClick={() => setDeleteAd(ad)}
                      >
                        <Trash2 size={11} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-1">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7" 
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={13} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-7 w-7" 
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Dialog suppression ─── */}
      <Dialog open={!!deleteAd} onOpenChange={(open) => !open && setDeleteAd(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Supprimer la publicité ?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-medium text-red-600">irréversible</span>.
            La pub <span className="font-medium text-[#1c1c2e]">«&nbsp;{deleteAd?.title}&nbsp;»</span> sera définitivement supprimée.
          </p>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={() => setDeleteAd(null)}
            >
              Annuler
            </Button>
            <Button 
              size="sm" 
              className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} 
              disabled={!!actionLoading}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}