"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, UserCheck, UserX, Trash2 } from "lucide-react";
import Link from "next/link";

interface Advertiser {
  id: string; name: string; contact_name: string; email: string;
  phone: string; website: string; is_active: boolean;
  total_ads: number; active_ads: number; created_at: string;
}

export default function AdvertisersPage() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setAction]    = useState<string | null>(null);
  const [deleteAdv, setDeleteAdv]     = useState<Advertiser | null>(null);

  const fetchAdvertisers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/advertisers/");
      setAdvertisers(data.results ?? data);
    } catch {
      setAdvertisers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAdvertisers(); }, [fetchAdvertisers]);

  async function handleAction(id: string, action: string) {
    setAction(id + action);
    try {
      await api.post(`/admin/advertisers/${id}/${action}/`, {});
      fetchAdvertisers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur");
    } finally {
      setAction(null);
    }
  }

  async function handleDelete() {
    if (!deleteAdv) return;
    setAction(deleteAdv.id + "delete");
    try {
      await api.delete(`/admin/advertisers/${deleteAdv.id}/`);
      setDeleteAdv(null);
      fetchAdvertisers();
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setAction(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#1c1c2e]">Annonceurs</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{advertisers.length} annonceurs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={fetchAdvertisers} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
          <Link href="/admin/advertisers/new">
            <Button size="sm" className="h-8 text-xs bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white gap-1.5">
              <Plus size={13} /> Nouvel annonceur
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="text-left px-3 py-2.5 font-medium">Société</th>
              <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Contact</th>
              <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell">Email</th>
              <th className="text-left px-3 py-2.5 font-medium">Statut</th>
              <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Pubs</th>
              <th className="text-right px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td colSpan={6} className="px-3 py-3">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </td>
              </tr>
            )) : advertisers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  Aucun annonceur. <Link href="/admin/advertisers/new" className="text-[#1c1c2e] underline">Créer le premier</Link>
                </td>
              </tr>
            ) : advertisers.map((adv) => (
              <tr key={adv.id} className="border-t border-gray-50 hover:bg-gray-50/40 transition-colors">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-[#1c1c2e]">{adv.name}</p>
                  {adv.website && (
                    <a href={adv.website} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-gray-400 hover:underline">
                      {adv.website.replace("https://", "").replace("http://", "")}
                    </a>
                  )}
                </td>
                <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{adv.contact_name}</td>
                <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{adv.email}</td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${
                    adv.is_active
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {adv.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell">
                  <span className="text-gray-500">{adv.active_ads}</span>
                  <span className="text-gray-300"> / {adv.total_ads}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {adv.is_active ? (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-50"
                        title="Désactiver"
                        disabled={actionLoading === adv.id + "deactivate"}
                        onClick={() => handleAction(adv.id, "deactivate")}>
                        <UserX size={11} />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600 hover:bg-green-50"
                        title="Activer"
                        disabled={actionLoading === adv.id + "activate"}
                        onClick={() => handleAction(adv.id, "activate")}>
                        <UserCheck size={11} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setDeleteAdv(adv)}>
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!deleteAdv} onOpenChange={(o) => !o && setDeleteAdv(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Supprimer l'annonceur ?</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-medium text-red-600">irréversible</span>.
            Toutes les pubs de <span className="font-medium text-[#1c1c2e]">{deleteAdv?.name}</span> seront supprimées.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs"
              onClick={() => setDeleteAdv(null)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={!!actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}