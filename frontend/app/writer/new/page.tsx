"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";

const Icons = {
  ArrowLeft: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>,
  Save: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  Upload: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  X: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
};

interface Tag { id: number; name: string; slug: string; }

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

interface FormData {
  title: string; excerpt: string; content: string; category: string;
  meta_title: string; meta_description: string; tags: number[];
}
interface FormErrors { [key: string]: string; }

export default function WriterNewPostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [form, setForm] = useState<FormData>({
    title: "", excerpt: "", content: "", category: "other",
    meta_title: "", meta_description: "", tags: [],
  });

  useEffect(() => {
    api.get("/tags/").then(({ data }) => setTags(data)).catch(() => {});
  }, []);

  function setField(field: keyof FormData, value: string | number[]) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleTag(id: number) {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(id) ? f.tags.filter(t => t !== id) : [...f.tags, id],
    }));
  }

  function handleCoverImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, cover_image: "Le fichier doit être une image" }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, cover_image: "L'image ne doit pas dépasser 5MB" }));
      return;
    }
    setCoverImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
    setErrors(prev => { const n = { ...prev }; delete n.cover_image; return n; });
  }

  function removeCoverImage() {
    setCoverImage(null);
    setCoverPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): boolean {
    const e: FormErrors = {};
    if (form.title.trim().length < 10) e.title = "Titre trop court (min. 10 car.).";
    if (form.excerpt.trim().length < 30) e.excerpt = "Résumé trop court (min. 30 car.).";
    if (form.content.split(/\s+/).length < 50) e.content = "Contenu trop court (min. 50 mots).";
    if (!form.category) e.category = "Catégorie requise.";
    if (!coverImage) e.cover_image = "L'image de couverture est obligatoire.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(publishDirectly = false) {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "tags") (v as number[]).forEach(id => body.append("tags", String(id)));
        else body.append(k, String(v));
      });
      if (coverImage) body.append("cover_image", coverImage);

      const { data: created } = await api.post("/writer/posts/", body);
      if (publishDirectly && created?.id) {
        await api.post(`/writer/posts/${created.id}/publish/`, {});
      }
      router.push("/writer");
    } catch (err: any) {
      const mapped: FormErrors = {};
      Object.entries(err.response?.data ?? {}).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : String(v);
      });
      setErrors(mapped);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/writer" className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
          text-gray-400 hover:text-[#1c1c2e] hover:border-gray-300 hover:bg-gray-50 transition-all">
          <Icons.ArrowLeft />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold text-[#1c1c2e] tracking-tight">Nouvel article</h1>
          <p className="text-[11px] text-gray-400 mt-0.5">Remplissez tous les champs obligatoires</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm space-y-6">
        
        {/* Image de couverture */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Image de couverture <span className="text-red-500">*</span>
          </Label>
          {coverPreview ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100 group">
              <Image src={coverPreview} alt="Aperçu" width={800} height={400} className="w-full h-52 object-cover" />
              <button onClick={removeCoverImage}
                className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm
                  opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500">
                <Icons.X />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 hover:border-[#c9a84c]/40 rounded-2xl p-10 
                flex flex-col items-center gap-3 transition-all bg-gray-50/50 hover:bg-[#c9a84c]/5 group">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center
                group-hover:bg-[#c9a84c]/10 group-hover:text-[#c9a84c] transition-all">
                <Icons.Upload />
              </div>
              <span className="text-sm font-medium text-gray-500 group-hover:text-[#1c1c2e]">
                Cliquez pour ajouter une image
              </span>
              <span className="text-[11px] text-gray-400">JPG, PNG ou WebP • Max 5MB</span>
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverImageChange} className="hidden" />
          {errors.cover_image && <p className="text-[11px] text-red-500 font-medium">{errors.cover_image}</p>}
        </div>

        {/* Titre */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Titre <span className="text-red-500">*</span>
          </Label>
          <Input className="w-full h-11 text-sm bg-gray-50 border-gray-100 rounded-2xl focus:border-[#c9a84c]/40 focus:ring-4 focus:ring-[#c9a84c]/5"
            placeholder="Titre de l'article (min. 10 car.)"
            value={form.title} onChange={e => setField("title", e.target.value)} />
          {errors.title && <p className="text-[11px] text-red-500 font-medium">{errors.title}</p>}
        </div>

        {/* Catégorie */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Catégorie <span className="text-red-500">*</span>
          </Label>
          <Select value={form.category} onValueChange={v => setField("category", v)}>
            <SelectTrigger className="h-11 text-sm rounded-2xl bg-gray-50 border-gray-100">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-[11px] text-red-500 font-medium">{errors.category}</p>}
        </div>

        {/* Résumé */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Résumé <span className="text-red-500">*</span>
          </Label>
          <Textarea className="w-full text-sm bg-gray-50 border-gray-100 rounded-2xl resize-none min-h-[90px]
            focus:border-[#c9a84c]/40 focus:ring-4 focus:ring-[#c9a84c]/5"
            placeholder="Résumé affiché dans les listes (min. 30 car.)"
            value={form.excerpt} onChange={e => setField("excerpt", e.target.value)} />
          {errors.excerpt && <p className="text-[11px] text-red-500 font-medium">{errors.excerpt}</p>}
        </div>

        {/* Contenu */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Contenu <span className="text-red-500">*</span>
          </Label>
          <Textarea className="w-full text-sm bg-gray-50 border-gray-100 rounded-2xl resize-none min-h-[280px] 
            font-mono leading-relaxed focus:border-[#c9a84c]/40 focus:ring-4 focus:ring-[#c9a84c]/5"
            placeholder="Rédigez le contenu de l'article (min. 50 mots)…"
            value={form.content} onChange={e => setField("content", e.target.value)} />
          <p className="text-[10px] text-gray-400">{form.content.split(/\s+/).filter(Boolean).length} mots</p>
          {errors.content && <p className="text-[11px] text-red-500 font-medium">{errors.content}</p>}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                  className={`px-4 py-2 rounded-2xl text-[12px] font-medium border-2 transition-all
                    ${form.tags.includes(tag.id)
                      ? "bg-[#1c1c2e] text-white border-[#1c1c2e]"
                      : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                    }`}>
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        <details className="group">
          <summary className="text-[11px] font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600">
            SEO (optionnel)
          </summary>
          <div className="mt-4 space-y-4 pl-1">
            <div className="space-y-2">
              <Label className="text-[11px] text-gray-400">Meta titre</Label>
              <Input className="w-full h-10 text-sm bg-gray-50 border-gray-100 rounded-2xl"
                placeholder="70 caractères max" maxLength={70}
                value={form.meta_title} onChange={e => setField("meta_title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] text-gray-400">Meta description</Label>
              <Textarea className="w-full text-sm bg-gray-50 border-gray-100 rounded-2xl resize-none min-h-[70px]"
                placeholder="160 caractères max" maxLength={160}
                value={form.meta_description} onChange={e => setField("meta_description", e.target.value)} />
            </div>
          </div>
        </details>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <Button variant="outline" size="sm" className="text-xs gap-2 rounded-2xl h-10 px-5 font-semibold"
            disabled={saving} onClick={() => handleSubmit(false)}>
            <Icons.Save /> Enregistrer brouillon
          </Button>
          <Button size="sm" className="text-xs gap-2 bg-[#1c1c2e] hover:bg-[#2a2a3e] text-white rounded-2xl h-10 px-5 font-semibold"
            disabled={saving} onClick={() => handleSubmit(true)}>
            <Icons.Send /> {saving ? "Publication…" : "Publier"}
          </Button>
        </div>
      </div>
    </div>
  );
}