import uuid

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class CommentStatus(models.TextChoices):
    PENDING  = "pending",  "En attente"
    APPROVED = "approved", "Approuvé"
    REJECTED = "rejected", "Rejeté"
    DELETED  = "deleted",  "Supprimé"   # soft-delete, jamais retiré de la DB


# ─────────────────────────────────────────────
# QuerySet / Manager
# ─────────────────────────────────────────────

class CommentQuerySet(models.QuerySet):
    def approved(self):
        return self.filter(status=CommentStatus.APPROVED)

    def pending(self):
        return self.filter(status=CommentStatus.PENDING)

    def roots(self):
        """Commentaires de premier niveau (pas de parent)."""
        return self.filter(parent__isnull=True)

    def for_post(self, post_id):
        return self.filter(post_id=post_id)

    def with_relations(self):
        return self.select_related("author", "post").prefetch_related(
            "likes",
            models.Prefetch(
                "replies",
                queryset=Comment.objects.approved().select_related("author").prefetch_related("likes"),
            ),
        )


class CommentManager(models.Manager):
    def get_queryset(self):
        return CommentQuerySet(self.model, using=self._db)

    def approved(self):
        return self.get_queryset().approved()

    def pending(self):
        return self.get_queryset().pending()


# ─────────────────────────────────────────────
# Comment
# ─────────────────────────────────────────────

class Comment(models.Model):
    id     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    post   = models.ForeignKey(
        "posts.Post",
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
    )

    body = models.TextField(
        validators=[MinLengthValidator(2)],
        max_length=2000,
    )

    status = models.CharField(
        max_length=10,
        choices=CommentStatus.choices,
        default=CommentStatus.PENDING,
        db_index=True,
    )
    rejection_note = models.CharField(max_length=300, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    likes_count   = models.PositiveIntegerField(default=0, editable=False)
    replies_count = models.PositiveIntegerField(default=0, editable=False)

    objects = CommentManager()

    class Meta:
        verbose_name        = "Commentaire"
        verbose_name_plural = "Commentaires"
        ordering            = ["created_at"]
        indexes = [
            models.Index(fields=["post", "status"]),
            models.Index(fields=["author", "status"]),
            models.Index(fields=["parent"]),
        ]
        constraints = [
            models.CheckConstraint(
                # BUG 3 CORRIGÉ : condition= (Django 4.1+) au lieu de check=
                condition=~models.Q(parent=models.F("id")),
                name="comment_cannot_reply_to_itself",
            ),
        ]

    def __str__(self):
        if self.author_id is None:
            author_name = "Anonyme"
        else:
            author_name = (
                self.author.get_full_name()
                if hasattr(self.author, "get_full_name")
                else str(self.author)
            )
        return f"{author_name} → {self.post.title[:40]}"

    @property
    def is_root(self) -> bool:
        # BUG 1 CORRIGÉ : parent_id au lieu de parent pour éviter une requête SQL
        return self.parent_id is None

    @property
    def is_reply(self) -> bool:
        return self.parent_id is not None

    @property
    def is_approved(self) -> bool:
        return self.status == CommentStatus.APPROVED

    @property
    def is_deleted(self) -> bool:
        return self.status == CommentStatus.DELETED

    # BUG 2 CORRIGÉ : indentation cassée + if save: était en dehors de la méthode
    def soft_delete(self, save: bool = True) -> None:
        from django.utils import timezone

        self.body       = "[Ce commentaire a été supprimé]"
        self.status     = CommentStatus.DELETED
        self.deleted_at = timezone.now()

        if save:
            self.save(update_fields=["body", "status", "deleted_at", "updated_at"])


# ─────────────────────────────────────────────
# CommentLike
# ─────────────────────────────────────────────

class CommentLike(models.Model):
    objects: models.Manager  # ← ajoute cette ligne

    # BUG 4 CORRIGÉ : "apps.comments.Comment" → "comments.Comment"
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name="likes",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="comment_likes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Like"
        verbose_name_plural = "Likes"
        constraints = [
            models.UniqueConstraint(
                fields=["comment", "user"],
                name="unique_comment_like_per_user",
            )
        ]

    def __str__(self):
        return f"{self.user} ♥ {self.comment_id}"