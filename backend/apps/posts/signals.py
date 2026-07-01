"""
Signaux pour l'app posts.
Gère l'upload automatique de Post.cover_image vers Supabase Storage.
"""
import logging
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.posts.models import Post
from apps.reportage.services.storage import SupabaseStorageService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Post)
def upload_post_cover_to_supabase(sender, instance, created, **kwargs):
    """
    À la sauvegarde d'un Post, upload la cover_image vers Supabase.
    """
    if not instance.cover_image:
        logger.warning(f"[Post] Pas de cover image pour {instance.id}")
        return
    
    try:
        # Vérifier si c'est un vrai upload (pas juste une référence)
        if hasattr(instance.cover_image, 'file') and instance.cover_image.file:
            filename = f"{instance.id}_{uuid.uuid4().hex}.jpg"
            url = SupabaseStorageService.upload_post_cover(
                instance.cover_image.file,
                filename
            )
            
            if url:
                logger.info(f"[Post] Cover uploadée: {url}")
        
    except Exception as e:
        logger.error(f"[Post] Erreur upload cover: {e}")