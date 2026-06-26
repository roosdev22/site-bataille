# # apps/users/views.py

# from rest_framework import status
# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import AllowAny
# from rest_framework.response import Response
# from rest_framework_simplejwt.views import TokenObtainPairView
# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
# from django.conf import settings


# class CustomTokenObtainPairView(TokenObtainPairView):
#     """
#     ✅ Login view qui retourne les tokens dans HttpOnly cookies
#     Au lieu de les mettre en JSON
#     """
    
#     def post(self, request, *args, **kwargs):
#         # Obtenir les tokens via le serializer standard
#         serializer = self.get_serializer(data=request.data)
        
#         try:
#             serializer.is_valid(raise_exception=True)
#         except Exception as e:
#             return Response(
#                 {"detail": str(e)},
#                 status=status.HTTP_401_UNAUTHORIZED
#             )
        
#         # Extraire les tokens
#         access_token = serializer.validated_data.get('access')
#         refresh_token = serializer.validated_data.get('refresh')
        
#         # Créer la réponse avec les données utilisateur
#         response = Response(
#             {
#                 "user": {
#                     "id": str(serializer.user.id),
#                     "email": serializer.user.email,
#                     "first_name": serializer.user.first_name,
#                     "last_name": serializer.user.last_name,
#                     "role": getattr(serializer.user, 'role', 'user'),
#                     "is_admin": serializer.user.is_staff,
#                 }
#             },
#             status=status.HTTP_200_OK
#         )
        
#         # ✅ SET HTTPONLY COOKIES
#         max_age = 60 * 60  # 1 heure pour access token
        
#         response.set_cookie(
#             key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
#             value=access_token,
#             max_age=max_age,
#             expires=None,  # Utilise max_age
#             path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
#             domain=None,
#             secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', True),  # HTTPS only
#             httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),  # JS can't access
#             samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
#         )
        
#         # ✅ SET REFRESH TOKEN COOKIE
#         max_age_refresh = 7 * 24 * 60 * 60  # 7 jours
        
#         response.set_cookie(
#             key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
#             value=refresh_token,
#             max_age=max_age_refresh,
#             expires=None,
#             path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
#             domain=None,
#             secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', True),
#             httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
#             samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
#         )
        
#         return response


# @api_view(['POST'])
# @permission_classes([AllowAny])
# def logout_view(request):
#     """
#     ✅ Logout view qui supprime les cookies
#     """
#     response = Response(
#         {"detail": "Logged out successfully"},
#         status=status.HTTP_200_OK
#     )
    
#     # Supprimer les cookies en les settant à vide
#     response.delete_cookie(
#         key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
#         path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
#         samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
#     )
    
#     response.delete_cookie(
#         key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
#         path=settings.SIMPLE_JWT.get('AUTH_COOKIE_PATH', '/'),
#         samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax'),
#     )
    
#     return response