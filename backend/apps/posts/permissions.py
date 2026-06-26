from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import PostStatus


class IsPostAuthor(BasePermission):
    """L'utilisateur est l'auteur de l'article."""
    message = "Vous n'êtes pas l'auteur de cet article."

    def has_object_permission(self, request, view, obj):
        return obj.author == request.user


class CanEditPost(BasePermission):
    """
    Un writer peut modifier son article uniquement s'il est
    en DRAFT ou REJECTED. Un admin peut toujours modifier.
    """
    message = "Cet article ne peut plus être modifié dans son état actuel."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.is_admin:
            return True
        return obj.author == request.user and obj.can_be_edited


class CanSubmitPost(BasePermission):
    """
    Un writer peut soumettre pour relecture uniquement ses
    propres articles en DRAFT ou REJECTED.
    """
    message = "Vous ne pouvez pas soumettre cet article."

    def has_object_permission(self, request, view, obj):
        if request.user.is_admin:
            return True
        return (
            obj.author == request.user
            and obj.status in (PostStatus.DRAFT, PostStatus.REJECTED)
        )


class CanPublishPost(BasePermission):
    """Seul un admin peut publier / rejeter / archiver un article."""
    message = "Seul un administrateur peut publier des articles."

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin