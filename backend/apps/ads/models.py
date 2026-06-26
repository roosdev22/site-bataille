import uuid

from django.core.validators import MinValueValidator, URLValidator
from django.db import models
from django.utils import timezone


# ─────────────────────────────────────────────
# Enums
# ─────────────────────────────────────────────

class AdFormat(models.TextChoices):
    BANNER_TOP      = "banner_top",      "Bannière haut de page"
    BANNER_BOTTOM   = "banner_bottom",   "Bannière bas de page"
    SIDEBAR         = "sidebar",         "Sidebar"
    IN_CONTENT      = "in_content",      "Dans l'article"
    STICKY_FOOTER   = "sticky_footer",   "Footer collant"


class AdStatus(models.TextChoices):
    DRAFT    = "draft",    "Brouillon"
    ACTIVE   = "active",  "Active"
    PAUSED   = "paused",   "En pause"
    EXPIRED  = "expired",  "Expirée"
    ARCHIVED = "archived", "Archivée"


class AdCategory(models.TextChoices):
    """
    Ciblage par catégorie d'article.
    ALL = affiché partout.
    """
    ALL        = "all",        "Toutes catégories"
    MEDICAL    = "medical",    "Médical"
    TRAVEL     = "travel",     "Voyage"
    TECHNOLOGY = "technology", "Technologie"
    EDUCATION  = "education",  "Éducation"
    LIFESTYLE  = "lifestyle",  "Lifestyle"
    SCIENCE    = "science",    "Science"
    LEGAL      = "legal",      "Juridique"
    FINANCE    = "finance",    "Finance"


# ─────────────────────────────────────────────
# Advertiser  (profil de l'annonceur)
# Géré par l'admin, pas de compte utilisateur
# ─────────────────────────────────────────────

class Advertiser(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name         = models.CharField(max_length=150, verbose_name="Nom de la société")
    contact_name = models.CharField(max_length=150, verbose_name="Nom du contact")
    email        = models.EmailField(unique=True, verbose_name="Email")
    phone        = models.CharField(max_length=30, blank=True)
    website      = models.URLField(blank=True, validators=[URLValidator()])
    notes        = models.TextField(blank=True, verbose_name="Notes internes")
    is_active    = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "Annonceur"
        verbose_name_plural = "Annonceurs"
        ordering            = ["name"]

    def __str__(self):
        return self.name

    @property
    def total_ads(self) -> int:
        return self.ads.count()

    @property
    def active_ads(self) -> int:
        return self.ads.filter(status=AdStatus.ACTIVE).count()


# ─────────────────────────────────────────────
# Ad  (une publicité)
# ─────────────────────────────────────────────

class AdQuerySet(models.QuerySet):
    def active(self):
        now = timezone.now()
        return self.filter(
            status=AdStatus.ACTIVE,
            start_date__lte=now,
        ).filter(
            models.Q(end_date__isnull=True) | models.Q(end_date__gte=now)
        )

    def for_format(self, fmt: str):
        return self.filter(format=fmt)

    def for_category(self, category: str):
        """Retourne les annonces ciblant cette catégorie OU toutes catégories."""
        return self.filter(
            models.Q(target_category=AdCategory.ALL)
            | models.Q(target_category=category)
        )

    def with_relations(self):
        return self.select_related("advertiser")


class AdManager(models.Manager):
    def get_queryset(self):
        return AdQuerySet(self.model, using=self._db)

    def active(self):
        return self.get_queryset().active()

    def for_slot(self, fmt: str, category: str = AdCategory.ALL):
        """
        Point d'entrée principal pour le frontend.
        Retourne les annonces actives pour un slot donné + catégorie.
        """
        return (
            self.active()
            .for_format(fmt)
            .for_category(category)
            .with_relations()
            .order_by("?")   # rotation aléatoire
        )


class Ad(models.Model):
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    advertiser   = models.ForeignKey(
        Advertiser,
        on_delete=models.PROTECT,
        related_name="ads",
    )

    # Contenu
    title        = models.CharField(max_length=150, verbose_name="Titre de la pub")
    image        = models.ImageField(upload_to="ads/%Y/%m/", verbose_name="Image")
    destination_url = models.URLField(verbose_name="URL de destination")
    alt_text     = models.CharField(max_length=200, blank=True, verbose_name="Texte alternatif")

    # Placement & ciblage
    format          = models.CharField(max_length=20, choices=AdFormat.choices, db_index=True)
    target_category = models.CharField(
        max_length=20,
        choices=AdCategory.choices,
        default=AdCategory.ALL,
        db_index=True,
        verbose_name="Catégorie ciblée",
    )

    # Statut & durée
    status     = models.CharField(max_length=10, choices=AdStatus.choices,
                                   default=AdStatus.DRAFT, db_index=True)
    start_date = models.DateTimeField(default=timezone.now, verbose_name="Début")
    end_date   = models.DateTimeField(null=True, blank=True, verbose_name="Fin (vide = illimitée)")

    # Budget / priorité
    priority       = models.PositiveSmallIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text="Plus le chiffre est élevé, plus la pub est prioritaire.",
    )
    max_impressions = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Impressions max (vide = illimité)",
    )
    max_clicks      = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name="Clics max (vide = illimité)",
    )

    # Stats dénormalisées (perf lecture)
    impressions_count = models.PositiveIntegerField(default=0, editable=False)
    clicks_count      = models.PositiveIntegerField(default=0, editable=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = AdManager()

    class Meta:
        verbose_name        = "Publicité"
        verbose_name_plural = "Publicités"
        ordering            = ["-priority", "-created_at"]
        indexes = [
            models.Index(fields=["status", "format", "target_category"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self):
        return f"[{self.get_format_display()}] {self.title} — {self.advertiser}"

    # ── Helpers ──────────────────────────────

    @property
    def ctr(self) -> float:
        """Click-Through Rate en %."""
        if not self.impressions_count:
            return 0.0
        return round(self.clicks_count / self.impressions_count * 100, 2)

    @property
    def is_expired(self) -> bool:
        if not self.end_date:
            return False
        return timezone.now() > self.end_date

    @property
    def budget_exhausted(self) -> bool:
        if self.max_impressions and self.impressions_count >= self.max_impressions:
            return True
        if self.max_clicks and self.clicks_count >= self.max_clicks:
            return True
        return False

    def auto_expire(self) -> bool:
        """
        Appelé après chaque impression/clic.
        Passe automatiquement la pub en EXPIRED si les limites sont atteintes.
        """
        if self.is_expired or self.budget_exhausted:
            Ad.objects.filter(pk=self.pk).update(status=AdStatus.EXPIRED)
            return True
        return False


# ─────────────────────────────────────────────
# AdImpression  (une vue d'une pub, dédupliquée par session)
# ─────────────────────────────────────────────

class AdImpression(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ad         = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name="impressions")
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=300, blank=True)
    referer    = models.URLField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Impression"
        verbose_name_plural = "Impressions"
        indexes = [
            models.Index(fields=["ad", "created_at"]),
            models.Index(fields=["ip_address", "ad"]),
        ]

    def __str__(self):
        return f"Impression {self.ad.title} — {self.ip_address}"


# ─────────────────────────────────────────────
# AdClick  (un clic sur une pub)
# ─────────────────────────────────────────────

class AdClick(models.Model):
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ad         = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name="clicks")
    ip_address = models.GenericIPAddressField()
    user_agent = models.CharField(max_length=300, blank=True)
    referer    = models.URLField(blank=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = "Clic"
        verbose_name_plural = "Clics"
        indexes = [
            models.Index(fields=["ad", "created_at"]),
        ]

    def __str__(self):
        return f"Clic {self.ad.title} — {self.ip_address}"