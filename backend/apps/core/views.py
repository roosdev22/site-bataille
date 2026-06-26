# apps/core/views.py
from datetime import timedelta  # ✅ À AJOUTER EN HAUT

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework import status
from django.db.models import Count, Q, Sum
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
import logging

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.models import User
from apps.posts.models import Post
from apps.comments.models import Comment
from apps.reportage.models import Reportage

logger = logging.getLogger(__name__)


class AdminStatsView(APIView):
    """
    GET /api/admin/stats/
    Retourne les statistiques du dashboard admin.
    """
    permission_classes = [IsAdminUser]
    CACHE_TIMEOUT = 120
    
    def get(self, request):
        cache_key = f'admin_stats_{request.user.id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        stats = self._get_stats(request.user)
        cache.set(cache_key, stats, self.CACHE_TIMEOUT)
        
        return Response(stats)
    
    def _get_stats(self, user):
        """Calcule les statistiques"""
        
        if user.role == 'admin' or user.is_staff:
            total_users = User.objects.count()
            total_posts = Post.objects.count()
            total_comments = Comment.objects.count()
            pending_posts = Post.objects.filter(status='pending').count()
            
            total_reportages = Reportage.objects.count()
            published_reportages = Reportage.objects.filter(
                status='published'
            ).count()
            reportage_views = Reportage.objects.aggregate(
                total=Sum('views')
            )['total'] or 0
            
            last_week = timezone.now() - timedelta(days=7)
            new_users_week = User.objects.filter(date_joined__gte=last_week).count()
            new_posts_week = Post.objects.filter(created_at__gte=last_week).count()
        else:
            total_users = None
            total_posts = Post.objects.filter(author=user).count()
            total_comments = Comment.objects.filter(post__author=user).count()
            pending_posts = Post.objects.filter(author=user, status='pending').count()
            
            total_reportages = Reportage.objects.filter(author=user).count()
            published_reportages = Reportage.objects.filter(
                author=user, status='published'
            ).count()
            reportage_views = Reportage.objects.filter(
                author=user
            ).aggregate(total=Sum('views'))['total'] or 0
            
            last_week = timezone.now() - timedelta(days=7)
            new_users_week = None
            new_posts_week = Post.objects.filter(
                author=user, created_at__gte=last_week
            ).count()
        
        data = {
            'counts': {
                'users': total_users,
                'posts': total_posts,
                'comments': total_comments,
                'pending_posts': pending_posts,
                'reportages': total_reportages,
                'published_reportages': published_reportages,
                'reportage_views': reportage_views,
                'gallery_images': 0,
            },
            'recent': {
                'users': new_users_week,
                'posts': new_posts_week,
            },
            'updated_at': timezone.now().isoformat(),
        }
        
        return data


# ═══════════════════════════════════════════════════════════
# ✅ AUTH AVEC COOKIES HTTP-ONLY
# ═══════════════════════════════════════════════════════════

class CookieTokenObtainPairView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Authentifie l'utilisateur et définit les cookies HTTP-only.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # ✅ Helper pour convertir timedelta en secondes
            def get_max_age(value):
                if isinstance(value, timedelta):
                    return int(value.total_seconds())
                return int(value)
            
            # Configuration cohérente pour les cookies
            cookie_config = {
                'httponly': True,
                'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', not settings.DEBUG),
                'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
                'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
                'domain': settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None),
            }
            
            # Access token cookie
            response.set_cookie(
                key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
                value=response.data['access'],
                max_age=get_max_age(settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=60))),
                **cookie_config
            )
            
            # Refresh token cookie
            if 'refresh' in response.data:
                response.set_cookie(
                    key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
                    value=response.data['refresh'],
                    max_age=get_max_age(settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME', timedelta(days=7))),
                    **cookie_config
                )
            
            # ✅ Supprimer les tokens du JSON (par sécurité, ils sont en cookies)
            del response.data['access']
            if 'refresh' in response.data:
                del response.data['refresh']
        
        return response


class CookieLogoutView(APIView):
    """
    POST /api/auth/logout/
    Supprime les cookies d'authentification.
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        response = Response({"detail": "Déconnecté avec succès"})
        
        # Supprimer les cookies avec les mêmes paramètres que lors de leur création
        cookie_config = {
            'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
            'domain': settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
        }
        
        response.delete_cookie(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
            **cookie_config
        )
        response.delete_cookie(
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
            **cookie_config
        )
        
        return response


class CookieTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/token/refresh/
    Rafraîchit le access_token en lisant le refresh_token depuis le cookie.
    """
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        # ✅ Lire le refresh_token depuis le cookie
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token')
        )
        
        # Créer une copie MUTABLE des données
        data = dict(request.data) if request.data else {}
        
        # ✅ Utiliser le token du cookie s'il n'est pas dans le body
        if not data.get('refresh') and refresh_token:
            data['refresh'] = refresh_token
        
        if not data.get('refresh'):
            return Response(
                {"detail": "Refresh token manquant"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ Utiliser le serializer avec les données corrigées
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        
        # ✅ Convertir timedelta en secondes
        def get_max_age(timedelta_value):
            if isinstance(timedelta_value, timedelta):
                return int(timedelta_value.total_seconds())
            return int(timedelta_value)
        
        # Configuration cohérente pour les cookies
        cookie_config = {
            'httponly': True,
            'secure': settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', not settings.DEBUG),
            'samesite': settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
            'path': settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
            'domain': settings.SIMPLE_JWT.get('AUTH_COOKIE_DOMAIN', None),
        }
        
        # ✅ Mettre à jour le cookie access_token
        response.set_cookie(
            key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
            value=serializer.validated_data['access'],
            max_age=get_max_age(settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME', timedelta(minutes=60))),
            **cookie_config
        )
        
        # Supprimer l'access token du JSON response (pour la sécurité)
        del response.data['access']
        
        return response