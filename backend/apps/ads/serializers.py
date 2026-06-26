from rest_framework import serializers
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta

from .models import Ad, AdFormat, AdCategory, Advertiser, AdImpression, AdClick, AdStatus


# ─────────────────────────────────────────────
# Public — ce que le frontend reçoit pour afficher une pub
# ─────────────────────────────────────────────

class AdPublicSerializer(serializers.ModelSerializer):
    """
    Données minimales exposées publiquement.
    Pas de stats, pas d'annonceur, pas de dates internes.
    """
    class Meta:
        model  = Ad
        fields = [
            "id", "title", "image", "destination_url",
            "alt_text", "format",
        ]


# ─────────────────────────────────────────────
# Admin — Advertiser CRUD
# ─────────────────────────────────────────────

class AdvertiserSerializer(serializers.ModelSerializer):
    total_ads  = serializers.IntegerField(read_only=True)
    active_ads = serializers.IntegerField(read_only=True)

    class Meta:
        model  = Advertiser
        fields = [
            "id", "name", "contact_name", "email", "phone",
            "website", "notes", "is_active",
            "total_ads", "active_ads",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_email(self, value: str) -> str:
        return value.lower().strip()


# ─────────────────────────────────────────────
# Admin — Ad CRUD
# ─────────────────────────────────────────────

class AdAdminSerializer(serializers.ModelSerializer):
    advertiser_name = serializers.CharField(source="advertiser.name", read_only=True)
    ctr             = serializers.FloatField(read_only=True)
    is_expired      = serializers.BooleanField(read_only=True)
    budget_exhausted = serializers.BooleanField(read_only=True)
    image           = serializers.ImageField(required=False)  # ✅ Rendre l'image optionnelle

    class Meta:
        model  = Ad
        fields = [
            "id", "advertiser", "advertiser_name",
            "title", "image", "destination_url", "alt_text",
            "format", "target_category",
            "status", "priority",
            "start_date", "end_date",
            "max_impressions", "max_clicks",
            "impressions_count", "clicks_count", "ctr",
            "is_expired", "budget_exhausted",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "impressions_count", "clicks_count",
            "created_at", "updated_at",
        ]
        extra_kwargs = {
            "image": {"required": False},  # ✅ Optionnel dans les requêtes
        }

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end   = attrs.get("end_date",   getattr(self.instance, "end_date",   None))
        if start and end and end <= start:
            raise serializers.ValidationError(
                {"end_date": "La date de fin doit être après la date de début."}
            )
        return attrs

    def validate_image(self, value):
        """
        Si aucune nouvelle image n'est fournie lors d'une modification (PATCH/PUT),
        conserver l'image existante.
        """
        if not value and self.instance and self.instance.image:
            return self.instance.image
        return value


# ─────────────────────────────────────────────
# Rapport global (toutes pubs confondues)
# ─────────────────────────────────────────────

class GlobalReportSerializer(serializers.Serializer):
    total_ads         = serializers.IntegerField()
    active_ads        = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    total_clicks      = serializers.IntegerField()
    global_ctr        = serializers.FloatField()
    top_ads           = serializers.ListField(child=serializers.DictField())
    by_format         = serializers.ListField(child=serializers.DictField())
    by_category       = serializers.ListField(child=serializers.DictField())
    daily_trend       = serializers.ListField(child=serializers.DictField())


# ─────────────────────────────────────────────
# Rapport par annonceur
# ─────────────────────────────────────────────

class AdvertiserReportSerializer(serializers.Serializer):
    advertiser        = AdvertiserSerializer()
    total_impressions = serializers.IntegerField()
    total_clicks      = serializers.IntegerField()
    ctr               = serializers.FloatField()
    ads               = serializers.ListField(child=serializers.DictField())
    monthly_trend     = serializers.ListField(child=serializers.DictField())