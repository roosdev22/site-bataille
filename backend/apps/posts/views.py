from django.db import transaction
from django.utils import timezone
from django.utils.translation import activate
from django.db.models import F
from rest_framework.views import APIView  
from rest_framework import generics, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.viewsets import ModelViewSet

from django_filters.rest_framework import DjangoFilterBackend

from .models import Post, PostStatus, PostView, Tag
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    PostWriteSerializer,
    PostPublishSerializer,
    PostRejectSerializer,
    TagSerializer,
)
from apps.posts.permissions import CanEditPost, CanSubmitPost, CanPublishPost
from .filters import PostFilter


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _get_client_ip(request) -> str:
    """Récupère l'IP du client"""
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "0.0.0.0")


def _get_requested_language(request) -> str:
    """
      Récupère la langue demandée du query param
    Défaut: 'fr' si non spécifié
    """
    return request.query_params.get('language', 'fr')


def _setup_serializer_context(request) -> dict:
    """
      Configure le contexte du serializer avec la langue
    Utilisé dans tous les views pour passer la langue aux serializers
    """
    language = _get_requested_language(request)
    context = {'request': request, 'language': language}
    activate(language)  # Active Django i18n
    return context


def _record_view(post: Post, request) -> None:
    """
    Enregistre une vue unique par IP + post.
    Utilise get_or_create pour être idempotent, puis incrémente
    le compteur dénormalisé avec F() pour éviter les race conditions.
    """
    ip = _get_client_ip(request)
    ua = request.META.get("HTTP_USER_AGENT", "")[:300]

    created = PostView.objects.get_or_create(
        post=post,
        ip_address=ip,
        defaults={"user_agent": ua},
    )[1]

    if created:
        Post.objects.filter(pk=post.pk).update(views_count=F("views_count") + 1)



# ─────────────────────────────────────────────
# Public — lecture (Multilingue)
# ─────────────────────────────────────────────

class PublicPostListView(generics.ListAPIView):
    """
    GET /api/posts/?language=en
    
    Articles publiés, filtrables par category, tag, search.
    Accessible sans authentification.
    ✨ Support multilingue : language=fr|en|es|ht
    """
    serializer_class   = PostListSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = PostFilter
    search_fields      = ["title", "excerpt", "content", "tags__name"]
    ordering_fields    = ["published_at", "views_count", "title"]
    ordering           = ["-published_at"]

    def get_queryset(self):
        return (
            Post.objects
            .published()
            .with_relations()
        )
    
    def get_serializer_context(self):
        """✨ Ajoute la langue au contexte"""
        return _setup_serializer_context(self.request)


class PublicPostDetailView(generics.RetrieveAPIView):
    """
    GET /api/posts/<slug>/?language=en
    
    Détail d'un article publié + enregistrement de la vue.
    ✨ Support multilingue
    """
    serializer_class   = PostDetailSerializer
    permission_classes = [AllowAny]
    throttle_classes   = [AnonRateThrottle]
    lookup_field       = "slug"

    def get_queryset(self):
        return Post.objects.published().with_relations()
    
    def get_serializer_context(self):
        """✨ Ajoute la langue au contexte"""
        return _setup_serializer_context(self.request)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        _record_view(instance, request)
        return Response(self.get_serializer(instance).data)


# ─────────────────────────────────────────────
# Writer — gestion de ses propres articles (Multilingue)
# ─────────────────────────────────────────────

class WriterPostViewSet(ModelViewSet):
    """
    /api/writer/posts/?language=en

    Un writer voit et gère UNIQUEMENT ses propres articles.
    Actions :
      POST   /{id}/submit/   → soumet pour relecture (DRAFT → PENDING)
      POST   /{id}/retract/  → retire la soumission  (PENDING → DRAFT)
    
    ✨ Support multilingue sur tous les endpoints
    """
    permission_classes = [IsAuthenticated]
    throttle_classes   = [UserRateThrottle]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = PostFilter
    search_fields      = ["title", "excerpt"]
    ordering_fields    = ["created_at", "updated_at", "status"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        # Isolation stricte : le writer ne voit QUE ses articles
        return (
            Post.objects
            .by_author(self.request.user)
            .with_relations()
        )

    def get_serializer_class(self):
        if self.action in ("list",):
            return PostListSerializer
        if self.action in ("retrieve",):
            return PostDetailSerializer
        return PostWriteSerializer
    
    def get_serializer_context(self):
        """✨ Ajoute la langue au contexte"""
        return _setup_serializer_context(self.request)

    def get_permissions(self):
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), CanEditPost()]
        if self.action == "destroy":
            return [IsAuthenticated(), CanEditPost()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # L'auteur est forcé côté serveur, jamais fourni par le client
        # Les signaux django-modeltranslation traduisent automatiquement
        serializer.save(author=self.request.user)

    def perform_destroy(self, instance):
        if not instance.can_be_edited:
            raise PermissionDenied(
                "Seuls les brouillons et articles rejetés peuvent être supprimés."
            )
        instance.delete()

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated, CanSubmitPost])
    def submit(self, request, pk=None):
        """
        DRAFT / REJECTED → PENDING
        POST /api/writer/posts/{id}/submit/
        """
        post = self.get_object()
        post.status = PostStatus.PENDING
        post.rejection_note = ""
        post.save(update_fields=["status", "rejection_note", "updated_at"])
        return Response({"detail": "Article soumis pour relecture."})

    @action(detail=True, methods=["post"])
    def retract(self, request, pk=None):
        """
        PENDING → DRAFT (le writer reprend la main)
        POST /api/writer/posts/{id}/retract/
        """
        post = self.get_object()
        if post.status != PostStatus.PENDING:
            raise ValidationError("Seuls les articles en attente peuvent être retirés.")
        post.status = PostStatus.DRAFT
        post.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Article repassé en brouillon."})


# ─────────────────────────────────────────────
# Admin — gestion complète (Multilingue)
# ─────────────────────────────────────────────

class AdminPostViewSet(ModelViewSet):
    """
    /api/admin/posts/?language=en

    Accès complet. Actions supplémentaires :
      POST /{id}/publish/  → publie l'article
      POST /{id}/reject/   → rejette avec motif obligatoire
      POST /{id}/archive/  → archive
    
    ✨ Support multilingue sur tous les endpoints
    """
    permission_classes = [IsAuthenticated, CanPublishPost]
    throttle_classes   = [UserRateThrottle]
    filter_backends    = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class    = PostFilter
    search_fields      = ["title", "excerpt", "author__email", "author__first_name"]
    ordering_fields    = ["created_at", "published_at", "views_count", "status"]
    ordering           = ["-created_at"]

    def get_queryset(self):
        return Post.objects.all().with_relations()

    def get_serializer_class(self):
        if self.action == "list":
            return PostListSerializer
        if self.action == "retrieve":
            return PostDetailSerializer
        return PostWriteSerializer
    
    def get_serializer_context(self):
        """✨ Ajoute la langue au contexte"""
        return _setup_serializer_context(self.request)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """
        PENDING → PUBLISHED. Accepte une date de publication optionnelle.
        POST /api/admin/posts/{id}/publish/?language=en
        """
        post = self.get_object()
        if post.status not in (PostStatus.PENDING, PostStatus.DRAFT):
            raise ValidationError("Seuls les articles en attente ou brouillon peuvent être publiés.")

        ser = PostPublishSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        with transaction.atomic():
            post.status       = PostStatus.PUBLISHED
            post.published_at = ser.validated_data.get("published_at") or timezone.now()
            post.rejection_note = ""
            post.save(update_fields=["status", "published_at", "rejection_note", "updated_at"])

        return Response({"detail": f"Article « {post.title} » publié."})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        """
        PENDING → REJECTED avec motif.
        POST /api/admin/posts/{id}/reject/?language=en
        """
        post = self.get_object()
        if post.status != PostStatus.PENDING:
            raise ValidationError("Seuls les articles en attente peuvent être rejetés.")

        ser = PostRejectSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        post.status         = PostStatus.REJECTED
        post.rejection_note = ser.validated_data["rejection_note"]
        post.save(update_fields=["status", "rejection_note", "updated_at"])

        return Response({"detail": "Article rejeté. Le writer a été notifié."})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """
        PUBLISHED → ARCHIVED.
        POST /api/admin/posts/{id}/archive/?language=en
        """
        post = self.get_object()
        if post.status != PostStatus.PUBLISHED:
            raise ValidationError("Seuls les articles publiés peuvent être archivés.")
        post.status = PostStatus.ARCHIVED
        post.save(update_fields=["status", "updated_at"])
        return Response({"detail": "Article archivé."})


# ─────────────────────────────────────────────
# Tags (public + admin)
# ─────────────────────────────────────────────

class TagListView(generics.ListAPIView):
    """GET /api/tags/ — liste publique des tags."""
    queryset           = Tag.objects.all()
    serializer_class   = TagSerializer
    permission_classes = [AllowAny]
    pagination_class   = None  # tous les tags d'un coup, liste courte


# ─────────────────────────────────────────────
# Dashboard (Admin)
# ─────────────────────────────────────────────

class DashboardView(APIView):
    """
    GET /api/admin/dashboard/?language=en
    
    Dashboard avec statistiques globales
    ✨ Support multilingue
    """
    permission_classes = [IsAuthenticated, CanPublishPost]

    def get(self, request):
        from django.db.models import Sum
        
        # Récupère la langue pour le contexte
        context = _setup_serializer_context(request)

        recent_posts = (
            Post.objects
            .select_related("author")
            .prefetch_related("tags")
            .order_by("-created_at")[:5]
        )

        return Response({
            "stats": {
                "total_posts":     Post.objects.count(),
                "total_published": Post.objects.filter(status=PostStatus.PUBLISHED).count(),
                "total_drafts":    Post.objects.filter(status=PostStatus.DRAFT).count(),
                "total_pending":   Post.objects.filter(status=PostStatus.PENDING).count(),
                "total_views":     Post.objects.aggregate(v=Sum("views_count"))["v"] or 0,
                "posts_growth":    0,
                "views_growth":    0,
            },
            "recent_posts":  PostListSerializer(recent_posts, many=True, context=context).data,
            "pending_posts": [],
            "user_stats":    {
                "total_users": 0,
                "total_writers": 0,
                "total_admins": 0,
                "new_this_month": 0
            },
            "comment_stats": {
                "total_pending": 0,
                "total_comments": 0
            },
            "ad_stats":      {
                "active_ads": 0,
                "total_impressions": 0
            },
        })