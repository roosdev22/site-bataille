from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from datetime import timedelta

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from .models import (
    Ad, AdClick, AdFormat, AdImpression,
    AdStatus, Advertiser,
)
from .serializers import (
    AdAdminSerializer,
    AdPublicSerializer,
    AdvertiserReportSerializer,
    AdvertiserSerializer,
    GlobalReportSerializer,
)
from apps.users.permissions import IsAdmin


def _get_client_ip(request) -> str:
    xff = request.META.get("HTTP_X_FORWARDED_FOR")
    return xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "0.0.0.0")


def _get_ua(request) -> str:
    return request.META.get("HTTP_USER_AGENT", "")[:300]


def _get_referer(request) -> str:
    return request.META.get("HTTP_REFERER", "")[:500]
import logging

logger = logging.getLogger(__name__)


class AdSlotView(APIView):
    """
    Récupère les publicités actives pour un emplacement et une catégorie donnés.
    
    Cette endpoint est publique (pas d'authentification requise) et est utilisée
    par le frontend pour afficher les pubs sur chaque page.
    
    Query params:
    - slot (required): format de la pub (banner_top, banner_bottom, sidebar, in_content, sticky_footer)
    - category (optional): catégorie ciblée (default: "all")
    - limit (optional): nombre max de pubs à retourner (default: 1, max: 5)
    
    Responses:
    200 OK: [{ id, title, image, destination_url, alt_text, format }]
    400 Bad Request: { "slot": "Le paramètre 'slot' est requis." }
    400 Bad Request: { "slot": "Format 'xyz' invalide. Acceptés: ..." }
    
    Example:
    GET /ads/slot/?slot=banner_top&category=medical&limit=3
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]  #  Limiter: 1000 req/jour par IP
    
    def get(self, request):
        # 1️ Récupérer et valider les paramètres
        slot = request.query_params.get("slot", "").strip()
        category = request.query_params.get("category", "all").strip()
        
        # Valider limit avec gestion d'erreur
        try:
            limit = min(int(request.query_params.get("limit", 1)), 5)
        except (ValueError, TypeError):
            logger.warning(f"Invalid limit parameter: {request.query_params.get('limit')}")
            limit = 1
        
        # 2️ Valider le format (slot)
        valid_formats = [f.value for f in AdFormat]
        
        if not slot:
            logger.warning("Missing required parameter: slot")
            raise BadRequest({"slot": "Le paramètre 'slot' est requis."})
        
        if slot not in valid_formats:
            logger.warning(f"Invalid slot format: {slot}. Valid formats: {valid_formats}")
            raise BadRequest({
                "slot": f"Format '{slot}' invalide. Acceptés: {', '.join(valid_formats)}"
            })
        
        # 3️ Récupérer les publicités
        try:
            ads = Ad.objects.for_slot(slot, category)[:limit]
            serializer = AdPublicSerializer(ads, many=True, context={"request": request})
            
            logger.debug(f"Ad slot retrieved: slot={slot}, category={category}, count={len(ads)}")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error retrieving ads for slot '{slot}': {str(e)}", exc_info=True)
            raise
class AdImpressionView(APIView):
    """
    Enregistre une impression (vue) d'une publicité.
    
    Déduplication: Une même IP ne peut enregistrer qu'une impression par heure.
    
    POST /ads/{pk}/impression/
    Returns: { tracked: bool }
    """
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    def post(self, request, pk):
        try:
            ad = Ad.objects.active().get(pk=pk)
        except Ad.DoesNotExist:
            logger.warning(f"Impression on non-existent ad: {pk}")
            raise BadRequest({"ad": "Publicité introuvable ou inactive."})
            # ✅ Message localisé, loggé et structuré

        ip = _get_client_ip(request)
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        already_exists = AdImpression.objects.filter(
            ad=ad, ip_address=ip, created_at__gte=one_hour_ago
        ).exists()

        if not already_exists:
            try:
                with transaction.atomic():
                    AdImpression.objects.create(
                        ad=ad, ip_address=ip,
                        user_agent=_get_ua(request),
                        referer=_get_referer(request),
                    )
                    Ad.objects.filter(pk=ad.pk).update(
                        impressions_count=F("impressions_count") + 1
                    )
                
                ad.refresh_from_db(fields=["impressions_count", "status"])
                ad.auto_expire()
                logger.debug(f"Impression recorded: ad={ad.id}, ip={ip}")
                # ✅ Logging de chaque impression enregistrée
            except Exception as e:
                logger.error(f"Error recording impression for ad {ad.id}: {str(e)}", exc_info=True)
                raise
        
        return Response({"tracked": not already_exists}, status=status.HTTP_200_OK)

class AdClickView(APIView):
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]

    def post(self, request, pk):
        try:
            ad = Ad.objects.active().get(pk=pk)
        except Ad.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Publicite introuvable ou inactive.")
        ip = _get_client_ip(request)
        with transaction.atomic():
            AdClick.objects.create(
                ad=ad, ip_address=ip,
                user_agent=_get_ua(request),
                referer=_get_referer(request),
            )
            Ad.objects.filter(pk=ad.pk).update(clicks_count=F("clicks_count") + 1)
        ad.refresh_from_db(fields=["clicks_count", "status"])
        ad.auto_expire()
        return Response({"url": ad.destination_url})


class AdvertiserViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertiserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]

    def perform_create(self, serializer):
        advertiser = serializer.save()
        logger.info(f"Advertiser created: {advertiser.id} ({advertiser.name})")
        #  Tu as maintenant une trace que cet annonceur a été créé

    def perform_update(self, serializer):
        advertiser = serializer.save()
        logger.info(f"Advertiser updated: {advertiser.id} ({advertiser.name})")

    def perform_destroy(self, instance):
        logger.warning(f"Advertiser deleted: {instance.id} ({instance.name})")
        #  Tu vois QUAND et QUOI a été supprimé
        instance.delete()

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        """Désactiver un annonceur (met aussi en pause ses pubs actives)."""
        adv = self.get_object()
        adv.is_active = False
        adv.save(update_fields=["is_active", "updated_at"])
        
        paused_count = adv.ads.filter(status=AdStatus.ACTIVE).update(status=AdStatus.PAUSED)
        logger.info(f"Advertiser deactivated: {adv.id} ({adv.name}). Paused {paused_count} ads.")
        #  Tu sais exactement combien de pubs ont été mises en pause
        
        return Response({
            "detail": f"Annonceur « {adv.name} » désactivé. {paused_count} pub(s) mises en pause."
        })

class AdAdminViewSet(viewsets.ModelViewSet):
    serializer_class   = AdAdminSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    throttle_classes   = [UserRateThrottle]

    def get_queryset(self):
        qs  = Ad.objects.all().with_relations()
        fmt = self.request.query_params.get("format")
        cat = self.request.query_params.get("category")
        adv = self.request.query_params.get("advertiser")
        st  = self.request.query_params.get("status")
        if fmt: qs = qs.filter(format=fmt)
        if cat: qs = qs.filter(target_category=cat)
        if adv: qs = qs.filter(advertiser_id=adv)
        if st:  qs = qs.filter(status=st)
        return qs.order_by("-priority", "-created_at")

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        ad = self.get_object()
        if ad.is_expired:
            raise ValidationError("Cette publicite est expiree, modifiez les dates avant de l'activer.")
        ad.status = AdStatus.ACTIVE
        ad.save(update_fields=["status", "updated_at"])
        return Response({"detail": f"<< {ad.title} >> est maintenant active."})

    @action(detail=True, methods=["post"])
    def pause(self, request, pk=None):
        ad = self.get_object()
        if ad.status != AdStatus.ACTIVE:
            raise ValidationError("Seules les pubs actives peuvent etre mises en pause.")
        ad.status = AdStatus.PAUSED
        ad.save(update_fields=["status", "updated_at"])
        return Response({"detail": f"<< {ad.title} >> mise en pause."})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        ad = self.get_object()
        ad.status = AdStatus.ARCHIVED
        ad.save(update_fields=["status", "updated_at"])
        return Response({"detail": f"<< {ad.title} >> archivee."})

    @action(detail=True, methods=["post"])
    def reset_stats(self, request, pk=None):
        ad = self.get_object()
        Ad.objects.filter(pk=ad.pk).update(impressions_count=0, clicks_count=0)
        AdImpression.objects.filter(ad=ad).delete()
        AdClick.objects.filter(ad=ad).delete()
        return Response({"detail": "Statistiques reinitialisees."})


class GlobalAdReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        days      = int(request.query_params.get("days", 30))
        since     = timezone.now() - timedelta(days=days)
        all_ads   = Ad.objects.all()
        total_imp = all_ads.aggregate(s=Sum("impressions_count"))["s"] or 0
        total_clk = all_ads.aggregate(s=Sum("clicks_count"))["s"] or 0
        top_ads   = list(all_ads.order_by("-clicks_count")[:5].values(
            "id", "title", "format", "impressions_count", "clicks_count"))
        for a in top_ads:
            imp = a["impressions_count"]
            a["ctr"] = round(a["clicks_count"] / imp * 100, 2) if imp else 0.0
        by_format = list(all_ads.values("format").annotate(
            impressions=Sum("impressions_count"),
            clicks=Sum("clicks_count"),
            count=Count("id"),
        ).order_by("-impressions"))
        by_category = list(all_ads.values("target_category").annotate(
            impressions=Sum("impressions_count"),
            clicks=Sum("clicks_count"),
            count=Count("id"),
        ).order_by("-impressions"))
        daily_imp = (AdImpression.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at")).values("day")
            .annotate(count=Count("id")).order_by("day"))
        daily_clk = (AdClick.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at")).values("day")
            .annotate(count=Count("id")).order_by("day"))
        imp_map   = {str(r["day"]): r["count"] for r in daily_imp}
        clk_map   = {str(r["day"]): r["count"] for r in daily_clk}
        all_days  = sorted(set(imp_map) | set(clk_map))
        daily_trend = [
            {"date": d, "impressions": imp_map.get(d, 0), "clicks": clk_map.get(d, 0)}
            for d in all_days
        ]
        data = {
            "total_ads":         all_ads.count(),
            "active_ads":        all_ads.filter(status=AdStatus.ACTIVE).count(),
            "total_impressions": total_imp,
            "total_clicks":      total_clk,
            "global_ctr":        round(total_clk / total_imp * 100, 2) if total_imp else 0.0,
            "top_ads":           top_ads,
            "by_format":         by_format,
            "by_category":       by_category,
            "daily_trend":       daily_trend,
        }
        return Response(GlobalReportSerializer(data).data)


class AdvertiserReportView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            advertiser = Advertiser.objects.get(pk=pk)
        except Advertiser.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Annonceur introuvable.")
        ads       = Ad.objects.filter(advertiser=advertiser)
        total_imp = ads.aggregate(s=Sum("impressions_count"))["s"] or 0
        total_clk = ads.aggregate(s=Sum("clicks_count"))["s"] or 0
        ads_detail = list(ads.values(
            "id", "title", "format", "target_category",
            "status", "start_date", "end_date",
            "impressions_count", "clicks_count",
        ).order_by("-clicks_count"))
        for a in ads_detail:
            imp = a["impressions_count"]
            a["ctr"] = round(a["clicks_count"] / imp * 100, 2) if imp else 0.0
        six_months_ago = timezone.now() - timedelta(days=180)
        monthly_imp = (AdImpression.objects
            .filter(ad__advertiser=advertiser, created_at__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at")).values("month")
            .annotate(count=Count("id")).order_by("month"))
        monthly_clk = (AdClick.objects
            .filter(ad__advertiser=advertiser, created_at__gte=six_months_ago)
            .annotate(month=TruncMonth("created_at")).values("month")
            .annotate(count=Count("id")).order_by("month"))
        imp_map    = {str(r["month"])[:7]: r["count"] for r in monthly_imp}
        clk_map    = {str(r["month"])[:7]: r["count"] for r in monthly_clk}
        all_months = sorted(set(imp_map) | set(clk_map))
        monthly_trend = [
            {"month": m, "impressions": imp_map.get(m, 0), "clicks": clk_map.get(m, 0)}
            for m in all_months
        ]
        data = {
            "advertiser":        advertiser,
            "total_impressions": total_imp,
            "total_clicks":      total_clk,
            "ctr":               round(total_clk / total_imp * 100, 2) if total_imp else 0.0,
            "ads":               ads_detail,
            "monthly_trend":     monthly_trend,
        }
        return Response(AdvertiserReportSerializer(data).data)
