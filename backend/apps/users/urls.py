# apps/users/urls.py

from django.urls import path, re_path, include
from rest_framework.routers import DefaultRouter
from .views import (
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
    #  AUTHENTICATION — slash optionnel : tolère le proxy Vercel
    re_path(r'^auth/register/?$', RegisterView.as_view(), name='register'),

    # USER MANAGEMENT
    re_path(r'^users/me/?$', ProfileView.as_view(), name='user-profile'),
    re_path(r'^users/me/password/?$', ChangePasswordView.as_view(), name='change-password'),
    re_path(r'^authors/?$', AuthorListView.as_view(), name='author-list'),

    # ADMIN ROUTES (via router)
    path('', include(router.urls)),
]