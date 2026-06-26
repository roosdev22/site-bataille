from django.contrib import admin
from django.utils.html import format_html

from .models import (
    Reportage,
    Bloc,
    GalleryImage,
    TimelineEvent,
    ReportageView,
)


# ═══════════════════════════════════════════════════════════════
#  INLINE BLOCS
# ═══════════════════════════════════════════════════════════════

class BlocInline(admin.StackedInline):

    model = Bloc

    extra = 1

    ordering = ['ordre']

    show_change_link = True

    fields = [

        ('type', 'ordre'),

        # TEXTE
        'contenu',

        ('citation_auteur', 'citation_large'),

        # IMAGE
        (
            'image',
            'image_caption',
            'image_credit',
            'image_fullbleed',
        ),

        # VIDEO
        (
            'video_fichier',
            'video_url',
            'video_titre',
            'video_description',
            'video_duree',
            'video_thumbnail',
        ),

        # AUDIO
        (
            'audio_fichier',
            'audio_titre',
            'audio_description',
            'audio_duree',
        ),

        # EMBED
        'embed_url',
    ]


# ═══════════════════════════════════════════════════════════════
#  REPORTAGE ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(Reportage)
class ReportageAdmin(admin.ModelAdmin):

    list_display = [
        'title',
        'author',
        'status',
        'featured',
        'reading_time',
        'views_count',
        'published_at',
        'cover_preview',
    ]

    list_filter = [
        'status',
        'featured',
        'author',
        'created_at',
    ]

    search_fields = [
        'title',
        'subtitle',
        'meta_title',
        'meta_description',
    ]

    prepopulated_fields = {
        'slug': ('title',)
    }

    readonly_fields = [
        'reading_time',
        'views_count',
        'created_at',
        'updated_at',
        'cover_preview',
    ]

    inlines = [
        BlocInline
    ]

    fieldsets = [

        (
            'Informations',
            {
                'fields': [
                    'title',
                    'subtitle',
                    'slug',
                    'author',
                ]
            }
        ),

        (
            'Couverture',
            {
                'fields': [
                    'cover_image',
                    'cover_preview',
                ]
            }
        ),

        (
            'SEO / Open Graph',
            {
                'fields': [
                    'meta_title',
                    'meta_description',
                    'og_image',
                ]
            }
        ),

        (
            'Publication',
            {
                'fields': [
                    'status',
                    'featured',
                    'published_at',
                ]
            }
        ),

        (
            'Statistiques',
            {
                'fields': [
                    'reading_time',
                    'views_count',
                ]
            }
        ),

        (
            'Dates',
            {
                'fields': [
                    'created_at',
                    'updated_at',
                ]
            }
        ),
    ]

    def cover_preview(self, obj):

        if obj.cover_image:

            return format_html(
                '<img src="{}" style="max-height:120px;border-radius:8px;" />',
                obj.cover_image.url
            )

        return '—'

    cover_preview.short_description = 'Aperçu'


# ═══════════════════════════════════════════════════════════════
#  BLOC ADMIN
# ═══════════════════════════════════════════════════════════════

@admin.register(Bloc)
class BlocAdmin(admin.ModelAdmin):

    list_display = [
        '__str__',
        'type',
        'ordre',
        'reportage',
    ]

    list_filter = [
        'type',
        'reportage',
    ]

    ordering = [
        'reportage',
        'ordre',
    ]


# ═══════════════════════════════════════════════════════════════
#  AUTRES MODÈLES
# ═══════════════════════════════════════════════════════════════

@admin.register(GalleryImage)
class GalleryImageAdmin(admin.ModelAdmin):

    list_display = [
        'bloc',
        'ordre',
        'caption',
    ]

    ordering = [
        'bloc',
        'ordre',
    ]


@admin.register(TimelineEvent)
class TimelineEventAdmin(admin.ModelAdmin):

    list_display = [
        'title',
        'date_label',
        'bloc',
        'ordre',
    ]

    ordering = [
        'bloc',
        'ordre',
    ]


@admin.register(ReportageView)
class ReportageViewAdmin(admin.ModelAdmin):

    list_display = [
        'reportage',
        'created_at',
    ]

    readonly_fields = [
        'reportage',
        'ip_hash',
        'created_at',
    ]