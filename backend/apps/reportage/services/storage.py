"""
Service centralisé pour gérer les uploads de fichiers vers Supabase Storage.
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
    Service unifié pour uploader des fichiers vers Supabase Storage.
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

            supabase.storage.from_(bucket).upload(
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

            supabase.storage.from_(SupabaseStorageService.BUCKET_POST_COVERS).upload(
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

            supabase.storage.from_(SupabaseStorageService.BUCKET_AD_IMAGES).upload(
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

    @staticmethod
    def upload_media_file(file_obj, filename: str, content_type: str = "video/mp4") -> Optional[str]:
        """Upload un fichier média (vidéo, audio, PDF, doc) vers Supabase."""
        try:
            path = f"media/{filename}"

            supabase.storage.from_(SupabaseStorageService.BUCKET_MEDIA_FILES).upload(
                path,
                file_obj.read() if hasattr(file_obj, 'read') else file_obj,
                {
                    "contentType": content_type,
                    "upsert": False
                }
            )

            url = supabase.storage.from_(SupabaseStorageService.BUCKET_MEDIA_FILES).get_public_url(path)
            logger.info(f"[SupabaseStorageService] Fichier média uploadé: {path}")
            return url

        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur upload média: {e}")
            return None

    @staticmethod
    def create_signed_upload_url(bucket: str, path: str) -> Optional[dict]:
        """Génère une URL signée pour permettre à un client d'uploader directement."""
        try:
            result = supabase.storage.from_(bucket).create_signed_upload_url(path)
            return result  # {'signed_url' ou 'signedUrl': ..., 'token': ..., 'path': ...}
        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur génération URL signée: {e}")
            return None

    @staticmethod
    def upload_bytes(bucket: str, path: str, data: bytes, content_type: str) -> Optional[str]:
        """Upload direct de bytes déjà en mémoire (variantes générées côté serveur)."""
        try:
            supabase.storage.from_(bucket).upload(
                path, data, {"contentType": content_type, "upsert": True}
            )
            return supabase.storage.from_(bucket).get_public_url(path)
        except Exception as e:
            logger.error(f"[SupabaseStorageService] Erreur upload bytes {path}: {e}")
            return None