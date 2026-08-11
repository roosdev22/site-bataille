from django.urls import path, re_path, include
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

#  Routers 
admin_router = DefaultRouter(trailing_slash='/?')
admin_router.register(r"advertisers", AdvertiserViewSet, basename="advertisers")
admin_router.register(r"ads", AdAdminViewSet, basename="admin-ads")

#  URL patterns 
urlpatterns = [
    #  PUBLIC ENDPOINTS (pas d'authentification) — slash optionnel : tolère le proxy Vercel
    re_path(r"^slot/?$", AdSlotView.as_view(), name="ad-slot"),
    re_path(r"^(?P<pk>[0-9a-fA-F-]+)/impression/?$", AdImpressionView.as_view(), name="ad-impression"),
    re_path(r"^(?P<pk>[0-9a-fA-F-]+)/click/?$", AdClickView.as_view(), name="ad-click"),

    #  ADMIN ENDPOINTS
    path("admin/", include(admin_router.urls)),

    #  REPORTS
    path("admin/reports/global/", GlobalAdReportView.as_view(), name="ad-report-global"),
    path("admin/advertisers/<uuid:pk>/report/", AdvertiserReportView.as_view(), name="ad-report-advertiser"),
]