// types/reportage.ts
import type { ReactNode } from "react";
export type BlocType = 
  | 'intro'
  | 'texte'
  | 'image'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'citation'
  | 'timeline'
  | 'embed';



export interface BlocTypeConfig {
  type: BlocType;
  label: string;
  icon: ReactNode;
  color: string;
}
export interface GalleryImage {
  image: File | string | null;
  preview?: string;
  caption?: string;
  credit?: string;
  ordre?: number;
}

export interface TimelineEvent {
  id?: string;
  uuid?: string;
  date_label: string;
  title: string;
  description?: string;
  image?: File | string | null;
  ordre?: number;
}

export interface Bloc {
  // Identifiants
  id?: number;
  uuid?: string;
  
  // Type et ordre
  type: BlocType;
  ordre: number;
  
  // Texte / Intro / Citation
  contenu: string;
  citation_auteur: string;
  citation_large: boolean;
  
  // Image optimisée
  image: File | string | null;
  image_id?: string | number;
  image_preview: string;
  image_caption: string;
  image_credit: string;
  image_fullbleed: boolean;
  
  // Galerie
  gallery_images: GalleryImage[];
  
  // Citation stylisée
  quote_id?: string | number;
  
  // Vidéo
  video_fichier: File | string | null;
  video_local_id?: string | number;
  video_youtube_url?: string;
  video_vimeo_url?: string;
  video_url: string;
  video_titre: string;
  video_description: string;
  video_duree: string;
  video_caption?: string;
  video_thumbnail: File | string | null;
  video_thumbnail_preview: string;
  
  video_file?: File | null;           
  video_file_name?: string;           
  video_file_size?: number;         
  video_preview?: string;             
  
  // Audio
  audio_fichier: File | string | null;
  audio_id?: string | number;
  audio_titre: string;
  audio_description: string;
  audio_duree: string;
  
  // Embed
  embed_url: string;
  
  // Timeline
  timeline_events: TimelineEvent[];
}

export interface ReportageForm {
  title: string;
  subtitle: string;
  status: 'draft' | 'review' | 'published';
  featured: boolean;
  cover_image: File | string | null;
  cover_preview: string;
  cover_image_id?: string | number;
  meta_title: string;
  meta_description: string;
  og_image: File | string | null;
  og_preview: string;
  og_image_id?: string | number;
  blocs: Bloc[];
}