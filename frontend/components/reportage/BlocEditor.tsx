// components/reportage/BlocEditor.tsx

import { Bloc, BlocType } from "@/types/reportage";
import { 
  GripVertical, 
  Trash2, 
  Image as ImageIcon,
  AlertCircle,
  Upload,
  FileVideo,
  FileAudio,
  Link as LinkIcon,
  CheckCircle2,
  X
} from "lucide-react";
import { GalleryEditor } from "./GalleryEditor";
import { TimelineEditor } from "./TimelineEditor";

const BLOC_COLORS: Record<BlocType, string> = {
  intro: 'bg-blue-100 text-blue-700 border-blue-200',
  texte: 'bg-gray-100 text-gray-700 border-gray-200',
  image: 'bg-green-100 text-green-700 border-green-200',
  gallery: 'bg-purple-100 text-purple-700 border-purple-200',
  video: 'bg-red-100 text-red-700 border-red-200',
  audio: 'bg-orange-100 text-orange-700 border-orange-200',
  citation: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  timeline: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  embed: 'bg-pink-100 text-pink-700 border-pink-200',
};

const BLOC_LABELS: Record<BlocType, string> = {
  intro: 'Introduction',
  texte: 'Texte',
  image: 'Image',
  gallery: 'Galerie',
  video: 'Vidéo',
  audio: 'Audio',
  citation: 'Citation',
  timeline: 'Chronologie',
  embed: 'Embed',
};

interface BlocEditorProps {
  bloc: Bloc;
  index: number;
  errors?: Record<string, string>;
  isUploading?: boolean;
  uploadProgress?: number;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onImageUpload: (file: File) => void;
  onVideoUpload: (file: File) => void;  
}

export function BlocEditor({
  bloc,
  index,
  errors = {},
  isUploading = false,
  uploadProgress = 0,
  onUpdate,
  onRemove,
  onImageUpload,
  onVideoUpload,  
}: BlocEditorProps) {
  const label = BLOC_LABELS[bloc.type];
  const hasErrors = Object.keys(errors).length > 0;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`
      border rounded-xl p-4 space-y-3 transition-all
      ${hasErrors ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300'}
    `}>
      
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-gray-400 cursor-move" />
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${BLOC_COLORS[bloc.type]}`}>
            {label}
          </span>
          {hasErrors && (
            <AlertCircle size={16} className="text-red-500" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isUploading && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <Upload size={12} className="animate-bounce" />
              <span>{uploadProgress}%</span>
            </div>
          )}
          <button 
            onClick={onRemove} 
            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
            title="Supprimer ce bloc"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ─── Message d'erreur général ─── */}
      {hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          {Object.entries(errors).map(([key, message]) => (
            <p key={key} className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle size={12} />
              {message}
            </p>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  CONTENU SPÉCIFIQUE PAR TYPE */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* ─── INTRO / TEXTE ─── */}
      {(bloc.type === 'intro' || bloc.type === 'texte') && (
        <div>
          <textarea
            value={bloc.contenu}
            onChange={(e) => onUpdate('contenu', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#c9a84c] focus:ring-1 focus:ring-[#c9a84c] outline-none text-sm min-h-[150px] resize-y"
            placeholder={bloc.type === 'intro' 
              ? "Introduction captivante de votre reportage..." 
              : "Contenu du bloc de texte..."
            }
          />
        </div>
      )}

      {/* ─── CITATION ─── */}
      {bloc.type === 'citation' && (
        <div className="space-y-3">
          <textarea
            value={bloc.contenu}
            onChange={(e) => onUpdate('contenu', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[100px] resize-y italic"
            placeholder="« Votre citation inspirante... »"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={bloc.citation_auteur}
              onChange={(e) => onUpdate('citation_auteur', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm"
              placeholder="Auteur"
            />
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={bloc.citation_large}
                onChange={(e) => onUpdate('citation_large', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Citation large</span>
            </label>
          </div>
        </div>
      )}

      {/* ─── IMAGE ─── */}
      {bloc.type === 'image' && (
        <div className="space-y-3">
          {/* Zone d'upload */}
          <div className="relative">
            <label className={`
              flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl 
              border-2 border-dashed cursor-pointer transition-all
              ${bloc.image 
                ? 'border-green-300 bg-green-50' 
                : errors.image 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-[#c9a84c] bg-gray-50'
              }
            `}>
              {bloc.image ? (
                <>
                  <CheckCircle2 size={24} className="text-green-500" />
                  <span className="text-sm text-green-600 font-medium">
                    Image sélectionnée
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Re-upload
                    }}
                    className="text-xs text-blue-600 underline"
                  >
                    Changer d'image
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className={errors.image ? 'text-red-400' : 'text-gray-400'} />
                  <span className={`text-sm ${errors.image ? 'text-red-500' : 'text-gray-500'}`}>
                    {isUploading ? 'Upload en cours...' : 'Cliquez pour choisir une image'}
                  </span>
                  <span className="text-xs text-gray-400">
                    JPEG, PNG ou WebP - Max 10 Mo
                  </span>
                </>
              )}
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
                    onImageUpload(file);
                  }
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Preview */}
          {bloc.image_preview && !isUploading && (
            <div className="relative group">
              <img 
                src={bloc.image_preview} 
                alt="Preview" 
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg" />
            </div>
          )}

          {/* Métadonnées image */}
          <div className="space-y-2">
            <input
              type="text"
              value={bloc.image_caption}
              onChange={(e) => onUpdate('image_caption', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
              placeholder="Légende de l'image"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={bloc.image_credit}
                onChange={(e) => onUpdate('image_credit', e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
                placeholder="Crédit photo"
              />
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={bloc.image_fullbleed}
                  onChange={(e) => onUpdate('image_fullbleed', e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">Plein écran</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ─── VIDÉO ─── */}
      {bloc.type === 'video' && (
        <div className="space-y-3">
          {/* Option 1: URL externe */}
          <div className="relative">
            <input
              type="url"
              value={bloc.video_url}
              onChange={(e) => onUpdate('video_url', e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
              placeholder="URL YouTube ou Vimeo..."
              disabled={!!bloc.video_file}  
            />
            <FileVideo size={16} className="absolute left-3 top-3 text-gray-400" />
            {bloc.video_url && (
              <button
                onClick={() => onUpdate('video_url', '')}
                className="absolute right-3 top-3 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Séparateur */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="text-xs text-gray-400 px-2">OU</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>
          
          {/* Option 2: Upload fichier local */}
          <div className="relative">
            <label className={`
              flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl 
              border-2 border-dashed cursor-pointer transition-all
              ${bloc.video_file 
                ? 'border-green-300 bg-green-50' 
                : errors.video_file 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 hover:border-[#c9a84c] bg-gray-50'
              }
            `}>
              {bloc.video_file ? (
                <>
                  <CheckCircle2 size={24} className="text-green-500" />
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">
                      Vidéo sélectionnée
                    </p>
                    <p className="text-xs text-green-500 mt-1">
                      {bloc.video_file_name || 'Fichier vidéo'} 
                      {bloc.video_file_size && ` - ${formatFileSize(bloc.video_file_size)}`}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onUpdate('video_file', null);
                      onUpdate('video_file_name', '');
                      onUpdate('video_file_size', 0);
                    }}
                    className="text-xs text-red-600 underline hover:text-red-700"
                  >
                    Supprimer la vidéo
                  </button>
                </>
              ) : (
                <>
                  <FileVideo size={24} className={errors.video_file ? 'text-red-400' : 'text-gray-400'} />
                  <span className={`text-sm ${errors.video_file ? 'text-red-500' : 'text-gray-500'}`}>
                    {isUploading ? 'Upload en cours...' : 'Cliquez pour uploader une vidéo'}
                  </span>
                  <span className="text-xs text-gray-400">
                    MP4, WebM ou MOV - Max 100 Mo
                  </span>
                </>
              )}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Vérification taille (100 Mo)
                    if (file.size > 100 * 1024 * 1024) {
                      alert("La vidéo ne doit pas dépasser 100 Mo");
                      return;
                    }
                    // Vérification format
                    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
                    if (!validTypes.includes(file.type)) {
                      alert("Format non supporté. Utilisez MP4, WebM ou MOV");
                      return;
                    }
                    // Si une URL externe existe, la supprimer
                    if (bloc.video_url) {
                      onUpdate('video_url', '');
                    }
                    onVideoUpload(file);
                  }
                }}
                className="hidden"
                disabled={isUploading || !!bloc.video_url}
              />
            </label>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

         {bloc.video_preview && !isUploading && (
            <div className="relative rounded-lg overflow-hidden bg-black">
              <video 
                src={bloc.video_preview} 
                controls 
                className="w-full max-h-64 object-contain"
                poster={typeof bloc.video_thumbnail === 'string' ? bloc.video_thumbnail : undefined}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            </div>
          )}
          
          {/* Champs vidéo (communs aux deux options) */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={bloc.video_titre}
              onChange={(e) => onUpdate('video_titre', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
              placeholder="Titre de la vidéo"
            />
            <input
              type="text"
              value={bloc.video_duree}
              onChange={(e) => onUpdate('video_duree', e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
              placeholder="Durée (ex: 3:45)"
            />
          </div>
          
          <textarea
            value={bloc.video_description}
            onChange={(e) => onUpdate('video_description', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[80px] resize-y focus:border-[#c9a84c] outline-none"
            placeholder="Description de la vidéo..."
          />
        </div>
      )}

      {/* ─── AUDIO ─── */}
      {bloc.type === 'audio' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
            <FileAudio size={24} className="text-gray-400" />
            <div className="flex-1">
              <input
                type="text"
                value={bloc.audio_titre}
                onChange={(e) => onUpdate('audio_titre', e.target.value)}
                className="w-full px-0 py-1 bg-transparent border-b border-gray-300 text-sm focus:border-[#c9a84c] outline-none"
                placeholder="Titre de l'audio"
              />
              <input
                type="text"
                value={bloc.audio_duree}
                onChange={(e) => onUpdate('audio_duree', e.target.value)}
                className="w-full px-0 py-1 bg-transparent border-b border-gray-300 text-xs text-gray-500 focus:border-[#c9a84c] outline-none mt-1"
                placeholder="Durée"
              />
            </div>
          </div>
          <textarea
            value={bloc.audio_description}
            onChange={(e) => onUpdate('audio_description', e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[60px] resize-y focus:border-[#c9a84c] outline-none"
            placeholder="Description de l'audio..."
          />
        </div>
      )}

      {/* ─── EMBED ─── */}
      {bloc.type === 'embed' && (
        <div className="relative">
          <input
            type="url"
            value={bloc.embed_url}
            onChange={(e) => onUpdate('embed_url', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#c9a84c] outline-none"
            placeholder="URL à intégrer (Twitter, Instagram, etc.)"
          />
          <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
        </div>
      )}

      
      {bloc.type === 'gallery' && (
        <GalleryEditor 
          bloc={bloc} 
          errors={errors}
          onUpdate={onUpdate} 
        />
      )}

      {/* ─── TIMELINE ─── */}
      {bloc.type === 'timeline' && (
        <TimelineEditor 
          bloc={bloc} 
          errors={errors}
          onUpdate={onUpdate} 
        />
      )} 

      {/* ─── Footer info ─── */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
        <span>Bloc #{index + 1}</span>
        {bloc.type === 'image' && bloc.image && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 size={12} />
            Image prête
          </span>
        )}
        {bloc.type === 'video' && (bloc.video_url || bloc.video_file) && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 size={12} />
            {bloc.video_file ? 'Vidéo locale prête' : 'URL configurée'}
          </span>
        )}
      </div>
    </div>
  );
}