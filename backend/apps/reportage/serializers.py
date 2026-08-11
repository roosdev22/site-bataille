"""
apps/reportage/serializers.py
"""
from io import BytesIO

from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.base import ContentFile
from django.db import transaction
from PIL import Image
from rest_framework import serializers

from .models import (
    Bloc,
    BlocType,
    GalleryImage,
    MediaFile,
    OptimizedImage,
    Quote,
    Reportage,
    ReportageView,
    TimelineEvent,
)


# ═══════════════════════════════════════════════════════════════
#  OPTIMIZED IMAGE
# ═══════════════════════════════════════════════════════════════

class OptimizedImageSerializer(serializers.ModelSerializer):
    """Lecture — URLs Supabase persistées, pas de SerializerMethodField."""

    class Meta:
        model = OptimizedImage
        fields = [
            'id',
            'image_url',
            'image_thumb_url',
            'image_small_url',
            'image_medium_url',
            'image_large_url',
            'alt_text', 'caption', 'credit', 'aspect_ratio',
            'width', 'height', 'file_size',
            'uploaded_by', 'uploaded_at',
        ]
        read_only_fields = [
            'id',
            'image_url', 'image_thumb_url', 'image_small_url',
            'image_medium_url', 'image_large_url',
            'width', 'height', 'file_size', 'aspect_ratio',
            'uploaded_at', 'uploaded_by',
        ]


class OptimizedImageUploadSerializer(serializers.ModelSerializer):
    """Écriture — upload + génération des variantes."""

    class Meta:
        model = OptimizedImage
        fields = ['id', 'image', 'alt_text', 'caption', 'credit']
        read_only_fields = ['id']

    def validate_image(self, value):
        if value.size > 50 * 1024 * 1024:
            raise serializers.ValidationError("Image trop grande (max 50 MB).")
        try:
            Image.open(value)
        except Exception:
            raise serializers.ValidationError("Fichier invalide ou non reconnu comme image.")
        return value

    def create(self, validated_data):
        optimized_image = OptimizedImage(**validated_data)
        original_image = validated_data['image']

        pil_image = Image.open(original_image)
        if pil_image.mode in ('RGBA', 'P'):
            rgb_image = Image.new('RGB', pil_image.size, (255, 255, 255))
            rgb_image.paste(
                pil_image,
                mask=pil_image.split()[-1] if pil_image.mode == 'RGBA' else None,
            )
            pil_image = rgb_image

        optimized_image.width, optimized_image.height = pil_image.size
        optimized_image.file_size = original_image.size

        sizes = {
            'image_thumb':  (150, 150),
            'image_small':  (400, 300),
            'image_medium': (800, 600),
            'image_large':  (1200, 900),
        }
        for field_name, (max_width, max_height) in sizes.items():
            temp = pil_image.copy()
            temp.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            buffer = BytesIO()
            temp.save(buffer, format='WEBP', quality=85, optimize=True)
            buffer.seek(0)
            base_name = original_image.name.split('.')[0]
            filename = f"{base_name}_{field_name}.webp"
            getattr(optimized_image, field_name).save(
                filename, ContentFile(buffer.getvalue()), save=False
            )

        optimized_image.save()
        return optimized_image

    def update(self, instance, validated_data):
        instance.alt_text = validated_data.get('alt_text', instance.alt_text)
        instance.caption  = validated_data.get('caption',  instance.caption)
        instance.credit   = validated_data.get('credit',   instance.credit)
        instance.save()
        return instance  # corrigé : était `instances`


# ═══════════════════════════════════════════════════════════════
#  MEDIA FILE
# ═══════════════════════════════════════════════════════════════

class MediaFileSerializer(serializers.ModelSerializer):
    file         = serializers.FileField(write_only=True)
    file_url     = serializers.SerializerMethodField()
    file_size_mb = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = MediaFile
        fields = [
            'id', 'title', 'media_type', 'description',
            'file',
            'file_url', 'file_size_mb', 'duration',
            'width', 'height', 'thumbnail_url',
            'transcription', 'subtitles_file',
            'uploaded_at',
        ]
        read_only_fields = ['id', 'file_url', 'file_size_mb', 'thumbnail_url', 'uploaded_at']

    def get_file_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            return request.build_absolute_uri(obj.file.url) if request else obj.file.url
        return None

    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail:
            return request.build_absolute_uri(obj.thumbnail.url) if request else obj.thumbnail.url
        return None


# ═══════════════════════════════════════════════════════════════
#  QUOTE
# ═══════════════════════════════════════════════════════════════

class QuoteSerializer(serializers.ModelSerializer):
    author_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Quote
        fields = [
            'id', 'text', 'author', 'author_role', 'author_image_url',
            'source', 'source_url', 'alignment', 'accent_color',
            'background_color', 'border_style',
        ]
        read_only_fields = ['author_image_url']

    def get_author_image_url(self, obj):
        request = self.context.get('request')
        if obj.author_image and request:
            return request.build_absolute_uri(obj.author_image.url)
        return None


# ═══════════════════════════════════════════════════════════════
#  SOUS-MODÈLES GALERIE / TIMELINE
# ═══════════════════════════════════════════════════════════════

class GalleryImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model  = GalleryImage
        fields = ['id', 'image', 'caption', 'credit', 'ordre']

    def get_image(self, obj):
        if obj.image:
            return OptimizedImageSerializer(obj.image, context=self.context).data
        return None


class GalleryImageWriteSerializer(serializers.ModelSerializer):
    image = serializers.PrimaryKeyRelatedField(queryset=OptimizedImage.objects.all())

    class Meta:
        model  = GalleryImage
        fields = ['id', 'image', 'caption', 'credit', 'ordre']


class TimelineEventSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model  = TimelineEvent
        fields = ['uuid', 'date_label', 'title', 'description', 'image', 'ordre']

    def get_image(self, obj):
        if obj.image:
            return OptimizedImageSerializer(obj.image, context=self.context).data
        return None


class TimelineEventWriteSerializer(serializers.ModelSerializer):
    image = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model  = TimelineEvent
        fields = ['uuid', 'date_label', 'title', 'description', 'image', 'ordre']


# ═══════════════════════════════════════════════════════════════
#  BLOC — LECTURE
# ═══════════════════════════════════════════════════════════════

class BlocReadSerializer(serializers.ModelSerializer):
    """Lecture seule — utilisé par ReportageDetailSerializer."""
    gallery_images  = GalleryImageSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    image           = OptimizedImageSerializer(read_only=True)
    quote           = QuoteSerializer(read_only=True)
    video_local     = MediaFileSerializer(read_only=True)
    audio           = MediaFileSerializer(read_only=True)
    video_type      = serializers.SerializerMethodField()
    video_source    = serializers.SerializerMethodField()

    class Meta:
        model = Bloc
        fields = [
            'uuid', 'type', 'ordre',
            'contenu', 'citation_auteur', 'citation_large',
            'image', 'image_caption', 'image_credit', 'image_fullbleed',
            'gallery_images',
            'quote',
            'video_type', 'video_source', 'video_caption',
            'video_youtube_url', 'video_vimeo_url', 'video_local',
            'audio',
            'embed_url',
            'timeline_events',
        ]

    def get_video_type(self, obj):
        if obj.video_local:
            return 'local'
        if obj.video_youtube_url:
            return 'youtube'
        if obj.video_vimeo_url:
            return 'vimeo'
        return None

    def get_video_source(self, obj):
        if obj.video_local:
            media = MediaFileSerializer(obj.video_local, context=self.context).data
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
            return {"type": "youtube", "url": obj.video_youtube_url, "file_url": None, "thumbnail_url": None}
        if obj.video_vimeo_url:
            return {"type": "vimeo", "url": obj.video_vimeo_url, "file_url": None, "thumbnail_url": None}
        return None


# ═══════════════════════════════════════════════════════════════
#  BLOC — ÉCRITURE
# ═══════════════════════════════════════════════════════════════

class BlocWriteSerializer(serializers.ModelSerializer):
    image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(), source='image',
        required=False, allow_null=True,
    )
    quote_id = serializers.PrimaryKeyRelatedField(
        queryset=Quote.objects.all(), source='quote',
        required=False, allow_null=True,
    )
    video_local_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.filter(media_type='video'), source='video_local',
        required=False, allow_null=True, write_only=True,
    )
    audio_id = serializers.PrimaryKeyRelatedField(
        queryset=MediaFile.objects.filter(media_type='audio'), source='audio',
        required=False, allow_null=True, write_only=True,
    )
    gallery_images  = GalleryImageWriteSerializer(many=True, required=False, default=list)
    timeline_events = TimelineEventWriteSerializer(many=True, required=False, default=list)

    class Meta:
        model = Bloc
        fields = [
            'uuid', 'type', 'ordre',
            'contenu', 'citation_auteur', 'citation_large',
            'image_id', 'image_caption', 'image_credit', 'image_fullbleed',
            'gallery_images',
            'quote_id',
            'video_youtube_url', 'video_vimeo_url', 'video_local_id', 'video_caption',
            'audio_id',
            'embed_url',
            'timeline_events',
        ]

    def validate(self, data):
        gallery_images  = data.pop('gallery_images', [])
        timeline_events = data.pop('timeline_events', [])
        instance = Bloc(**data)
        try:
            instance.clean()
        except DjangoValidationError as e:
            raise serializers.ValidationError(e.message_dict)
        data['gallery_images']  = gallery_images
        data['timeline_events'] = timeline_events
        return data

    @transaction.atomic
    def create(self, validated_data):
        gallery_images_data  = validated_data.pop('gallery_images', [])
        timeline_events_data = validated_data.pop('timeline_events', [])
        bloc = Bloc.objects.create(**validated_data)
        for img_data in gallery_images_data:
            GalleryImage.objects.create(bloc=bloc, **img_data)
        for event_data in timeline_events_data:
            TimelineEvent.objects.create(bloc=bloc, **event_data)
        return bloc

    @transaction.atomic
    def update(self, instance, validated_data):
        gallery_images_data  = validated_data.pop('gallery_images', None)
        timeline_events_data = validated_data.pop('timeline_events', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if gallery_images_data is not None:
            instance.gallery_images.all().delete()
            for img_data in gallery_images_data:
                GalleryImage.objects.create(bloc=instance, **img_data)
        if timeline_events_data is not None:
            instance.timeline_events.all().delete()
            for event_data in timeline_events_data:
                TimelineEvent.objects.create(bloc=instance, **event_data)
        return instance


# ═══════════════════════════════════════════════════════════════
#  REPORTAGE
# ═══════════════════════════════════════════════════════════════

class ReportageListSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    author_name     = serializers.SerializerMethodField()
    views_count     = serializers.SerializerMethodField()

    class Meta:
        model = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'author_name', 'cover_image_url',
            'reading_time', 'views_count',
            'featured', 'published_at', 'created_at',
        ]

    def get_cover_image_url(self, obj):
        # URL Supabase persistée — pas de build_absolute_uri nécessaire
        if obj.cover_image:
            return obj.cover_image.image_url or None
        return None

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_views_count(self, obj):
        return obj.views_count


class ReportageDetailSerializer(serializers.ModelSerializer):
    blocs           = BlocReadSerializer(many=True, read_only=True)  # corrigé : BlocReadSerializer
    cover_image_url = serializers.SerializerMethodField()
    og_image_url    = serializers.SerializerMethodField()
    author_name     = serializers.SerializerMethodField()
    views_count     = serializers.SerializerMethodField()

    class Meta:
        model = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'author_name', 'cover_image_url',
            'meta_title', 'meta_description', 'og_image_url',
            'reading_time', 'views_count',
            'featured', 'published_at', 'created_at', 'updated_at',
            'blocs',
        ]

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            return obj.cover_image.image_url or None
        return None

    def get_og_image_url(self, obj):
        if obj.og_image:
            return obj.og_image.image_url or None
        return None

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username

    def get_views_count(self, obj):
        return obj.views_count


class ReportageWriteSerializer(serializers.ModelSerializer):
    cover_image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(), source='cover_image',
        required=False, allow_null=True,
    )
    og_image_id = serializers.PrimaryKeyRelatedField(
        queryset=OptimizedImage.objects.all(), source='og_image',
        required=False, allow_null=True,
    )
    blocs  = BlocWriteSerializer(many=True, required=False, default=list)
    author = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Reportage
        fields = [
            'slug', 'title', 'subtitle', 'status',
            'meta_title', 'meta_description',
            'cover_image_id', 'og_image_id',
            'featured', 'published_at',
            'blocs', 'author',
        ]

    @transaction.atomic
    def create(self, validated_data):
        blocs_data = validated_data.pop('blocs', [])
        reportage  = Reportage.objects.create(**validated_data)
        for bloc_data in blocs_data:
            BlocWriteSerializer().create({**bloc_data, 'reportage': reportage})
        return reportage

    @transaction.atomic
    def update(self, instance, validated_data):
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
    class Meta:
        model  = ReportageView
        fields = ['reportage', 'ip_hash', 'created_at']
        read_only_fields = ['ip_hash', 'created_at']