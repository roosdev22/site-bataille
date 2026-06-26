// app/admin/comments/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Check, X, Trash2, Search, RefreshCw,
  ChevronLeft, ChevronRight, MessageSquare,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_email: string;
  post_title: string;
  post_id: string;
  status: string;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-50 text-green-700 border-green-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  approved: "Approuvé",
  pending:  "En attente",
  rejected: "Rejeté",
};

export default function AdminCommentsPage() {
  const [comments, setComments]    = useState<Comment[]>([]);
  const [count, setCount]          = useState(0);
  const [loading, setLoading]      = useState(true);
  const [page, setPage]            = useState(1);
  const [search, setSearch]        = useState("");
  const [statusFilter, setStatus]  = useState("all");
  const [actionLoading, setAction] = useState<string | null>(null);
  const [deleteComment, setDeleteComment] = useState<Comment | null>(null);
  const PAGE_SIZE = 20;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (search)                 p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    try {
      const { data } = await api.get<any>(`/admin/comments/?${p}`);
      if (Array.isArray(data)) {
        setComments(data);
        setCount(data.length);
      } else {
        setComments(data.results ?? []);
        setCount(data.count ?? 0);
      }
    } catch {
      setComments([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function commentAction(id: string, action: string) {
    setAction(id + action);
    try {
      await api.post(`/admin/comments/${id}/${action}/`, {});
      fetchComments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur");
    } finally {
      setAction(null);
    }
  }

  async function handleDelete() {
    if (!deleteComment) return;
    setAction(deleteComment.id + "delete");
    try {
      await api.delete(`/admin/comments/${deleteComment.id}/`);
      setDeleteComment(null);
      fetchComments();
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setAction(null);
    }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[#1c1c2e]">Commentaires</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{count} commentaires au total</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchComments} disabled={loading}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Rechercher par auteur, contenu…" className="pl-8 h-8 text-xs"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-[160px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvés</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-gray-100 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider">
              <th className="text-left px-3 py-2.5 font-medium">Auteur</th>
              <th className="text-left px-3 py-2.5 font-medium">Commentaire</th>
              <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell">Article</th>
              <th className="text-left px-3 py-2.5 font-medium">Statut</th>
              <th className="text-left px-3 py-2.5 font-medium hidden sm:table-cell">Date</th>
              <th className="text-right px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td colSpan={6} className="px-3 py-3">
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                </td>
              </tr>
            )) : comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                  Aucun commentaire trouvé
                </td>
              </tr>
            ) : comments.map((comment) => (
              <tr key={comment.id} className="border-t border-gray-50 hover:bg-gray-50/40 transition-colors">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-[#1c1c2e]">{comment.author_name}</p>
                  <p className="text-[10px] text-gray-400">{comment.author_email}</p>
                </td>
                <td className="px-3 py-2.5 max-w-[200px]">
                  <p className="truncate text-gray-600">{comment.content}</p>
                </td>
                <td className="px-3 py-2.5 hidden lg:table-cell max-w-[160px]">
                  <p className="truncate text-gray-500">{comment.post_title}</p>
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[comment.status] ?? ""}`}>
                    {STATUS_LABELS[comment.status] ?? comment.status}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-gray-400 hidden sm:table-cell">
                  {new Date(comment.created_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-1">
                    {comment.status === "pending" && (
                      <Button variant="ghost" size="icon"
                        className="h-6 w-6 text-green-600 hover:bg-green-50"
                        title="Approuver"
                        disabled={actionLoading === comment.id + "approve"}
                        onClick={() => commentAction(comment.id, "approve")}>
                        <Check size={12} />
                      </Button>
                    )}
                    {comment.status === "pending" && (
                      <Button variant="ghost" size="icon"
                        className="h-6 w-6 text-red-500 hover:bg-red-50"
                        title="Rejeter"
                        disabled={actionLoading === comment.id + "reject"}
                        onClick={() => commentAction(comment.id, "reject")}>
                        <X size={12} />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                      title="Supprimer"
                      onClick={() => setDeleteComment(comment)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}><ChevronLeft size={13} /></Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}><ChevronRight size={13} /></Button>
          </div>
        </div>
      )}

      <Dialog open={!!deleteComment} onOpenChange={(o) => !o && setDeleteComment(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Supprimer le commentaire ?</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-medium text-red-600">irréversible</span>.
            Le commentaire de <span className="font-medium text-[#1c1c2e]">{deleteComment?.author_name}</span> sera définitivement supprimé.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs"
              onClick={() => setDeleteComment(null)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={!!actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}