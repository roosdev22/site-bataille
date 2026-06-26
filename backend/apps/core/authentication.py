from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authentification JWT qui lit le token depuis le cookie HTTP-only 'access_token'.
    Fallback sur le header Authorization Bearer si pas de cookie.
    """
    def authenticate(self, request):
        #  Priorité 1 : Cookie HTTP-only
        raw_token = request.COOKIES.get('access_token')
        
        #  Priorité 2 : Header Authorization Bearer (fallback)
        if not raw_token:
            auth_header = request.META.get('HTTP_AUTHORIZATION', '')
            if auth_header.startswith('Bearer '):
                raw_token = auth_header[7:]
        
        if not raw_token:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)
            return (user, validated_token)
        except InvalidToken:
            return None