// app/admin/posts/page.tsx
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

// Icônes SVG
const Icons = {
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  X: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Archive: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Refresh: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>,
  ChevronLeft: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  ChevronRight: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>,
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Pencil: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>,
  Trash: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>,
  Loader: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
};

interface Author { id: string; full_name: string; }
interface Post {
  id: string; title: string; author: Author; category_display: string;
  status: string; status_display: string;
  views_count: number; created_at: string;
}
interface PaginatedPosts { count: number; results: Post[]; }

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  draft:     "bg-gray-50 text-gray-600 border-gray-200",
  rejected:  "bg-red-50 text-red-700 border-red-200",
  archived:  "bg-slate-50 text-slate-600 border-slate-200",
};
const STATUS_LABELS: Record<string, string> = {
  published: "Publié", pending: "En attente", draft: "Brouillon",
  rejected: "Rejeté", archived: "Archivé",
};

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatus] = useState("all");
  const [actionLoading, setAction] = useState<string | null>(null);
  const [rejectPost, setRejectPost] = useState<Post | null>(null);
  const [rejectionNote, setRejection] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [deletePost, setDeletePost] = useState<Post | null>(null);
  const PAGE_SIZE = 20;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    try {
      const { data } = await api.get<any>(`/admin/posts/?${p}`);
      if (Array.isArray(data)) { setPosts(data); setCount(data.length); }
      else { setPosts(data.results ?? []); setCount(data.count ?? 0); }
    } catch (err) { console.error("fetchPosts error:", err); setPosts([]); setCount(0); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  async function postAction(postId: string, action: string, body?: object) {
    setAction(postId + action);
    try { await api.post(`/admin/posts/${postId}/${action}/`, body ?? {}); return true; }
    catch (err: any) { alert(err.response?.data?.detail || "Erreur"); return false; }
    finally { setAction(null); }
  }

  async function handleDelete() {
    if (!deletePost) return;
    setAction(deletePost.id + "delete");
    try { await api.delete(`/admin/posts/${deletePost.id}/`); setDeletePost(null); fetchPosts(); }
    catch { alert("Erreur lors de la suppression"); }
    finally { setAction(null); }
  }

  async function handleRejectConfirm() {
    if (!rejectPost) return;
    if (rejectionNote.trim().length < 10) { setRejectError("Motif trop court (min. 10 car.)."); return; }
    const ok = await postAction(rejectPost.id, "reject", { rejection_note: rejectionNote });
    if (ok) { setRejectPost(null); setRejection(""); setRejectError(""); fetchPosts(); }
  }

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-[#1c1c2e] tracking-tight">Articles</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{count} articles au total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={fetchPosts} disabled={loading}>
            {loading ? <Icons.Loader /> : <Icons.Refresh />}
          </Button>
          <Link href="/admin/posts/new">
            <Button size="sm" className="h-9 text-xs bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white gap-2 rounded-xl font-semibold shadow-lg shadow-[#1c1c2e]/10">
              <Icons.Plus /> Nouvel article
            </Button>
          </Link>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"><Icons.Search /></span>
          <Input placeholder="Rechercher par titre, auteur…" className="pl-10 h-10 text-sm rounded-2xl bg-gray-50 border-gray-100"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[170px] text-sm rounded-2xl bg-gray-50 border-gray-100"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="published">Publiés</SelectItem>
            <SelectItem value="draft">Brouillons</SelectItem>
            <SelectItem value="rejected">Rejetés</SelectItem>
            <SelectItem value="archived">Archivés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] text-gray-400 uppercase tracking-wider border-b">
              <th className="text-left px-4 py-3 font-bold">Titre</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Auteur</th>
              <th className="text-left px-4 py-3 font-bold hidden lg:table-cell">Catégorie</th>
              <th className="text-left px-4 py-3 font-bold">Statut</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Vues</th>
              <th className="text-right px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-t border-gray-50">
                <td colSpan={6} className="px-4 py-3.5"><div className="h-3 bg-gray-100 rounded-full animate-pulse w-3/4" /></td>
              </tr>
            )) : posts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400">Aucun article trouvé</td></tr>
            ) : posts.map(post => (
              <tr key={post.id} className="border-t border-gray-50 hover:bg-gray-50/30 transition-colors">
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-semibold truncate text-[#1c1c2e]">{post.title}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(post.created_at).toLocaleDateString("fr-FR")}</p>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{post.author?.full_name}</td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{post.category_display}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[post.status] ?? ""}`}>
                    {STATUS_LABELS[post.status] ?? post.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{post.views_count.toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/posts/${post.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-gray-100" title="Voir"><Icons.Eye /></Button>
                    </Link>
                    <Link href={`/admin/posts/${post.id}?edit=1`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-blue-50 hover:text-blue-600" title="Modifier"><Icons.Pencil /></Button>
                    </Link>
                    {(post.status === "pending" || post.status === "draft") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-emerald-600 hover:bg-emerald-50" title="Publier"
                        disabled={actionLoading === post.id + "publish"}
                        onClick={async () => { const ok = await postAction(post.id, "publish"); if (ok) fetchPosts(); }}>
                        <Icons.Check />
                      </Button>
                    )}
                    {post.status === "pending" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-red-500 hover:bg-red-50" title="Rejeter"
                        onClick={() => { setRejectPost(post); setRejection(""); setRejectError(""); }}>
                        <Icons.X />
                      </Button>
                    )}
                    {post.status === "published" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-500 hover:bg-slate-50" title="Archiver"
                        disabled={actionLoading === post.id + "archive"}
                        onClick={async () => { const ok = await postAction(post.id, "archive"); if (ok) fetchPosts(); }}>
                        <Icons.Archive />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50" title="Supprimer"
                      onClick={() => setDeletePost(post)}>
                      <Icons.Trash />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page === 1} onClick={() => setPage(p => p - 1)}><Icons.ChevronLeft /></Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-xl" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><Icons.ChevronRight /></Button>
          </div>
        </div>
      )}

      {/* Modal Rejet */}
      <Dialog open={!!rejectPost} onOpenChange={o => !o && setRejectPost(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-sm font-bold">Rejeter l'article</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">Article : <span className="font-semibold text-[#1c1c2e]">{rejectPost?.title}</span></p>
            <Textarea placeholder="Motif du rejet (min. 10 caractères)…" className="text-sm min-h-[100px] resize-none rounded-2xl bg-gray-50 border-gray-100"
              value={rejectionNote} onChange={e => { setRejection(e.target.value); setRejectError(""); }} />
            {rejectError && <p className="text-[11px] text-red-500 font-medium">{rejectError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => setRejectPost(null)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={handleRejectConfirm} disabled={!!actionLoading}>Confirmer le rejet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Supprimer */}
      <Dialog open={!!deletePost} onOpenChange={o => !o && setDeletePost(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-sm font-bold">Supprimer l'article ?</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-semibold text-red-600">irréversible</span>.
            L'article <span className="font-semibold text-[#1c1c2e]">« {deletePost?.title} »</span> sera définitivement supprimé.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs rounded-xl" onClick={() => setDeletePost(null)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={handleDelete} disabled={!!actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}