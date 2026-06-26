from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.posts.models import Post
from apps.core.services.translation_service import LibreTranslateService


@receiver(post_save, sender=Post)
def translate_post(sender, instance, created, **kwargs):
    if not created:
        return

    instance.title_es = LibreTranslateService.translate(
        text=instance.title,
        source_lang="fr",
        target_lang="es"
    )

    instance.save(update_fields=["title_es"])