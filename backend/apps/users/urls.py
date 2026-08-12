# apps/users/urls.py

from django.urls import path, re_path, include
from apps.core.routers import OptionalSlashRouter
from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    AuthorListView,
    AdminUserViewSet,
)

# Router pour le ViewSet
router = OptionalSlashRouter()
router.register(r'admin/users', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    re_path(r'^auth/register/?$', RegisterView.as_view(), name='register'),

    re_path(r'^users/me/?$', ProfileView.as_view(), name='user-profile'),
    re_path(r'^users/me/password/?$', ChangePasswordView.as_view(), name='change-password'),
    re_path(r'^authors/?$', AuthorListView.as_view(), name='author-list'),

    path('', include(router.urls)),
]