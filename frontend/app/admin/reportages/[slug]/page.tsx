// app/admin/reportages/[slug]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import {
  ArrowLeft, Save, Camera, Loader2, AlertCircle, Pencil, Plus, Trash2,
  Eye, Globe
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Bloc {
  id: number;
  type: string;
  contenu: string;
  image_url?: string;
  video_url?: string;
}

interface ReportageDetail {
  slug: string;
  title: string;
  subtitle: string;
  status: string;
  cover_image_url: string | null;
  author_name: string;
  blocs: Bloc[];
  views_count: number;
  featured: boolean;
  published_at: string | null;
}

export default function EditReportagePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [reportage, setReportage] = useState<ReportageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    status: "draft",
  });

  const fetchReportage = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/reportages/${slug}/`);
      const reportageData = Array.isArray(data) ? data[0] : data;
      setReportage(reportageData);
      setForm({
        title: reportageData.title || "",
        subtitle: reportageData.subtitle || "",
        status: reportageData.status || "draft",
      });
    } catch (err) {
      setError("Reportage introuvable.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) fetchReportage();
  }, [slug, fetchReportage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/reportages/${slug}/`, form);
      alert("Reportage sauvegardé !");
    } catch (err) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (error || !reportage) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">{error || "Reportage introuvable."}</p>
        <Link href="/admin/reportages" className="text-[#c9a84c] hover:underline">
          ← Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/reportages" className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1c1c2e] hover:border-gray-300 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-lg font-extrabold text-[#1c1c2e]">Modifier le reportage</h1>
            <p className="text-[11px] text-gray-400">Slug : {slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/reportages/${slug}`} target="_blank">
            <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl gap-2">
              <Globe size={14} /> Voir le reportage
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving} className="h-10 px-4 rounded-xl bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e] font-bold">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      {/* Formulaire */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Titre</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm outline-none focus:border-[#c9a84c]/40 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sous-titre</label>
                <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm outline-none focus:border-[#c9a84c]/40 focus:bg-white transition-all" />
              </div>
            </CardContent>
          </Card>

          {/* Blocs existants */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold text-[#1c1c2e]">Blocs ({reportage.blocs?.length || 0})</h2>
                <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs gap-1">
                  <Plus size={13} /> Ajouter un bloc
                </Button>
              </div>
              {reportage.blocs?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Aucun bloc. Ajoutez du contenu.</p>
              ) : (
                <div className="space-y-2">
                  {reportage.blocs.map((bloc, i) => (
                    <div key={bloc.id || i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl text-sm">
                      <span className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {i + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-100 text-gray-600">
                        {bloc.type}
                      </span>
                      <span className="flex-1 truncate text-gray-500">
                        {bloc.contenu?.slice(0, 60) || bloc.video_url || "(vide)"}
                      </span>
                      <button className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-[15px] font-bold text-[#1c1c2e]">Statut</h2>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-100 bg-gray-50 text-sm">
                <option value="draft">Brouillon</option>
                <option value="review">En révision</option>
                <option value="published">Publié</option>
              </select>

              <div className="pt-4 border-t border-gray-100 text-sm text-gray-500 space-y-2">
                <p><Eye size={14} className="inline mr-1" />{reportage.views_count} vues</p>
                <p>Par {reportage.author_name}</p>
                {reportage.published_at && (
                  <p>Publié le {new Date(reportage.published_at).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}