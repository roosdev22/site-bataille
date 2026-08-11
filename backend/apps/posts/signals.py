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
    À la sauvegarde d'un Post, upload la cover_image vers Supabase
    et enregistre l'URL publique dans cover_image_url.
    """
    if not instance.cover_image:
        logger.warning(f"[Post] Pas de cover image pour {instance.id}")
        return

    if instance.cover_image_url:
        return  # déjà uploadée, évite les ré-uploads en boucle

    try:
        file = instance.cover_image.file
    except (ValueError, FileNotFoundError, IOError) as e:
        logger.warning(f"[Post] Fichier cover inaccessible pour {instance.id}: {e}")
        return

    try:
        filename = f"{instance.id}_{uuid.uuid4().hex}.jpg"
        url = SupabaseStorageService.upload_post_cover(file, filename)
        if url:
            logger.info(f"[Post] Cover uploadée: {url}")
            Post.objects.filter(pk=instance.pk).update(cover_image_url=url)
        else:
            logger.error(f"[Post] Upload retourné None pour {instance.id}")
    except Exception as e:
        logger.error(f"[Post] Erreur upload cover: {e}")