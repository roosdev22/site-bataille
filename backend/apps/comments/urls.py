from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    PostCommentListView,
    PostCommentCreateView,
    CommentDetailView,
    CommentLikeView,
    AdminCommentViewSet,
)

admin_router = DefaultRouter()
admin_router.register(r"comments", AdminCommentViewSet, basename="admin-comments")

urlpatterns = [
    # ── Public / authentifié ──────────────────────────────────────────────

    # Liste des commentaires d'un article
    path(
        "posts/<slug:post_slug>/comments/",
        PostCommentListView.as_view(),
        name="post-comment-list",
    ),
    # Créer un commentaire (ou une réponse)
    path(
        "posts/<slug:post_slug>/comments/create/",
        PostCommentCreateView.as_view(),
        name="post-comment-create",
    ),

    # Modifier / supprimer un commentaire
    path(
        "comments/<uuid:pk>/",
        CommentDetailView.as_view(),
        name="comment-detail",
    ),

    # Like / Unlike
    path(
        "comments/<uuid:pk>/like/",
        CommentLikeView.as_view(),
        name="comment-like",
    ),

    # ── Admin ─────────────────────────────────────────────────────────────
    path("admin/", include(admin_router.urls)),
]