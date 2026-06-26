"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Eye, Clock, Share2, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { OptimizedImage } from "@/components/reportage/OptimizedImage";


// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface OptimizedImageType {
  id: string;
  image_url: string;
  thumbnail_url: string;
  small_url: string;
  medium_url: string;
  large_url: string;
  alt_text: string;
  caption: string;
  credit: string;
  aspect_ratio: string;
  width: number;
  height: number;
}

interface MediaFile {
  id: string;
  title: string;
  media_type: string;
  file_url: string;
  duration?: number;
  width?: number;
  height?: number;
  transcription?: string;
}

interface Quote {
  id: string;
  text: string;
  author: string;
  author_role: string;
  author_image_url: string | null;
  source: string;
  source_url: string;
  alignment: string;
  accent_color: string;
  background_color: string;
  border_style: string;
}

interface TimelineEvent {
  uuid: string;
  date_label: string;
  title: string;
  description: string;
  image: OptimizedImageType | null;
  ordre: number;
}

interface GalleryImage {
  id: string;
  image: OptimizedImageType;
  caption: string;
  credit: string;
  ordre: number;
}

interface Bloc {
  uuid: string;
  type: string;
  ordre: number;
  contenu: string;
  citation_auteur: string;
  citation_large: boolean;
  image: OptimizedImageType | null;
  image_caption: string;
  image_credit: string;
  image_fullbleed: boolean;
  gallery_images: GalleryImage[];
  quote: Quote | null;
  video_type: string | null;
  video_source: string | any;
  video_caption: string;
  audio: MediaFile | null;
  embed_url: string;
  timeline_events: TimelineEvent[];
}

interface Reportage {
  slug: string;
  title: string;
  subtitle: string;
  status: string;
  author_name: string;
  cover_image_url: string | null;
  og_image_url: string | null;
  meta_title: string;
  meta_description: string;
  reading_time: number;
  views_count: number;
  featured: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
  blocs: Bloc[];
}

// ═══════════════════════════════════════════════════════════════
//  COMPOSANTS DE BLOCS
// ═══════════════════════════════════════════════════════════════

function BlocIntro({ bloc }: { bloc: Bloc }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <p className="text-lg leading-relaxed text-gray-600 font-serif text-center">
        {bloc.contenu}
      </p>
    </motion.section>
  );
}

function BlocTexte({ bloc }: { bloc: Bloc }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed font-serif">
        {bloc.contenu.split("\n\n").map((paragraph, i) => (
          <p key={`text-${bloc.uuid}-${i}`} className="mb-6 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </motion.section>
  );
}

function BlocImage({ bloc }: { bloc: Bloc }) {
  if (!bloc.image) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`py-12 px-8 ${bloc.image_fullbleed ? "w-full" : "max-w-4xl mx-auto"}`}
    >
      <figure className={bloc.image_fullbleed ? "" : "rounded-xl overflow-hidden"}>
        <div
          className={`relative w-full ${bloc.image_fullbleed ? "h-[60vh]" : "h-[400px]"}`}
        >
          <OptimizedImage
            src={bloc.image.medium_url || bloc.image.image_url}
            alt={bloc.image.alt_text}
            fill
            objectFit="cover"
            sizes={bloc.image_fullbleed ? "100vw" : "(max-width: 896px) 100vw, 896px"}
          />
        </div>
        {(bloc.image_caption || bloc.image_credit) && (
          <figcaption className="mt-4 text-center text-sm text-gray-500 font-serif">
            {bloc.image_caption && <p className="mb-1">{bloc.image_caption}</p>}
            {bloc.image_credit && <p className="text-xs italic">© {bloc.image_credit}</p>}
          </figcaption>
        )}
      </figure>
    </motion.section>
  );
}

function BlocGallery({ bloc }: { bloc: Bloc }) {
  const images = bloc.gallery_images || [];
  if (images.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto py-12 px-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {images.map((item) => (
          <figure key={item.id} className="rounded-lg overflow-hidden">
            <div className="relative w-full h-[300px]">
              <OptimizedImage
                src={item.image?.medium_url || item.image?.image_url}
                alt={item.image?.alt_text || "Galerie"}
                fill
                objectFit="cover"
                sizes="(max-width: 768px) 100vw, 448px"
              />
            </div>
            {(item.caption || item.credit) && (
              <figcaption className="p-4 bg-gray-50">
                {item.caption && <p className="text-sm text-gray-700 mb-1">{item.caption}</p>}
                {item.credit && <p className="text-xs text-gray-500 italic">© {item.credit}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </motion.section>
  );
}
// ═══════════════════════════════════════════════════════════════
//  UTILITAIRES VIDÉO
// ═══════════════════════════════════════════════════════════════

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /^(\d+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}
function BlocVideo({ bloc }: { bloc: Bloc }) {
  const source = bloc.video_source;

  // On ne fait plus confiance qu'à l'objet source fourni par le backend
  if (!source || !source.type) return null;

  return (
    <motion.section className="max-w-3xl mx-auto py-12 px-8">
      <figure className="rounded-lg overflow-hidden bg-black">
        
        {/* --- YOUTUBE --- */}
        {source.type === "youtube" && (
          <div className="relative w-full aspect-video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(source.url)}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {/* --- VIMEO --- */}
        {source.type === "vimeo" && (
          <div className="relative w-full aspect-video">
            <iframe
              src={`https://player.vimeo.com/video/${extractVimeoId(source.url)}`}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
            />
          </div>
        )}

        {/* --- LOCAL --- */}
        {source.type === "local" && (
          <video 
            controls 
            className="w-full h-auto bg-black" 
            poster={source.thumbnail_url || ""}
            preload="metadata"
          >
            {/* Ici, on utilise file_url qui est présent dans MediaFileSerializer */}
            <source src={source.file_url} type="video/mp4" />
          </video>
        )}

        {/* --- LÉGENDE --- */}
        {bloc.video_caption && (
          <figcaption className="p-4 bg-gray-50 text-sm text-gray-600 text-center">
            {bloc.video_caption}
          </figcaption>
        )}
      </figure>
    </motion.section>
  );
}

function BlocAudio({ bloc }: { bloc: Bloc }) {
  if (!bloc.audio?.file_url) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <div className="bg-gray-50 p-6 rounded-lg">
        <p className="text-sm text-gray-600 mb-4 font-semibold">{bloc.audio.title}</p>
        <audio controls className="w-full">
          <source src={bloc.audio.file_url} type="audio/mpeg" />
          Votre navigateur ne supporte pas l'audio.
        </audio>
        {bloc.audio.transcription && (
          <details className="mt-4">
            <summary className="text-sm font-semibold text-gray-600 cursor-pointer">
              📝 Voir la transcription
            </summary>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {bloc.audio.transcription}
            </p>
          </details>
        )}
      </div>
    </motion.section>
  );
}

function BlocCitation({ bloc }: { bloc: Bloc }) {
  if (!bloc.quote) return null;

  const q = bloc.quote;
  const borderClass = {
    left: "border-l-4",
    top: "border-t-4",
    none: "",
  }[q.border_style] || "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <blockquote
        className={`p-8 rounded-lg ${borderClass} transition-all`}
        style={{
          backgroundColor: q.background_color,
          borderColor: q.accent_color,
          textAlign: q.alignment as any,
        }}
      >
        <p className="text-xl leading-relaxed mb-6 font-serif italic" style={{ color: q.accent_color }}>
          "{q.text}"
        </p>

        <div className="flex items-center gap-3 justify-center">
          {q.author_image_url && (
            <OptimizedImage
              src={q.author_image_url}
              alt={q.author}
              width={40}
              height={40}
              className="rounded-full"
            />
          )}
          <div>
            <p className="font-semibold text-sm" style={{ color: q.accent_color }}>
              {q.author}
            </p>
            {q.author_role && (
              <p className="text-xs" style={{ color: q.accent_color }}>
                {q.author_role}
              </p>
            )}
          </div>
        </div>

        {q.source && (
          <p className="mt-4 text-xs" style={{ color: q.accent_color }}>
            {q.source_url ? (
              <a href={q.source_url} target="_blank" rel="noopener noreferrer" className="underline">
                {q.source}
              </a>
            ) : (
              q.source
            )}
          </p>
        )}
      </blockquote>
    </motion.section>
  );
}

function BlocTimeline({ bloc }: { bloc: Bloc }) {
  const events = bloc.timeline_events || [];
  if (events.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <div className="relative">
        {/* Ligne verticale */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Événements */}
        <div className="space-y-12">
          {events.map((event, i) => (
            <div key={event.uuid} className="pl-24">
              {/* Cercle point */}
              <div className="absolute left-2 top-0 w-12 h-12 bg-white border-4 border-[#c9a84c] rounded-full flex items-center justify-center text-[#c9a84c] font-bold text-sm">
                {i + 1}
              </div>

              {/* Contenu */}
              <div>
                <time className="text-sm font-semibold text-[#c9a84c]">
                  {event.date_label}
                </time>
                <h3 className="text-lg font-bold text-gray-800 mt-2 mb-2">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {event.description}
                  </p>
                )}
                {event.image && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden mt-3">
                    <OptimizedImage
                      src={event.image.medium_url || event.image.image_url}
                      alt={event.image.alt_text}
                      fill
                      objectFit="cover"
                      sizes="(max-width: 896px) 100vw, 896px"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function BlocEmbed({ bloc }: { bloc: Bloc }) {
  if (!bloc.embed_url) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-3xl mx-auto py-12 px-8"
    >
      <div className="bg-gray-50 rounded-lg p-6">
        <a
          href={bloc.embed_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#c9a84c] font-semibold hover:underline inline-flex items-center gap-2"
        >
          Voir l'intégration complète →
        </a>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════
//  PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════

export default function ReportagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [reportage, setReportage] = useState<Reportage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReportage() {
      try {
        const { data } = await api.get(`/reportages/${slug}/`);
        setReportage(data);

        // Enregistrer la vue (anonymisée)
        await api.post(`/reportages/${slug}/record-view/`);
      } catch (err) {
        setError("Reportage introuvable.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchReportage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  if (error || !reportage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8">
        <AlertCircle className="text-red-500 mb-4" size={40} />
        <p className="text-gray-600 mb-6 text-center">{error || "Reportage introuvable."}</p>
        <Link
          href="/"
          className="text-[#c9a84c] font-semibold hover:underline inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-serif">
      {/* En-tête */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors no-underline"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Retour</span>
          </Link>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: reportage.title,
                  text: reportage.subtitle,
                  url: window.location.href,
                });
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-semibold p-2 rounded hover:bg-gray-100"
          >
            <Share2 size={18} />
            Partager
          </button>
        </div>
      </motion.header>

      {/* Couverture */}
      {reportage.cover_image_url && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative w-full h-[60vh] max-h-[700px] overflow-hidden"
        >
          <OptimizedImage
            src={reportage.cover_image_url}
            alt={reportage.title}
            fill
            objectFit="cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
        </motion.div>
      )}

      {/* Titre & méta */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-3xl mx-auto px-8 py-16 -mt-20 relative z-10"
      >
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {reportage.title}
        </h1>
        {reportage.subtitle && (
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            {reportage.subtitle}
          </p>
        )}

        {/* Métadonnées */}
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 border-t border-b border-gray-200 py-6">
          <div className="flex items-center gap-2">
            <User size={16} />
            <span className="font-semibold">{reportage.author_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{new Date(reportage.published_at).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>{reportage.reading_time} min de lecture</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span>{reportage.views_count.toLocaleString("fr-FR")} vues</span>
          </div>
        </div>
      </motion.section>

      {/* Contenu des blocs */}
      <div className="py-12">
        {reportage.blocs && reportage.blocs.length > 0 ? (
          reportage.blocs.map((bloc) => (
            <div key={bloc.uuid}>
              {bloc.type === "intro" && <BlocIntro bloc={bloc} />}
              {bloc.type === "texte" && <BlocTexte bloc={bloc} />}
              {bloc.type === "image" && <BlocImage bloc={bloc} />}
              {bloc.type === "gallery" && <BlocGallery bloc={bloc} />}
              {bloc.type === "video" && <BlocVideo bloc={bloc} />}
              {bloc.type === "audio" && <BlocAudio bloc={bloc} />}
              {bloc.type === "citation" && <BlocCitation bloc={bloc} />}
              {bloc.type === "timeline" && <BlocTimeline bloc={bloc} />}
              {bloc.type === "embed" && <BlocEmbed bloc={bloc} />}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p>Aucun contenu disponible pour ce reportage.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12 mt-20">
        <div className="max-w-3xl mx-auto px-8 text-center text-sm text-gray-600">
          <p className="mb-4">
            © {new Date().getFullYear()} Site Bataille — Tous droits réservés
          </p>
          <Link
            href="/"
            className="text-[#c9a84c] font-semibold hover:underline no-underline"
          >
            Retour à l'accueil
          </Link>
        </div>
      </footer>
    </div>
  );
}