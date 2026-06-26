"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AdSection from "@/components/ads/AdSection";

interface Post {
  id: string; title: string; slug: string; excerpt: string;
  category: string; category_display: string;
  author: { full_name: string; bio: string; avatar_url: string | null };
  views_count: number; published_at: string; cover_image: string | null;
  tags: { id: number; name: string; slug: string }[];
  content?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = [
  { value: "all",        label: "Tout" },
  { value: "medical",    label: "Médical" },
  { value: "travel",     label: "Voyage" },
  { value: "technology", label: "Technologie" },
  { value: "education",  label: "Éducation" },
];

const CAT_COLORS: Record<string, string> = {
  medical: "bg-[#e8f4f8]", travel: "bg-[#f0f8e8]", technology: "bg-[#f0e8f8]",
  education: "bg-[#f8f4e8]", lifestyle: "bg-[#f8e8f0]", science: "bg-[#e8f8f4]",
  legal: "bg-[#f8ece8]", finance: "bg-[#e8ecf8]",
};

const CAT_ICONS: Record<string, string> = {
  medical: "🏥", travel: "✈️", technology: "💻", education: "📚",
  lifestyle: "🌿", science: "🔬", legal: "⚖️", finance: "💰", all: "📰",
};

function readingTime(excerpt: string): number {
  return Math.max(1, Math.ceil(excerpt.split(/\s+/).length / 3));
}

// ── Skeleton ──
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#ece9e2]">
      <div className="h-40 bg-gradient-to-r from-[#f0ede8] via-[#e8e5e0] to-[#f0ede8] bg-[length:200%_100%] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-[#f0ede8] rounded-md w-2/5 animate-shimmer" />
        <div className="h-4 bg-[#f0ede8] rounded-md w-[90%] animate-shimmer" />
        <div className="h-4 bg-[#f0ede8] rounded-md w-[70%] animate-shimmer" />
        <div className="h-3 bg-[#f0ede8] rounded-md w-3/5 animate-shimmer" />
      </div>
    </div>
  );
}

// ── Post Card ──
function PostCard({ post, index }: { post: Post; index: number }) {
  const mins = readingTime(post.excerpt);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <Link href={`/articles/${post.slug}`} className="no-underline block">
        <article className="bg-white rounded-2xl overflow-hidden border border-[#ece9e2] h-full shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          {/* Image */}
          <div
            className="h-40 relative overflow-hidden flex items-center justify-center"
            style={{
              background: post.cover_image
                ? `url(${post.cover_image}) center/cover`
                : CAT_COLORS[post.category] ?? "#f0ede8",
            }}
          >
            {!post.cover_image && (
              <span className="text-[40px] opacity-50">{CAT_ICONS[post.category] ?? "📝"}</span>
            )}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-lg rounded-[20px] px-[10px] py-[3px] text-[11px] font-sans text-[#555]">
              ⏱ {mins} min
            </div>
          </div>
          {/* Body */}
          <div className="px-[18px] py-4">
            <span className="inline-block text-[#555] px-[10px] py-[3px] rounded-[10px] text-[11px] font-sans font-semibold"
              style={{ backgroundColor: CAT_COLORS[post.category] ?? "#f0ede8" }}>
              {CAT_ICONS[post.category]} {post.category_display}
            </span>
            <h3 className="text-[15px] font-bold text-[#1c1c2e] mt-[10px] mb-2 leading-[1.35] tracking-[-0.2px]">
              {post.title}
            </h3>
            <p className="text-[13px] text-[#777] leading-relaxed mb-[14px] font-sans">
              {post.excerpt.slice(0, 90)}…
            </p>
            <div className="flex items-center justify-between text-xs text-[#aaa] font-sans border-t border-[#f5f3ee] pt-3">
              <span className="font-medium text-[#666]">{post.author?.full_name}</span>
              <span>👁 {post.views_count.toLocaleString("fr-FR")}</span>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
}

export default function PublicHomePage() {
  const [posts, setPosts]         = useState<Post[]>([]);
  const [trending, setTrending]   = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [category, setCategory]   = useState("all");
  const [search, setSearch]       = useState("");
  const [page, setPage]           = useState(1);
  const [totalCount, setTotal]    = useState(0);
  const [newsletter, setNewsletter] = useState({ email: "", sent: false });
  const [contact, setContact]     = useState({ name: "", email: "", message: "", sent: false });
  const [catSticky, setCatSticky] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 9;

  // Sticky categories
  useEffect(() => {
    function onScroll() {
      if (catRef.current) {
        setCatSticky(catRef.current.getBoundingClientRect().top <= 64);
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fetch posts
  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (category !== "all") p.set("category", category);
    if (search) p.set("search", search);
    fetch(`${API}/posts/?${p}`)
      .then((r) => r.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : data.results ?? []);
        setTotal(data.count ?? 0);
      })
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [category, search, page]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [category, search]);

  // Trending posts (most views)
  useEffect(() => {
    fetch(`${API}/posts/?ordering=-views_count&page_size=4`)
      .then((r) => r.json())
      .then((data) => setTrending(Array.isArray(data) ? data : data.results ?? []))
      .catch(() => {});
  }, []);

  const featuredPost  = posts[0];
  const restPosts     = posts.slice(1);
  const totalPages    = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen font-[Georgia,serif] bg-[#fafaf8]">

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ y: -64 }} animate={{ y: 0 }} transition={{ duration: 0.4 }}
        className="sticky top-0 z-[100] bg-[#fafaf8]/95 backdrop-blur-2xl border-b border-[#e8e6e0] px-8 flex items-center justify-between h-16"
      >
        <div className="flex items-center gap-2">
          <div className="w-[34px] h-[34px] bg-[#1c1c2e] rounded-[9px] flex items-center justify-center">
            <span className="text-[#c9a84c] font-extrabold text-[15px]">B</span>
          </div>
          <span className="font-bold text-lg text-[#1c1c2e] tracking-[-0.5px]">
            Site Bataille
          </span>
        </div>
        <div className="flex gap-7 text-sm">
          {[["#articles", "Articles"], ["#trending", "Tendances"], ["#about", "À propos"], ["#contact", "Contact"]].map(([href, label]) => (
            <a key={href} href={href} className="no-underline text-[#555] font-sans">
              {label}
            </a>
          ))}
        </div>
        <Link href="/login" className="bg-[#1c1c2e] text-white px-5 py-2 rounded-lg text-[13px] no-underline font-sans font-semibold">
          Connexion
        </Link>
      </motion.nav>

      {/* ── HERO ── */}
      <section className="pt-20 pb-16 px-8 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-block bg-[#c9a84c]/[0.13] text-[#c9a84c] px-[18px] py-[5px] rounded-[20px] text-xs font-sans font-bold mb-6 tracking-[1.5px]">
            ✦ BLOG & ANALYSES
          </div>
          <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-extrabold text-[#1c1c2e] leading-[1.1] mb-5 tracking-[-1.5px]">
            Des idées qui<br />
            <span className="text-[#c9a84c]">changent</span> le regard
          </h1>
          <p className="text-lg text-[#666] max-w-[540px] mx-auto mb-10 leading-[1.7] font-sans">
            Articles de fond sur la médecine, la technologie, le voyage et bien plus.
            Écrits par des experts, pour les curieux.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <motion.a href="#articles" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="bg-[#1c1c2e] text-white py-[13px] px-[30px] rounded-[10px] text-sm no-underline font-sans font-semibold inline-block">
              Lire les articles →
            </motion.a>
            <motion.a href="#about" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="bg-white text-[#1c1c2e] py-[13px] px-[30px] rounded-[10px] text-sm no-underline font-sans border border-[#e0ddd6] inline-block">
              À propos
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURED POST ── */}
      {featuredPost && (
        <motion.section
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-4xl mx-auto mb-16 px-8"
        >
          <Link href={`/articles/${featuredPost.slug}`} className="no-underline">
            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}
              className="bg-[#1c1c2e] rounded-[22px] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[300px] shadow-[0_20px_60px_rgba(28,28,46,0.2)]"
            >
              <div className="p-11 md:p-12 flex flex-col justify-between">
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className="bg-[#c9a84c] text-[#1c1c2e] py-1 px-[14px] rounded-[20px] text-[11px] font-bold font-sans">
                      ⭐ À LA UNE
                    </span>
                    <span className="bg-white/[0.08] text-[#aaa] py-1 px-[14px] rounded-[20px] text-[11px] font-sans">
                      {featuredPost.category_display}
                    </span>
                  </div>
                  <h2 className="text-white text-[26px] font-extrabold mb-[14px] leading-[1.25] tracking-[-0.5px]">
                    {featuredPost.title}
                  </h2>
                  <p className="text-[#999] text-sm leading-[1.65] font-sans">
                    {featuredPost.excerpt.slice(0, 130)}…
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-7">
                  <div className="w-[34px] h-[34px] rounded-full bg-[#c9a84c] flex items-center justify-center text-[13px] font-bold text-[#1c1c2e]">
                    {featuredPost.author?.full_name?.[0]}
                  </div>
                  <div>
                    <p className="m-0 text-white text-[13px] font-sans font-semibold">
                      {featuredPost.author?.full_name}
                    </p>
                    <p className="m-0 text-[#666] text-[11px] font-sans">
                      ⏱ {readingTime(featuredPost.excerpt)} min · 👁 {featuredPost.views_count.toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span className="ml-auto bg-[#c9a84c] text-[#1c1c2e] py-[9px] px-5 rounded-[9px] text-[13px] font-bold font-sans">
                    Lire →
                  </span>
                </div>
              </div>
              <div
                className="flex items-center justify-center min-h-[200px] md:min-h-0"
                style={{
                  background: featuredPost.cover_image
                    ? `url(${featuredPost.cover_image}) center/cover`
                    : "linear-gradient(135deg, rgba(201,168,76,0.13), rgba(201,168,76,0.03))",
                }}
              >
                {!featuredPost.cover_image && (
                  <span className="text-[80px] opacity-25">📖</span>
                )}
              </div>
            </motion.div>
          </Link>
        </motion.section>
      )}

      {/* ── PUB BANNER TOP ── */}
      <AdSection format="banner_top" category="all" />

      {/* ── TRENDING ── */}
      {trending.length > 0 && (
        <section id="trending" className="max-w-4xl mx-auto mb-16 px-8">
          <div className="flex items-center gap-[10px] mb-6">
            <span className="text-xl">🔥</span>
            <h2 className="text-xl font-bold text-[#1c1c2e] m-0">Tendances</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                <Link href={`/articles/${post.slug}`} className="no-underline">
                  <div className="bg-white border border-[#ece9e2] rounded-2xl p-4 flex gap-3 items-start">
                    <span className="text-[22px] font-extrabold text-[#e8e5e0] font-sans shrink-0 leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="m-0 mb-[6px] text-[13px] font-semibold text-[#1c1c2e] leading-[1.3]">
                        {post.title.slice(0, 50)}{post.title.length > 50 ? "…" : ""}
                      </p>
                      <p className="m-0 text-[11px] text-[#aaa] font-sans">
                        👁 {post.views_count.toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── PUB BANNER BOTTOM ── */}
      <AdSection format="banner_bottom" category="all" />

      {/* ── CATEGORIES STICKY ── */}
      <div ref={catRef} id="articles" className="max-w-4xl mx-auto px-8">
        <div className={`${
          catSticky
            ? "sticky top-16 z-40 bg-[#fafaf8]/97 backdrop-blur-xl border-b border-[#e8e6e0] py-3"
            : "relative pb-6"
        } transition-all duration-200`}
        >
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <motion.button key={cat.value}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => setCategory(cat.value)}
                className={`py-[7px] px-4 rounded-[20px] text-[13px] font-sans cursor-pointer border transition-all duration-150 ${
                  category === cat.value
                    ? "border-[#1c1c2e] bg-[#1c1c2e] text-white"
                    : "border-[#e0ddd6] bg-white text-[#555]"
                }`}
              >
                {CAT_ICONS[cat.value]} {cat.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Search + titre */}
        <div className="flex items-center justify-between my-6">
          <h2 className="text-xl font-bold text-[#1c1c2e] m-0">
            Articles récents
            {totalCount > 0 && (
              <span className="text-sm text-[#aaa] font-normal ml-2 font-sans">
                ({totalCount})
              </span>
            )}
          </h2>
          <input
            placeholder="Rechercher…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#e0ddd6] rounded-lg py-2 px-4 text-[13px] font-sans bg-white outline-none w-[200px] text-[#333] focus:border-[#c9a84c] transition-colors"
          />
        </div>

        {/* Grille */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10"
            >
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : restPosts.length === 0 && posts.length === 0 ? (
            <motion.div key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 text-[#aaa] font-sans"
            >
              <div className="text-[40px] mb-3">🔍</div>
              <p>Aucun article trouvé.</p>
            </motion.div>
          ) : (
            <motion.div key="grid"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10"
            >
              {(restPosts.length > 0 ? restPosts : posts).map((post, i) => (
                <PostCard key={post.id} post={post} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-16">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className={`bg-white border border-[#e0ddd6] py-[9px] px-[18px] rounded-lg text-[13px] font-sans ${
                page === 1 ? "text-[#ccc] cursor-not-allowed" : "text-[#1c1c2e] cursor-pointer"
              }`}
            >
              ← Précédent
            </motion.button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <motion.button key={p} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={() => setPage(p)}
                className={`w-[38px] h-[38px] rounded-lg text-[13px] font-sans cursor-pointer ${
                  p === page
                    ? "bg-[#1c1c2e] text-white border-none"
                    : "bg-white text-[#555] border border-[#e0ddd6]"
                }`}
              >
                {p}
              </motion.button>
            ))}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className={`bg-white border border-[#e0ddd6] py-[9px] px-[18px] rounded-lg text-[13px] font-sans ${
                page === totalPages ? "text-[#ccc] cursor-not-allowed" : "text-[#1c1c2e] cursor-pointer"
              }`}
            >
              Suivant →
            </motion.button>
          </div>
        )}
      </div>

      {/* ── NEWSLETTER ── */}
      <section className="max-w-4xl mx-auto mb-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-[#1c1c2e] to-[#2d2d4e] rounded-3xl p-12 md:p-14 text-center"
        >
          <span className="text-4xl block mb-4">📬</span>
          <h2 className="text-white text-[26px] font-bold mb-[10px]">
            Restez informé
          </h2>
          <p className="text-[#888] text-[15px] font-sans mb-7">
            Recevez les meilleurs articles directement dans votre boîte mail.
          </p>
          {newsletter.sent ? (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <p className="text-[#c9a84c] text-base font-sans">
                ✓ Merci ! Vous êtes inscrit.
              </p>
            </motion.div>
          ) : (
            <div className="flex max-w-[440px] mx-auto">
              <input
                type="email" placeholder="votre@email.com"
                value={newsletter.email}
                onChange={(e) => setNewsletter(n => ({ ...n, email: e.target.value }))}
                className="flex-1 py-[13px] px-[18px] rounded-l-[10px] border-none text-sm font-sans outline-none text-[#333]"
              />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => newsletter.email && setNewsletter(n => ({ ...n, sent: true }))}
                className="bg-[#c9a84c] text-[#1c1c2e] border-none py-[13px] px-[22px] rounded-r-[10px] text-sm font-sans cursor-pointer font-bold"
              >
                S'abonner
              </motion.button>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── BIOGRAPHIE ── */}
      <section id="about" className="max-w-4xl mx-auto mb-20 px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="bg-[#1c1c2e] rounded-3xl p-12 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center"
        >
          <div className="w-[110px] h-[110px] rounded-full bg-[#c9a84c] flex items-center justify-center text-[44px] shrink-0 mx-auto md:mx-0">
            ✍️
          </div>
          <div>
            <p className="text-[#c9a84c] text-[11px] font-sans font-bold tracking-[2px] mb-2">
              RÉDACTEUR EN CHEF
            </p>
            <h2 className="text-white text-[26px] font-bold mb-[14px]">
              Jean Bataille
            </h2>
            <p className="text-[#888] text-[15px] leading-[1.7] mb-5 font-sans">
              Journaliste et analyste spécialisé dans la santé, la technologie et les sciences sociales.
              Avec plus de 10 ans d'expérience, Jean explore les sujets complexes avec clarté et rigueur.
            </p>
            <div className="flex gap-[10px] flex-wrap">
              {["Médecine", "Technologie", "Société", "Science"].map((tag) => (
                <span key={tag} className="bg-white/[0.07] text-[#ccc] py-1 px-[14px] rounded-[20px] text-xs font-sans">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── RÉSEAUX SOCIAUX ── */}
      <section className="max-w-4xl mx-auto mb-20 px-8 text-center">
        <p className="text-[#bbb] text-[11px] font-sans tracking-[2px] mb-5">
          SUIVEZ-NOUS
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          {[
            { label: "Twitter / X", icon: "𝕏" },
            { label: "Facebook", icon: "f" },
            { label: "Instagram", icon: "📸" },
            { label: "LinkedIn", icon: "in" },
          ].map((s) => (
            <motion.a key={s.label} href="#" whileHover={{ y: -3 }}
              className="flex items-center gap-2 bg-white border border-[#e0ddd6] rounded-[10px] py-[10px] px-5 no-underline text-[13px] text-[#333] font-sans"
            >
              <span className="text-base">{s.icon}</span>
              {s.label}
            </motion.a>
          ))}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="max-w-[600px] mx-auto mb-20 px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="text-center mb-9">
            <h2 className="text-[26px] font-bold text-[#1c1c2e] mb-2">
              Nous contacter
            </h2>
            <p className="text-[#777] text-[15px] font-sans">
              Une question, une collaboration ? Écrivez-nous.
            </p>
          </div>

          {contact.sent ? (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className="bg-[#f0f8f0] border border-[#c8e6c8] rounded-2xl p-10 text-center"
            >
              <div className="text-[40px] mb-3">✅</div>
              <h3 className="text-[#2e7d32] mb-2 font-sans">Message envoyé !</h3>
              <p className="text-[#555] text-sm font-sans mb-4">
                Nous vous répondrons rapidement.
              </p>
              <button onClick={() => setContact(c => ({ ...c, sent: false }))}
                className="bg-[#1c1c2e] text-white border-none py-[10px] px-6 rounded-lg text-[13px] font-sans cursor-pointer"
              >
                Nouveau message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setContact(c => ({ ...c, sent: true })); }}
              className="bg-white border border-[#ece9e2] rounded-[20px] p-9 flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                {[
                  { key: "name", label: "Nom", type: "text", placeholder: "Votre nom" },
                  { key: "email", label: "Email", type: "email", placeholder: "votre@email.com" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-[#555] font-sans block mb-[6px]">
                      {label} *
                    </label>
                    <input required type={type} placeholder={placeholder}
                      value={contact[key as "name" | "email"]}
                      onChange={(e) => setContact(c => ({ ...c, [key]: e.target.value }))}
                      className="w-full border border-[#e0ddd6] rounded-lg py-[10px] px-[14px] text-sm font-sans outline-none box-border text-[#333] focus:border-[#c9a84c] transition-colors"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-[#555] font-sans block mb-[6px]">
                  Message *
                </label>
                <textarea required rows={5} placeholder="Votre message…"
                  value={contact.message}
                  onChange={(e) => setContact(c => ({ ...c, message: e.target.value }))}
                  className="w-full border border-[#e0ddd6] rounded-lg py-[10px] px-[14px] text-sm font-sans outline-none resize-none box-border text-[#333] focus:border-[#c9a84c] transition-colors"
                />
              </div>
              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="bg-[#1c1c2e] text-white border-none py-[14px] rounded-[10px] text-[15px] font-sans cursor-pointer font-semibold"
              >
                Envoyer le message →
              </motion.button>
            </form>
          )}
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1c1c2e] py-10 px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <span className="text-white font-bold text-base">Site Bataille</span>
          <span className="text-[#555] text-[13px] font-sans">
            © {new Date().getFullYear()} — Tous droits réservés
          </span>
          <div className="flex gap-5">
            {[["#articles", "Articles"], ["#about", "À propos"], ["#contact", "Contact"]].map(([href, label]) => (
              <a key={href} href={href} className="text-[#777] text-[13px] no-underline font-sans">
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* ── PUB STICKY FOOTER ── */}
      <AdSection format="sticky_footer" category="all" />
    </div>
  );
}