from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import Ad, AdClick, AdImpression, AdStatus, Advertiser


# ─────────────────────────────────────────────
# Advertiser
# ─────────────────────────────────────────────

@admin.register(Advertiser)
class AdvertiserAdmin(admin.ModelAdmin):
    list_display  = ["name", "contact_name", "email", "active_ads_badge", "is_active", "created_at"]
    list_filter   = ["is_active"]
    search_fields = ["name", "email", "contact_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering      = ["name"]

    @admin.display(description="Pubs actives")
    def active_ads_badge(self, obj):
        n = obj.ads.filter(status=AdStatus.ACTIVE).count()
        color = "#2ecc71" if n > 0 else "#95a5a6"
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{} active(s)</span>',
            color, n,
        )


# ─────────────────────────────────────────────
# Ad
# ─────────────────────────────────────────────

class AdImpressionInline(admin.TabularInline):
    model          = AdImpression
    fields         = ["ip_address", "referer", "created_at"]
    readonly_fields = fields
    extra          = 0
    can_delete     = False
    max_num        = 20
    show_change_link = False


class AdClickInline(admin.TabularInline):
    model          = AdClick
    fields         = ["ip_address", "referer", "created_at"]
    readonly_fields = fields
    extra          = 0
    can_delete     = False
    max_num        = 20


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display  = [
        "title", "advertiser", "format_badge", "target_category",
        "status_badge", "priority",
        "impressions_count", "clicks_count", "ctr_display",
        "start_date", "end_date",
    ]
    list_filter   = ["status", "format", "target_category", "advertiser"]
    search_fields = ["title", "advertiser__name"]
    readonly_fields = [
        "id", "impressions_count", "clicks_count",
        "created_at", "updated_at",
    ]
    raw_id_fields  = ["advertiser"]
    inlines        = [AdImpressionInline, AdClickInline]
    ordering       = ["-priority", "-created_at"]
    list_per_page  = 25

    fieldsets = (
        ("Contenu",      {"fields": ("title", "image", "destination_url", "alt_text")}),
        ("Annonceur",    {"fields": ("advertiser",)}),
        ("Ciblage",      {"fields": ("format", "target_category", "priority")}),
        ("Diffusion",    {"fields": ("status", "start_date", "end_date")}),
        ("Budget",       {"fields": ("max_impressions", "max_clicks")}),
        ("Performance",  {"fields": ("impressions_count", "clicks_count"), "classes": ("collapse",)}),
        ("Métadonnées",  {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)}),
    )

    actions = ["activate_ads", "pause_ads", "archive_ads"]

    @admin.display(description="Format")
    def format_badge(self, obj):
        colors = {
            "banner_top":    "#3498db",
            "banner_bottom": "#2980b9",
            "sidebar":       "#9b59b6",
            "in_content":    "#e67e22",
            "sticky_footer": "#1abc9c",
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            colors.get(obj.format, "#95a5a6"),
            obj.get_format_display(),
        )

    @admin.display(description="Statut")
    def status_badge(self, obj):
        colors = {
            AdStatus.DRAFT:    "#95a5a6",
            AdStatus.ACTIVE:   "#2ecc71",
            AdStatus.PAUSED:   "#f39c12",
            AdStatus.EXPIRED:  "#e74c3c",
            AdStatus.ARCHIVED: "#34495e",
        }
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">{}</span>',
            colors.get(obj.status, "#95a5a6"),
            obj.get_status_display(),
        )

    @admin.display(description="CTR")
    def ctr_display(self, obj):
        ctr = obj.ctr
        color = "#2ecc71" if ctr >= 2 else ("#f39c12" if ctr >= 0.5 else "#e74c3c")
        return format_html(
            '<span style="color:{};font-weight:600">{:.2f}%</span>', color, ctr
        )

    @admin.action(description="▶ Activer les pubs sélectionnées")
    def activate_ads(self, request, queryset):
        n = queryset.exclude(status=AdStatus.EXPIRED).update(status=AdStatus.ACTIVE)
        self.message_user(request, f"{n} pub(s) activée(s).")

    @admin.action(description="⏸ Mettre en pause les pubs sélectionnées")
    def pause_ads(self, request, queryset):
        n = queryset.filter(status=AdStatus.ACTIVE).update(status=AdStatus.PAUSED)
        self.message_user(request, f"{n} pub(s) mises en pause.")

    @admin.action(description="🗄 Archiver les pubs sélectionnées")
    def archive_ads(self, request, queryset):
        n = queryset.update(status=AdStatus.ARCHIVED)
        self.message_user(request, f"{n} pub(s) archivée(s).")