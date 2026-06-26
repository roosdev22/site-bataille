// app/(public)/articles/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import AdSection from "@/components/ads/AdSection";

// Types (identiques)
interface Author { full_name: string; bio: string; avatar_url: string | null; role: string; }
interface Tag { id: number; name: string; slug: string; }
interface Post {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: string; category_display: string;
  author: Author; tags: Tag[];
  views_count: number; published_at: string; cover_image: string | null;
}
interface Comment {
  id: string; body: string; status: string; likes_count: number; replies_count: number;
  created_at: string;
  author: { full_name: string; avatar_url: string | null } | null;
  replies: Comment[];
}

const API = process.env.NEXT_PUBLIC_API_URL;

function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours}h`;
  return `il y a ${days}j`;
}

// Icônes SVG
const Icons = {
  Heart: ({ filled }: { filled: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={filled ? "text-red-500" : "text-gray-400"}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  Reply: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>,
  Share: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
  Clock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  MessageSquare: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  Send: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Twitter: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>,
  Facebook: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  Linkedin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065z"/></svg>,
  Check: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>,
  ArrowRight: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>,
};

// ── CommentItem (identique, déjà responsive) ──
function CommentItem({ comment, postSlug, onRefresh, depth = 0 }: {
  comment: Comment; postSlug: string; onRefresh: () => void; depth?: number;
}) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes_count);

  async function handleLike() {
    if (!user) return;
    try {
      const token = document.cookie.split("access_token=")[1]?.split(";")[0];
      const res = await fetch(`${API}/comments/${comment.id}/like/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLiked(data.liked); setLikes(data.likes_count);
    } catch {}
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim() || !user) return;
    setSubmitting(true);
    try {
      const token = document.cookie.split("access_token=")[1]?.split(";")[0];
      await fetch(`${API}/posts/${postSlug}/comments/create/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: replyBody, parent: comment.id }),
      });
      setReplyBody(""); setShowReply(false); onRefresh();
    } catch {} finally { setSubmitting(false); }
  }

  return (
    <div className={`${depth > 0 ? "ml-4 sm:ml-8" : ""} mb-3 sm:mb-4`}>
      <div className="bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1c1c2e] flex items-center justify-center text-[#c9a84c] font-bold text-[11px] sm:text-xs shrink-0">
            {comment.author?.full_name?.[0] ?? "?"}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-[#1c1c2e] truncate">{comment.author?.full_name ?? "Anonyme"}</p>
            <p className="text-[10px] sm:text-[11px] text-gray-400">{timeAgo(comment.created_at)}</p>
          </div>
        </div>
        <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed mb-2 sm:mb-3">{comment.body}</p>
        <div className="flex items-center gap-4 sm:gap-5">
          <button onClick={handleLike} disabled={!user} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-400 hover:text-red-500 transition-colors">
            <Icons.Heart filled={liked} /> {likes}
          </button>
          {user && depth === 0 && (
            <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-gray-400 hover:text-[#c9a84c] transition-colors">
              <Icons.Reply /> Répondre
            </button>
          )}
        </div>
        {showReply && (
          <form onSubmit={handleReply} className="mt-3 space-y-2">
            <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)} rows={2} placeholder="Votre réponse..."
              className="w-full border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none resize-none focus:border-[#c9a84c]/50 transition-colors" />
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="bg-[#1c1c2e] text-white px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium hover:bg-[#2a2a3e] transition-colors">
                {submitting ? "Envoi…" : "Envoyer"}
              </button>
              <button type="button" onClick={() => setShowReply(false)} className="text-gray-500 border border-gray-200 px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
      {comment.replies?.map(reply => (
        <CommentItem key={reply.id} comment={reply} postSlug={postSlug} onRefresh={onRefresh} depth={depth + 1} />
      ))}
    </div>
  );
}

// ── Page ──
export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [commentSent, setCommentSent] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`${API}/posts/${slug}/`).then(r => r.json()).then(setPost).catch(() => {}).finally(() => setLoading(false));
    loadComments();
  }, [slug]);

  function loadComments() {
    fetch(`${API}/posts/${slug}/comments/`).then(r => r.json()).then(data => setComments(Array.isArray(data) ? data : data.results ?? [])).catch(() => setComments([]));
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const token = document.cookie.split("access_token=")[1]?.split(";")[0];
      await fetch(`${API}/posts/${slug}/comments/create/`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: newComment }),
      });
      setNewComment(""); setCommentSent(true); loadComments();
      setTimeout(() => setCommentSent(false), 4000);
    } catch {} finally { setSubmitting(false); }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setShared(true); setTimeout(() => setShared(false), 2000);
  }

  // Loading
  if (loading) return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-3 sm:space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-100 rounded-xl animate-pulse" style={{ width: i === 0 ? "60%" : `${75 + i * 5}%` }} />
        ))}
      </div>
    </div>
  );

  // Not found
  if (!post) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-4">
      <div className="text-center">
        <p className="text-gray-400 mb-4 text-sm sm:text-base">Article introuvable.</p>
        <Link href="/" className="text-[#c9a84c] font-semibold hover:underline text-sm">← Retour à l'accueil</Link>
      </div>
    </div>
  );

  const minutes = readingTime(post.content);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1c1c2e] flex items-center justify-center">
            <span className="text-[#c9a84c] font-bold text-xs sm:text-sm">B</span>
          </div>
          <span className="font-extrabold text-base sm:text-lg text-[#1c1c2e]">Site Bataille</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handleShare} className={`text-[11px] sm:text-xs font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300
            ${shared ? "bg-[#1c1c2e] text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            {shared ? <><Icons.Check /> Copié !</> : <><Icons.Share /> Partager</>}
          </button>
        </div>
      </nav>

      {/* HEADER ARTICLE */}
      <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-6 sm:pb-8">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <span className="bg-[#c9a84c] text-[#1c1c2e] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold">{post.category_display}</span>
          {post.tags.map(tag => (
            <span key={tag.id} className="bg-gray-100 text-gray-500 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px]">{tag.name}</span>
          ))}
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1c1c2e] leading-[1.2] tracking-[-0.3px] sm:tracking-[-0.5px] mb-3 sm:mb-4">{post.title}</h1>
        <p className="text-sm sm:text-base md:text-lg text-gray-500 leading-relaxed mb-4 sm:mb-6">{post.excerpt}</p>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-6 sm:pb-8 border-b border-gray-100">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#1c1c2e] flex items-center justify-center text-[#c9a84c] font-bold text-sm sm:text-base shrink-0">{post.author?.full_name?.[0]}</div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-[#1c1c2e]">{post.author?.full_name}</p>
              <p className="text-[10px] sm:text-[11px] text-gray-400">{post.published_at ? new Date(post.published_at).toLocaleDateString("fr-FR", { dateStyle: "long" }) : ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-[13px] text-gray-400">
            <span className="flex items-center gap-1 sm:gap-1.5"><Icons.Clock />{minutes} min</span>
            <span className="flex items-center gap-1 sm:gap-1.5"><Icons.Eye />{post.views_count.toLocaleString("fr-FR")}</span>
            <span className="flex items-center gap-1 sm:gap-1.5"><Icons.MessageSquare />{comments.length}</span>
          </div>
        </div>
      </header>

      {/* IMAGE */}
      {post.cover_image && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-8 sm:mb-10">
          <img src={post.cover_image} alt={post.title} className="w-full rounded-2xl sm:rounded-3xl object-cover max-h-[300px] sm:max-h-[400px] md:max-h-[450px]" />
        </div>
      )}

      {/* CONTENU */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="text-[15px] sm:text-[17px] leading-[1.8] sm:leading-[1.85] text-gray-700 space-y-5 sm:space-y-6">
          {post.content.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
        </div>

        {/* Partage */}
        <div className="border-t border-gray-100 pt-6 sm:pt-8 mt-8 sm:mt-12 flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500 font-medium">Partager :</span>
          {[
            { icon: <Icons.Twitter />, label: "Twitter", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}` },
            { icon: <Icons.Facebook />, label: "Facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}` },
            { icon: <Icons.Linkedin />, label: "LinkedIn", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}` },
          ].map(s => (
            <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 sm:gap-1.5 bg-white border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-gray-600 hover:border-[#c9a84c]/30 hover:text-[#c9a84c] transition-all">
              {s.icon}{s.label}
            </a>
          ))}
          <button onClick={handleShare} className="bg-white border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-gray-600 hover:border-gray-300 transition-all">
            {shared ? "✓ Lien copié" : "🔗 Copier le lien"}
          </button>
        </div>
      </article>

      <AdSection format="in_content" category={post?.category ?? "all"} />

      {/* AUTEUR */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <div className="bg-[#1c1c2e] rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start text-white">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#c9a84c] flex items-center justify-center text-[#1c1c2e] font-bold text-lg sm:text-xl shrink-0">{post.author?.full_name?.[0]}</div>
          <div>
            <p className="text-[#c9a84c] text-[10px] sm:text-[11px] font-bold tracking-widest mb-1">AUTEUR</p>
            <h3 className="text-base sm:text-lg font-bold mb-1 sm:mb-2">{post.author?.full_name}</h3>
            {post.author?.bio && <p className="text-white/60 text-xs sm:text-sm leading-relaxed">{post.author.bio}</p>}
          </div>
        </div>
      </div>

      {/* COMMENTAIRES */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <h2 className="text-lg sm:text-xl font-extrabold text-[#1c1c2e] mb-6 sm:mb-8">Commentaires ({comments.length})</h2>

        {user ? (
          <form onSubmit={handleComment} className="mb-8 sm:mb-10 bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
            <div className="flex gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#1c1c2e] flex items-center justify-center text-[#c9a84c] font-bold text-[11px] sm:text-xs shrink-0">{user.full_name?.[0]}</div>
              <textarea value={newComment} onChange={e => setNewComment(e.target.value)} rows={3} placeholder="Partagez votre avis…"
                className="flex-1 border border-gray-200 rounded-lg sm:rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm outline-none resize-none focus:border-[#c9a84c]/50 transition-colors" />
            </div>
            <div className="flex justify-end items-center gap-2 sm:gap-3">
              {commentSent && <span className="text-emerald-600 text-[11px] sm:text-xs">✓ Envoyé — en attente de modération.</span>}
              <button type="submit" disabled={submitting || !newComment.trim()}
                className="bg-[#1c1c2e] text-white px-4 sm:px-5 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#2a2a3e] disabled:opacity-50 transition-all">
                {submitting ? "Envoi…" : "Commenter"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 sm:mb-10 bg-white border border-gray-100 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
            <p className="text-gray-500 text-sm">Connectez-vous pour laisser un commentaire.</p>
          </div>
        )}

        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-10 sm:py-12">Soyez le premier à commenter cet article.</p>
        ) : (
          comments.map(comment => <CommentItem key={comment.id} comment={comment} postSlug={slug} onRefresh={loadComments} />)
        )}
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1c1c2e] py-8 sm:py-10 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 text-sm">
          <Link href="/" className="text-white font-bold text-base sm:text-lg">Site Bataille</Link>
          <span className="text-gray-500 text-xs sm:text-sm">© {new Date().getFullYear()} — Tous droits réservés</span>
        </div>
      </footer>
    </div>
  );
}