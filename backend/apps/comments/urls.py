from django.urls import path, include
from apps.core.routers import OptionalSlashRouter

from .views import (
    PostCommentListView,
    PostCommentCreateView,
    CommentDetailView,
    CommentLikeView,
    AdminCommentViewSet,
)

admin_router = OptionalSlashRouter()
admin_router.register(r"comments", AdminCommentViewSet, basename="admin-comments")

urlpatterns = [
    path(
        "posts/<slug:post_slug>/comments/",
        PostCommentListView.as_view(),
        name="post-comment-list",
    ),
    path(
        "posts/<slug:post_slug>/comments/create/",
        PostCommentCreateView.as_view(),
        name="post-comment-create",
    ),
    path(
        "comments/<uuid:pk>/",
        CommentDetailView.as_view(),
        name="comment-detail",
    ),
    path(
        "comments/<uuid:pk>/like/",
        CommentLikeView.as_view(),
        name="comment-like",
    ),
    path("admin/", include(admin_router.urls)),
]