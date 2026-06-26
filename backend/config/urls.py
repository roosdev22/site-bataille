from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import (
    AdminStatsView,
    CookieTokenObtainPairView,
    CookieLogoutView,
    CookieTokenRefreshView,
)


urlpatterns = [
    path("admin/", admin.site.urls),
    
    # Stats
    path("api/admin/stats/", AdminStatsView.as_view(), name="admin-stats"),

    # Auth avec cookies HTTP-only
    path("api/auth/login/",         CookieTokenObtainPairView.as_view(),  name="token_obtain"),
    path("api/auth/logout/",        CookieLogoutView.as_view(),           name="logout"),
    path("api/auth/token/refresh/", CookieTokenRefreshView.as_view(),     name="token_refresh"),

    # Apps
    path("api/", include("apps.users.urls")),
    path("api/ads/", include("apps.ads.urls")),    #  CHANGE: api/ → api/ads/
    path("api/", include("apps.posts.urls")),
    path("api/", include("apps.comments.urls")),
    path("api/", include("apps.reportage.urls")), 
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)