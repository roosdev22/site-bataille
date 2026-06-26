# apps/reportage/serializers.py
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from .models import OptimizedImage
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from .models import (
    Bloc,
    BlocType,
    GalleryImage,
    Reportage,
    ReportageView,
    TimelineEvent,
    MediaFile,
    Quote,
    OptimizedImage,
)


# ═══════════════════════════════════════════════════════════════
#  SOUS-MODÈLES (LECTURE)
# ═══════════════════════════════════════════════════════════════

class GalleryImageSerializer(serializers.ModelSerializer):
    """
    Pour la lecture des images de galerie.
     CORRIGÉ : imbrication complète d'OptimizedImage avec toutes les résolutions
    """
    image = serializers.SerializerMethodField()

    class Meta:
        model  = GalleryImage
        fields = ['id', 'image', 'caption', 'credit', 'ordre']

    def get_image(self, obj):
        """Retourner l'OptimizedImage sérialisée avec toutes les résolutions."""
        if obj.image:
            return OptimizedImageSerializer(obj.image, context=self.context).data
        return None


class TimelineEventSerializer(serializers.ModelSerializer):
    """
    Pour la lecture des événements de timeline.
     CORRIGÉ : imbrication complète d'OptimizedImage avec toutes les résolutions
    """
    image = serializers.SerializerMethodField()

    class Meta:
        model  = TimelineEvent
        fields = ['uuid', 'date_label', 'title', 'description', 'image', 'ordre']

    def get_image(self, obj):
        """Retourner l'OptimizedImage sérialisée avec toutes les résolutions."""
        if obj.image:
            return OptimizedImageSerializer(obj.image, context=self.context).data
        return None


# ═══════════════════════════════════════════════════════════════
#  NOUVEAUX SERIALIZERS PROFESSIONNELS
# ═══════════════════════════════════════════════════════════════
class MediaFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    file = serializers.FileField(write_only=True)  #  AJOUTE CETTE LIGNE
    
    class Meta:
        model = MediaFile
        fields = [
            'id', 'title', 'media_type', 'description',
            'file',  #
            'file_url', 'file_size_mb', 'duration',
            'width', 'height', 'thumbnail_url',
            'transcription', 'subtitles_file',
            'uploaded_at'
        ]
        read_only_fields = ['file_size_mb', 'file_url', 'thumbnail_url', 'id', 'uploaded_at']
    
    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            else:
                from django.conf import settings
                return f"{settings.MEDIA_URL}{obj.file.name}"
        return None
    
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail:
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            else:
                from django.conf import settings
                return f"{settings.MEDIA_URL}{obj.thumbnail.name}"
        return None
class QuoteSerializer(serializers.ModelSerializer):
    """Citation professionnelle stylisée."""
    author_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Quote
        fields = [
            'id', 'text', 'author', 'author_role', 'author_image_url',
            'source', 'source_url', 'alignment', 'accent_color',
            'background_color', 'border_style'
        ]
        read_only_fields = ['author_image_url']
    
    def get_author_image_url(self, obj):
        request = self.context.get('request')
        if obj.author_image and request:
            return request.build_absolute_uri(obj.author_image.url)
        return None

# ═══════════════════════════════════════════════════════════════
#  OPTIMIZED IMAGES (À AJOUTER dans apps/reportage/serializers.py)
# ═══════════════════════════════════════════════════════════════
# ═══════════════════════════════════════════════════════════════
#  OPTIMIZED IMAGES (CORRIGÉ)
# ═══════════════════════════════════════════════════════════════

class OptimizedImageSerializer(serializers.ModelSerializer):
    """Sérialiseur de lecture pour les images optimisées."""

    image_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    small_url = serializers.SerializerMethodField()
    medium_url = serializers.SerializerMethodField()
    large_url = serializers.SerializerMethodField()

    class Meta:
        model = OptimizedImage
        fields = [
            'id', 'image_url', 'thumbnail_url', 'small_url', 'medium_url', 'large_url',
            'alt_text', 'caption', 'credit', 'aspect_ratio',
            'width', 'height', 'file_size',
            'uploaded_by', 'uploaded_at'
        ]
        read_only_fields = ['id', 'width', 'height', 'file_size', 'aspect_ratio', 'uploaded_at', 'uploaded_by']

    def get_image_url(self, obj):
        """URL de l'image originale."""
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None

    def get_thumbnail_url(self, obj):
        """URL de la variante thumbnail (150x150)."""
        request = self.context.get('request')
        if obj.image_thumb and request:
            return request.build_absolute_uri(obj.image_thumb.url)
        return None

    def get_small_url(self, obj):
        """URL de la variante small (400x300)."""
        request = self.context.get('request')
        if obj.image_small and request:
            return request.build_absolute_uri(obj.image_small.url)
        return None

    def get_medium_url(self, obj):
        """URL de la variante medium (800x600)."""
        request = self.context.get('request')
        if obj.image_medium and request:
            return request.build_absolute_uri(obj.image_medium.url)
        return None

    def get_large_url(self, obj):
        """URL de la variante large (1200x900)."""
        request = self.context.get('request')
        if obj.image_large and request:
            return request.build_absolute_uri(obj.image_large.url)
        return None


class OptimizedImageUploadSerializer(serializers.ModelSerializer):
    """ CORRIGÉ: Sérialiseur d'écriture pour uploader des images."""

    class Meta:
        model = OptimizedImage
        fields = ['id', 'image', 'alt_text', 'caption', 'credit']
        read_only_fields = ['id']

    def validate_image(self, value):
        """Valider la taille et le format de l'image."""
        if value.size > 50 * 1024 * 1024:  # 50 MB max
            raise serializers.ValidationError("Image trop grande (max 50 MB).")
        
        # Vérifier que c'est une image valide
        try:
            Image.open(value)
        except Exception:
            raise serializers.ValidationError("Fichier invalide ou non reconnu comme image.")
        
        return value

    def create(self, validated_data):
        """ CORRIGÉ: Créer l'image et générer les variantes."""
        # Créer l'instance OptimizedImage
        optimized_image = OptimizedImage(**validated_data)
        original_image = validated_data['image']

        # Ouvrir l'image avec PIL
        pil_image = Image.open(original_image)
        
        # Convertir en RGB si PNG/transparent
        if pil_image.mode in ('RGBA', 'P'):
            rgb_image = Image.new('RGB', pil_image.size, (255, 255, 255))
            rgb_image.paste(pil_image, mask=pil_image.split()[-1] if pil_image.mode == 'RGBA' else None)
            pil_image = rgb_image

        # Stocker les dimensions
        optimized_image.width, optimized_image.height = pil_image.size
        optimized_image.file_size = original_image.size

        #  CORRIGÉ: Utiliser les bons noms de champs du modèle
        sizes = {
            'image_thumb': (150, 150),
            'image_small': (400, 300),
            'image_medium': (800, 600),
            'image_large': (1200, 900),
        }
        
        for field_name, (max_width, max_height) in sizes.items():
            # Copier pour ne pas modifier l'original
            temp_image = pil_image.copy()
            temp_image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

            # Sauvegarder en mémoire en WEBP
            buffer = BytesIO()
            temp_image.save(buffer, format='WEBP', quality=85, optimize=True)
            buffer.seek(0)

            # Ajouter au modèle avec le bon nom de champ
            base_name = original_image.name.split('.')[0]
            filename = f"{base_name}_{field_name}.webp"
            
            field = getattr(optimized_image, field_name)
            field.save(
                filename,
                ContentFile(buffer.getvalue()),
                save=False
            )

        optimized_image.save()
        return optimized_image

    def update(self, instance, validated_data):
        """ CORRIGÉ: Mettre à jour (alt_text, caption, credit) mais pas l'image elle-même."""
        instance.alt_text = validated_data.get('alt_text', instance.alt_text)
        instance.caption = validated_data.get('caption', instance.caption)
        instance.credit = validated_data.get('credit', instance.credit)
        instance.save()
        return instances
class GalleryImageWriteSerializer(serializers.ModelSerializer):
    """
    Pour création/modification des images de galerie.
     CORRIGÉ : image est une PrimaryKeyRelatedField vers OptimizedImage
    """
    image = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        required=True
    )

    class Meta:
        model  = GalleryImage
        fields = ['id', 'image', 'caption', 'credit', 'ordre']


class TimelineEventWriteSerializer(serializers.ModelSerializer):
    """
    Pour création/modification des événements de timeline.
     CORRIGÉ : image est une PrimaryKeyRelatedField vers OptimizedImage
    """
    image = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model  = TimelineEvent
        fields = ['uuid', 'date_label', 'title', 'description', 'image', 'ordre']


# ═══════════════════════════════════════════════════════════════
#  BLOC (LECTURE)
# ═══════════════════════════════════════════════════════════════

class BlocSerializer(serializers.ModelSerializer):
    """Pour la lecture des blocs avec nouveau système professionnel."""
    gallery_images   = GalleryImageSerializer(many=True, read_only=True)
    timeline_events  = TimelineEventSerializer(many=True, read_only=True)
    
    # Nouveaux champs optimisés (lecture seule)
    image = OptimizedImageSerializer(read_only=True)
    quote = QuoteSerializer(read_only=True)
    video_local = MediaFileSerializer(read_only=True)
    audio = MediaFileSerializer(read_only=True)
    
    # Déterminer le type de vidéo utilisé
    video_type = serializers.SerializerMethodField()
    video_source = serializers.SerializerMethodField()

    class Meta:
        model = Bloc
        fields = [
            'uuid',
            'type',
            'ordre',

            'contenu',
            'citation_auteur',
            'citation_large',

            # Image optimisée
            'image',
            'image_caption',
            'image_credit',
            'image_fullbleed',

            'gallery_images',

            # Citation stylisée
            'quote',

            # Vidéo (YouTube + Vimeo + local)
            'video_type',
            'video_source',
            'video_caption',
            'video_youtube_url',
            'video_vimeo_url',
            'video_local',

            # Audio
            'audio',

            'embed_url',

            'timeline_events',
        ]

    def get_video_type(self, obj):
        """Déterminer le type de vidéo utilisé."""
        if obj.video_youtube_url:
            return 'youtube'
        elif obj.video_vimeo_url:
            return 'vimeo'
        elif obj.video_local:
            return 'local'
        return None
    def get_video_source(self, obj):

        if obj.video_local:

            media = MediaFileSerializer(
                obj.video_local,
                context=self.context
            ).data

            return {

                "type": "local",

                "url": media.get("file_url"),

                "file_url": media.get("file_url"),

                "thumbnail_url": media.get("thumbnail_url"),

                "duration": media.get("duration"),

                "width": media.get("width"),

                "height": media.get("height"),

                "title": media.get("title"),

                "transcription": media.get("transcription"),

                "subtitles_file": media.get("subtitles_file"),
            }

        if obj.video_youtube_url:

            return {

                "type": "youtube",

                "url": obj.video_youtube_url,

                "file_url": None,

                "thumbnail_url": None,
            }

        if obj.video_vimeo_url:

            return {

                "type": "vimeo",

                "url": obj.video_vimeo_url,

                "file_url": None,

                "thumbnail_url": None,
            }

        return None
    

    def validate(self, data):
        """ Valider les blocs selon leur type."""
        instance = Bloc(**data)
        try:
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        return data


# ═══════════════════════════════════════════════════════════════
#  BLOC (ÉCRITURE)
# ═══════════════════════════════════════════════════════════════
class BlocSerializer(serializers.ModelSerializer):
    """Pour créer/lire les blocs."""
    gallery_images = GalleryImageSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    
    #  LECTURE (ce que tu as déjà)
    image = OptimizedImageSerializer(read_only=True)
    quote = QuoteSerializer(read_only=True)
    video_local = MediaFileSerializer(read_only=True)
    audio = MediaFileSerializer(read_only=True)
    
    #  ÉCRITURE (AJOUTE CES LIGNES)
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        source='image',
        write_only=True,
        required=False,
        allow_null=True
    )
    video_local_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.all(),
        source='video_local',
        write_only=True,
        required=False,
        allow_null=True
    )
    audio_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.all(),
        source='audio',
        write_only=True,
        required=False,
        allow_null=True
    )
    quote_id = serializers.PrimaryKeyRelatedField(
        queryset=Quote.objects.all(),
        source='quote',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    # Champs calculés (lecture seule)
    video_type = serializers.SerializerMethodField()
    video_source = serializers.SerializerMethodField()

    class Meta:
        model = Bloc
        fields = [
            'uuid', 'type', 'ordre',
            'contenu', 'citation_auteur', 'citation_large',
            # Lecture
            'image', 'quote', 'video_local', 'audio',
            # Écriture 
            'image_id', 'video_local_id', 'audio_id', 'quote_id',
            # Métadonnées
            'image_caption', 'image_credit', 'image_fullbleed',
            'gallery_images',
            'video_type', 'video_source', 'video_caption',
            'video_youtube_url', 'video_vimeo_url',
            'embed_url',
            'timeline_events',
        ]
        read_only_fields = ['uuid', 'video_type', 'video_source']

    def get_video_type(self, obj):
        """Déterminer le type de vidéo."""
        if obj.video_local:
            return 'local'
        elif obj.video_youtube_url:
            return 'youtube'
        elif obj.video_vimeo_url:
            return 'vimeo'
        return None
    
    def get_video_source(self, obj):
        """Construire l'objet vidéo avec URLs."""
        if obj.video_local:
            serializer = MediaFileSerializer(obj.video_local, context=self.context)
            media_data = serializer.data
            
            return {
                "type": "local",
                "url": media_data.get("file_url"),
                "file_url": media_data.get("file_url"),
                "thumbnail_url": media_data.get("thumbnail_url"),
                "duration": media_data.get("duration"),
                "width": media_data.get("width"),
                "height": media_data.get("height"),
                "transcription": media_data.get("transcription"),
            }
        
        elif obj.video_youtube_url:
            return {
                "type": "youtube",
                "url": obj.video_youtube_url,
                "file_url": None,
            }
        
        elif obj.video_vimeo_url:
            return {
                "type": "vimeo",
                "url": obj.video_vimeo_url,
                "file_url": None,
            }
        
        return None
class BlocWriteSerializer(serializers.ModelSerializer):
    """
    FIXED: Sérializer d'écriture pour les blocs.
    Support ForeignKey pour les nouveaux modèles optimisés.
    """

    # ForeignKey IDs pour les champs optimisés
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        source='image',
        required=False,
        allow_null=True
    )

    quote_id = serializers.PrimaryKeyRelatedField(
        queryset=Quote.objects.all(),
        source='quote',
        required=False,
        allow_null=True
    )

    video_local_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.filter(media_type='video'),
        source='video_local',
        required=False,
        allow_null=True,
        write_only=True
    )
    
    audio_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.filter(media_type='audio'),
        source='audio',
        required=False,
        allow_null=True,
        write_only=True
    )

    gallery_images = GalleryImageWriteSerializer(
        many=True,
        required=False,
        default=list
    )

    timeline_events = TimelineEventWriteSerializer(
        many=True,
        required=False,
        default=list
    )

    class Meta:
        model = Bloc
        fields = [
            "uuid",
            "type",
            "ordre",

            "contenu",
            "citation_auteur",
            "citation_large",

            # Image optimisée
            "image_id",
            "image_caption",
            "image_credit",
            "image_fullbleed",

            "gallery_images",

            # Citation stylisée
            "quote_id",

            # Vidéo (YouTube + Vimeo + local)
            "video_youtube_url",
            "video_vimeo_url",
            "video_local_id",
            "video_caption",

            # Audio
            "audio_id",

            "embed_url",

            "timeline_events",
        ]

    def validate(self, data):
        """ FIXED: Valider correctement sans pop/push bizarre."""
        bloc_type = data.get("type")
        
        # Extraire les sous-modèles (ne pas les valider ici)
        gallery_images = data.pop("gallery_images", [])
        timeline_events = data.pop("timeline_events", [])

        # Créer une instance temporaire pour la validation
        instance = Bloc(**data)
        try:
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)

        # Remettre les sous-modèles en place
        data["gallery_images"] = gallery_images
        data["timeline_events"] = timeline_events

        return data

    @transaction.atomic
    def create(self, validated_data):
        """ Créer un bloc avec ses sous-modèles."""
        gallery_images_data = validated_data.pop("gallery_images", [])
        timeline_events_data = validated_data.pop("timeline_events", [])

        # Créer le bloc
        bloc = Bloc.objects.create(**validated_data)

        # Créer les images de galerie
        for img_data in gallery_images_data:
            GalleryImage.objects.create(bloc=bloc, **img_data)

        # Créer les événements de timeline
        for event_data in timeline_events_data:
            TimelineEvent.objects.create(bloc=bloc, **event_data)

        return bloc

    @transaction.atomic
    def update(self, instance, validated_data):
        """ Mettre à jour un bloc et ses sous-modèles."""
        gallery_images_data = validated_data.pop("gallery_images", None)
        timeline_events_data = validated_data.pop("timeline_events", None)

        # Mettre à jour les champs du bloc
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Mettre à jour les images de galerie
        if gallery_images_data is not None:
            instance.gallery_images.all().delete()
            for img_data in gallery_images_data:
                GalleryImage.objects.create(bloc=instance, **img_data)

        # Mettre à jour les événements de timeline
        if timeline_events_data is not None:
            instance.timeline_events.all().delete()
            for event_data in timeline_events_data:
                TimelineEvent.objects.create(bloc=instance, **event_data)

        return instance


# ═══════════════════════════════════════════════════════════════
#  REPORTAGE (LISTE)
# ═══════════════════════════════════════════════════════════════

class ReportageListSerializer(serializers.ModelSerializer):
    """Version légère pour la liste — sans blocs."""
    cover_image_url = serializers.SerializerMethodField()
    author_name     = serializers.SerializerMethodField()
    views_count     = serializers.SerializerMethodField()

    class Meta:
        model  = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'author_name', 'cover_image_url',
            'reading_time', 'views_count',
            'featured', 'published_at', 'created_at',
        ]
        read_only_fields = ['views_count']

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.image.url)
        return None

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_views_count(self, obj):
        """ FIXED: Utiliser la property au lieu du champ."""
        return obj.views_count


# ═══════════════════════════════════════════════════════════════
#  REPORTAGE (DÉTAIL)
# ═══════════════════════════════════════════════════════════════

class ReportageDetailSerializer(serializers.ModelSerializer):
    """Version complète avec tous les blocs."""
    blocs           = BlocSerializer(many=True, read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    og_image_url    = serializers.SerializerMethodField()
    author_name     = serializers.SerializerMethodField()
    views_count     = serializers.SerializerMethodField()

    class Meta:
        model  = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'author_name', 'cover_image_url',
            'meta_title', 'meta_description', 'og_image_url',
            'reading_time', 'views_count',
            'featured', 'published_at', 'created_at', 'updated_at',
            'blocs',
        ]
        read_only_fields = ['views_count']

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.image.url)
        return None

    def get_og_image_url(self, obj):
        request = self.context.get('request')
        if obj.og_image and request:
            return request.build_absolute_uri(obj.og_image.image.url)
        return None

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_views_count(self, obj):
        """ FIXED: Utiliser la property."""
        return obj.views_count


# ═══════════════════════════════════════════════════════════════
#  REPORTAGE (ÉCRITURE)
# ═══════════════════════════════════════════════════════════════

class ReportageWriteSerializer(serializers.ModelSerializer):

    cover_image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        source='cover_image',
        required=False,
        allow_null=True
    )

    og_image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(),
        source='og_image',
        required=False,
        allow_null=True
    )

    blocs = BlocWriteSerializer(
        many=True,
        required=False,
        default=list
    )

    author = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'meta_title', 'meta_description',
            'cover_image_id', 'og_image_id',
            'featured', 'published_at',
            'blocs', 'author'
        ]

    @transaction.atomic
    def create(self, validated_data):
        """Créer un reportage avec ses blocs."""
        blocs_data = validated_data.pop('blocs', [])
        reportage = Reportage.objects.create(**validated_data)
        
        for bloc_data in blocs_data:
            BlocWriteSerializer().create({**bloc_data, 'reportage': reportage})
        
        return reportage

    @transaction.atomic
    def update(self, instance, validated_data):
        """Mettre à jour un reportage et ses blocs."""
        blocs_data = validated_data.pop('blocs', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if blocs_data is not None:
            instance.blocs.all().delete()
            for bloc_data in blocs_data:
                BlocWriteSerializer().create({**bloc_data, 'reportage': instance})
        
        return instance


# ═══════════════════════════════════════════════════════════════
#  VUE DE REPORTAGE
# ═══════════════════════════════════════════════════════════════

class ReportageViewSerializer(serializers.ModelSerializer):
    """Pour enregistrer les vues."""
    class Meta:
        model  = ReportageView
        fields = ['reportage', 'ip_hash', 'created_at']
        read_only_fields = ['ip_hash', 'created_at']