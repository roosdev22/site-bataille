// app/admin/reportages/new/page.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { 
  ArrowLeft, Save, Eye, Loader2, Camera, Plus, AlertCircle, 
  CheckCircle2, Upload 
} from "lucide-react";
import Link from "next/link";
import { useReportage } from "@/hooks/useReportage";
import { BlocTypeButtons } from "@/components/reportage/BlocTypeButtons";
import { BlocEditor } from "@/components/reportage/BlocEditor";
export default function NewReportagePage() {
  const {
    form,
    setForm,
    loading,
    errors,
    blocErrors,        
    uploadProgress,
    updateBlocVideo,
    addBloc,
    removeBloc,
    updateBloc,
    updateBlocImage,
    setCoverImage,
    setOgImage,
    submit,
  } = useReportage();

  // Vérifier s'il y a des erreurs
  const hasErrors = Object.keys(errors).length > 0;
  const hasBlocErrors = blocErrors && Object.keys(blocErrors).length > 0;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  EN-TÊTE */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/reportages">
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nouveau reportage</h1>
            <p className="text-sm text-gray-500">
              {loading ? 'Création en cours...' : 'Créez un reportage immersif'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Bouton Brouillon */}
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-4 rounded-xl"
            onClick={async () => {
              setForm(prev => ({ ...prev, status: 'draft' }));
              // Sauvegarder en brouillon (optionnel)
              await submit();
            }}
            disabled={loading}
          >
            {loading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <Save size={16} className="mr-2" />
            )}
            Brouillon
          </Button>
          
          {/* Bouton Publier */}
          <Button
            size="sm"
            className={`h-10 px-4 rounded-xl transition-all ${
              hasErrors || hasBlocErrors
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-[#c9a84c] text-[#1c1c2e] hover:bg-[#d4b55e]'
            }`}
            onClick={() => {
              setForm(prev => ({ ...prev, status: 'published' }));
              submit();
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              <>
                <Eye size={16} className="mr-2" />
                Publier
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  ALERTE ERREUR GÉNÉRALE */}
      {/* ═══════════════════════════════════════════════════════ */}
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <p className="font-medium">Erreur</p>
            <p>{errors.general}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  ALERTE ERREURS DE BLOCS */}
      {/* ═══════════════════════════════════════════════════════ */}
      {hasBlocErrors && !errors.general && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <div>
            <p className="font-medium">Certains blocs nécessitent votre attention</p>
            <p>Corrigez les erreurs avant de publier.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  PROGRESSION UPLOAD GLOBALE */}
      {/* ═══════════════════════════════════════════════════════ */}
      {loading && Object.keys(uploadProgress).length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Upload size={18} className="text-blue-600 animate-bounce" />
            <span className="text-sm font-medium text-blue-700">
              Upload des médias en cours...
            </span>
          </div>
          <div className="space-y-1">
            {Object.entries(uploadProgress).map(([key, progress]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-blue-600 w-20 truncate">{key}</span>
                <div className="flex-1 bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-blue-600 w-10 text-right">{progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  CONTENU PRINCIPAL */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ─── COLONNE PRINCIPALE ─── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Infos générales */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                  {errors.title && (
                    <span className="text-red-500 ml-2 text-xs">{errors.title}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-colors ${
                    errors.title 
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c]'
                  }`}
                  placeholder="Titre du reportage"
                />
              </div>

              {/* Sous-titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-titre</label>
                <input
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none text-sm"
                  placeholder="Sous-titre"
                />
              </div>

              {/* Image de couverture */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image de couverture
                  {errors.cover_image && (
                    <span className="text-red-500 ml-2 text-xs">{errors.cover_image}</span>
                  )}
                </label>
                <div className="flex items-center gap-4">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    errors.cover_image
                      ? 'border-red-300 hover:border-red-400 bg-red-50'
                      : form.cover_image
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-[#c9a84c]'
                  }`}>
                    <Camera size={16} className={errors.cover_image ? 'text-red-400' : 'text-gray-400'} />
                    <span className={`text-sm ${errors.cover_image ? 'text-red-500' : 'text-gray-500'}`}>
                      {form.cover_image ? 'Changer' : 'Choisir'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 10 * 1024 * 1024) {
                            alert("L'image ne doit pas dépasser 10 Mo");
                            return;
                          }
                          setCoverImage(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  
                  {/* Preview */}
                  {form.cover_preview && (
                    <div className="relative">
                      <img 
                        src={form.cover_preview} 
                        alt="Preview couverture" 
                        className="h-16 w-24 object-cover rounded-lg shadow-sm" 
                      />
                      <button
                        onClick={() => setForm(prev => ({ 
                          ...prev, 
                          cover_image: null, 
                          cover_preview: '' 
                        }))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  )}
                  
                  {/* État upload */}
                  {loading && uploadProgress['cover'] !== undefined && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress['cover']}%` }}
                        />
                      </div>
                      <span className="text-xs text-blue-600">{uploadProgress['cover']}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Blocs */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-[15px] font-bold">
                    Blocs ({form.blocs.length})
                  </CardTitle>
                  {hasBlocErrors && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Erreurs
                    </span>
                  )}
                </div>
                <BlocTypeButtons onAdd={addBloc} />
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
                 <BlocEditor
                    key={index}
                    bloc={bloc}
                    index={index}
                    errors={blocErrors?.[index] || {}} 
                    isUploading={loading && uploadProgress[`bloc_${index}`] !== undefined}
                    uploadProgress={uploadProgress[`bloc_${index}`] || 0}
                    onUpdate={(field, value) => updateBloc(index, field, value)}
                    onRemove={() => removeBloc(index)}
                    onImageUpload={(file) => updateBlocImage(index, file)}
                    onVideoUpload={(file) => updateBlocVideo(index, file)} 
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="space-y-6">
          
          {/* Statut */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
                >
                  <option value="draft">📝 Brouillon</option>
                  <option value="review">👁️ En révision</option>
                  <option value="published">✅ Publié</option>
                </select>
              </div>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">⭐ Mettre en avant</span>
              </label>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem]">
            <CardHeader className="pb-4">
              <CardTitle className="text-[15px] font-bold">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titre SEO</label>
                                <input
                  type="text"
                  value={form.meta_title}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 255) {  
                      setForm({ ...form, meta_title: value });
                    }
                  }}
                  maxLength={255}  // Ajoute cette limite HTML
                  className={`w-full px-4 py-2 rounded-xl border text-sm focus:border-[#c9a84c] outline-none ${
                    form.meta_title.length > 255 ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder="Titre pour les moteurs de recherche"
                />
                <p className={`text-xs mt-1 ${form.meta_title.length > 200 ? 'text-red-500' : 'text-gray-400'}`}>
                  {form.meta_title.length}/255 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta description
                </label>
                <textarea
                  value={form.meta_description}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm min-h-[80px] focus:border-[#c9a84c] outline-none resize-y"
                  placeholder="Description pour les résultats de recherche"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {form.meta_description.length}/160 caractères
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Open Graph
                </label>
                <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  form.og_image
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 hover:border-[#c9a84c]'
                }`}>
                  <Camera size={16} className={form.og_image ? 'text-green-500' : 'text-gray-400'} />
                  <span className={`text-sm ${form.og_image ? 'text-green-600' : 'text-gray-500'}`}>
                    {form.og_image ? 'Image chargée ✓' : 'Choisir une image'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => e.target.files?.[0] && setOgImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>

                {form.og_preview && (
                  <div className="relative mt-2">
                    <img 
                      src={form.og_preview} 
                      alt="OG Preview" 
                      className="w-full h-32 object-cover rounded-lg shadow-sm" 
                    />
                    <button
                      onClick={() => setForm(prev => ({ 
                        ...prev, 
                        og_image: null, 
                        og_preview: '' 
                      }))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card className="border-gray-100 shadow-none rounded-[1.25rem] bg-gray-50">
            <CardContent className="py-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Résumé</h4>
              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2">
                  <span className={form.title ? 'text-green-500' : 'text-gray-400'}>
                    {form.title ? '✓' : '○'}
                  </span>
                  Titre renseigné
                </li>
                <li className="flex items-center gap-2">
                  <span className={form.blocs.length > 0 ? 'text-green-500' : 'text-gray-400'}>
                    {form.blocs.length > 0 ? '✓' : '○'}
                  </span>
                  {form.blocs.length} bloc(s)
                </li>
                <li className="flex items-center gap-2">
                  <span className={form.cover_image ? 'text-green-500' : 'text-gray-400'}>
                    {form.cover_image ? '✓' : '○'}
                  </span>
                  Image de couverture
                </li>
                <li className="flex items-center gap-2">
                  <span className={!hasErrors ? 'text-green-500' : 'text-red-500'}>
                    {!hasErrors ? '✓' : '✗'}
                  </span>
                  {hasErrors ? 'Erreurs à corriger' : 'Prêt à publier'}
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}