"""
Signaux pour l'app reportage.
Gère l'upload automatique des OptimizedImage vers Supabase Storage.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.reportage.models import OptimizedImage
from apps.reportage.services.storage import SupabaseStorageService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=OptimizedImage)
def upload_optimized_images_to_supabase(sender, instance, created, **kwargs):
    """
    À la sauvegarde d'une OptimizedImage, upload TOUTES les variantes vers Supabase.
    """
    if not instance.image:
        logger.warning(f"[OptimizedImage] Pas d'image source pour {instance.id}")
        return
    
    try:
        # Si les variantes existent, les uploader
        variants = {
            'thumb': instance.image_thumb,
            'small': instance.image_small,
            'medium': instance.image_medium,
            'large': instance.image_large,
        }
        
        for variant_name, image_field in variants.items():
            if image_field and image_field.name:
                try:
                    filename = f"{instance.id}_{variant_name}.webp"
                    url = SupabaseStorageService.upload_optimized_image(
                        image_field.file,
                        filename
                    )
                    
                    if url:
                        logger.info(f"[OptimizedImage] Variante {variant_name} uploadée: {url}")
                        
                except Exception as e:
                    logger.error(f"[OptimizedImage] Erreur upload variante {variant_name}: {e}")
        
        # Upload l'image source aussi
        if instance.image:
            try:
                filename = f"{instance.id}_original.jpg"
                url = SupabaseStorageService.upload_optimized_image(
                    instance.image.file,
                    filename
                )
                if url:
                    logger.info(f"[OptimizedImage] Image originale uploadée: {url}")
            except Exception as e:
                logger.error(f"[OptimizedImage] Erreur upload original: {e}")
    
    except Exception as e:
        logger.error(f"[OptimizedImage] Erreur signal: {e}")