"""
Service centralisé pour gérer les uploads d'images vers Supabase Storage.
"""
import logging
from typing import Optional
from django.conf import settings
from supabase import create_client

logger = logging.getLogger(__name__)

# Initialiser le client Supabase
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)


class SupabaseStorageService:
    """
    Service unifié pour uploader des images vers Supabase Storage.
    """
    
    # Buckets
    BUCKET_OPTIMIZED_IMAGES = "optimized-images"
    BUCKET_POST_COVERS = "post-covers"
    BUCKET_AD_IMAGES = "ad-images"
    BUCKET_MEDIA_FILES = "media-files"
    
    @staticmethod
    def upload_optimized_image(file_obj, filename: str, bucket: str = BUCKET_OPTIMIZED_IMAGES) -> Optional[str]:
        """Upload une image optimisée vers Supabase."""
        try:
            path = f"optimized/{filename}"
            
            response = supabase.storage.from_(bucket).upload(
                path,
                file_obj.read() if hasattr(file_obj, 'read') else file_obj,
                {
                    "contentType": getattr(file_obj, "content_type", "image/jpeg"),
                    "upsert": False
                }
            )
            
            url = supabase.storage.from_(bucket).get_public_url(path)
            logger.info(f"[SupabaseStorageService] Image optimisée uploadée: {path}")
            return url
            
        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur upload image optimisée: {e}")
            return None
    
    @staticmethod
    def upload_post_cover(file_obj, filename: str) -> Optional[str]:
        """Upload une image de couverture d'article."""
        try:
            path = f"covers/{filename}"
            
            response = supabase.storage.from_(SupabaseStorageService.BUCKET_POST_COVERS).upload(
                path,
                file_obj.read() if hasattr(file_obj, 'read') else file_obj,
                {
                    "contentType": getattr(file_obj, "content_type", "image/jpeg"),
                    "upsert": False
                }
            )
            
            url = supabase.storage.from_(SupabaseStorageService.BUCKET_POST_COVERS).get_public_url(path)
            logger.info(f"[SupabaseStorageService] Cover uploadée: {path}")
            return url
            
        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur upload cover: {e}")
            return None
    
    @staticmethod
    def upload_ad_image(file_obj, filename: str) -> Optional[str]:
        """Upload une image de publicité."""
        try:
            path = f"ads/{filename}"
            
            response = supabase.storage.from_(SupabaseStorageService.BUCKET_AD_IMAGES).upload(
                path,
                file_obj.read() if hasattr(file_obj, 'read') else file_obj,
                {
                    "contentType": getattr(file_obj, "content_type", "image/jpeg"),
                    "upsert": False
                }
            )
            
            url = supabase.storage.from_(SupabaseStorageService.BUCKET_AD_IMAGES).get_public_url(path)
            logger.info(f"[SupabaseStorageService] Image pub uploadée: {path}")
            return url
            
        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur upload image pub: {e}")
            return None