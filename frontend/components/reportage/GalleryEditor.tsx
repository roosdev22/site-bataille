// components/reportage/GalleryEditor.tsx

import { Bloc } from "@/types/reportage";
import { Image as ImageIcon, Trash2, GripVertical, AlertCircle } from "lucide-react";

interface GalleryEditorProps {
  bloc: Bloc;
  errors?: Record<string, string>;  // Ajouter cette prop
  onUpdate: (field: string, value: any) => void;
}

export function GalleryEditor({ bloc, errors = {}, onUpdate }: GalleryEditorProps) {
  const galleryImages = bloc.gallery_images || [];

  const addImage = () => {
    const newImages = [
      ...galleryImages,
      { image: null, caption: "", credit: "", ordre: galleryImages.length },
    ];
    onUpdate("gallery_images", newImages);
  };

  const removeImage = (index: number) => {
    const newImages = galleryImages.filter((_, i) => i !== index);
    onUpdate("gallery_images", newImages);
  };

  const updateImage = (index: number, field: string, value: any) => {
    const newImages = [...galleryImages];
    (newImages[index] as any)[field] = value;
    onUpdate("gallery_images", newImages);
  };

  const handleImageUpload = (index: number, file: File) => {
    const newImages = [...galleryImages];
    newImages[index] = {
      ...newImages[index],
      image: file,
      preview: URL.createObjectURL(file),
    };
    onUpdate("gallery_images", newImages);
  };

  return (
    <div className="space-y-3">
      {/* Erreur générale de la galerie */}
      {errors.gallery && (
        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={14} />
          {errors.gallery}
        </div>
      )}

      {/* Liste des images */}
      {galleryImages.map((img: any, index: number) => (
        <div
          key={index}
          className={`border rounded-lg p-3 space-y-2 ${
            errors[`gallery_image_${index}`] ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-gray-400 cursor-move" />
              <span className="text-xs font-medium text-gray-600">
                Image {index + 1}
              </span>
            </div>
            <button
              onClick={() => removeImage(index)}
              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Upload image */}
          <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            img.image
              ? 'border-green-300 bg-green-50'
              : errors[`gallery_image_${index}`]
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
          }`}>
            <ImageIcon size={14} className={errors[`gallery_image_${index}`] ? 'text-red-400' : 'text-gray-400'} />
            <span className={`text-xs ${
              errors[`gallery_image_${index}`] 
                ? 'text-red-500' 
                : img.image 
                  ? 'text-green-600' 
                  : 'text-gray-500'
            }`}>
              {img.image ? 'Image chargée ✓' : 'Choisir une image'}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(index, file);
              }}
              className="hidden"
            />
          </label>

          {/* Erreur spécifique à cette image */}
          {errors[`gallery_image_${index}`] && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle size={12} />
              {errors[`gallery_image_${index}`]}
            </p>
          )}

          {/* Preview */}
          {img.preview && (
            <img
              src={img.preview}
              alt={`Preview ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
          )}

          {/* Métadonnées */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={img.caption || ""}
              onChange={(e) => updateImage(index, "caption", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-[#c9a84c] outline-none"
              placeholder="Légende"
            />
            <input
              type="text"
              value={img.credit || ""}
              onChange={(e) => updateImage(index, "credit", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs focus:border-[#c9a84c] outline-none"
              placeholder="Crédit"
            />
          </div>
        </div>
      ))}

      {/* Bouton ajouter */}
      <button
        onClick={addImage}
        className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors"
      >
        + Ajouter une image
      </button>
    </div>
  );
}