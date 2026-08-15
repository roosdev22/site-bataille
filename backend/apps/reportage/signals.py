"""
Signaux pour l'app reportage.
Gère la génération des variantes WEBP après upload direct d'une OptimizedImage.
Le fichier original a déjà été uploadé vers Supabase par le client (URL signée) ;
ce signal télécharge cet original et génère/uploade les 4 variantes.
"""
import logging
from io import BytesIO
from math import gcd

import requests
from django.db.models.signals import post_save
from django.dispatch import receiver
from PIL import Image

from apps.reportage.models import OptimizedImage
from apps.reportage.services.storage import SupabaseStorageService

logger = logging.getLogger(__name__)


@receiver(post_save, sender=OptimizedImage)
def generate_variants_after_direct_upload(sender, instance, created, **kwargs):
    """
    À la création d'une OptimizedImage (image_url déjà rempli par le client),
    télécharge l'original depuis Supabase et génère/uploade les 4 variantes WEBP.
    """
    if not instance.image_url:
        return

    all_uploaded = all([
        instance.image_thumb_url,
        instance.image_small_url,
        instance.image_medium_url,
        instance.image_large_url,
    ])
    if all_uploaded:
        return

    try:
        response = requests.get(instance.image_url, timeout=15)
        response.raise_for_status()
        original = Image.open(BytesIO(response.content))
        original_bytes_len = len(response.content)

        if original.mode in ('RGBA', 'P'):
            rgb = Image.new('RGB', original.size, (255, 255, 255))
            rgb.paste(original, mask=original.split()[-1] if original.mode == 'RGBA' else None)
            original = rgb
    except Exception as e:
        logger.error(f"[OptimizedImage] Échec téléchargement original {instance.id}: {e}")
        return

    updates = {}

    if not instance.width or not instance.height:
        updates['width'], updates['height'] = original.size
        divisor = gcd(original.size[0], original.size[1])
        if divisor > 0:
            updates['aspect_ratio'] = f"{original.size[0] // divisor}:{original.size[1] // divisor}"

    if not instance.file_size:
        updates['file_size'] = original_bytes_len

    sizes = {
        'image_thumb_url':  (150, 150),
        'image_small_url':  (400, 300),
        'image_medium_url': (800, 600),
        'image_large_url':  (1200, 900),
    }

    for url_field, (max_width, max_height) in sizes.items():
        if getattr(instance, url_field):
            continue

        try:
            temp = original.copy()
            temp.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            temp.save(buffer, format='WEBP', quality=85, optimize=True)
            buffer.seek(0)

            variant_name = url_field.replace('image_', '').replace('_url', '')
            filename = f"{instance.id}_{variant_name}.webp"

            url = SupabaseStorageService.upload_bytes(
                SupabaseStorageService.BUCKET_OPTIMIZED_IMAGES,
                f"optimized/{filename}",
                buffer.getvalue(),
                'image/webp',
            )
            if url:
                updates[url_field] = url
                logger.info(f"[OptimizedImage] {url_field} généré: {url}")
            else:
                logger.error(f"[OptimizedImage] Upload retourné None pour {url_field} — {instance.id}")
        except Exception as e:
            logger.error(f"[OptimizedImage] Erreur génération {url_field} pour {instance.id}: {e}")

    if updates:
        OptimizedImage.objects.filter(pk=instance.pk).update(**updates)