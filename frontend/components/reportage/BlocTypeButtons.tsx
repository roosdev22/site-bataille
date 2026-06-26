// components/reportage/BlocTypeButtons.tsx

import Button from "@/components/ui/Button";
import { BlocTypeConfig, BlocType } from "@/types/reportage";
import {
  Type, FileText, Image, Layout, Video, Music, Quote, Clock
} from "lucide-react";

const BLOC_TYPES: BlocTypeConfig[] = [
  { type: 'intro', label: 'Introduction', icon: <Type size={16} />, color: 'bg-blue-100 text-blue-700' },
  { type: 'texte', label: 'Texte', icon: <FileText size={16} />, color: 'bg-gray-100 text-gray-700' },
  { type: 'image', label: 'Image', icon: <Image size={16} />, color: 'bg-green-100 text-green-700' },
  { type: 'gallery', label: 'Galerie', icon: <Layout size={16} />, color: 'bg-purple-100 text-purple-700' },
  { type: 'video', label: 'Vidéo', icon: <Video size={16} />, color: 'bg-red-100 text-red-700' },
  { type: 'audio', label: 'Audio', icon: <Music size={16} />, color: 'bg-orange-100 text-orange-700' },
  { type: 'citation', label: 'Citation', icon: <Quote size={16} />, color: 'bg-yellow-100 text-yellow-700' },
  { type: 'timeline', label: 'Chronologie', icon: <Clock size={16} />, color: 'bg-indigo-100 text-indigo-700' },
  { type: 'embed', label: 'Embed', icon: <Layout size={16} />, color: 'bg-pink-100 text-pink-700' },
];

interface BlocTypeButtonsProps {
  onAdd: (type: BlocType) => void;
}

export function BlocTypeButtons({ onAdd }: BlocTypeButtonsProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {BLOC_TYPES.map((bt) => (
        <button
          key={bt.type}
          onClick={() => onAdd(bt.type)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${bt.color} hover:opacity-80 transition-opacity`}
          title={bt.label}
        >
          <span className="flex items-center gap-1.5">
            {bt.icon}
            {bt.label}
          </span>
        </button>
      ))}
    </div>
  );
}