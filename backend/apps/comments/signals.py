"""
Signals — synchronisation des compteurs dénormalisés.

On utilise des signaux plutôt que des overrides de save() pour que les
opérations bulk (queryset.update(), import de fixtures) restent correctes.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import F

from .models import Comment, CommentLike, CommentStatus


@receiver(post_save, sender=Comment)
def sync_post_comment_count(sender, instance, created, **kwargs):
    """
    Met à jour Post.comments_count à chaque création / changement de statut.
    Nécessite d'ajouter le champ comments_count sur Post (voir README).
    """
    from apps.posts.models import Post  # import tardif → évite les circular imports
    try:
        if created and instance.status == CommentStatus.APPROVED:
            Post.objects.filter(pk=instance.post_id).update(
                comments_count=F("comments_count") + 1
            )
    except Exception:
        pass  # ne jamais casser la requête principale à cause d'un signal


@receiver(post_delete, sender=Comment)
def decrement_post_comment_count(sender, instance, **kwargs):
    """Décrémente quand un commentaire est hard-deleted."""
    from apps.posts.models import Post
    if instance.status == CommentStatus.APPROVED:
        try:
            Post.objects.filter(pk=instance.post_id).update(
                comments_count=F("comments_count") - 1
            )
        except Exception:
            pass


@receiver(post_delete, sender=CommentLike)
def decrement_like_count(sender, instance, **kwargs):
    """
    Garde le compteur dénormalisé cohérent lors d'une suppression
    en cascade (ex. suppression du user).
    """
    try:
        Comment.objects.filter(pk=instance.comment_id).update(
            likes_count=F("likes_count") - 1
        )
    except Exception:
        pass