
from django.urls import path, include
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
    # Public
    path("posts/",                PublicPostListView.as_view(),   name="public-post-list"),
    path("posts/<slug:slug>/",    PublicPostDetailView.as_view(), name="public-post-detail"),
    path("tags/",                 TagListView.as_view(),          name="tag-list"),

    # Writer (authentifié)
    path("writer/", include(writer_router.urls)),
    path("admin/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("admin/", include(admin_router.urls)),
]
