from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import CommentStatus


class IsCommentAuthor(BasePermission):
    message = "Vous n'êtes pas l'auteur de ce commentaire."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author == request.user


class CanEditComment(BasePermission):
    message = "Ce commentaire ne peut plus être modifié."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_admin:
            return True
        return (
            obj.author == request.user
            and obj.status in (CommentStatus.APPROVED, CommentStatus.PENDING)
        )


class CanDeleteComment(BasePermission):
    message = "Vous ne pouvez pas supprimer ce commentaire."

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return obj.author == request.user and not obj.is_deleted


class IsAdminForComments(BasePermission):
    message = "Accès réservé aux administrateurs."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin