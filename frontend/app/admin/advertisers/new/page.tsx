// app/admin/reportages/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import {
  ArrowLeft, Save, Eye, Loader2, Camera, Plus, Trash2,
  GripVertical, Image, Type, Video, Music, Quote, Clock,
  Layout, FileText, AlertCircle
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

// Types
type ReportageStatus = 'draft' | 'review' | 'published';
type BlocType = 'intro' | 'texte' | 'image' | 'gallery' | 'video' | 'audio' | 'citation' | 'timeline' | 'embed';

interface GalleryImage {
  id?: number;
  image: File | null;
  caption: string;
  credit: string;
  ordre: number;
  preview?: string;
}

interface TimelineEvent {
  id?: number;
  date_label: string;
  title: string;
  description: string;
  image: File | null;
  ordre: number;
  preview?: string;
}

interface Bloc {
  id?: number;
  type: BlocType;
  ordre: number;
  contenu: string;
  citation_auteur: string;
  citation_large: boolean;
  image: File | null;
  image_caption: string;
  image_credit: string;
  image_fullbleed: boolean;
  image_preview?: string;
  video_fichier: File | null;
  video_url: string;
  video_titre: string;
  video_description: string;
  video_duree: string;
  video_thumbnail: File | null;
  video_thumbnail_preview?: string;
  audio_fichier: File | null;
  audio_titre: string;
  audio_description: string;
  audio_duree: string;
  embed_url: string;
  gallery_images: GalleryImage[];
  timeline_events: TimelineEvent[];
}

interface ReportageForm {
  title: string;
  subtitle: string;
  status: ReportageStatus;
  featured: boolean;
  cover_image: File | null;
  cover_preview: string;
  meta_title: string;
  meta_description: string;
  og_image: File | null;
  og_preview: string;
  blocs: Bloc[];
}

// Constantes
const BLOC_TYPES: { type: BlocType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'intro',    label: 'Introduction', icon: <Type size={16} />,     color: 'bg-blue-100 text-blue-700' },
  { type: 'texte',    label: 'Texte',        icon: <FileText size={16} />, color: 'bg-gray-100 text-gray-700' },
  { type: 'image',    label: 'Image',        icon: <Image size={16} />,    color: 'bg-green-100 text-green-700' },
  { type: 'gallery',  label: 'Galerie',      icon: <Layout size={16} />,   color: 'bg-purple-100 text-purple-700' },
  { type: 'video',    label: 'Vidéo',        icon: <Video size={16} />,    color: 'bg-red-100 text-red-700' },
  { type: 'audio',    label: 'Audio',        icon: <Music size={16} />,    color: 'bg-orange-100 text-orange-700' },
  { type: 'citation', label: 'Citation',     icon: <Quote size={16} />,    color: 'bg-yellow-100 text-yellow-700' },
  { type: 'timeline', label: 'Chronologie',  icon: <Clock size={16} />,    color: 'bg-indigo-100 text-indigo-700' },
  { type: 'embed',    label: 'Embed',        icon: <Layout size={16} />,   color: 'bg-pink-100 text-pink-700' },
];

export default function NewReportagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});

  const [form, setForm] = useState<ReportageForm>({
    title: "",
    subtitle: "",
    status: "draft",
    featured: false,
    cover_image: null,
    cover_preview: "",
    meta_title: "",
    meta_description: "",
    og_image: null,
    og_preview: "",
    blocs: [],
  });

  // ── Couverture ──────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, cover_image: file, cover_preview: URL.createObjectURL(file) });
  };

  const handleOgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setForm({ ...form, og_image: file, og_preview: URL.createObjectURL(file) });
  };

  // ── Blocs ───────────────────────────────────────────────────
  const addBloc = (type: BlocType) => {
    const newBloc: Bloc = {
      type, ordre: form.blocs.length,
      contenu: "", citation_auteur: "", citation_large: false,
      image: null, image_caption: "", image_credit: "", image_fullbleed: false,
      video_fichier: null, video_url: "", video_titre: "", video_description: "", video_duree: "", video_thumbnail: null,
      audio_fichier: null, audio_titre: "", audio_description: "", audio_duree: "",
      embed_url: "", gallery_images: [], timeline_events: [],
    };
    setForm({ ...form, blocs: [...form.blocs, newBloc] });
  };

  const removeBloc = (index: number) => {
    setForm({ ...form, blocs: form.blocs.filter((_, i) => i !== index) });
  };

  const updateBloc = (index: number, field: string, value: any) => {
    const newBlocs = [...form.blocs];
    (newBlocs[index] as any)[field] = value;
    setForm({ ...form, blocs: newBlocs });
  };

  const handleBlocImage = (index: number, file: File) => {
    const newBlocs = [...form.blocs];
    newBlocs[index].image = file;
    newBlocs[index].image_preview = URL.createObjectURL(file);
    setForm({ ...form, blocs: newBlocs });
  };

  // ── Galerie ─────────────────────────────────────────────────
  const addGalleryImage = (blocIndex: number) => {
    const newBlocs = [...form.blocs];
    newBlocs[blocIndex].gallery_images.push({ image: null, caption: "", credit: "", ordre: newBlocs[blocIndex].gallery_images.length });
    setForm({ ...form, blocs: newBlocs });
  };

  const removeGalleryImage = (blocIndex: number, imageIndex: number) => {
    const newBlocs = [...form.blocs];
    newBlocs[blocIndex].gallery_images = newBlocs[blocIndex].gallery_images.filter((_, i) => i !== imageIndex);
    setForm({ ...form, blocs: newBlocs });
  };

  const updateGalleryImage = (blocIndex: number, imageIndex: number, field: string, value: any) => {
    const newBlocs = [...form.blocs];
    if (field === 'image' && value instanceof File) {
      newBlocs[blocIndex].gallery_images[imageIndex].image = value;
      newBlocs[blocIndex].gallery_images[imageIndex].preview = URL.createObjectURL(value);
    } else {
      (newBlocs[blocIndex].gallery_images[imageIndex] as any)[field] = value;
    }
    setForm({ ...form, blocs: newBlocs });
  };

  // ── Timeline ────────────────────────────────────────────────
  const addTimelineEvent = (blocIndex: number) => {
    const newBlocs = [...form.blocs];
    newBlocs[blocIndex].timeline_events.push({ date_label: "", title: "", description: "", image: null, ordre: newBlocs[blocIndex].timeline_events.length });
    setForm({ ...form, blocs: newBlocs });
  };

  const removeTimelineEvent = (blocIndex: number, eventIndex: number) => {
    const newBlocs = [...form.blocs];
    newBlocs[blocIndex].timeline_events = newBlocs[blocIndex].timeline_events.filter((_, i) => i !== eventIndex);
    setForm({ ...form, blocs: newBlocs });
  };

  const updateTimelineEvent = (blocIndex: number, eventIndex: number, field: string, value: any) => {
    const newBlocs = [...form.blocs];
    if (field === 'image' && value instanceof File) {
      newBlocs[blocIndex].timeline_events[eventIndex].image = value;
      newBlocs[blocIndex].timeline_events[eventIndex].preview = URL.createObjectURL(value);
    } else {
      (newBlocs[blocIndex].timeline_events[eventIndex] as any)[field] = value;
    }
    setForm({ ...form, blocs: newBlocs });
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // ── ÉTAPE 1 : JSON pur (sans fichiers binaires) ───────────────────
      const blocsPayload = form.blocs.map((bloc, i) => ({
        type:              bloc.type,
        ordre:             i,
        contenu:           bloc.contenu,
        citation_auteur:   bloc.citation_auteur,
        citation_large:    bloc.citation_large,
        image_caption:     bloc.image_caption,
        image_credit:      bloc.image_credit,
        image_fullbleed:   bloc.image_fullbleed,
        video_url:         bloc.video_url,
        video_titre:       bloc.video_titre,
        video_description: bloc.video_description,
        video_duree:       bloc.video_duree,
        audio_titre:       bloc.audio_titre,
        audio_description: bloc.audio_description,
        audio_duree:       bloc.audio_duree,
        embed_url:         bloc.embed_url,
        // Sous-modèles textuels uniquement (pas de fichiers)
        gallery_images: bloc.gallery_images.map((img, j) => ({
          caption: img.caption,
          credit:  img.credit,
          ordre:   j,
        })),
        timeline_events: bloc.timeline_events.map((ev, j) => ({
          date_label:  ev.date_label,
          title:       ev.title,
          description: ev.description,
          ordre:       j,
        })),
      }));

      const jsonResponse = await api.post(
        '/reportages/',
        {
          title:            form.title,
          subtitle:         form.subtitle,
          status:           form.status,
          featured:         form.featured,
          meta_title:       form.meta_title,
          meta_description: form.meta_description,
          blocs:            blocsPayload,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const reportage = jsonResponse.data;
      const slug = reportage.slug;

      // ── ÉTAPE 2 : Fichiers via PATCH (si nécessaire) ──────────────────
      const hasFiles =
        form.cover_image ||
        form.og_image ||
        form.blocs.some(
          (b) => b.image || b.video_fichier || b.video_thumbnail || b.audio_fichier
        );

      if (hasFiles) {
        const fd = new FormData();
        if (form.cover_image) fd.append('cover_image', form.cover_image);
        if (form.og_image)    fd.append('og_image',    form.og_image);

        // Fichiers des blocs — indexés par l'id retourné par l'API
        reportage.blocs?.forEach((apiBloc: any, i: number) => {
          const localBloc = form.blocs[i];
          if (!localBloc) return;
          if (localBloc.image)           fd.append(`bloc_${apiBloc.id}_image`,           localBloc.image);
          if (localBloc.video_fichier)   fd.append(`bloc_${apiBloc.id}_video_fichier`,   localBloc.video_fichier);
          if (localBloc.video_thumbnail) fd.append(`bloc_${apiBloc.id}_video_thumbnail`, localBloc.video_thumbnail);
          if (localBloc.audio_fichier)   fd.append(`bloc_${apiBloc.id}_audio_fichier`,   localBloc.audio_fichier);
        });

        await api.patch(`/reportages/${slug}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      router.push(`/admin/reportages/${slug}`);
    } catch (error: any) {
      console.error('Erreur création reportage:', error.response?.data);
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: "Une erreur est survenue lors de la création du reportage." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/reportages">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nouveau reportage</h1>
            <p className="text-sm text-gray-500">Créez un reportage immersif long format</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl"
            onClick={() => { setForm({ ...form, status: 'draft' }); handleSubmit(); }}
            disabled={loading}
          >
            <Save size={16} className="mr-2" />
            Brouillon
          </Button>
          <Button
            size="sm"
            className="h-10 px-4 rounded-xl bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Eye size={16} className="mr-2" />}
            Publier
          </Button>
        </div>
      </div>

      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} />
          {errors.general}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">

          {/* Informations de base */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none text-sm"
                  placeholder="Titre du reportage"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none text-sm"
                  placeholder="Un sous-titre accrocheur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image de couverture</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#c9a84c] cursor-pointer transition-colors">
                    <Camera size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Choisir une image</span>
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
                  {form.cover_preview && (
                    <img src={form.cover_preview} alt="Preview" className="h-16 w-24 object-cover rounded-lg" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocs */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[15px] font-bold">Blocs de contenu</CardTitle>
                <div className="flex items-center gap-1 flex-wrap">
                  {BLOC_TYPES.map((bt) => (
                    <button
                      key={bt.type}
                      onClick={() => addBloc(bt.type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${bt.color} hover:opacity-80 transition-opacity`}
                      title={bt.label}
                    >
                      <span className="flex items-center gap-1.5">{bt.icon}{bt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.blocs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Plus size={40} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Ajoutez des blocs pour construire votre reportage</p>
                </div>
              ) : (
                form.blocs.map((bloc, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-400 cursor-move" />
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${BLOC_TYPES.find(bt => bt.type === bloc.type)?.color}`}>
                          {BLOC_TYPES.find(bt => bt.type === bloc.type)?.label}
                        </span>
                      </div>
                      <button onClick={() => removeBloc(index)} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {(bloc.type === 'intro' || bloc.type === 'texte') && (
                      <textarea
                        value={bloc.contenu}
                        onChange={(e) => updateBloc(index, 'contenu', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none text-sm min-h-[150px]"
                        placeholder="Contenu du bloc..."
                      />
                    )}

                    {bloc.type === 'citation' && (
                      <div className="space-y-3">
                        <textarea
                          value={bloc.contenu}
                          onChange={(e) => updateBloc(index, 'contenu', e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] outline-none text-sm min-h-[100px]"
                          placeholder="Texte de la citation..."
                        />
                        <input
                          type="text"
                          value={bloc.citation_auteur}
                          onChange={(e) => updateBloc(index, 'citation_auteur', e.target.value)}
                          className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
                          placeholder="Auteur de la citation"
                        />
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={bloc.citation_large} onChange={(e) => updateBloc(index, 'citation_large', e.target.checked)} className="rounded" />
                          <span className="text-sm text-gray-600">Citation large</span>
                        </label>
                      </div>
                    )}

                    {bloc.type === 'image' && (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#c9a84c] cursor-pointer">
                          <Image size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-500">Choisir une image</span>
                          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleBlocImage(index, e.target.files[0])} className="hidden" />
                        </label>
                        {bloc.image_preview && <img src={bloc.image_preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />}
                        <input type="text" value={bloc.image_caption} onChange={(e) => updateBloc(index, 'image_caption', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Légende de l'image" />
                        <input type="text" value={bloc.image_credit} onChange={(e) => updateBloc(index, 'image_credit', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Crédit photo" />
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={bloc.image_fullbleed} onChange={(e) => updateBloc(index, 'image_fullbleed', e.target.checked)} className="rounded" />
                          <span className="text-sm text-gray-600">Plein écran (full bleed)</span>
                        </label>
                      </div>
                    )}

                    {bloc.type === 'gallery' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Images de la galerie</span>
                          <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs" onClick={() => addGalleryImage(index)}>
                            <Plus size={14} className="mr-1" />Ajouter
                          </Button>
                        </div>
                        {bloc.gallery_images.map((img, imgIndex) => (
                          <div key={imgIndex} className="border border-gray-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Image {imgIndex + 1}</span>
                              <button onClick={() => removeGalleryImage(index, imgIndex)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                            </div>
                            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 hover:border-[#c9a84c] cursor-pointer text-xs">
                              <Image size={14} className="text-gray-400" />Choisir une image
                              <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && updateGalleryImage(index, imgIndex, 'image', e.target.files[0])} className="hidden" />
                            </label>
                            {img.preview && <img src={img.preview} alt="Preview" className="w-full h-32 object-cover rounded-lg" />}
                            <input type="text" value={img.caption} onChange={(e) => updateGalleryImage(index, imgIndex, 'caption', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs" placeholder="Légende" />
                            <input type="text" value={img.credit} onChange={(e) => updateGalleryImage(index, imgIndex, 'credit', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs" placeholder="Crédit" />
                          </div>
                        ))}
                      </div>
                    )}

                    {bloc.type === 'video' && (
                      <div className="space-y-3">
                        <input type="url" value={bloc.video_url} onChange={(e) => updateBloc(index, 'video_url', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="URL de la vidéo (YouTube, Vimeo...)" />
                        <input type="text" value={bloc.video_titre} onChange={(e) => updateBloc(index, 'video_titre', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Titre de la vidéo" />
                        <input type="text" value={bloc.video_description} onChange={(e) => updateBloc(index, 'video_description', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Description" />
                      </div>
                    )}

                    {bloc.type === 'embed' && (
                      <input type="url" value={bloc.embed_url} onChange={(e) => updateBloc(index, 'embed_url', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="URL à intégrer" />
                    )}

                    {bloc.type === 'audio' && (
                      <div className="space-y-3">
                        <input type="text" value={bloc.audio_titre} onChange={(e) => updateBloc(index, 'audio_titre', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Titre de l'audio" />
                        <input type="text" value={bloc.audio_description} onChange={(e) => updateBloc(index, 'audio_description', e.target.value)} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Description" />
                      </div>
                    )}

                    {bloc.type === 'timeline' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Événements</span>
                          <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs" onClick={() => addTimelineEvent(index)}>
                            <Plus size={14} className="mr-1" />Ajouter
                          </Button>
                        </div>
                        {bloc.timeline_events.map((event, eventIndex) => (
                          <div key={eventIndex} className="border border-gray-100 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">Événement {eventIndex + 1}</span>
                              <button onClick={() => removeTimelineEvent(index, eventIndex)} className="text-red-500 hover:text-red-700"><Trash2 size={14} /></button>
                            </div>
                            <input type="text" value={event.date_label} onChange={(e) => updateTimelineEvent(index, eventIndex, 'date_label', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs" placeholder="Date (ex: 12 janvier 2024)" />
                            <input type="text" value={event.title} onChange={(e) => updateTimelineEvent(index, eventIndex, 'title', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs" placeholder="Titre" />
                            <textarea value={event.description} onChange={(e) => updateTimelineEvent(index, eventIndex, 'description', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs min-h-[60px]" placeholder="Description" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ReportageStatus })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
                >
                  <option value="draft">Brouillon</option>
                  <option value="review">En révision</option>
                  <option value="published">Publié</option>
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-600">Mettre en avant</span>
              </label>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta titre</label>
                <input type="text" value={form.meta_title} onChange={(e) => setForm({ ...form, meta_title: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Titre SEO" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta description</label>
                <textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm min-h-[80px]" placeholder="Description pour les moteurs de recherche" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image Open Graph</label>
                <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#c9a84c] cursor-pointer">
                  <Camera size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Image pour les réseaux sociaux</span>
                  <input type="file" accept="image/*" onChange={handleOgChange} className="hidden" />
                </label>
                {form.og_preview && <img src={form.og_preview} alt="OG Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}