import uuid

from django.conf import settings
from django.core.validators import MinLengthValidator
from django.db import models
from django.utils.text import slugify


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────
class PostLanguage(models.TextChoices):
    FR = "fr", "Français"
    EN = "en", "English"
    ES = "es", "Español"
    HT = "ht", "Kreyòl Ayisyen"

class PostCategory(models.TextChoices):
    MEDICAL    = "medical",    "Médical"
    TRAVEL     = "travel",     "Voyage"
    TECHNOLOGY = "technology", "Technologie"
    EDUCATION  = "education",  "Éducation"
    LIFESTYLE  = "lifestyle",  "Lifestyle"
    SCIENCE    = "science",    "Science"
    LEGAL      = "legal",      "Juridique"
    FINANCE    = "finance",    "Finance"
    OTHER      = "other",      "Autre"


class PostStatus(models.TextChoices):
    DRAFT     = "draft",     "Brouillon"
    PENDING   = "pending",   "En attente de validation"
    PUBLISHED = "published", "Publié"
    ARCHIVED  = "archived",  "Archivé"
    REJECTED  = "rejected",  "Rejeté"


# ─────────────────────────────────────────────
# Tag
# ─────────────────────────────────────────────

class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True, blank=True)

    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tags"
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

# apps/posts/models.py

# ─────────────────────────────────────────────
# Post QuerySet
# ─────────────────────────────────────────────

class PostQuerySet(models.QuerySet):
    """Requêtes personnalisées sur les articles."""
    
    def published(self):
        """Articles publiés."""
        return self.filter(status=PostStatus.PUBLISHED)
    
    def draft(self):
        """Articles en brouillon."""
        return self.filter(status=PostStatus.DRAFT)
    
    def pending(self):
        """Articles en attente de validation."""
        return self.filter(status=PostStatus.PENDING)
    
    def by_author(self, author):
        """Articles d'un auteur spécifique."""
        return self.filter(author=author)
    
    def by_category(self, category: str):
        """Articles d'une catégorie."""
        return self.filter(category=category)
    
    def with_relations(self):
        """Précharge les ForeignKeys et ManyToMany pour éviter N+1."""
        return self.select_related("author").prefetch_related("tags")


# ─────────────────────────────────────────────
# Post Manager
# ─────────────────────────────────────────────

class PostManager(models.Manager):
    """Manager pour le modèle Post."""
    
    def get_queryset(self):
        """Retourne un PostQuerySet au lieu d'un QuerySet basique."""
        return PostQuerySet(self.model, using=self._db)
    
    #  Délégation des méthodes personnalisées du QuerySet
    def published(self):
        return self.get_queryset().published()
    
    def draft(self):
        return self.get_queryset().draft()
    
    def pending(self):
        return self.get_queryset().pending()
    
    def by_author(self, author):
        """ IMPORTANT : Délégation au QuerySet."""
        return self.get_queryset().by_author(author)
    
    def by_category(self, category: str):
        """ IMPORTANT : Délégation au QuerySet."""
        return self.get_queryset().by_category(category)
    
    def with_relations(self):
        """ IMPORTANT : Délégation au QuerySet."""
        return self.get_queryset().with_relations()

# ─────────────────────────────────────────────
# Post
# ─────────────────────────────────────────────

class Post(models.Model):
    
    id       = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title    = models.CharField(max_length=200, validators=[MinLengthValidator(10)])
    slug     = models.SlugField(max_length=220, unique=True, blank=True)
    excerpt  = models.TextField(max_length=500, validators=[MinLengthValidator(30)],
                                help_text="Résumé affiché dans les listes.")
    content  = models.TextField(validators=[MinLengthValidator(100)])

    source_language = models.CharField(
        max_length=2,
        choices=PostLanguage.choices,
        default=PostLanguage.FR,
        db_index=True,
        help_text="Langue dans laquelle l'article a été rédigé."
    )

    # Classification
    category = models.CharField(max_length=20, choices=PostCategory.choices,
                                 default=PostCategory.OTHER, db_index=True)
    tags     = models.ManyToManyField(Tag, blank=True, related_name="posts")
   
    # Auteur
    author   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,          # jamais de suppression en cascade
        related_name="posts",
    )

    # Media
    cover_image = models.ImageField(upload_to="posts/covers/%Y/%m/", null=True, blank=True)

    # Statut & workflow
    status         = models.CharField(max_length=10, choices=PostStatus.choices,
                                      default=PostStatus.DRAFT, db_index=True)
    rejection_note = models.TextField(blank=True,
                                      help_text="Motif de rejet renseigné par l'admin.")

    # SEO
    meta_title       = models.CharField(max_length=70, blank=True)
    meta_description = models.CharField(max_length=160, blank=True)

    # Timestamps
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    # Stats (dénormalisé pour perf lecture)
    views_count = models.PositiveIntegerField(default=0, editable=False)

    objects = PostManager()

    class Meta:
        verbose_name        = "Article"
        verbose_name_plural = "Articles"
        ordering            = ["-published_at", "-created_at"]
        indexes = [
            models.Index(fields=["status", "category"]),
            models.Index(fields=["author", "status"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return f"[{self.get_category_display()}] {self.title}"

    # ── Helpers ──────────────────────────────

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.title)
            slug = base
            n = 1
            while Post.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base}-{n}"
                n += 1
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_published(self) -> bool:
        return self.status == PostStatus.PUBLISHED

    @property
    def can_be_edited(self) -> bool:
        return self.status in (PostStatus.DRAFT, PostStatus.REJECTED)


# ─────────────────────────────────────────────
# PostView  (log des lectures, dédupliqué)
# ─────────────────────────────────────────────

class PostView(models.Model):
    post       = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="views")
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=300, blank=True)
    viewed_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Vue"
        verbose_name_plural = "Vues"
        # Un même IP ne peut compter qu'une fois par post par jour
        constraints = [
            models.UniqueConstraint(
                fields=["post", "ip_address"],
                name="unique_view_per_ip_post",
            )
        ]

    def __str__(self):
        return f"{self.post.title} — {self.ip_address}"