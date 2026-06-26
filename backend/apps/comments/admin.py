from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Comment, CommentLike, CommentStatus


class CommentLikeInline(admin.TabularInline):
    model      = CommentLike
    fields     = ["user", "created_at"]
    readonly_fields = ["user", "created_at"]
    extra      = 0
    can_delete = False
    max_num    = 0


class ReplyInline(admin.TabularInline):
    model       = Comment
    fk_name     = "parent"
    fields      = ["body", "author", "status", "created_at"]
    readonly_fields = ["author", "created_at"]
    extra       = 0
    can_delete  = True
    show_change_link = True


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display  = [
        "short_body", "author", "post_link",
        "status_badge", "likes_count", "replies_count",
        "created_at",
    ]
    list_filter   = ["status", "created_at"]
    search_fields = ["body", "author__email", "author__first_name", "post__title"]
    readonly_fields = [
        "id", "likes_count", "replies_count",
        "created_at", "updated_at", "deleted_at",
    ]
    raw_id_fields  = ["post", "author", "parent"]
    inlines        = [ReplyInline, CommentLikeInline]
    ordering       = ["-created_at"]
    list_per_page  = 30

    fieldsets = (
        ("Contenu", {"fields": ("body", "post", "author", "parent")}),
        ("Modération", {"fields": ("status", "rejection_note")}),
        ("Stats", {"fields": ("likes_count", "replies_count")}),
        ("Timestamps", {"fields": ("id", "created_at", "updated_at", "deleted_at"), "classes": ("collapse",)}),
    )

    actions = ["approve_comments", "reject_comments", "soft_delete_comments"]

    @admin.display(description="Commentaire")
    def short_body(self, obj):
        return obj.body[:60] + ("…" if len(obj.body) > 60 else "")

    @admin.display(description="Article")
    def post_link(self, obj):
        return format_html(
            '<a href="/admin/posts/post/{}/change/">{}</a>',
            obj.post_id, obj.post.title[:40],
        )

    @admin.display(description="Statut")
    def status_badge(self, obj):
        colors = {
            CommentStatus.PENDING:  "#f39c12",
            CommentStatus.APPROVED: "#2ecc71",
            CommentStatus.REJECTED: "#e74c3c",
            CommentStatus.DELETED:  "#95a5a6",
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            colors.get(obj.status, "#95a5a6"),
            obj.get_status_display(),
        )

    @admin.action(description="✅ Approuver les commentaires sélectionnés")
    def approve_comments(self, request, queryset):
        n = queryset.filter(
            status__in=[CommentStatus.PENDING, CommentStatus.REJECTED]
        ).update(status=CommentStatus.APPROVED, rejection_note="")
        self.message_user(request, f"{n} commentaire(s) approuvé(s).")

    @admin.action(description="❌ Rejeter les commentaires sélectionnés")
    def reject_comments(self, request, queryset):
        n = queryset.filter(status=CommentStatus.PENDING).update(
            status=CommentStatus.REJECTED
        )
        self.message_user(request, f"{n} commentaire(s) rejeté(s).")

    @admin.action(description="🗑 Supprimer (soft) les commentaires sélectionnés")
    def soft_delete_comments(self, request, queryset):
        now = timezone.now()
        n = queryset.exclude(status=CommentStatus.DELETED).update(
            body="[Ce commentaire a été supprimé]",
            status=CommentStatus.DELETED,
            deleted_at=now,
        )
        self.message_user(request, f"{n} commentaire(s) supprimé(s).")
        