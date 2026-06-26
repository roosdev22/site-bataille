from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import UserRole

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )

class IsWriter(BasePermission):
    """Autorise writers ET admins."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in (UserRole.ADMIN, UserRole.WRITER)
        )

class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.role == UserRole.ADMIN:
            return True
        return obj == request.user

class IsAdminOrReadOnly(BasePermission):
    """Lecture publique, écriture admin uniquement."""
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )