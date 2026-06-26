from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Post, PostStatus, PostView, Tag
@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ["name", "slug"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


class PostViewInline(admin.TabularInline):
    model  = PostView
    fields = ["ip_address", "user_agent", "viewed_at"]
    readonly_fields = ["ip_address", "user_agent", "viewed_at"]
    extra  = 0
    can_delete = False


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display  = [
        "title", "author", "category_badge", "status_badge",
        "views_count", "published_at", "created_at",
    ]
    list_filter   = ["status", "category", "created_at"]
    search_fields = ["title", "author__email", "author__first_name", "author__last_name"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["id", "views_count", "created_at", "updated_at"]
    autocomplete_fields = ["tags"]
    inlines  = [PostViewInline]
    ordering = ["-created_at"]

    fieldsets = (
        ("Contenu", {"fields": ("title", "slug", "excerpt", "content", "cover_image")}),
        ("Classification", {"fields": ("category", "tags")}),
        ("Auteur & Statut", {"fields": ("author", "status", "rejection_note")}),
        ("SEO", {"fields": ("meta_title", "meta_description"), "classes": ("collapse",)}),
        ("Métadonnées", {"fields": ("id", "views_count", "published_at", "created_at", "updated_at"), "classes": ("collapse",)}),
    )

    actions = ["publish_posts", "archive_posts", "send_to_draft"]

    @admin.display(description="Catégorie")
    def category_badge(self, obj):
        colors = {
            "medical": "#e74c3c", "travel": "#3498db",
            "technology": "#9b59b6", "education": "#2ecc71",
            "lifestyle": "#f39c12", "other": "#95a5a6",
        }
        color = colors.get(obj.category, "#95a5a6")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_category_display(),
        )

    @admin.display(description="Statut")
    def status_badge(self, obj):
        colors = {
            PostStatus.DRAFT: "#95a5a6",
            PostStatus.PENDING: "#f39c12",
            PostStatus.PUBLISHED: "#2ecc71",
            PostStatus.ARCHIVED: "#34495e",
            PostStatus.REJECTED: "#e74c3c",
        }
        color = colors.get(obj.status, "#95a5a6")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            color, obj.get_status_display(),
        )

    @admin.action(description="Publier les articles sélectionnés")
    def publish_posts(self, request, queryset):
        updated = queryset.filter(
            status__in=[PostStatus.PENDING, PostStatus.DRAFT]
        ).update(status=PostStatus.PUBLISHED, published_at=timezone.now())
        self.message_user(request, f"{updated} article(s) publié(s).")

    @admin.action(description="Archiver les articles sélectionnés")
    def archive_posts(self, request, queryset):
        updated = queryset.filter(status=PostStatus.PUBLISHED).update(status=PostStatus.ARCHIVED)
        self.message_user(request, f"{updated} article(s) archivé(s).")

    @admin.action(description="Remettre en brouillon")
    def send_to_draft(self, request, queryset):
        updated = queryset.exclude(
            status__in=[PostStatus.PUBLISHED, PostStatus.ARCHIVED]
        ).update(status=PostStatus.DRAFT)
        self.message_user(request, f"{updated} article(s) repassé(s) en brouillon.")