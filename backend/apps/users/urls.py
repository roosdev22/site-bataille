# apps/users/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # ✅ ENLEVÉ : CustomTokenObtainPairView, logout_view, LoginView
    RegisterView,
    ProfileView,
    ChangePasswordView,
    AuthorListView,
    AdminUserViewSet,
)

# Router pour le ViewSet
router = DefaultRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    # ✅ AUTHENTICATION - Maintenant dans config/urls.py
    path('auth/register/', RegisterView.as_view(), name='register'),
    
    # USER MANAGEMENT
    path('users/me/', ProfileView.as_view(), name='user-profile'),
    path('users/me/password/', ChangePasswordView.as_view(), name='change-password'),
    path('authors/', AuthorListView.as_view(), name='author-list'),
    
    # ADMIN ROUTES (via router)
    path('', include(router.urls)),
]