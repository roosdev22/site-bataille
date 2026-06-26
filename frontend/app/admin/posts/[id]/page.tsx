"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api"
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Pencil, Check, X, Archive, Trash2, Save, Eye,
} from "lucide-react";
import Link from "next/link";

interface Tag { id: number; name: string; slug: string; }
interface Post {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; category_display: string; status: string;
  author: { id: string; full_name: string };
  tags: Tag[]; meta_title: string; meta_description: string;
  views_count: number; created_at: string; published_at: string | null;
  rejection_note: string;
}


const CATEGORIES = [
  { value: "medical", label: "Médical" },
  { value: "travel", label: "Voyage" },
  { value: "technology", label: "Technologie" },
  { value: "education", label: "Éducation" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "science", label: "Science" },
  { value: "legal", label: "Juridique" },
  { value: "finance", label: "Finance" },
  { value: "other", label: "Autre" },
];

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-50 text-green-700 border-green-200",
  pending:   "bg-amber-50 text-amber-700 border-amber-200",
  draft:     "bg-gray-50 text-gray-600 border-gray-200",
  rejected:  "bg-red-50 text-red-700 border-red-200",
  archived:  "bg-slate-50 text-slate-600 border-slate-200",
};
const STATUS_LABELS: Record<string, string> = {
  published: "Publié", pending: "En attente", draft: "Brouillon",
  rejected: "Rejeté", archived: "Archivé",
};

export default function PostDetailPage() {
  const { id }            = useParams<{ id: string }>();
  const searchParams      = useSearchParams();
  const router            = useRouter();

  const [post, setPost]         = useState<Post | null>(null);
  const [allTags, setAllTags]   = useState<Tag[]>([]);
  const [loading, setLoading]   = useState(true);
  const [editMode, setEditMode] = useState(searchParams.get("edit") === "1");
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [actionLoading, setAction] = useState<string | null>(null);

  // Reject dialog
  const [showReject, setShowReject]   = useState(false);
  const [rejectionNote, setRejection] = useState("");
  const [rejectError, setRejectError] = useState("");

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false);

  // Form state
useEffect(() => {
  Promise.all([
    api.get(`/admin/posts/${id}/`).then(({ data }) => data),
    api.get("/tags/").then(({ data }) => data).catch(() => []),
  ]).then(([postData, tagsData]) => {
    setPost(postData)
    setAllTags(tagsData)
    setForm({
      title:            postData.title,
      excerpt:          postData.excerpt,
      content:          postData.content,
      category:         postData.category,
      meta_title:       postData.meta_title,
      meta_description: postData.meta_description,
      tags:             postData.tags.map((t: Tag) => t.id),
    })
  }).catch(() => {}).finally(() => setLoading(false))
}, [id])

async function handleSave() {
  if (!validate()) return
  setSaving(true)
  try {
    const body = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === "tags") (v as number[]).forEach((tid) => body.append("tags", String(tid)))
      else body.append(k, String(v))
    })
    const { data: updated } = await api.patch(`/admin/posts/${id}/`, body)
    setPost(updated)
    setEditMode(false)
  } catch (err: any) {
    const mapped: Record<string, string> = {}
    Object.entries(err.response?.data ?? {}).forEach(([k, v]) => {
      mapped[k] = Array.isArray(v) ? v[0] : String(v)
    })
    setErrors(mapped)
  } finally {
    setSaving(false)
  }
}

async function postAction(action: string, body?: object) {
  setAction(action)
  try {
    await api.post(`/admin/posts/${id}/${action}/`, body ?? {})
    return true
  } catch (err: any) {
    alert(err.response?.data?.detail || "Erreur")
    return false
  } finally {
    setAction(null)
  }
}

async function handlePublish() {
  const ok = await postAction("publish")
  if (ok) {
    const { data } = await api.get(`/admin/posts/${id}/`)
    setPost(data)
  }
}

async function handleArchive() {
  const ok = await postAction("archive")
  if (ok) {
    const { data } = await api.get(`/admin/posts/${id}/`)
    setPost(data)
  }
}

async function handleRejectConfirm() {
  if (rejectionNote.trim().length < 10) { setRejectError("Motif trop court (min. 10 car.)."); return }
  const ok = await postAction("reject", { rejection_note: rejectionNote })
  if (ok) {
    setShowReject(false)
    setRejection("")
    setRejectError("")
    const { data } = await api.get(`/admin/posts/${id}/`)
    setPost(data)
  }
}
const [form, setForm] = useState({
  title: "", excerpt: "", content: "", category: "other",
  meta_title: "", meta_description: "", tags: [] as number[],
})

function setField(field: string, value: string | number[]) {
  setForm((f) => ({ ...f, [field]: value }))
  setErrors((e) => { const n = { ...e }; delete n[field]; return n })
}

function toggleTag(tagId: number) {
  setForm((f) => ({
    ...f,
    tags: f.tags.includes(tagId) ? f.tags.filter((t) => t !== tagId) : [...f.tags, tagId],
  }))
}

function validate() {
  const e: Record<string, string> = {}
  if (form.title.trim().length < 10)        e.title   = "Titre trop court (min. 10 car.)."
  if (form.excerpt.trim().length < 30)       e.excerpt = "Résumé trop court (min. 30 car.)."
  if (form.content.split(/\s+/).length < 50) e.content = "Contenu trop court (min. 50 mots)."
  setErrors(e)
  return Object.keys(e).length === 0
}

async function handleDelete() {
  setAction("delete")
  try {
    await api.delete(`/admin/posts/${id}/`)
    router.push("/admin/posts")
  } catch {
    alert("Erreur lors de la suppression")
  } finally {
    setAction(null)
  }
}

  if (loading) return (
    <div className="space-y-4 max-w-3xl animate-pulse">
      <div className="h-6 bg-gray-100 rounded w-1/3" />
      <div className="h-40 bg-gray-100 rounded" />
    </div>
  );

  if (!post) return (
    <div className="text-center py-20 text-gray-400">
      <p className="text-sm">Article introuvable.</p>
      <Link href="/admin/posts"><Button variant="link" className="text-xs mt-2">← Retour</Button></Link>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-5">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/posts">
            <Button variant="ghost" size="icon" className="h-8 w-8"><ArrowLeft size={15} /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[#1c1c2e] line-clamp-1">{post.title}</h1>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${STATUS_STYLES[post.status] ?? ""}`}>
                {STATUS_LABELS[post.status] ?? post.status}
              </Badge>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Par {post.author?.full_name} · {post.views_count.toLocaleString("fr-FR")} vues
            </p>
          </div>
        </div>

        {/* Barre d'actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!editMode && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8"
              onClick={() => setEditMode(true)}>
              <Pencil size={12} /> Modifier
            </Button>
          )}
          {(post.status === "pending" || post.status === "draft") && (
            <Button size="sm" className="text-xs bg-green-600 hover:bg-green-700 text-white gap-1.5 h-8"
              disabled={!!actionLoading} onClick={handlePublish}>
              <Check size={12} /> Publier
            </Button>
          )}
          {post.status === "pending" && (
            <Button variant="outline" size="sm"
              className="text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5 h-8"
              onClick={() => { setShowReject(true); setRejection(""); setRejectError(""); }}>
              <X size={12} /> Rejeter
            </Button>
          )}
          {post.status === "published" && (
            <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8"
              disabled={!!actionLoading} onClick={handleArchive}>
              <Archive size={12} /> Archiver
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
            onClick={() => setShowDelete(true)}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Note de rejet */}
      {post.status === "rejected" && post.rejection_note && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-[11px] font-medium text-red-700 mb-0.5">Motif du rejet</p>
          <p className="text-xs text-red-600">{post.rejection_note}</p>
        </div>
      )}

      {/* ── MODE LECTURE ─────────────────────────────────────── */}
      {!editMode ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Catégorie</p>
              <p className="font-medium text-[#1c1c2e]">{post.category_display}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Créé le</p>
              <p className="font-medium text-[#1c1c2e]">
                {new Date(post.created_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
              </p>
            </div>
            {post.published_at && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Publié le</p>
                <p className="font-medium text-[#1c1c2e]">
                  {new Date(post.published_at).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                </p>
              </div>
            )}
            {post.tags.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {post.tags.map((t) => (
                    <span key={t.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Résumé</p>
            <p className="text-xs text-gray-600 leading-relaxed">{post.excerpt}</p>
          </div>

          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Contenu</p>
            <div className="prose prose-sm max-w-none text-xs text-gray-700 leading-relaxed
              border border-gray-100 rounded-lg p-4 bg-gray-50/40 whitespace-pre-wrap">
              {post.content}
            </div>
          </div>
        </div>
      ) : (
        /* ── MODE ÉDITION ─────────────────────────────────────── */
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Titre <span className="text-red-500">*</span></Label>
            <Input className="text-sm" value={form.title}
              onChange={(e) => setField("title", e.target.value)} />
            {errors.title && <p className="text-[11px] text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Catégorie <span className="text-red-500">*</span></Label>
            <Select value={form.category} onValueChange={(v) => setField("category", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Résumé <span className="text-red-500">*</span></Label>
            <Textarea className="text-sm resize-none min-h-[80px]" value={form.excerpt}
              onChange={(e) => setField("excerpt", e.target.value)} />
            <p className="text-[10px] text-gray-400 text-right">{form.excerpt.length} / 500</p>
            {errors.excerpt && <p className="text-[11px] text-red-500">{errors.excerpt}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Contenu <span className="text-red-500">*</span></Label>
            <Textarea className="text-sm resize-none min-h-[260px] font-mono" value={form.content}
              onChange={(e) => setField("content", e.target.value)} />
            <p className="text-[10px] text-gray-400 text-right">
              {form.content.split(/\s+/).filter(Boolean).length} mots
            </p>
            {errors.content && <p className="text-[11px] text-red-500">{errors.content}</p>}
          </div>

          {allTags.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag) => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${
                      form.tags.includes(tag.id)
                        ? "bg-[#1c1c2e] text-white border-[#1c1c2e]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                    }`}>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <details>
            <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
              SEO (optionnel) ▸
            </summary>
            <div className="mt-3 space-y-3 pl-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Meta titre</Label>
                <Input className="text-sm" maxLength={70} value={form.meta_title}
                  onChange={(e) => setField("meta_title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Meta description</Label>
                <Textarea className="text-sm resize-none min-h-[60px]" maxLength={160}
                  value={form.meta_description}
                  onChange={(e) => setField("meta_description", e.target.value)} />
              </div>
            </div>
          </details>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setEditMode(false)}>
              Annuler
            </Button>
            <Button size="sm" className="text-xs bg-[#1c1c2e] hover:bg-[#1c1c2e]/90 text-white gap-1.5"
              disabled={saving} onClick={handleSave}>
              <Save size={13} /> {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      )}

      {/* Dialog rejet */}
      <Dialog open={showReject} onOpenChange={setShowReject}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">Rejeter l'article</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea placeholder="Motif du rejet (min. 10 car.)…"
              className="text-xs min-h-[100px] resize-none" value={rejectionNote}
              onChange={(e) => { setRejection(e.target.value); setRejectError(""); }} />
            {rejectError && <p className="text-[11px] text-red-500">{rejectError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowReject(false)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleRejectConfirm} disabled={!!actionLoading}>Confirmer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Supprimer l'article ?</DialogTitle></DialogHeader>
          <p className="text-xs text-gray-500 py-2">
            Cette action est <span className="font-medium text-red-600">irréversible</span>.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowDelete(false)}>Annuler</Button>
            <Button size="sm" className="text-xs bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete} disabled={!!actionLoading}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}