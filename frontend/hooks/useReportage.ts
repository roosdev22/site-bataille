// hooks/useReportage.ts

import { useState, useCallback, useMemo } from 'react';
import { ReportageForm, BlocType, Bloc } from '@/types/reportage';
import { ReportageService } from '@/services/reportage.service';
import { useRouter } from 'next/navigation';

const INITIAL_FORM: ReportageForm = {
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
};

const createEmptyBloc = (type: BlocType, ordre: number): Bloc => ({
  // Identifiants
  id: undefined,
  uuid: undefined,
  
  // Type et ordre
  type,
  ordre,
  
  // Texte / Intro / Citation
  contenu: "",
  citation_auteur: "",
  citation_large: false,
  
  // Image optimisée
  image: null,
  image_id: undefined,
  image_preview: "",
  image_caption: "",
  image_credit: "",
  image_fullbleed: false,
  
  // Galerie
  gallery_images: [],
  
  // Citation stylisée
  quote_id: undefined,
  
  // Vidéo
  video_fichier: null,
  video_local_id: undefined,
  video_youtube_url: undefined,
  video_vimeo_url: undefined,
  video_url: "",
  video_titre: "",
  video_description: "",
  video_duree: "",
  video_caption: undefined,
  video_thumbnail: null,
  video_thumbnail_preview: "",
  
  // Vidéo UI (transient)
  video_file: undefined,
  video_file_name: undefined,
  video_file_size: undefined,
  video_preview: undefined,
  
  // Audio
  audio_fichier: null,
  audio_id: undefined,
  audio_titre: "",
  audio_description: "",
  audio_duree: "",
  
  // Embed
  embed_url: "",
  
  // Timeline
  timeline_events: [],
});

export function useReportage(initialData?: ReportageForm) {
  const router = useRouter();
  const [form, setForm] = useState<ReportageForm>(initialData || INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // ═══════════════════════════════════════════════════════════
  //  VALIDATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Valide le formulaire et retourne les erreurs
   */
  const validateForm = useCallback((): Record<string, any> => {
    const validationErrors: Record<string, any> = {};

    // Validation titre
    if (!form.title.trim()) {
      validationErrors.title = "Le titre est obligatoire.";
    }

    // Validation blocs pour publication
    if (form.status === 'published' && form.blocs.length === 0) {
      validationErrors.general = "Ajoutez au moins un bloc pour publier.";
    }

    // Validation individuelle des blocs
    const blocErrors: Record<string, Record<string, string>> = {};
    
    form.blocs.forEach((bloc, index) => {
      const blockErrors: Record<string, string> = {};

      switch (bloc.type) {
        case 'image':
          if (!bloc.image) {
            blockErrors.image = "Sélectionnez une image pour ce bloc.";
          }
          break;

        case 'video':
          if (!bloc.video_fichier && !bloc.video_file && !bloc.video_url) {
              blockErrors.video = "Ajoutez un fichier vidéo ou une URL.";
         }
        break;

        case 'audio':
          if (!bloc.audio_fichier) {
            blockErrors.audio = "Ajoutez un fichier audio.";
          }
          break;

        case 'gallery':
          if (!bloc.gallery_images || bloc.gallery_images.length === 0) {
            blockErrors.gallery = "Ajoutez au moins une image à la galerie.";
          } else {
            bloc.gallery_images.forEach((img: any, imgIndex: number) => {
              if (!img.image) {
                blockErrors[`gallery_image_${imgIndex}`] = `L'image ${imgIndex + 1} est requise.`;
              }
            });
          }
          break;

        case 'embed':
          if (!bloc.embed_url) {
            blockErrors.embed = "Ajoutez une URL à intégrer.";
          }
          break;

        case 'citation':
          if (!bloc.contenu && !bloc.citation_auteur) {
            blockErrors.citation = "Ajoutez le texte et l'auteur de la citation.";
          }
          break;

        case 'timeline':
          if (!bloc.timeline_events || bloc.timeline_events.length === 0) {
            blockErrors.timeline = "Ajoutez au moins un événement.";
          } else {
            bloc.timeline_events.forEach((event: any, eventIndex: number) => {
              if (!event.date_label) {
                blockErrors[`timeline_event_${eventIndex}`] = "La date est requise.";
              }
              if (!event.title) {
                blockErrors[`timeline_event_${eventIndex}`] = 
                  (blockErrors[`timeline_event_${eventIndex}`] || '') + " Le titre est requis.";
              }
            });
          }
          break;
      }

      if (Object.keys(blockErrors).length > 0) {
        blocErrors[index] = blockErrors;
      }
    });

    if (Object.keys(blocErrors).length > 0) {
      validationErrors.blocs = blocErrors;
    }

    return validationErrors;
  }, [form]);

  // ═══════════════════════════════════════════════════════════
  //  ERREURS DE BLOCS (formatées pour l'affichage)
  // ═══════════════════════════════════════════════════════════

  /**
   * Erreurs formatées par index de bloc
   */
  const blocErrors = useMemo(() => {
    if (errors.blocs && typeof errors.blocs === 'object' && !Array.isArray(errors.blocs)) {
      return errors.blocs as Record<string, Record<string, string>>;
    }
    
    // Valider en temps réel pour l'affichage visuel
    const validationErrors = validateForm();
    if (validationErrors.blocs) {
      return validationErrors.blocs as Record<string, Record<string, string>>;
    }
    
    return {};
  }, [errors, validateForm]);

  // ═══════════════════════════════════════════════════════════
  //  SOUMISSION
  // ═══════════════════════════════════════════════════════════

  const submit = useCallback(async () => {
    setLoading(true);
    setErrors({});

    // Étape 1 : Validation frontend
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      // Étape 2 : Upload + Création
      const response = await ReportageService.createReportage(
        form,
        (key, progress) => {
          setUploadProgress(prev => ({ ...prev, [key]: progress }));
        }
      );

      // Succès : redirection
      router.push(`/admin/reportages/${response.data.slug}`);
      
    } catch (error: any) {
      console.error('Erreur soumission:', error.response?.data);
      
      // Formater les erreurs du serveur
      const serverErrors = error.response?.data || {};
      
      // Si le serveur renvoie des erreurs de blocs sous forme de tableau
      if (serverErrors.blocs && Array.isArray(serverErrors.blocs)) {
        const formattedBlocErrors: Record<string, Record<string, string>> = {};
        
        serverErrors.blocs.forEach((blocError: any, index: number) => {
          if (blocError && Object.keys(blocError).length > 0) {
            formattedBlocErrors[index] = blocError;
          }
        });
        
        serverErrors.blocs = formattedBlocErrors;
      }
      
      setErrors(serverErrors);
    } finally {
      setLoading(false);
    }
  }, [form, validateForm, router]);

  // ═══════════════════════════════════════════════════════════
  //  GESTION DES BLOCS
  // ═══════════════════════════════════════════════════════════

  const addBloc = useCallback((type: BlocType) => {
    const newBloc = createEmptyBloc(type, form.blocs.length);
    setForm(prev => ({ ...prev, blocs: [...prev.blocs, newBloc] }));
    // Nettoyer les erreurs
    setErrors({});
  }, [form.blocs.length]);

  const removeBloc = useCallback((index: number) => {
    setForm(prev => ({
      ...prev,
      blocs: prev.blocs.filter((_, i) => i !== index),
    }));
    // Nettoyer les erreurs
    setErrors({});
  }, []);

  const updateBloc = useCallback((index: number, field: string, value: any) => {
    setForm(prev => {
      const newBlocs = [...prev.blocs];
      (newBlocs[index] as any)[field] = value;
      return { ...prev, blocs: newBlocs };
    });
    
    // Nettoyer l'erreur de ce bloc spécifique
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.blocs?.[index]?.[field]) {
        const blocErrors = { ...newErrors.blocs[index] };
        delete blocErrors[field];
        
        if (Object.keys(blocErrors).length === 0) {
          delete newErrors.blocs[index];
          if (Object.keys(newErrors.blocs).length === 0) {
            delete newErrors.blocs;
          }
        } else {
          newErrors.blocs = { ...newErrors.blocs, [index]: blocErrors };
        }
      }
      return newErrors;
    });
  }, []);

  const updateBlocImage = useCallback((index: number, file: File | string) => {  
    // Si c'est une string (URL du serveur), on la stocke directement
    if (typeof file === 'string') {
      setForm(prev => {
        const newBlocs = [...prev.blocs];
        newBlocs[index].image = file;
        return { ...prev, blocs: newBlocs };
      });
      return;
    }

    // Validation taille
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        blocs: {
          ...prev.blocs,
          [index]: {
            ...(prev.blocs?.[index] || {}),
            image: "L'image ne doit pas dépasser 10 Mo.",
          },
        },
      }));
      return;
    }

    // Validation format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        blocs: {
          ...prev.blocs,
          [index]: {
            ...(prev.blocs?.[index] || {}),
            image: "Format non supporté. Utilisez JPEG, PNG ou WebP.",
          },
        },
      }));
      return;
    }

    setForm(prev => {
      const newBlocs = [...prev.blocs];
      newBlocs[index].image = file;
      newBlocs[index].image_preview = URL.createObjectURL(file);
      return { ...prev, blocs: newBlocs };
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.blocs?.[index]?.image) {
        const blocErrors = { ...newErrors.blocs[index] };
        delete blocErrors.image;
        
        if (Object.keys(blocErrors).length === 0) {
          delete newErrors.blocs[index];
          if (Object.keys(newErrors.blocs).length === 0) {
            delete newErrors.blocs;
          }
        } else {
          newErrors.blocs = { ...newErrors.blocs, [index]: blocErrors };
        }
      }
      return newErrors;
    });
  }, []);

  // ✅ NOUVELLE FONCTION - Correctement placée
  const updateBlocVideo = useCallback((index: number, file: File) => {
    // Validation taille (100 Mo)
    if (file.size > 100 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        blocs: {
          ...prev.blocs,
          [index]: {
            ...(prev.blocs?.[index] || {}),
            video_file: "La vidéo ne doit pas dépasser 100 Mo.",
          },
        },
      }));
      return;
    }

    // Validation format
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        blocs: {
          ...prev.blocs,
          [index]: {
            ...(prev.blocs?.[index] || {}),
            video_file: "Format non supporté. Utilisez MP4, WebM ou MOV.",
          },
        },
      }));
      return;
    }

    setForm(prev => {
      const newBlocs = [...prev.blocs];
      newBlocs[index].video_file = file;
      newBlocs[index].video_file_name = file.name;
      newBlocs[index].video_file_size = file.size;
      newBlocs[index].video_preview = URL.createObjectURL(file);
      return { ...prev, blocs: newBlocs };
    });

    // Nettoyer les erreurs
    setErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors.blocs?.[index]?.video_file) {
        const blocErrors = { ...newErrors.blocs[index] };
        delete blocErrors.video_file;
        
        if (Object.keys(blocErrors).length === 0) {
          delete newErrors.blocs[index];
          if (Object.keys(newErrors.blocs).length === 0) {
            delete newErrors.blocs;
          }
        } else {
          newErrors.blocs = { ...newErrors.blocs, [index]: blocErrors };
        }
      }
      return newErrors;
    });
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  IMAGES DE COUVERTURE / OG
  // ═══════════════════════════════════════════════════════════

  const setCoverImage = useCallback((file: File | string) => {
    // Si c'est une string (URL du serveur), on la stocke directement
    if (typeof file === 'string') {
      setForm(prev => ({
        ...prev,
        cover_image: file,
      }));
      return;
    }

    // Validation
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        cover_image: "L'image ne doit pas dépasser 10 Mo.",
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      cover_image: file,
      cover_preview: URL.createObjectURL(file),
    }));
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.cover_image;
      return newErrors;
    });
  }, []);

  const setOgImage = useCallback((file: File | string) => {
    // Si c'est une string (URL du serveur), on la stocke directement
    if (typeof file === 'string') {
      setForm(prev => ({
        ...prev,
        og_image: file,
      }));
      return;
    }

    setForm(prev => ({
      ...prev,
      og_image: file,
      og_preview: URL.createObjectURL(file),
    }));
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  RETOUR
  // ═══════════════════════════════════════════════════════════

  return {
    form,
    setForm,
    loading,
    errors,
    blocErrors,        
    uploadProgress,    
    validateForm,
    addBloc,
    removeBloc,
    updateBloc,
    updateBlocImage,
    updateBlocVideo,  
    setCoverImage,
    setOgImage,
    submit,
  };
}