"""
Signaux pour l'app ads.
Gère l'upload automatique de Ad.image vers Supabase Storage.
"""
import logging
import uuid
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.ads.models import Ad
from apps.reportage.services.storage import SupabaseStorageService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Ad)
def upload_ad_image_to_supabase(sender, instance, created, **kwargs):
    """
    À la sauvegarde d'une Ad, upload l'image vers Supabase.
    """
    if not instance.image:
        logger.warning(f"[Ad] Pas d'image pour {instance.id}")
        return
    
    try:
        if hasattr(instance.image, 'file') and instance.image.file:
            filename = f"{instance.id}_{uuid.uuid4().hex}.jpg"
            url = SupabaseStorageService.upload_ad_image(
                instance.image.file,
                filename
            )
            
            if url:
                logger.info(f"[Ad] Image uploadée: {url}")
    
    except Exception as e:
        logger.error(f"[Ad] Erreur upload image: {e}")