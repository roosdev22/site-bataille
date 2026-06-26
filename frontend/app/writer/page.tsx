"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";

// Icônes SVG
const Icons = {
  Plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Send: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  FileText: () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
};

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: string;
  category: string;
  category_display: string;
  views_count: number;
  created_at: string;
  published_at: string | null;
  cover_image: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-slate-50 text-slate-600 border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publié",
  rejected: "Rejeté",
  archived: "Archivé",
};

export default function WriterPostsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Utilise useAuth au lieu de vérifier localStorage
  useEffect(() => {
    if (authLoading) return;

    // Si pas connecté ou pas writer/admin → rediriger
    if (!user || (user.role !== "writer" && user.role !== "admin")) {
      router.push("/login");
      return;
    }

    // Fetch les articles
    api.get("/writer/posts/")
      .then(({ data }) => setPosts(data.results || data))
      .catch((err) => {
        console.error("Erreur lors du chargement des articles:", err);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const publishPost = async (postId: string) => {
    if (!confirm("Publier cet article ? Il sera visible publiquement.")) return;
    try {
      await api.post(`/writer/posts/${postId}/publish/`);
      setPosts(posts.map(p => p.id === postId ? { ...p, status: "published" } : p));
    } catch (err: any) {
      alert(err.response?.data?.detail || "Erreur lors de la publication");
    }
  };

  // ✅ Affiche un loader pendant le chargement de l'auth
  if (authLoading || (loading && user)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#1c1c2e] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-[#1c1c2e] tracking-tight">Mes articles</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">{posts.length} article(s)</p>
        </div>
        <Link href="/writer/new">
          <Button size="sm" className="h-10 px-5 text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl font-semibold shadow-lg shadow-[#1c1c2e]/10">
            <Icons.Plus /> Nouvel article
          </Button>
        </Link>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-50 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-16 text-center">
          <div className="text-gray-300 mb-4 flex justify-center"><Icons.FileText /></div>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">Aucun article</h3>
          <p className="text-[11px] text-gray-400 mb-6">Commencez par écrire votre premier article</p>
          <Link href="/writer/new">
            <Button size="sm" className="h-10 px-5 text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl font-semibold">
              <Icons.Plus /> Écrire un article
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${STATUS_STYLES[post.status] || ""}`}>
                      {STATUS_LABELS[post.status] || post.status}
                    </Badge>
                    <span className="text-[11px] text-gray-400">
                      {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {post.views_count > 0 && (
                      <span className="text-[11px] text-gray-400">👁 {post.views_count} vues</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#1c1c2e] mb-1 truncate">
                    {post.title || "Sans titre"}
                  </h3>
                  <p className="text-[12px] text-gray-500 line-clamp-2">{post.excerpt}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link href={`/writer/${post.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-[#1c1c2e] hover:bg-gray-100 rounded-xl" title="Modifier">
                      <Icons.Edit />
                    </Button>
                  </Link>
                  {post.status === "draft" && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-xl"
                      title="Publier" onClick={() => publishPost(post.id)}>
                      <Icons.Send />
                    </Button>
                  )}
                  {post.status === "published" && post.slug && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" title="Voir">
                        <Icons.Eye />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}