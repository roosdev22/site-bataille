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
    À la sauvegarde d'une OptimizedImage, upload toutes les variantes
    vers Supabase et persiste les URLs publiques.
    """
    # Guard globale — si toutes les URLs sont déjà là, rien à faire
    all_uploaded = all([
        instance.image_url,
        instance.image_thumb_url,
        instance.image_small_url,
        instance.image_medium_url,
        instance.image_large_url,
    ])
    if all_uploaded:
        return

    variants = {
        'image_url':        (instance.image,       f"{instance.id}_original.jpg"),
        'image_thumb_url':  (instance.image_thumb,  f"{instance.id}_thumb.webp"),
        'image_small_url':  (instance.image_small,  f"{instance.id}_small.webp"),
        'image_medium_url': (instance.image_medium, f"{instance.id}_medium.webp"),
        'image_large_url':  (instance.image_large,  f"{instance.id}_large.webp"),
    }

    updates = {}

    for url_field, (image_field, filename) in variants.items():
        # Passer les variantes déjà uploadées
        if getattr(instance, url_field):
            continue

        # Passer les variantes absentes (pas encore générées)
        if not image_field or not image_field.name:
            logger.warning(f"[OptimizedImage] Variante absente pour {instance.id}: {url_field}")
            continue

        # Accès fichier isolé — peut échouer si le fichier temporaire est fermé
        try:
            file = image_field.file
        except (ValueError, FileNotFoundError, IOError) as e:
            logger.warning(f"[OptimizedImage] Fichier inaccessible {url_field} pour {instance.id}: {e}")
            continue

        try:
            url = SupabaseStorageService.upload_optimized_image(file, filename)
            if url:
                updates[url_field] = url
                logger.info(f"[OptimizedImage] {url_field} uploadé: {url}")
            else:
                logger.error(f"[OptimizedImage] Upload retourné None pour {url_field} — {instance.id}")
        except Exception as e:
            logger.error(f"[OptimizedImage] Erreur upload {url_field} pour {instance.id}: {e}")

    if updates:
        OptimizedImage.objects.filter(pk=instance.pk).update(**updates)