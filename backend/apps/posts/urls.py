from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PublicPostListView,
    PublicPostDetailView,
    WriterPostViewSet,
    AdminPostViewSet,
    TagListView,
    DashboardView,
)

# ── Routers ───────────────────────────────────────────────────────────────────

writer_router = DefaultRouter()
writer_router.register(r"posts", WriterPostViewSet, basename="writer-posts")

admin_router = DefaultRouter()
admin_router.register(r"posts", AdminPostViewSet, basename="admin-posts")

# ── URL patterns ──────────────────────────────────────────────────────────────

urlpatterns = [
    # Public — slash optionnel : tolère le proxy Vercel
    re_path(r"^posts/?$", PublicPostListView.as_view(), name="public-post-list"),
    re_path(r"^posts/(?P<slug>[-\w]+)/?$", PublicPostDetailView.as_view(), name="public-post-detail"),
    re_path(r"^tags/?$", TagListView.as_view(), name="tag-list"),

    # Writer (authentifié)
    path("writer/", include(writer_router.urls)),
    path("admin/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("admin/", include(admin_router.urls)),
]