from django.urls import path
from .views import (
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
    # ───────────────────────────────────────────────────────────
    # MEDIA FILES (VIDÉOS/AUDIO) AJOUTE CES ROUTES
    # ───────────────────────────────────────────────────────────
    path('media-files/',
         MediaFileListView.as_view(),
         name='media-file-list'),
    
    path('media-files/<uuid:media_id>/',
         MediaFileDetailView.as_view(),
         name='media-file-detail'),

    # ───────────────────────────────────────────────────────────
    # IMAGES OPTIMISÉES
    # ───────────────────────────────────────────────────────────
    path('optimized-images/',
         OptimizedImageListView.as_view(),
         name='optimized-image-list'),
    
    path('optimized-images/<uuid:uuid>/',
         OptimizedImageDetailView.as_view(),
         name='optimized-image-detail'),

    # ───────────────────────────────────────────────────────────
    # REPORTAGES
    # ───────────────────────────────────────────────────────────
    path('reportages/',
         ReportageListView.as_view(),
         name='reportage-list'),
    
    path('stats/', 
         ReportageStatsView.as_view(),
         name='reportage-stats'),

    path('reportages/<slug:slug>/',
         ReportageDetailView.as_view(),
         name='reportage-detail'),

    path('reportages/<slug:slug>/publish/',
         ReportagePublishView.as_view(),
         name='reportage-publish'),

    path('reportages/<slug:slug>/record-view/',
         ReportageRecordView.as_view(),
         name='reportage-record-view'),
]