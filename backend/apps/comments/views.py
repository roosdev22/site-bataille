from django.db import transaction
from django.db.models import F
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework import mixins

from .models import Comment, CommentLike, CommentStatus
from .serializers import (
    CommentSerializer,
    CommentCreateSerializer,
    CommentUpdateSerializer,
    CommentRejectSerializer,
    AdminCommentSerializer,
)
from .permissions import CanEditComment, CanDeleteComment, IsAdminForComments
from apps.posts.models import Post, PostStatus


# ─────────────────────────────────────────────
# Helper — récupère le post publié ou 404
# ─────────────────────────────────────────────

def _get_published_post(post_slug: str) -> Post:
    return get_object_or_404(Post, slug=post_slug, status=PostStatus.PUBLISHED)


# ─────────────────────────────────────────────
# Commentaires publics d'un article
# GET  /api/posts/<slug>/comments/
# ─────────────────────────────────────────────

class PostCommentListView(generics.ListAPIView):
    """
    Liste les commentaires approuvés d'un article (structure arborescente).
    Seuls les commentaires racines sont retournés ; leurs réponses
    sont imbriquées dans le champ `replies`.
    """
    serializer_class   = CommentSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]

    def get_queryset(self):
        post = _get_published_post(self.kwargs["post_slug"])
        return (
            Comment.objects
            .approved()
            .for_post(post.id)
            .roots()
            .with_relations()
        )


# ─────────────────────────────────────────────
# Créer un commentaire / une réponse
# POST /api/posts/<slug>/comments/
# ─────────────────────────────────────────────

class PostCommentCreateView(generics.CreateAPIView):
    """
    Crée un commentaire ou une réponse.
    L'auteur est injecté côté serveur.
    Par défaut : statut PENDING (modération manuelle).
    """
    serializer_class   = CommentCreateSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes   = [UserRateThrottle]

    def get_serializer_context(self):
        ctx  = super().get_serializer_context()
        post = _get_published_post(self.kwargs["post_slug"])
        ctx["post"] = post
        return ctx

    def perform_create(self, serializer):
        post   = _get_published_post(self.kwargs["post_slug"])
        parent = serializer.validated_data.get("parent")

        with transaction.atomic():
            comment = serializer.save(
                author=self.request.user,
                post=post,
                # Si l'auteur est admin/writer du blog → auto-approuvé
                status=(
                    CommentStatus.APPROVED
                    if self.request.user.is_admin or self.request.user.is_writer
                    else CommentStatus.PENDING
                ),
            )
            # Met à jour le compteur replies_count du parent
            if parent:
                Comment.objects.filter(pk=parent.pk).update(
                    replies_count=F("replies_count") + 1
                )


# ─────────────────────────────────────────────
# Modifier / supprimer son propre commentaire
# PATCH  /api/comments/<id>/
# DELETE /api/comments/<id>/
# ─────────────────────────────────────────────

class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → retourne le commentaire (public si approuvé).
    PATCH  → l'auteur modifie son commentaire.
    DELETE → soft-delete (contenu masqué, structure conservée).
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.select_related("author", "post").prefetch_related("likes", "replies")

    def get_serializer_class(self):
        if self.request.method in ("PATCH", "PUT"):
            return CommentUpdateSerializer
        return CommentSerializer

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT"):
            return [IsAuthenticated(), CanEditComment()]
        if self.request.method == "DELETE":
            return [IsAuthenticated(), CanDeleteComment()]
        return [AllowAny()]

    def update(self, request, *args, **kwargs):
        comment = self.get_object()
        # Re-passe en PENDING après modification (re-modération)
        serializer = self.get_serializer(comment, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            status=CommentStatus.PENDING if not request.user.is_admin else comment.status
        )
        return Response(CommentSerializer(comment, context={"request": request}).data)

    def destroy(self, request, *args, **kwargs):
        comment = self.get_object()
        comment.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─────────────────────────────────────────────
# Like / Unlike
# POST /api/comments/<id>/like/
# ─────────────────────────────────────────────

class CommentLikeView(generics.GenericAPIView):
    """
    Toggle like : like si absent, unlike si présent.
    Retourne { liked: bool, likes_count: int }.
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [UserRateThrottle]

    def get_object(self):
        return get_object_or_404(
            Comment.objects.approved(),
            pk=self.kwargs["pk"],
        )

    def post(self, request, *args, **kwargs):
        comment = self.get_object()

        with transaction.atomic():
            like, created = CommentLike.objects.get_or_create(
                comment=comment,
                user=request.user,
            )
            if created:
                Comment.objects.filter(pk=comment.pk).update(
                    likes_count=F("likes_count") + 1
                )
            else:
                like.delete()
                Comment.objects.filter(pk=comment.pk).update(
                    likes_count=F("likes_count") - 1
                )

        comment.refresh_from_db(fields=["likes_count"])
        return Response({
            "liked":       created,
            "likes_count": comment.likes_count,
        })


# ─────────────────────────────────────────────
# Admin — modération
# /api/admin/comments/
# ─────────────────────────────────────────────

class AdminCommentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    GenericViewSet,
):
    """
    Modération complète des commentaires.

    Actions supplémentaires :
      POST /{id}/approve/   → PENDING → APPROVED
      POST /{id}/reject/    → PENDING → REJECTED (motif optionnel)
      POST /{id}/restore/   → DELETED → APPROVED
    """
    serializer_class   = AdminCommentSerializer
    permission_classes = [IsAuthenticated, IsAdminForComments]
    throttle_classes   = [UserRateThrottle]

    def get_queryset(self):
        qs = (
            Comment.objects
            .all()
            .select_related("author", "post")
        )
        # Filtre par statut via ?status=pending
        s = self.request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        # Filtre par post via ?post=<uuid>
        post_id = self.request.query_params.get("post")
        if post_id:
            qs = qs.filter(post_id=post_id)
        return qs.order_by("-created_at")

    def destroy(self, request, *args, **kwargs):
        """Hard delete réservé aux admins."""
        comment = self.get_object()
        # Décrémente replies_count du parent si c'est une réponse
        if comment.parent_id:
            Comment.objects.filter(pk=comment.parent_id).update(
                replies_count=F("replies_count") - 1
            )
        comment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        comment = self.get_object()
        if comment.status == CommentStatus.APPROVED:
            raise ValidationError("Ce commentaire est déjà approuvé.")
        comment.status = CommentStatus.APPROVED
        comment.rejection_note = ""
        comment.save(update_fields=["status", "rejection_note", "updated_at"])
        return Response({"detail": "Commentaire approuvé."})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        comment = self.get_object()
        ser = CommentRejectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        comment.status = CommentStatus.REJECTED
        comment.rejection_note = ser.validated_data.get("rejection_note", "")
        comment.save(update_fields=["status", "rejection_note", "updated_at"])
        return Response({"detail": "Commentaire rejeté."})

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Restaure un commentaire supprimé (soft-delete)."""
        comment = self.get_object()
        if comment.status != CommentStatus.DELETED:
            raise ValidationError("Seuls les commentaires supprimés peuvent être restaurés.")
        comment.status     = CommentStatus.APPROVED
        comment.deleted_at = None
        comment.body       = ""   # le contenu est définitivement perdu, l'admin doit le resaisir
        comment.save(update_fields=["status", "deleted_at", "body", "updated_at"])
        return Response({"detail": "Commentaire restauré."})