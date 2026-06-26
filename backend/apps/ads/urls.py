from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AdSlotView,
    AdImpressionView,
    AdClickView,
    AdvertiserViewSet,
    AdAdminViewSet,
    GlobalAdReportView,
    AdvertiserReportView,
)

# ── Routers ──
admin_router = DefaultRouter()
admin_router.register(r"advertisers", AdvertiserViewSet, basename="advertisers")
admin_router.register(r"ads", AdAdminViewSet, basename="admin-ads")

# ── URL patterns ──
urlpatterns = [
    #  PUBLIC ENDPOINTS (pas d'authentification)
    path("slot/", AdSlotView.as_view(), name="ad-slot"),  # ← CHANGE: ads/ → slot/
    path("<uuid:pk>/impression/", AdImpressionView.as_view(), name="ad-impression"),
    path("<uuid:pk>/click/", AdClickView.as_view(), name="ad-click"),

    #  ADMIN ENDPOINTS
    path("admin/", include(admin_router.urls)),

    #  REPORTS
    path("admin/reports/global/", GlobalAdReportView.as_view(), name="ad-report-global"),
    path("admin/advertisers/<uuid:pk>/report/", AdvertiserReportView.as_view(), name="ad-report-advertiser"),
]