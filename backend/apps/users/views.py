# apps/users/views.py
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated

from .permissions import IsAdmin
from .serializers import (
    UserSerializer,
    UserPublicSerializer,
    RegisterSerializer,
    AdminUserSerializer,
    ChangePasswordSerializer,
)

User = get_user_model()


# ============================================
# USER REGISTRATION & AUTHENTICATION
# ============================================

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/ — Inscription d'un nouvel écrivain.
    """
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=status.HTTP_201_CREATED,
        )


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/users/me/ — Profil de l'utilisateur connecté.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    PATCH /api/users/me/password/ — Changement de mot de passe.
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"old_password": "Mot de passe actuel incorrect."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save()
        return Response({"detail": "Mot de passe modifié avec succès."})


class AuthorListView(generics.ListAPIView):
    """
    GET /api/authors/ — Liste publique des auteurs du blog.
    """
    serializer_class = UserPublicSerializer
    permission_classes = [AllowAny]
    queryset = User.objects.filter(is_active=True)


# ============================================
# ADMIN ONLY - User Management
# ============================================

class AdminUserViewSet(viewsets.ModelViewSet):
    """
    /api/admin/users/ — CRUD complet sur les comptes (Admin uniquement)
    
    Actions supplémentaires:
      POST /api/admin/users/{id}/activate/   → Active un compte
      POST /api/admin/users/{id}/deactivate/ → Désactive un compte
      POST /api/admin/users/{id}/promote/    → Passe en admin
      POST /api/admin/users/{id}/demote/     → Repasse en writer
    """
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    queryset = User.objects.all().order_by("-date_joined")

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({"detail": f"{user.get_full_name()} est maintenant actif."})

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "Impossible de désactiver votre propre compte."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.is_active = False
        user.save()
        return Response({"detail": f"{user.get_full_name()} a été désactivé."})

    @action(detail=True, methods=["post"])
    def promote(self, request, pk=None):
        user = self.get_object()
        user.role = "admin"
        user.is_staff = True
        user.save()
        return Response({"detail": f"{user.get_full_name()} est maintenant administrateur."})

    @action(detail=True, methods=["post"])
    def demote(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response(
                {"detail": "Impossible de rétrograder votre propre compte."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        user.role = "writer"
        user.is_staff = False
        user.save()
        return Response({"detail": f"{user.get_full_name()} est maintenant écrivain."})