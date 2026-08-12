from django.urls import path, re_path, include
from apps.core.routers import OptionalSlashRouter          # ← changé

from .views import (
    PublicPostListView,
    PublicPostDetailView,
    WriterPostViewSet,
    AdminPostViewSet,
    TagListView,
    DashboardView,
)


writer_router = OptionalSlashRouter()                        # ← changé
writer_router.register(r"posts", WriterPostViewSet, basename="writer-posts")

admin_router = OptionalSlashRouter()                          # ← changé
admin_router.register(r"posts", AdminPostViewSet, basename="admin-posts")


urlpatterns = [
    re_path(r"^posts/?$", PublicPostListView.as_view(), name="public-post-list"),
    re_path(r"^posts/(?P<slug>[-\w]+)/?$", PublicPostDetailView.as_view(), name="public-post-detail"),
    re_path(r"^tags/?$", TagListView.as_view(), name="tag-list"),

    path("writer/", include(writer_router.urls)),
    path("admin/dashboard/", DashboardView.as_view(), name="dashboard"),
    path("admin/", include(admin_router.urls)),
]