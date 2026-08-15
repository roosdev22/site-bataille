# apps/reportage/views.py
import uuid

from rest_framework import status, permissions
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import (
    Reportage, ReportageStatus, ReportageView, OptimizedImage, MediaFile
)
from .serializers import (
    ReportageListSerializer,
    ReportageDetailSerializer,
    ReportageWriteSerializer,
    OptimizedImageSerializer,
    OptimizedImageDirectCreateSerializer,   # ← remplace OptimizedImageUploadSerializer
    MediaFileSerializer,
    MediaFileDirectCreateSerializer,        # ← nouveau
)
from .services.storage import SupabaseStorageService


# ═══════════════════════════════════════════════════════════════
#  UPLOAD DIRECT — URL SIGNÉE SUPABASE
# ═══════════════════════════════════════════════════════════════

ALLOWED_BUCKETS = {
    'optimized-images': SupabaseStorageService.BUCKET_OPTIMIZED_IMAGES,
    'media-files': SupabaseStorageService.BUCKET_MEDIA_FILES,
}


class SignedUploadURLView(APIView):
    """
    POST : Génère une URL signée pour permettre au frontend d'uploader
    directement vers Supabase, sans passer par Render.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        bucket_key = request.data.get('bucket')
        filename = request.data.get('filename', '')

        if bucket_key not in ALLOWED_BUCKETS:
            return Response({'error': 'Bucket invalide'}, status=status.HTTP_400_BAD_REQUEST)

        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'bin'
        unique_name = f"{uuid.uuid4()}.{ext}"
        prefix = 'optimized/' if bucket_key == 'optimized-images' else 'media/'
        path = f"{prefix}{unique_name}"

        result = SupabaseStorageService.create_signed_upload_url(
            ALLOWED_BUCKETS[bucket_key], path
        )
        if not result:
            return Response(
                {'error': "Impossible de générer l'URL signée"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response({
            'signed_url': result.get('signed_url') or result.get('signedUrl'),
            'token': result.get('token'),
            'path': path,
        })


# ═══════════════════════════════════════════════════════════════
#  OPTIMIZED IMAGES
# ═══════════════════════════════════════════════════════════════

class OptimizedImageListView(APIView):
    """
    GET  : Liste toutes les images optimisées (AUTHENTIFIÉ)
    POST : Enregistre une image déjà uploadée directement sur Supabase (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Liste toutes les images de l'utilisateur."""
        images = OptimizedImage.objects.filter(uploaded_by=request.user)

        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        total = images.count()
        images = images.order_by('-uploaded_at')[start:end]

        serializer = OptimizedImageSerializer(
            images,
            many=True,
            context={'request': request}
        )
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })

    def post(self, request):
        """Enregistre une image déjà uploadée sur Supabase et déclenche la génération des variantes."""
        serializer = OptimizedImageDirectCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            image = serializer.save(uploaded_by=request.user)
            detail_serializer = OptimizedImageSerializer(
                image,
                context={'request': request}
            )
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        print("ERREURS IMAGE UPLOAD:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OptimizedImageDetailView(APIView):
    """
    GET    : Détail d'une image (AUTHENTIFIÉ)
    PATCH  : Modifier métadonnées (AUTHENTIFIÉ)
    DELETE : Supprimer une image (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, uuid):
        return get_object_or_404(OptimizedImage, uuid=uuid)

    def get(self, request, uuid):
        image = self.get_object(uuid)
        serializer = OptimizedImageSerializer(
            image,
            context={'request': request}
        )
        return Response(serializer.data)

    def patch(self, request, uuid):
        """Mettre à jour les métadonnées (alt_text, caption, credit)."""
        image = self.get_object(uuid)
        serializer = OptimizedImageDirectCreateSerializer(
            image,
            data=request.data,
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            image = serializer.save()
            detail_serializer = OptimizedImageSerializer(
                image,
                context={'request': request}
            )
            return Response(detail_serializer.data)
        print("ERREURS IMAGE PATCH:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, uuid):
        image = self.get_object(uuid)
        image.delete()
        return Response(
            {'message': 'Image supprimée avec succès.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ═══════════════════════════════════════════════════════════════
#  MEDIA FILES (VIDÉOS/AUDIO)
# ═══════════════════════════════════════════════════════════════

class MediaFileListView(APIView):
    """
    GET  : Liste tous les fichiers média (AUTHENTIFIÉ)
    POST : Enregistre un fichier déjà uploadé directement sur Supabase (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Liste paginée des fichiers média."""
        media_files = MediaFile.objects.all()

        media_type = request.query_params.get('media_type')
        if media_type in ['video', 'audio']:
            media_files = media_files.filter(media_type=media_type)

        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        total = media_files.count()
        media_files = media_files.order_by('-uploaded_at')[start:end]

        serializer = MediaFileSerializer(
            media_files,
            many=True,
            context={'request': request}
        )
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })

    def post(self, request):
        """Enregistre un fichier média déjà uploadé sur Supabase."""
        serializer = MediaFileDirectCreateSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            media = serializer.save(uploaded_by=request.user)
            return Response(
                MediaFileSerializer(media, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        print("ERREURS MEDIA UPLOAD:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MediaFileDetailView(APIView):
    """
    GET    : Détail d'un fichier média (AUTHENTIFIÉ)
    PATCH  : Modifier métadonnées (AUTHENTIFIÉ)
    DELETE : Supprimer un fichier (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, media_id):
        return get_object_or_404(MediaFile, id=media_id)

    def get(self, request, media_id):
        media = self.get_object(media_id)
        serializer = MediaFileSerializer(
            media,
            context={'request': request}
        )
        return Response(serializer.data)

    def patch(self, request, media_id):
        """Mettre à jour les métadonnées."""
        media = self.get_object(media_id)
        serializer = MediaFileDirectCreateSerializer(
            media,
            data=request.data,
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            media = serializer.save()
            return Response(
                MediaFileSerializer(media, context={'request': request}).data
            )
        print("ERREURS MEDIA PATCH:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, media_id):
        media = self.get_object(media_id)
        media.delete()
        return Response(
            {'message': 'Fichier média supprimé avec succès.'},
            status=status.HTTP_204_NO_CONTENT
        )


# ═══════════════════════════════════════════════════════════════
#  REPORTAGES (INCHANGÉ — garde MultiPartParser car peut recevoir des blocs JSON imbriqués)
# ═══════════════════════════════════════════════════════════════

class ReportageListView(APIView):
    """
    GET  : Liste tous les reportages (PUBLIC)
    POST : Crée un nouveau reportage (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request):
        if request.user.is_authenticated:
            reportages = Reportage.objects.select_related('author').all()
        else:
            reportages = Reportage.objects.select_related('author').filter(status='published')

        status_filter = request.query_params.get('status')
        if status_filter and request.user.is_authenticated:
            reportages = reportages.filter(status=status_filter)

        featured = request.query_params.get('featured')
        if featured is not None:
            reportages = reportages.filter(featured=featured.lower() == 'true')

        page_size = int(request.query_params.get('page_size', 10))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        total = reportages.count()
        reportages = reportages[start:end]

        serializer = ReportageListSerializer(
            reportages,
            many=True,
            context={'request': request}
        )
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': serializer.data
        })

    def post(self, request):
        """Crée un nouveau reportage avec ses blocs (plus de fichiers ici, que des IDs)."""
        serializer = ReportageWriteSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            reportage = serializer.save()
            detail_serializer = ReportageDetailSerializer(
                reportage,
                context={'request': request}
            )
            return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
        print("ERREURS REPORTAGE POST:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportageDetailView(APIView):
    """
    GET    : Détail complet d'un reportage (PUBLIC si publié)
    PUT    : Modification complète (AUTHENTIFIÉ)
    PATCH  : Modification partielle (AUTHENTIFIÉ)
    DELETE : Supprime un reportage (AUTHENTIFIÉ)
    """
    parser_classes = [JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_object(self, slug):
        return get_object_or_404(
            Reportage.objects.prefetch_related('blocs__gallery_images', 'blocs__timeline_events'),
            slug=slug
        )

    def get(self, request, slug):
        reportage = self.get_object(slug)

        if not request.user.is_authenticated and reportage.status != 'published':
            return Response(
                {'detail': 'Reportage non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ReportageDetailSerializer(
            reportage,
            context={'request': request}
        )
        return Response(serializer.data)

    def put(self, request, slug):
        reportage = self.get_object(slug)
        serializer = ReportageWriteSerializer(
            reportage,
            data=request.data,
            context={'request': request},
            partial=False
        )
        if serializer.is_valid():
            reportage = serializer.save()
            detail_serializer = ReportageDetailSerializer(
                reportage,
                context={'request': request}
            )
            return Response(detail_serializer.data)
        print("ERREURS REPORTAGE PUT:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug):
        reportage = self.get_object(slug)
        serializer = ReportageWriteSerializer(
            reportage,
            data=request.data,
            context={'request': request},
            partial=True
        )
        if serializer.is_valid():
            reportage = serializer.save()
            detail_serializer = ReportageDetailSerializer(
                reportage,
                context={'request': request}
            )
            return Response(detail_serializer.data)
        print("ERREURS REPORTAGE PATCH:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug):
        reportage = self.get_object(slug)
        reportage.delete()
        return Response(
            {'message': 'Reportage supprimé avec succès.'},
            status=status.HTTP_204_NO_CONTENT
        )


class ReportagePublishView(APIView):
    """
    POST : Publie/Dépublie un reportage (AUTHENTIFIÉ)
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, slug):
        reportage = get_object_or_404(Reportage, slug=slug)
        action = request.data.get('action', 'publish')

        if action == 'publish':
            reportage.status = ReportageStatus.PUBLISHED
            message = 'Reportage publié avec succès.'
        elif action == 'unpublish':
            reportage.status = ReportageStatus.DRAFT
            message = 'Reportage dépublié avec succès.'
        else:
            return Response(
                {'error': "Action invalide. Utilisez 'publish' ou 'unpublish'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        reportage.save()
        return Response({
            'message': message,
            'status': reportage.status
        })


class ReportageRecordView(APIView):
    """
    POST : Enregistre une vue unique pour un reportage (PUBLIC)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, slug):
        reportage = get_object_or_404(Reportage, slug=slug)
        ip = self.get_client_ip(request)
        is_new = reportage.record_view(ip)

        return Response({
            'views_count': reportage.views_count,
            'is_new_view': is_new
        })

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ReportageStatsView(APIView):
    """
    GET : Retourne les statistiques des reportages (AUTHENTIFIÉ)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total = Reportage.objects.count()
        published = Reportage.objects.filter(status=ReportageStatus.PUBLISHED).count()
        draft = Reportage.objects.filter(status=ReportageStatus.DRAFT).count()
        review = Reportage.objects.filter(status=ReportageStatus.REVIEW).count()

        total_views = ReportageView.objects.count()

        return Response({
            'total': total,
            'published': published,
            'draft': draft,
            'review': review,
            'total_views': total_views,
        })