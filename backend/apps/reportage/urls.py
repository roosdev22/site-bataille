from django.urls import re_path
from .views import (
    # Upload direct
    SignedUploadURLView,
    # Reportages
    ReportageListView,
    ReportageDetailView,
    ReportagePublishView,
    ReportageRecordView,
    ReportageStatsView,
    # Images optimisées
    OptimizedImageListView,
    OptimizedImageDetailView,
    MediaFileListView,
    MediaFileDetailView,
)

urlpatterns = [
    # UPLOAD DIRECT — génère une URL signée Supabase (le fichier ne passe jamais par Render)
    re_path(r'^signed-upload-url/?$',
            SignedUploadURLView.as_view(),
            name='signed-upload-url'),

    # MEDIA FILES (VIDÉOS/AUDIO) — slash optionnel : tolère le proxy Vercel
    re_path(r'^media-files/?$',
            MediaFileListView.as_view(),
            name='media-file-list'),

    re_path(r'^media-files/(?P<media_id>[0-9a-fA-F-]+)/?$',
            MediaFileDetailView.as_view(),
            name='media-file-detail'),

    # IMAGES OPTIMISÉES
    re_path(r'^optimized-images/?$',
            OptimizedImageListView.as_view(),
            name='optimized-image-list'),

    re_path(r'^optimized-images/(?P<uuid>[0-9a-fA-F-]+)/?$',
            OptimizedImageDetailView.as_view(),
            name='optimized-image-detail'),

    # REPORTAGES
    re_path(r'^reportages/?$',
            ReportageListView.as_view(),
            name='reportage-list'),

    re_path(r'^stats/?$',
            ReportageStatsView.as_view(),
            name='reportage-stats'),

    re_path(r'^reportages/(?P<slug>[-\w]+)/?$',
            ReportageDetailView.as_view(),
            name='reportage-detail'),

    re_path(r'^reportages/(?P<slug>[-\w]+)/publish/?$',
            ReportagePublishView.as_view(),
            name='reportage-publish'),

    re_path(r'^reportages/(?P<slug>[-\w]+)/record-view/?$',
            ReportageRecordView.as_view(),
            name='reportage-record-view'),
]