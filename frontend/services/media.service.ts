
import api from '@/lib/api';  

export const MediaService = {
  uploadImage: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('alt_text', file.name);
    
    return api.post('/optimized-images/', formData, {  // ✅ Correction 2 : pas de /api/ en double
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: any) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
  },

  uploadVideo: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('media_type', 'video');
    
    return api.post('/media-files/', formData, {  // ✅ Correction 2 : pas de /api/ en double
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event: any) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
  },

  uploadAudio: (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('media_type', 'audio');
    
    return api.post('/media-files/', formData, {  // ✅ Correction 2 : pas de /api/ en double
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
}