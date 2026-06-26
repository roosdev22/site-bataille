import hashlib
from io import BytesIO
from math import gcd
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone
from django.utils.text import slugify
from PIL import Image

# ═══════════════════════════════════════════════════════════════
#   CHOICES
# ═══════════════════════════════════════════════════════════════

class ReportageStatus(models.TextChoices):
    DRAFT = 'draft', 'Brouillon'
    REVIEW = 'review', 'En révision'
    PUBLISHED = 'published', 'Publié'


class BlocType(models.TextChoices):
    INTRO = 'intro', 'Intro'
    TEXTE = 'texte', 'Texte'
    IMAGE = 'image', 'Image'
    GALLERY = 'gallery', 'Galerie'
    VIDEO = 'video', 'Vidéo'
    AUDIO = 'audio', 'Audio'
    CITATION = 'citation', 'Citation'
    TIMELINE = 'timeline', 'Timeline'
    EMBED = 'embed', 'Embed'


# ═══════════════════════════════════════════════════════════════
#   MODÈLES MÉDIAS & ACCESSOIRES
# ═══════════════════════════════════════════════════════════════

class MediaFile(models.Model):
    """
    Gestion centralisée des fichiers média (vidéos, audio, documents).
    """
    MEDIA_TYPE_CHOICES = [
        ('video', 'Vidéo'),
        ('audio', 'Audio'),
        ('document', 'Document'),
    ]
    
    VIDEO_FORMAT_CHOICES = [
        ('mp4', 'MP4 (H.264)'),
        ('webm', 'WebM (VP9)'),
        ('mov', 'MOV'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    file = models.FileField(
        upload_to='media_files/%Y/%m/%d/',
        validators=[FileExtensionValidator(
            allowed_extensions=['mp4', 'webm', 'mov', 'mp3', 'wav', 'pdf', 'doc', 'docx']
        )]
    )
    
    video_format = models.CharField(
        max_length=10,
        choices=VIDEO_FORMAT_CHOICES,
        blank=True,
        null=True
    )
    duration = models.IntegerField(null=True, blank=True, help_text="Durée en secondes")
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    thumbnail = models.ImageField(
        upload_to='video_thumbnails/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text="Thumbnail personnalisée"
    )
    
    file_size = models.BigIntegerField(null=True, blank=True, help_text="Taille en bytes")
    mime_type = models.CharField(max_length=50, blank=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='uploaded_media_files')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    transcription = models.TextField(
        blank=True,
        help_text="Transcription de la vidéo pour l'accessibilité"
    )
    subtitles_file = models.FileField(
        upload_to='subtitles/%Y/%m/%d/',
        blank=True,
        null=True,
        help_text="Fichier SRT ou VTT"
    )
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Fichier média"
        verbose_name_plural = "Fichiers média"
        indexes = [
            models.Index(fields=['media_type', '-uploaded_at']),
            models.Index(fields=['uploaded_by']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.media_type})"

    @property
    def file_url(self):
        """Retourner l'URL complète du fichier."""
        if self.file:
            return self.file.url
        return None
    
    @property
    def thumbnail_url(self):
        """Retourner l'URL complète de la miniature."""
        if self.thumbnail:
            return self.thumbnail.url
        return None
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        if self.file:
            updated = False

            try:
                size = self.file.size
                if self.file_size != size:
                    self.file_size = size
                    updated = True
            except Exception:
                pass

            mime = getattr(self.file, "content_type", None)
            if mime and self.mime_type != mime:
                self.mime_type = mime
                updated = True

            if updated:
                super().save(update_fields=["file_size", "mime_type"])




class Quote(models.Model):
    """
    Citation professionnelle structurée avec configuration de design intégrée.
    """
    ALIGNMENT_CHOICES = [
        ('left', 'Gauche'),
        ('center', 'Centré'),
        ('right', 'Droite'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    text = models.TextField()
    author = models.CharField(max_length=255)
    author_role = models.CharField(max_length=255, blank=True, help_text="Titre/rôle de l'auteur")
    author_image = models.ImageField(upload_to='quotes/%Y/%m/', blank=True, null=True)
    source = models.CharField(max_length=500, blank=True, help_text="Livre, article, etc.")
    source_url = models.URLField(blank=True, help_text="Lien vers la source")
    
    alignment = models.CharField(max_length=20, choices=ALIGNMENT_CHOICES, default='center')
    accent_color = models.CharField(max_length=7, default='#000000', help_text="Couleur d'accent (format hex)")
    background_color = models.CharField(max_length=7, default='#f5f5f5', blank=True)
    border_style = models.CharField(
        max_length=20,
        choices=[('left', 'Barre gauche'), ('top', 'Barre haut'), ('none', 'Aucune')],
        default='left'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Citation"
        verbose_name_plural = "Citations"
    
    def __str__(self):
        return f"'{self.text[:50]}...' — {self.author}"


class OptimizedImage(models.Model):
    """
    Gestion centralisée et optimisée des images avec variantes WEBP auto-générées.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Image originale source
    image = models.ImageField(
        upload_to='optimized_images/%Y/%m/%d/',
        help_text="Image source (sera convertie en WEBP pour les variantes)"
    )
    
    # Variantes générées à la sauvegarde
    image_thumb = models.ImageField(upload_to='optimized_images/thumbs/%Y/%m/%d/', blank=True)
    image_small = models.ImageField(upload_to='optimized_images/small/%Y/%m/%d/', blank=True)
    image_medium = models.ImageField(upload_to='optimized_images/medium/%Y/%m/%d/', blank=True)
    image_large = models.ImageField(upload_to='optimized_images/large/%Y/%m/%d/', blank=True)
    
    # Référencement et métadonnées
    alt_text = models.CharField(max_length=255, help_text="Texte alternatif (SEO / Accessibilité)")
    caption = models.CharField(max_length=500, blank=True, help_text="Légende de l'image")
    credit = models.CharField(max_length=255, blank=True, help_text="Crédits photographiques")
    
    # Propriétés de l'image originale
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    aspect_ratio = models.CharField(max_length=20, blank=True, editable=False)
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="Taille originale en bytes")
    
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='optimized_images')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Image optimisée"
        verbose_name_plural = "Images optimisées"
        indexes = [
            models.Index(fields=['id']),
            models.Index(fields=['uploaded_by']),
            models.Index(fields=['-uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.alt_text or 'Image'} ({self.id})"
    
    def save(self, *args, **kwargs):
        if self.image:
            # Récupérer la taille du fichier d'origine
            try:
                self.file_size = self.image.size
            except (AttributeError, ValueError):
                pass

            # Extraction et calcul des dimensions et du ratio
            if not self.width or not self.height:
                img = Image.open(self.image)
                self.width, self.height = img.size
                
                # Calcul et simplification du aspect_ratio (ex: 16:9)
                divisor = gcd(self.width, self.height)
                if divisor > 0:
                    self.aspect_ratio = f"{self.width // divisor}:{self.height // divisor}"
            
            # Définition des cibles de redimensionnement
            sizes = {
                'thumb': (150, 150),
                'small': (400, 300),
                'medium': (800, 600),
                'large': (1200, 900),
            }
            
            for version, (max_width, max_height) in sizes.items():
                self._create_resized_image(version, max_width, max_height)
        
        super().save(*args, **kwargs)
    
    def _create_resized_image(self, version, max_width, max_height):
        """Génère, convertit en WEBP et sauvegarde une variante spécifique."""
        try:
            img = Image.open(self.image)
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            output = BytesIO()
            img.save(output, format='WEBP', quality=85, optimize=True)
            output.seek(0)
            
            base_name = self.image.name.split('/')[-1].split('.')[0]
            filename = f"{base_name}_{version}.webp"
            
            field_name = f"image_{version}"
            field = getattr(self, field_name)
            field.save(filename, ContentFile(output.read()), save=False)
        except Exception:
            # Sécurité pour empêcher une interruption globale si le traitement d'image échoue
            pass


# ═══════════════════════════════════════════════════════════════
#   REPORTAGE PRINCIPAL & STATS
# ═══════════════════════════════════════════════════════════════

class Reportage(models.Model):
    """
    Reportage long-format immersif.
    """
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=500, blank=True)
    slug = models.SlugField(unique=True, blank=True, max_length=300)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reportages',
    )

    cover_image = models.ForeignKey(
        OptimizedImage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportage_covers'
    )

    og_image = models.ForeignKey(
        OptimizedImage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reportage_og_images'
    )

    status = models.CharField(
        max_length=20,
        choices=ReportageStatus.choices,
        default=ReportageStatus.DRAFT,
    )
    featured = models.BooleanField(default=False)

    # SEO / Réseaux Sociaux
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)

    reading_time = models.PositiveIntegerField(
        default=0,
        help_text="Calculé automatiquement (mots / 200). Ne pas modifier.",
        editable=False,
    )

    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at', '-created_at']
        verbose_name = 'Reportage'
        verbose_name_plural = 'Reportages'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['status']),
            models.Index(fields=['published_at']),
            models.Index(fields=['featured']),
        ]

    def _generate_unique_slug(self) -> str:
        base = slugify(self.title)
        slug = base
        n = 1
        qs = Reportage.objects.exclude(pk=self.pk)
        while qs.filter(slug=slug).exists():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def _calculate_reading_time(self) -> int:
        """Calcule le temps de lecture basé sur les blocs textuels."""
        text_types = [BlocType.INTRO, BlocType.TEXTE, BlocType.CITATION]
        total_words = sum(
            len(b.contenu.split())
            for b in self.blocs.filter(type__in=text_types)
            if b.contenu
        )
        return max(1, round(total_words / 200))

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._generate_unique_slug()

        if self.status == ReportageStatus.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

        # Recalcul sans boucle de save infinie
        new_time = self._calculate_reading_time()
        if new_time != self.reading_time:
            Reportage.objects.filter(pk=self.pk).update(reading_time=new_time)

    def record_view(self, ip: str) -> bool:
        """Enregistre une vue unique anonymisée (SHA-256)."""
        ip_hash = hashlib.sha256(ip.encode()).hexdigest()
        _, created = ReportageView.objects.get_or_create(
            reportage=self,
            ip_hash=ip_hash,
        )
        return created

    @property
    def views_count(self) -> int:
        return self.views.count()

    def __str__(self):
        return self.title


class ReportageView(models.Model):
    """
    Table isolée gérant l'historique des vues uniques et évitant le RGPD.
    """
    reportage = models.ForeignKey(Reportage, on_delete=models.CASCADE, related_name='views')
    ip_hash = models.CharField(max_length=64) 
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['reportage', 'ip_hash']
        verbose_name = 'Vue'
        verbose_name_plural = 'Vues'
        indexes = [
            models.Index(fields=['reportage', 'ip_hash']),
        ]

    def __str__(self):
        return f"Vue — {self.reportage.title}"


# ═══════════════════════════════════════════════════════════════
#   BLOCS DYNAMIQUES & ENFANTS
# ═══════════════════════════════════════════════════════════════

class Bloc(models.Model):
    """
    Composant flexible orchestrant le rendu séquentiel du reportage.
    """
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    reportage = models.ForeignKey(Reportage, on_delete=models.CASCADE, related_name='blocs')
    type = models.CharField(max_length=20, choices=BlocType.choices)
    ordre = models.PositiveIntegerField(default=0)

    # Contenus textuels
    contenu = models.TextField(blank=True)
    citation_auteur = models.CharField(max_length=200, blank=True)
    citation_large = models.BooleanField(default=False)

    # Références médias optimisées
    image = models.ForeignKey(OptimizedImage, on_delete=models.SET_NULL, null=True, blank=True, related_name='blocs')
    image_caption = models.CharField(max_length=500, blank=True)
    image_credit = models.CharField(max_length=200, blank=True)
    image_fullbleed = models.BooleanField(default=False)

    quote = models.ForeignKey(Quote, on_delete=models.SET_NULL, null=True, blank=True, related_name='blocs')

    # Vidéos alternatives
    video_youtube_url = models.URLField(blank=True, help_text="URL YouTube")
    video_vimeo_url = models.URLField(blank=True, help_text="URL Vimeo")
    video_local = models.ForeignKey(
        MediaFile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='blocs',
        limit_choices_to={'media_type': 'video'}
    )
    video_caption = models.CharField(max_length=500, blank=True)

    # Audios
    audio = models.ForeignKey(
        MediaFile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audio_blocs',
        limit_choices_to={'media_type': 'audio'}
    )

    # Intégrations externes
    embed_url = models.URLField(blank=True)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Bloc'
        verbose_name_plural = 'Blocs'
        indexes = [
            models.Index(fields=['ordre']),
            models.Index(fields=['type']),
        ]

def clean(self):
    errors = {}

    if self.type == BlocType.VIDEO:

        sources = [
            bool(self.video_local),
            bool(self.video_youtube_url),
            bool(self.video_vimeo_url),
        ]

        if sum(sources) == 0:

            errors['video'] = (
                "Un bloc vidéo doit contenir une source."
            )

        elif sum(sources) > 1:

            errors['video'] = (
                "Une seule source vidéo est autorisée."
            )

    elif self.type == BlocType.IMAGE and not self.image:

        errors['image'] = (
            "Un bloc image requiert une image."
        )

    elif self.type == BlocType.AUDIO and not self.audio:

        errors['audio'] = (
            "Un bloc audio doit contenir un MediaFile audio."
        )

    elif self.type == BlocType.CITATION and not self.quote:

        errors['quote'] = (
            "Un bloc citation requiert une citation."
        )

    elif self.type == BlocType.EMBED and not self.embed_url:

        errors['embed_url'] = (
            "Une URL d'intégration est requise."
        )

    if errors:
        raise ValidationError(errors)
class GalleryImage(models.Model):
    """
    Ressources images itérées au sein d'un bloc GALLERY.
    """
    bloc = models.ForeignKey(
        Bloc,
        on_delete=models.CASCADE,
        related_name='gallery_images',
        limit_choices_to={'type': BlocType.GALLERY},
    )
    image = models.ForeignKey(OptimizedImage, on_delete=models.CASCADE, related_name='gallery_images')
    caption = models.CharField(max_length=500, blank=True)
    credit = models.CharField(max_length=200, blank=True)
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Image de galerie'
        verbose_name_plural = 'Images de galerie'

    def __str__(self):
        return f"GalleryImage {self.ordre} — Bloc #{self.bloc_id}"


class TimelineEvent(models.Model):
    """
    Événements chronologiques itérés au sein d'un bloc TIMELINE.
    """
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, db_index=True)
    bloc = models.ForeignKey(
        Bloc,
        on_delete=models.CASCADE,
        related_name='timeline_events',
        limit_choices_to={'type': BlocType.TIMELINE},
    )
    date_label = models.CharField(max_length=100, help_text="Ex: '12 janvier 2024', 'Été 1994'")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    image = models.ForeignKey(
        OptimizedImage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='timeline_events'
    )
    ordre = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['ordre']
        verbose_name = 'Événement de timeline'
        verbose_name_plural = 'Événements de timeline'

    def __str__(self):
        return f"{self.date_label} — {self.title}"