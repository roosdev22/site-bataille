// services/reportage.service.ts

import api from "@/lib/api";  
import { ReportageForm, Bloc } from "@/types/reportage";

export class ReportageService {
  
  static async uploadImage(
    file: File,
    altText: string = '',
    onProgress?: (progress: number) => void
  ): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', altText || file.name);
    
    const response = await api.post('/optimized-images/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: any) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    
    return {
      id: response.data.id,
      url: response.data.images?.original || response.data.url,
    };
  }

  static async uploadVideo(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('media_type', 'video');
    
    const response = await api.post('/media-files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: any) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    
    return { id: response.data.id };
  }

  static async uploadAudio(file: File): Promise<{ id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('media_type', 'audio');
    
    const response = await api.post('/media-files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return { id: response.data.id };
  }

  static async uploadAllMedia(
    form: ReportageForm,
    onProgress?: (key: string, progress: number) => void
  ): Promise<{
    coverImageId?: string;
    ogImageId?: string;
    blocs: any[];
  }> {
    const result: any = { blocs: [] };

    if (form.cover_image instanceof File) {
      const { id } = await this.uploadImage(form.cover_image, form.title, (p) => onProgress?.('cover', p));
      result.coverImageId = id;
    }

    if (form.og_image instanceof File) {
      const { id } = await this.uploadImage(form.og_image, `OG - ${form.title}`, (p) => onProgress?.('og', p));
      result.ogImageId = id;
    }

    for (let i = 0; i < form.blocs.length; i++) {
      const bloc: any = { ...form.blocs[i] };
      const blocKey = `bloc_${i}`;

      if (bloc.type === 'image' && bloc.image instanceof File) {
        const { id } = await this.uploadImage(bloc.image, bloc.image_caption || '', (p) => onProgress?.(blocKey, p));
        bloc.image_id = id;
        delete bloc.image;
        delete bloc.image_preview;
      }

      if (bloc.type === 'video' && (bloc.video_fichier instanceof File || bloc.video_file instanceof File)) {
        const fileToUpload = bloc.video_fichier instanceof File ? bloc.video_fichier : bloc.video_file;
        const { id } = await this.uploadVideo(fileToUpload, (p) => onProgress?.(blocKey, p));
        bloc.video_local_id = id;
        delete bloc.video_fichier;
        delete bloc.video_file;
        delete bloc.video_file_name;
        delete bloc.video_file_size;
        delete bloc.video_preview;
      }

      if (bloc.type === 'audio' && bloc.audio_fichier instanceof File) {
        const { id } = await this.uploadAudio(bloc.audio_fichier);
        bloc.audio_id = id;
        delete bloc.audio_fichier;
      }

      if (bloc.type === 'gallery' && bloc.gallery_images?.length > 0) {
        const processedGallery = [];
        for (let j = 0; j < bloc.gallery_images.length; j++) {
          const img: any = { ...bloc.gallery_images[j] };
          if (img.image instanceof File) {
            const { id } = await this.uploadImage(img.image, img.caption || '');
            img.image = id;
          }
          processedGallery.push({ image: img.image, caption: img.caption || '', credit: img.credit || '', ordre: j });
        }
        bloc.gallery_images = processedGallery;
      }

      result.blocs.push(bloc);
    }

    return result;
  }

  private static preparePayload(form: ReportageForm, mediaIds: { coverImageId?: string; ogImageId?: string; blocs: any[] }) {
    return {
      title: form.title,
      subtitle: form.subtitle || '',
      status: form.status,
      featured: form.featured || false,
      meta_title: form.meta_title || '',
      meta_description: form.meta_description || '',
      ...(mediaIds.coverImageId && { cover_image_id: mediaIds.coverImageId }),
      ...(mediaIds.ogImageId && { og_image_id: mediaIds.ogImageId }),
      blocs: mediaIds.blocs.map((bloc: any, index: number) => {
        const clean: any = { type: bloc.type, ordre: index };
        
        if (bloc.type === 'intro' || bloc.type === 'texte') clean.contenu = bloc.contenu || '';
        if (bloc.type === 'image') {
          clean.image_id = bloc.image_id;
          clean.image_caption = bloc.image_caption || '';
          clean.image_credit = bloc.image_credit || '';
          clean.image_fullbleed = bloc.image_fullbleed || false;
        }
        if (bloc.type === 'video') {
          if (bloc.video_local_id) clean.video_local_id = bloc.video_local_id;
          if (bloc.video_url?.includes('youtube')) clean.video_youtube_url = bloc.video_url;
          if (bloc.video_url?.includes('vimeo')) clean.video_vimeo_url = bloc.video_url;
          clean.video_caption = bloc.video_description || bloc.video_caption || '';
        }
        if (bloc.type === 'audio') clean.audio_id = bloc.audio_id;
        if (bloc.type === 'citation') {
          clean.contenu = bloc.contenu || '';
          clean.citation_auteur = bloc.citation_auteur || '';
          clean.citation_large = bloc.citation_large || false;
        }
        if (bloc.type === 'gallery') {
          clean.gallery_images = (bloc.gallery_images || []).map((img: any, j: number) => ({
            image: img.image, caption: img.caption || '', credit: img.credit || '', ordre: j
          }));
        }
        if (bloc.type === 'timeline') {
          clean.timeline_events = (bloc.timeline_events || []).map((ev: any, j: number) => ({
            date_label: ev.date_label || '', title: ev.title || '', description: ev.description || '', ordre: j
          }));
        }
        if (bloc.type === 'embed') clean.embed_url = bloc.embed_url || '';
        
        return clean;
      }),
    };
  }

  static async createReportage(form: ReportageForm, onProgress?: (key: string, progress: number) => void) {
    const mediaIds = await this.uploadAllMedia(form, onProgress);
    const payload = this.preparePayload(form, mediaIds);
    const response = await api.post('/reportages/', payload);
    return response;
  }
}